"""
估价微服务 FastAPI 主应用
============================================================
端口：8722
提供 RESTful API 供 Node.js 后端调用。

API 端点：
  GET  /health                    健康检查
  POST /api/v1/valuation/estimate 房产估价（核心接口）
  POST /api/v1/valuation/batch    批量估价
  POST /api/v1/model/train        触发模型训练
  GET  /api/v1/model/status       查询模型状态
  GET  /api/v1/city/{city_id}/stats 城市市场统计
"""

import os
import logging
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv

load_dotenv()

# 配置日志
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# 延迟导入（避免启动时数据库连接失败）
from .valuation_engine import ValuationRequest, ValuationResult, get_engine
from .ml_model import (
    get_city_model, train_city_model, predict_with_ml,
    ensemble_estimate, build_feature_vector,
)
from .database import health_check, fetch_city_market_stats


# ─── 生命周期 ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("估价微服务启动中...")
    logger.info(f"数据库: {os.getenv('DB_NAME', 'gujia')} (分表数: {os.getenv('SHARD_COUNT', '8')})")
    yield
    logger.info("估价微服务已关闭")


# ─── FastAPI 应用 ────────────────────────────────────────────
app = FastAPI(
    title="房产自动估价微服务",
    description="基于 GeoHash + 距离衰减加权 + ML 回归的房产估价引擎",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS（允许 Node.js 后端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8721", "http://localhost:8720", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 请求/响应模型 ───────────────────────────────────────────

class EstimateRequest(BaseModel):
    """估价请求体"""
    city_id: int = Field(..., description="城市 ID", example=190)
    latitude: float = Field(..., description="纬度", example=22.5431)
    longitude: float = Field(..., description="经度", example=114.0579)
    area: float = Field(..., description="建筑面积（㎡）", example=89.5, gt=0, le=10000)
    floor: int = Field(0, description="所在楼层", example=15, ge=0)
    total_floors: int = Field(0, description="总楼层数", example=33, ge=0)
    rooms: str = Field("", description="户型（如 3室2厅）", example="3室2厅")
    build_year: Optional[int] = Field(None, description="建成年份", example=2018)
    decoration: str = Field("simple", description="装修：rough/simple/fine/luxury")
    transaction_type: str = Field("sale", description="交易类型：sale/rent")
    estate_id: Optional[int] = Field(None, description="楼盘 ID（可选）")
    community: Optional[str] = Field(None, description="小区名称（可选）")
    use_ml: bool = Field(True, description="是否使用 ML 模型融合")

    @validator("decoration")
    def validate_decoration(cls, v):
        allowed = {"rough", "simple", "fine", "luxury", ""}
        if v not in allowed:
            raise ValueError(f"decoration 必须是 {allowed} 之一")
        return v

    @validator("transaction_type")
    def validate_transaction_type(cls, v):
        if v not in {"sale", "rent"}:
            raise ValueError("transaction_type 必须是 sale 或 rent")
        return v


class EstimateResponse(BaseModel):
    """估价响应体"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BatchEstimateRequest(BaseModel):
    """批量估价请求"""
    requests: List[EstimateRequest] = Field(..., max_items=50)


class TrainRequest(BaseModel):
    """模型训练请求"""
    city_id: int
    geohash_prefix: str = Field("", description="GeoHash 前缀（限制训练区域，空=全城市）")


# ─── API 端点 ────────────────────────────────────────────────

@app.get("/health", summary="健康检查")
async def health():
    """检查微服务和数据库连接状态"""
    db_status = health_check()
    return {
        "status": "ok" if db_status["status"] == "ok" else "degraded",
        "service": "valuation-microservice",
        "version": "1.0.0",
        "database": db_status,
    }


@app.post(
    "/api/v1/valuation/estimate",
    response_model=EstimateResponse,
    summary="房产估价",
    description="输入房产基本信息，返回估算单价、总价和置信区间",
)
async def estimate(req: EstimateRequest):
    """
    核心估价接口。

    算法流程：
    1. GeoHash 编码目标点
    2. 检索周边成交案例（分表查询）
    3. 距离衰减加权估价
    4. ML 模型融合（可选）
    5. 返回估价结果 + 参考案例
    """
    try:
        engine = get_engine()
        val_req = ValuationRequest(
            city_id=req.city_id,
            latitude=req.latitude,
            longitude=req.longitude,
            area=req.area,
            floor=req.floor,
            total_floors=req.total_floors,
            rooms=req.rooms,
            build_year=req.build_year,
            decoration=req.decoration,
            transaction_type=req.transaction_type,
            estate_id=req.estate_id,
            community=req.community,
        )

        result = engine.estimate(val_req)

        # ML 融合（如果请求启用且模型已训练）
        ml_price = None
        if req.use_ml:
            ml_price = predict_with_ml(req.city_id, {
                "area": req.area,
                "floor": req.floor,
                "total_floors": req.total_floors,
                "rooms": req.rooms,
                "build_year": req.build_year,
                "latitude": req.latitude,
                "longitude": req.longitude,
                "geohash": result.geohash,
            })

        if ml_price and ml_price > 0:
            final_price = ensemble_estimate(
                result.estimated_unit_price,
                ml_price,
                ml_weight=0.3,
            )
            method = "ensemble (weighted + ml)"
        else:
            final_price = result.estimated_unit_price
            method = result.method

        return EstimateResponse(
            success=True,
            data={
                "estimated_unit_price": round(final_price, 2),
                "estimated_total_price": round(final_price * req.area, 2),
                "price_range_low": result.price_range_low,
                "price_range_high": result.price_range_high,
                "confidence": result.confidence,
                "method": method,
                "ml_price": round(ml_price, 2) if ml_price else None,
                "weighted_price": result.estimated_unit_price,
                "comparable_count": result.comparable_count,
                "avg_comparable_price": result.avg_comparable_price,
                "market_trend": result.market_trend,
                "adjustments": result.adjustments,
                "comparable_cases": result.comparable_cases,
                "geohash": result.geohash,
                "timestamp": result.timestamp,
            },
        )

    except Exception as e:
        logger.error(f"估价失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    "/api/v1/valuation/batch",
    response_model=Dict[str, Any],
    summary="批量估价",
)
async def batch_estimate(req: BatchEstimateRequest):
    """批量估价（最多 50 条）"""
    engine = get_engine()
    results = []

    for item in req.requests:
        try:
            val_req = ValuationRequest(
                city_id=item.city_id,
                latitude=item.latitude,
                longitude=item.longitude,
                area=item.area,
                floor=item.floor,
                total_floors=item.total_floors,
                rooms=item.rooms,
                build_year=item.build_year,
                decoration=item.decoration,
                transaction_type=item.transaction_type,
            )
            result = engine.estimate(val_req)
            results.append({
                "success": True,
                "estimated_unit_price": result.estimated_unit_price,
                "estimated_total_price": result.estimated_total_price,
                "confidence": result.confidence,
                "comparable_count": result.comparable_count,
            })
        except Exception as e:
            results.append({"success": False, "error": str(e)})

    return {"results": results, "total": len(results)}


@app.post(
    "/api/v1/model/train",
    summary="触发模型训练",
)
async def trigger_train(req: TrainRequest, background_tasks: BackgroundTasks):
    """
    触发指定城市的 ML 模型训练（后台异步执行）。
    """
    def _train():
        result = train_city_model(req.city_id, req.geohash_prefix)
        logger.info(f"城市 {req.city_id} 模型训练结果: {result}")

    background_tasks.add_task(_train)
    return {
        "status": "training_started",
        "city_id": req.city_id,
        "message": "模型训练已在后台启动，请稍后查询状态",
    }


@app.get(
    "/api/v1/model/status",
    summary="查询所有城市模型状态",
)
async def model_status():
    """查询已训练的城市模型状态"""
    from pathlib import Path
    model_dir = Path(os.getenv("MODEL_DIR", "/home/ubuntu/saas/valuation-service/models"))
    models = []
    for f in model_dir.glob("city_*_model.pkl"):
        city_id = int(f.stem.split("_")[1])
        stat = f.stat()
        models.append({
            "city_id": city_id,
            "model_file": f.name,
            "size_kb": round(stat.st_size / 1024, 1),
            "trained_at": stat.st_mtime,
        })
    return {"models": models, "total": len(models)}


@app.get(
    "/api/v1/city/{city_id}/stats",
    summary="城市市场统计",
)
async def city_stats(city_id: int):
    """查询城市房产市场统计数据"""
    stats = fetch_city_market_stats(city_id)
    return {"city_id": city_id, "stats": stats}


@app.get("/api/v1/geohash/encode", summary="经纬度转 GeoHash")
async def geohash_encode(lat: float, lng: float, precision: int = 6):
    """将经纬度编码为 GeoHash"""
    from .geohash_utils import encode
    gh = encode(lat, lng, precision)
    return {"geohash": gh, "lat": lat, "lng": lng, "precision": precision}


# ─── 全局异常处理 ────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未处理异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "服务内部错误，请稍后重试"},
    )
