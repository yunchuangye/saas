"""
机器学习估价模型
============================================================
基于 Scikit-Learn 的梯度提升回归模型（GradientBoostingRegressor）。

特征工程：
  - 地理特征：GeoHash 编码（One-Hot）、经纬度
  - 物理特征：面积、楼层比、总楼层、户型房间数
  - 时间特征：房龄、成交月份（季节性）
  - 市场特征：城市均价（归一化）

模型训练策略：
  - 按城市独立训练（每个城市一个模型）
  - 最少 30 条案例才训练
  - 每 24 小时自动重训练
  - 模型持久化到 models/ 目录

预测流程：
  1. 特征提取 → 标准化 → 模型预测
  2. 与加权法结果融合（集成估价）
  3. 返回预测价格 + 特征重要性
"""

import os
import re
import logging
import pickle
import hashlib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_percentage_error
import joblib

from .database import fetch_nearby_cases

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/home/ubuntu/saas/valuation-service/models"))
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MIN_CASES_FOR_ML = int(os.getenv("MIN_CASES_FOR_ML", "30"))


# ─── 特征工程 ────────────────────────────────────────────────

def extract_room_count(rooms_str: str) -> int:
    """从户型字符串提取卧室数（如 "3室2厅" → 3）"""
    if not rooms_str:
        return 2  # 默认 2 室
    match = re.search(r"(\d+)\s*[室房]", str(rooms_str))
    return int(match.group(1)) if match else 2


def extract_hall_count(rooms_str: str) -> int:
    """从户型字符串提取厅数（如 "3室2厅" → 2）"""
    if not rooms_str:
        return 1
    match = re.search(r"(\d+)\s*厅", str(rooms_str))
    return int(match.group(1)) if match else 1


def geohash_to_numeric(geohash: str, precision: int = 6) -> List[float]:
    """
    将 GeoHash 转换为数值特征（避免 One-Hot 维度爆炸）。
    使用 GeoHash 前 N 位的哈希值作为连续特征。
    """
    prefix = (geohash or "")[:precision]
    # 使用 MD5 哈希映射到 [0, 1] 区间
    h = hashlib.md5(prefix.encode()).hexdigest()
    return [int(h[:8], 16) / 0xFFFFFFFF, int(h[8:16], 16) / 0xFFFFFFFF]


def build_feature_vector(case: Dict, city_avg_price: float = 10000.0) -> Optional[np.ndarray]:
    """
    从案例数据构建特征向量。

    特征列表（共 12 维）：
    0: area              建筑面积（㎡）
    1: floor_ratio       楼层比（floor/total_floors）
    2: total_floors      总楼层
    3: room_count        卧室数
    4: hall_count        厅数
    5: build_age         房龄（当前年 - 建成年）
    6: deal_month        成交月份（1~12，捕捉季节性）
    7: area_log          面积对数（处理非线性）
    8: geohash_x         GeoHash 数值特征 X
    9: geohash_y         GeoHash 数值特征 Y
    10: lat              纬度
    11: lng              经度
    """
    try:
        area = float(case.get("area") or 0)
        if area <= 0:
            return None

        floor = int(case.get("floor") or 0)
        total_floors = int(case.get("total_floors") or 0)
        floor_ratio = floor / total_floors if total_floors > 0 else 0.5

        rooms = str(case.get("rooms") or "")
        room_count = extract_room_count(rooms)
        hall_count = extract_hall_count(rooms)

        current_year = datetime.now().year
        build_year = case.get("build_year")
        build_age = current_year - int(build_year) if build_year else 10

        deal_date = case.get("deal_date")
        if deal_date:
            deal_month = pd.to_datetime(str(deal_date)).month
        else:
            deal_month = 6

        geohash = str(case.get("geohash") or "")
        gh_features = geohash_to_numeric(geohash)

        lat = float(case.get("latitude") or 0)
        lng = float(case.get("longitude") or 0)

        return np.array([
            area,
            floor_ratio,
            total_floors,
            room_count,
            hall_count,
            build_age,
            deal_month,
            np.log1p(area),
            gh_features[0],
            gh_features[1],
            lat,
            lng,
        ], dtype=np.float64)

    except Exception as e:
        logger.debug(f"特征提取失败: {e}")
        return None


# ─── 模型管理 ────────────────────────────────────────────────

