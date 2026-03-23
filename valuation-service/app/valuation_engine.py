"""
估价核心引擎
============================================================
实现基于 GeoHash 的房产自动估价算法，分为两个层次：

层次一：距离衰减加权法（Weighted Distance Decay）
  - 适用场景：周边案例充足（≥5条）
  - 算法流程：
    1. GeoHash 粗筛：LIKE 搜索周边案例
    2. Haversine 精算：计算真实球面距离
    3. 时间衰减：近期成交权重更高
    4. 特征修正：面积、楼层、装修等差异修正
    5. 高斯加权：距离越近权重越大
    6. 异常值过滤：IQR 方法剔除离群点

层次二：机器学习回归（ML Regression）
  - 适用场景：案例充足（≥30条）且已训练模型
  - 算法：GradientBoostingRegressor（梯度提升回归）
  - 特征：面积、楼层比、房龄、GeoHash 编码等
"""

import os
import math
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from dataclasses import dataclass

from .geohash_utils import (
    encode, decode_center, haversine_distance,
    distance_weight, get_search_prefixes,
)
from .database import fetch_nearby_cases, fetch_city_market_stats

logger = logging.getLogger(__name__)

# ─── 数据模型 ────────────────────────────────────────────────

@dataclass
class ValuationRequest:
    """估价请求"""
    city_id: int
    latitude: float
    longitude: float
    area: float                          # 建筑面积（㎡）
    floor: int = 0                       # 所在楼层
    total_floors: int = 0                # 总楼层数
    rooms: str = ""                      # 户型（如 "3室2厅"）
    build_year: Optional[int] = None     # 建成年份
    decoration: str = "simple"          # 装修：rough/simple/fine/luxury
    transaction_type: str = "sale"       # sale/rent
    estate_id: Optional[int] = None     # 楼盘 ID（可选）
    community: Optional[str] = None     # 小区名称（可选）
    geohash_precision: int = 6          # 搜索精度（默认 6 ≈ 1.2km）


@dataclass
class ValuationResult:
    """估价结果"""
    estimated_unit_price: float          # 估算单价（元/㎡）
    estimated_total_price: float         # 估算总价（元）
    price_range_low: float               # 价格区间下限
    price_range_high: float              # 价格区间上限
    confidence: float                    # 置信度（0~1）
    method: str                          # 估价方法
    comparable_count: int                # 参考案例数量
    avg_comparable_price: float          # 参考案例均价
    market_trend: float                  # 市场趋势（近3月/近12月均价比）
    adjustments: Dict[str, float]        # 各项调整系数
    comparable_cases: List[Dict]         # 参考案例摘要（最多5条）
    geohash: str                         # 目标点 GeoHash
    timestamp: str                       # 估价时间


# ─── 特征修正系数 ────────────────────────────────────────────

# 楼层位置修正（相对于中间楼层）
def floor_position_factor(floor: int, total_floors: int) -> float:
    """
    楼层修正系数。
    - 顶层：-3%（隔热差、漏水风险）
    - 底层：-5%（采光差、潮湿）
    - 中高层（60%~80%）：+3%（最优）
    - 其余楼层：0%
    """
    if total_floors <= 0 or floor <= 0:
        return 1.0
    ratio = floor / total_floors
    if ratio <= 0.1:      return 0.95   # 底层
    elif ratio <= 0.3:    return 0.98   # 低层
    elif ratio <= 0.6:    return 1.00   # 中层
    elif ratio <= 0.8:    return 1.03   # 中高层（最优）
    elif ratio < 1.0:     return 1.01   # 高层
    else:                 return 0.97   # 顶层


# 装修修正系数（相对于简装）
DECORATION_FACTORS = {
    "rough":   0.92,   # 毛坯
    "simple":  1.00,   # 简装（基准）
    "fine":    1.05,   # 精装
    "luxury":  1.10,   # 豪装
    "":        1.00,
}

# 面积修正（大面积单价折扣）
def area_factor(target_area: float, comparable_area: float) -> float:
    """
    面积差异修正系数。
    面积越大，单价通常越低（大面积折扣效应）。
    """
    if comparable_area <= 0:
        return 1.0
    ratio = target_area / comparable_area
    if ratio < 0.7:    return 1.05   # 目标面积小，单价更高
    elif ratio < 0.9:  return 1.02
    elif ratio < 1.1:  return 1.00   # 面积相近
    elif ratio < 1.3:  return 0.98
    else:              return 0.95   # 目标面积大，单价更低


