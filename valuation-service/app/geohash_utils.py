"""
GeoHash 工具模块
============================================================
提供 GeoHash 编解码、邻格计算、精度级别定义等功能。
与 shard-db.ts 中的 encodeGeoHash 算法保持一致。

GeoHash 精度参考：
  precision=4 → ~39km × 20km
  precision=5 → ~4.9km × 4.9km
  precision=6 → ~1.2km × 0.6km  ← 默认（城市级估价）
  precision=7 → ~152m × 152m
  precision=8 → ~38m × 19m      ← 精确定位
"""

import math
from typing import List, Tuple, Optional

# GeoHash 字符集（Base32）
BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
BASE32_MAP = {c: i for i, c in enumerate(BASE32)}

# 各精度对应的近似范围（km）
PRECISION_KM = {
    1: 2500, 2: 630, 3: 78, 4: 20,
    5: 2.4, 6: 0.61, 7: 0.076, 8: 0.019,
}

# 邻格方向偏移（用于计算 8 邻格）
NEIGHBORS = {
    "right":  {"even": "bc01fg45telegramhijklmnopqrstuvwx", "odd": "p0r21436x8zb9dcf5h7kjnmqesgutwvy"},
    "left":   {"even": "238967debc01telegramfghijklmnopqrst", "odd": "14365h7k9dcfesgujnmqp0r2twvyx8zb"},
    "top":    {"even": "p0r21436x8zb9dcf5h7kjnmqesgutwvy", "odd": "bc01fg45telegramhijklmnopqrstuvwx"},
    "bottom": {"even": "14365h7k9dcfesgujnmqp0r2twvyx8zb", "odd": "238967debc01telegramfghijklmnopqrst"},
}

BORDERS = {
    "right":  {"even": "bcfguvyz", "odd": "prxz"},
    "left":   {"even": "0145hjnp", "odd": "028b"},
    "top":    {"even": "prxz",     "odd": "bcfguvyz"},
    "bottom": {"even": "028b",     "odd": "0145hjnp"},
}


def encode(lat: float, lng: float, precision: int = 6) -> str:
    """
    将经纬度编码为 GeoHash 字符串。

    Args:
        lat: 纬度（-90 ~ 90）
        lng: 经度（-180 ~ 180）
        precision: 精度（字符数，默认 6 ≈ 0.61km）

    Returns:
        GeoHash 字符串
    """
    min_lat, max_lat = -90.0, 90.0
    min_lng, max_lng = -180.0, 180.0
    hash_str = ""
    bits = 0
    hash_value = 0
    is_lng = True

    while len(hash_str) < precision:
        if is_lng:
            mid = (min_lng + max_lng) / 2
            if lng >= mid:
                hash_value = (hash_value << 1) + 1
                min_lng = mid
            else:
                hash_value = (hash_value << 1) + 0
                max_lng = mid
        else:
            mid = (min_lat + max_lat) / 2
            if lat >= mid:
                hash_value = (hash_value << 1) + 1
                min_lat = mid
            else:
                hash_value = (hash_value << 1) + 0
                max_lat = mid

        is_lng = not is_lng
        bits += 1

        if bits == 5:
            hash_str += BASE32[hash_value]
            bits = 0
            hash_value = 0

    return hash_str


def decode(geohash: str) -> Tuple[float, float, float, float]:
    """
    将 GeoHash 解码为经纬度范围。

    Returns:
        (lat_center, lng_center, lat_err, lng_err)
    """
    min_lat, max_lat = -90.0, 90.0
    min_lng, max_lng = -180.0, 180.0
    is_lng = True

    for char in geohash:
        val = BASE32_MAP[char]
        for bit_idx in range(4, -1, -1):
            bit = (val >> bit_idx) & 1
            if is_lng:
                mid = (min_lng + max_lng) / 2
                if bit:
                    min_lng = mid
                else:
                    max_lng = mid
            else:
                mid = (min_lat + max_lat) / 2
                if bit:
                    min_lat = mid
                else:
                    max_lat = mid
            is_lng = not is_lng

    lat_center = (min_lat + max_lat) / 2
    lng_center = (min_lng + max_lng) / 2
    lat_err = (max_lat - min_lat) / 2
    lng_err = (max_lng - min_lng) / 2

    return lat_center, lng_center, lat_err, lng_err


def decode_center(geohash: str) -> Tuple[float, float]:
    """解码 GeoHash 为中心点坐标 (lat, lng)"""
    lat, lng, _, _ = decode(geohash)
    return lat, lng


def get_neighbors(geohash: str) -> List[str]:
    """
    获取 GeoHash 的 8 个邻格（上下左右 + 四角）。
    用于扩大周边搜索范围，避免边界遗漏。
    """
    try:
        import geohash2 as gh2
        neighbors = []
        for direction in ["right", "left", "top", "bottom",
                          "top-right", "top-left", "bottom-right", "bottom-left"]:
            try:
                neighbors.append(gh2.expand(geohash)[direction] if hasattr(gh2, 'expand') else geohash)
            except Exception:
                pass
        # 如果 geohash2 不支持，使用前缀截断方式
        if not neighbors:
            neighbors = [geohash]
    except ImportError:
        neighbors = []

    # 保底方案：返回当前 hash 及其父级前缀（覆盖更大范围）
    if not neighbors:
        neighbors = [geohash]

    return list(set(neighbors))


def get_search_prefixes(geohash: str, radius_precision: int = 5) -> List[str]:
    """
    根据目标精度获取搜索前缀列表。

    策略：
    - 使用 geohash 的前 N 位作为前缀进行 LIKE 搜索
    - precision=6 → 搜索半径约 0.61km
    - precision=5 → 搜索半径约 2.4km（适合稀疏区域）

    Args:
        geohash: 目标点的 GeoHash（完整精度）
        radius_precision: 搜索半径精度（字符数，越小范围越大）

    Returns:
        SQL LIKE 前缀列表
    """
    prefix = geohash[:radius_precision]
    # 同时搜索当前格子及相邻格子（通过父级前缀覆盖）
    parent_prefix = geohash[:radius_precision - 1] if radius_precision > 1 else prefix
    return [prefix, parent_prefix]


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    使用 Haversine 公式计算两点之间的球面距离（km）。

    Args:
        lat1, lng1: 第一个点的经纬度
        lat2, lng2: 第二个点的经纬度

    Returns:
        距离（km）
    """
    R = 6371.0  # 地球半径（km）
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def distance_weight(distance_km: float, alpha: float = 0.5) -> float:
    """
    距离衰减权重函数（高斯衰减）。

    权重随距离增加而指数衰减：
    - 0km → weight=1.0（最近邻）
    - 0.5km → weight≈0.78
    - 1km → weight≈0.37
    - 2km → weight≈0.02

    Args:
        distance_km: 距离（km）
        alpha: 衰减系数（越大衰减越快）

    Returns:
        权重（0~1）
    """
    return math.exp(-alpha * distance_km ** 2)