class CityValuationModel:
    """
    单城市估价模型。
    每个城市独立训练，按城市 ID 存储。
    """

    def __init__(self, city_id: int):
        self.city_id = city_id
        self.model_path = MODEL_DIR / f"city_{city_id}_model.pkl"
        self.meta_path = MODEL_DIR / f"city_{city_id}_meta.json"
        self.pipeline: Optional[Pipeline] = None
        self.feature_importances: Dict[str, float] = {}
        self.training_stats: Dict[str, Any] = {}
        self.trained_at: Optional[datetime] = None

    def _build_pipeline(self) -> Pipeline:
        """构建 Scikit-Learn Pipeline（标准化 + 梯度提升）"""
        return Pipeline([
            ("scaler", StandardScaler()),
            ("model", GradientBoostingRegressor(
                n_estimators=200,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                min_samples_leaf=5,
                random_state=42,
            )),
        ])

    def train(self, cases: List[Dict]) -> Dict[str, Any]:
        """
        使用案例数据训练模型。

        Args:
            cases: 案例列表（从数据库查询）

        Returns:
            训练统计信息
        """
        if len(cases) < MIN_CASES_FOR_ML:
            return {"status": "skipped", "reason": f"案例不足（{len(cases)} < {MIN_CASES_FOR_ML}）"}

        # 构建特征矩阵和目标向量
        X_list, y_list = [], []
        for c in cases:
            features = build_feature_vector(c)
            unit_price = float(c.get("unit_price") or 0)
            if features is not None and unit_price > 0:
                X_list.append(features)
                y_list.append(unit_price)

        if len(X_list) < MIN_CASES_FOR_ML:
            return {"status": "skipped", "reason": f"有效特征不足（{len(X_list)}）"}

        X = np.array(X_list)
        y = np.array(y_list)

        # 训练模型
        pipeline = self._build_pipeline()
        pipeline.fit(X, y)

        # 交叉验证评估
        try:
            cv_scores = cross_val_score(
                pipeline, X, y,
                cv=min(5, len(X) // 10),
                scoring="neg_mean_absolute_percentage_error",
            )
            mape = float(-cv_scores.mean())
        except Exception:
            mape = 0.0

        # 特征重要性
        feature_names = [
            "area", "floor_ratio", "total_floors", "room_count", "hall_count",
            "build_age", "deal_month", "area_log", "geohash_x", "geohash_y",
            "latitude", "longitude",
        ]
        try:
            importances = pipeline.named_steps["model"].feature_importances_
            self.feature_importances = dict(zip(feature_names, importances.tolist()))
        except Exception:
            self.feature_importances = {}

        self.pipeline = pipeline
        self.trained_at = datetime.now()
        self.training_stats = {
            "sample_count": len(X_list),
            "mape": round(mape, 4),
            "trained_at": self.trained_at.isoformat(),
        }

        # 持久化模型
        joblib.dump(pipeline, self.model_path)
        logger.info(f"城市 {self.city_id} 模型训练完成：{len(X_list)} 条，MAPE={mape:.2%}")

        return {"status": "trained", **self.training_stats}

    def predict(self, features: np.ndarray) -> Optional[float]:
        """
        使用训练好的模型预测单价。

        Args:
            features: 特征向量（12 维）

        Returns:
            预测单价（元/㎡），失败返回 None
        """
        if self.pipeline is None:
            self._load()
        if self.pipeline is None:
            return None

        try:
            pred = self.pipeline.predict(features.reshape(1, -1))
            return float(pred[0])
        except Exception as e:
            logger.error(f"模型预测失败: {e}")
            return None

    def _load(self):
        """从磁盘加载模型"""
        if self.model_path.exists():
            try:
                self.pipeline = joblib.load(self.model_path)
                logger.info(f"城市 {self.city_id} 模型已从磁盘加载")
            except Exception as e:
                logger.error(f"模型加载失败: {e}")

    def is_trained(self) -> bool:
        """检查模型是否已训练"""
        return self.pipeline is not None or self.model_path.exists()

    def needs_retrain(self, interval_hours: int = 24) -> bool:
        """检查是否需要重新训练"""
        if not self.model_path.exists():
            return True
        if self.trained_at is None:
            return True
        elapsed = (datetime.now() - self.trained_at).total_seconds() / 3600
        return elapsed > interval_hours


# ─── 模型注册表（按城市缓存） ────────────────────────────────
_model_registry: Dict[int, CityValuationModel] = {}


def get_city_model(city_id: int) -> CityValuationModel:
    """获取城市模型（懒加载）"""
    if city_id not in _model_registry:
        _model_registry[city_id] = CityValuationModel(city_id)
    return _model_registry[city_id]


def train_city_model(city_id: int, geohash_prefix: str = "") -> Dict[str, Any]:
    """
    触发城市模型训练。
    从分表中拉取全量案例（最多 5000 条）进行训练。
    """
    # 拉取训练数据（使用宽泛的 GeoHash 前缀）
    prefixes = [geohash_prefix] if geohash_prefix else ["w", "e", "v", "t", "s", "u", "y"]
    cases = fetch_nearby_cases(
        city_id=city_id,
        geohash_prefixes=prefixes,
        limit=5000,
    )

    if not cases:
        # 尝试不带前缀过滤（全量）
        from .database import get_shard_table, get_connection
        table = get_shard_table("cases", city_id)
        try:
            with get_connection() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    f"SELECT * FROM `{table}` WHERE city_id=%s AND unit_price>0 LIMIT 5000",
                    [city_id]
                )
                cases = cursor.fetchall()
                cursor.close()
        except Exception as e:
            logger.error(f"训练数据查询失败: {e}")
            return {"status": "error", "message": str(e)}

    model = get_city_model(city_id)
    return model.train(cases)


def predict_with_ml(
    city_id: int,
    case_features: Dict,
) -> Optional[float]:
    """
    使用 ML 模型预测单价。

    Args:
        city_id: 城市 ID
        case_features: 包含特征字段的字典

    Returns:
        预测单价，若模型不可用返回 None
    """
    model = get_city_model(city_id)
    features = build_feature_vector(case_features)
    if features is None:
        return None
    return model.predict(features)


def ensemble_estimate(
    weighted_price: float,
    ml_price: Optional[float],
    ml_weight: float = 0.3,
) -> float:
    """
    集成估价：加权法 + ML 模型融合。

    Args:
        weighted_price: 加权法估价结果
        ml_price: ML 模型预测结果（可能为 None）
        ml_weight: ML 模型权重（默认 30%）

    Returns:
        融合后的估价
    """
    if ml_price is None or ml_price <= 0:
        return weighted_price

    # 合理性检验：ML 预测偏差超过 50% 则降低其权重
    deviation = abs(ml_price - weighted_price) / weighted_price
    if deviation > 0.5:
        ml_weight = ml_weight * 0.3  # 大幅偏差时降低 ML 权重

    return weighted_price * (1 - ml_weight) + ml_price * ml_weight