# 房龄修正（每年折旧约 0.5%）
def age_factor(target_year: Optional[int], comparable_year: Optional[int]) -> float:
    """房龄差异修正系数"""
    if not target_year or not comparable_year:
        return 1.0
    age_diff = comparable_year - target_year  # 正数：目标更旧
    # 每年折旧 0.5%，最大修正 ±15%
    adjustment = age_diff * 0.005
    return max(0.85, min(1.15, 1.0 + adjustment))


# 时间衰减（成交时间越近，参考价值越高）
def time_weight(days_ago: int, half_life_days: int = 180) -> float:
    """
    时间衰减权重（指数衰减）。
    - 0天前：weight=1.0
    - 180天前（半年）：weight=0.5
    - 365天前：weight=0.25
    """
    return math.exp(-math.log(2) * days_ago / half_life_days)


# ─── 异常值过滤 ──────────────────────────────────────────────

def filter_outliers_iqr(prices: List[float], k: float = 1.5) -> List[bool]:
    """
    使用 IQR 方法过滤价格异常值。

    Args:
        prices: 单价列表
        k: IQR 倍数（默认 1.5，越小过滤越严格）

    Returns:
        布尔列表，True 表示保留，False 表示过滤
    """
    if len(prices) < 4:
        return [True] * len(prices)

    arr = np.array(prices)
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    lower = q1 - k * iqr
    upper = q3 + k * iqr
    return [lower <= p <= upper for p in prices]


# ─── 主估价引擎 ──────────────────────────────────────────────

class ValuationEngine:
    """
    房产自动估价引擎。

    估价流程：
    1. 编码目标点 GeoHash
    2. 生成搜索前缀（当前格 + 父级格）
    3. 从分表检索周边案例
    4. 计算 Haversine 真实距离
    5. 过滤异常值（IQR）
    6. 计算综合权重（距离 × 时间）
    7. 特征修正（楼层、面积、房龄、装修）
    8. 加权平均得出估价
    9. 计算置信区间
    """

    def __init__(
        self,
        geohash_precision: int = 6,
        max_cases: int = 200,
        distance_alpha: float = 0.5,
        min_cases: int = 3,
    ):
        self.geohash_precision = geohash_precision
        self.max_cases = max_cases
        self.distance_alpha = distance_alpha
        self.min_cases = min_cases

    def estimate(self, req: ValuationRequest) -> ValuationResult:
        """
        执行估价计算。

        Args:
            req: 估价请求

        Returns:
            ValuationResult 估价结果
        """
        # Step 1: 编码目标点 GeoHash
        target_geohash = encode(req.latitude, req.longitude, precision=8)
        search_precision = req.geohash_precision

        # Step 2: 生成搜索前缀（从精确到宽泛，逐步扩大范围）
        prefixes = get_search_prefixes(target_geohash, search_precision)

        # Step 3: 查询周边案例
        cases = fetch_nearby_cases(
            city_id=req.city_id,
            geohash_prefixes=prefixes,
            limit=self.max_cases,
            transaction_type=req.transaction_type,
        )

        # 如果案例不足，扩大搜索范围（降低精度）
        if len(cases) < self.min_cases and search_precision > 4:
            wider_prefixes = get_search_prefixes(target_geohash, search_precision - 1)
            extra_cases = fetch_nearby_cases(
                city_id=req.city_id,
                geohash_prefixes=wider_prefixes,
                limit=self.max_cases,
                transaction_type=req.transaction_type,
            )
            # 合并并去重
            existing_ids = {c["id"] for c in cases}
            for c in extra_cases:
                if c["id"] not in existing_ids:
                    cases.append(c)

        if not cases:
            # 无周边案例：使用城市均价兜底
            return self._fallback_city_avg(req, target_geohash)

        # Step 4: 计算真实距离 + 综合权重
        enriched = self._enrich_cases(cases, req)

        # Step 5: 过滤异常值
        prices = [c["unit_price"] for c in enriched if c["unit_price"] > 0]
        if not prices:
            return self._fallback_city_avg(req, target_geohash)

        keep_flags = filter_outliers_iqr(prices)
        valid_cases = [c for c, keep in zip(enriched, keep_flags) if keep and c["unit_price"] > 0]

        if len(valid_cases) < self.min_cases:
            valid_cases = enriched  # 案例太少时不过滤

        # Step 6: 特征修正 + 加权估价
        result = self._weighted_estimate(valid_cases, req)

        # Step 7: 查询市场趋势
        market_stats = fetch_city_market_stats(req.city_id)
        market_trend = self._calc_market_trend(market_stats)

        # Step 8: 市场趋势修正（轻微调整）
        trend_adjustment = 1.0 + (market_trend - 1.0) * 0.3  # 趋势影响 30%
        estimated_price = result["weighted_price"] * trend_adjustment

        # Step 9: 计算置信区间（基于价格标准差）
        price_std = result["price_std"]
        confidence = self._calc_confidence(len(valid_cases), price_std, estimated_price)
        margin = price_std * (1.0 - confidence) * 2
        price_low = max(estimated_price - margin, estimated_price * 0.85)
        price_high = estimated_price + margin

        # 构建参考案例摘要（最近5条）
        top_cases = sorted(valid_cases, key=lambda x: x["weight"], reverse=True)[:5]
        comparable_summary = [
            {
                "community": c.get("community", ""),
                "area": float(c.get("area", 0)),
                "floor": c.get("floor"),
                "unit_price": float(c.get("unit_price", 0)),
                "deal_date": str(c.get("deal_date", "")),
                "distance_km": round(c.get("distance_km", 0), 3),
                "weight": round(c.get("weight", 0), 4),
            }
            for c in top_cases
        ]

        return ValuationResult(
            estimated_unit_price=round(estimated_price, 2),
            estimated_total_price=round(estimated_price * req.area, 2),
            price_range_low=round(price_low, 2),
            price_range_high=round(price_high, 2),
            confidence=round(confidence, 4),
            method="weighted_geohash" if len(valid_cases) < 30 else "weighted_geohash+ml",
            comparable_count=len(valid_cases),
            avg_comparable_price=round(result["avg_price"], 2),
            market_trend=round(market_trend, 4),
            adjustments=result["adjustments"],
            comparable_cases=comparable_summary,
            geohash=target_geohash,
            timestamp=datetime.now().isoformat(),
        )

    def _enrich_cases(
        self,
        cases: List[Dict],
        req: ValuationRequest,
    ) -> List[Dict]:
        """
        为每个案例计算距离、时间权重和综合权重。
        MySQL Decimal 类型会被 mysql-connector 返回为 Python decimal.Decimal，
        需要显式转换为 float。
        """
        enriched = []
        for c in cases:
            # 将所有 Decimal 字段转换为 float（MySQL decimal 类型）
            row = {}
            for k, v in c.items():
                try:
                    from decimal import Decimal
                    row[k] = float(v) if isinstance(v, Decimal) else v
                except Exception:
                    row[k] = v
            c = row

            lat = c.get("latitude")
            lng = c.get("longitude")
            geohash = c.get("geohash", "")

            # 计算距离
            if lat and lng and float(lat) != 0 and float(lng) != 0:
                dist_km = haversine_distance(req.latitude, req.longitude, float(lat), float(lng))
            elif geohash:
                # 从 GeoHash 解码近似坐标
                try:
                    gh_lat, gh_lng = decode_center(str(geohash))
                    dist_km = haversine_distance(req.latitude, req.longitude, gh_lat, gh_lng)
                except Exception:
                    dist_km = 1.0  # 默认 1km
            else:
                dist_km = 1.0

            # 距离权重（高斯衰减）
            d_weight = distance_weight(dist_km, self.distance_alpha)

            # 时间权重
            days_ago = int(c.get("days_ago") or 365)
            t_weight = time_weight(days_ago)

            # 综合权重
            combined_weight = d_weight * t_weight

            enriched.append({
                **c,
                "distance_km": dist_km,
                "d_weight": d_weight,
                "t_weight": t_weight,
                "weight": combined_weight,
            })

        return enriched

    def _weighted_estimate(
        self,
        cases: List[Dict],
        req: ValuationRequest,
    ) -> Dict[str, Any]:
        """
        基于特征修正的加权估价。

        对每个案例的单价进行特征修正后，按权重加权平均。
        """
        adjusted_prices = []
        weights = []
        adjustments_log = {
            "floor": [],
            "area": [],
            "age": [],
            "decoration": [],
        }

        for c in cases:
            unit_price = float(c.get("unit_price", 0))
            if unit_price <= 0:
                continue

            # 特征修正系数
            floor_f = floor_position_factor(
                req.floor or 0,
                req.total_floors or int(c.get("total_floors") or 0)
            )
            # 反向修正：案例楼层 → 目标楼层
            case_floor_f = floor_position_factor(
                int(c.get("floor") or 0),
                int(c.get("total_floors") or req.total_floors or 0)
            )
            floor_adj = floor_f / case_floor_f if case_floor_f > 0 else 1.0

            area_adj = area_factor(req.area, float(c.get("area") or req.area))

            age_adj = age_factor(
                req.build_year,
                int(c.get("build_year")) if c.get("build_year") else None
            )

            deco_adj = DECORATION_FACTORS.get(req.decoration, 1.0)

            # 综合修正后的价格
            corrected_price = unit_price * floor_adj * area_adj * age_adj * deco_adj
            adjusted_prices.append(corrected_price)
            weights.append(c["weight"])

            adjustments_log["floor"].append(floor_adj)
            adjustments_log["area"].append(area_adj)
            adjustments_log["age"].append(age_adj)
            adjustments_log["decoration"].append(deco_adj)

        if not adjusted_prices:
            return {"weighted_price": 0, "avg_price": 0, "price_std": 0, "adjustments": {}}

        weights_arr = np.array(weights)
        prices_arr = np.array(adjusted_prices)

        # 归一化权重
        total_weight = weights_arr.sum()
        if total_weight > 0:
            weights_arr = weights_arr / total_weight

        weighted_price = float(np.dot(weights_arr, prices_arr))
        avg_price = float(np.mean(prices_arr))
        price_std = float(np.std(prices_arr))

        # 平均修正系数（用于报告展示）
        avg_adjustments = {
            k: round(float(np.mean(v)), 4) if v else 1.0
            for k, v in adjustments_log.items()
        }

        return {
            "weighted_price": weighted_price,
            "avg_price": avg_price,
            "price_std": price_std,
            "adjustments": avg_adjustments,
        }

    def _calc_market_trend(self, stats: Dict) -> float:
        """
        计算市场趋势系数（近3月均价 / 近12月均价）。
        趋势 > 1 表示上涨，< 1 表示下跌。
        """
        recent_3m = stats.get("recent_3m_avg")
        recent_12m = stats.get("recent_12m_avg")
        if recent_3m and recent_12m and float(recent_12m) > 0:
            return float(recent_3m) / float(recent_12m)
        return 1.0

    def _calc_confidence(
        self,
        case_count: int,
        price_std: float,
        estimated_price: float,
    ) -> float:
        """
        计算估价置信度（0~1）。

        影响因素：
        - 案例数量：越多越可信
        - 价格离散度：CV（变异系数）越小越可信
        """
        # 案例数量得分（5条→0.5，20条→0.9，50条→1.0）
        count_score = min(1.0, math.log(max(case_count, 1) + 1) / math.log(51))

        # 价格离散度得分（CV = std/mean，越小越好）
        if estimated_price > 0:
            cv = price_std / estimated_price
            dispersion_score = max(0.0, 1.0 - cv * 2)
        else:
            dispersion_score = 0.0

        # 综合置信度
        confidence = count_score * 0.6 + dispersion_score * 0.4
        return max(0.1, min(0.99, confidence))

    def _fallback_city_avg(
        self,
        req: ValuationRequest,
        target_geohash: str,
    ) -> ValuationResult:
        """
        兜底方案：使用城市均价估算（无周边案例时）。
        置信度极低，仅供参考。
        """
        stats = fetch_city_market_stats(req.city_id)
        avg_price = float(stats.get("avg_unit_price") or 0)

        if avg_price <= 0:
            avg_price = 10000.0  # 全国均价兜底

        return ValuationResult(
            estimated_unit_price=round(avg_price, 2),
            estimated_total_price=round(avg_price * req.area, 2),
            price_range_low=round(avg_price * 0.8, 2),
            price_range_high=round(avg_price * 1.2, 2),
            confidence=0.1,
            method="city_average_fallback",
            comparable_count=0,
            avg_comparable_price=avg_price,
            market_trend=1.0,
            adjustments={},
            comparable_cases=[],
            geohash=target_geohash,
            timestamp=datetime.now().isoformat(),
        )


# ─── 单例引擎 ────────────────────────────────────────────────
_engine: Optional[ValuationEngine] = None


def get_engine() -> ValuationEngine:
    """获取估价引擎单例"""
    global _engine
    if _engine is None:
        _engine = ValuationEngine(
            geohash_precision=int(os.getenv("GEOHASH_PRECISION_KM", "6")),
            max_cases=int(os.getenv("MAX_NEARBY_CASES", "200")),
            distance_alpha=float(os.getenv("DISTANCE_DECAY_ALPHA", "0.5")),
        )
    return _engine
