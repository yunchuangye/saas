/**
 * 估价微服务代理路由
 * ============================================================
 * 将前端的 tRPC 调用转发到 Python 估价微服务（:8722）。
 * 同时在 Node.js 层做参数验证、权限控制和结果缓存。
 *
 * 架构：
 *   前端 → tRPC → Node.js(8721) → HTTP → Python微服务(8722)
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../lib/trpc";
import { TRPCError } from "@trpc/server";
import { redis } from "../lib/db";

const VALUATION_SERVICE_URL = process.env.VALUATION_SERVICE_URL || "http://localhost:8722";
const CACHE_TTL_SECONDS = 3600; // 估价结果缓存 1 小时

// ─── 请求工具函数 ────────────────────────────────────────────

async function callValuationService(
  path: string,
  method: "GET" | "POST",
  body?: object,
  timeoutMs = 10000
): Promise<any> {
  const url = `${VALUATION_SERVICE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `估价服务返回错误 ${res.status}: ${errText}`,
      });
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new TRPCError({
        code: "TIMEOUT",
        message: "估价服务请求超时，请稍后重试",
      });
    }
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `估价服务不可用: ${err.message}`,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ─── 缓存 Key 生成 ───────────────────────────────────────────

function buildCacheKey(cityId: number, lat: number, lng: number, area: number, params: object): string {
  // 将坐标精度降低到小数点后 4 位（约 11m 精度），避免缓存碎片
  const latR = Math.round(lat * 10000) / 10000;
  const lngR = Math.round(lng * 10000) / 10000;
  const areaR = Math.round(area);
  const paramStr = JSON.stringify(params);
  return `valuation:${cityId}:${latR}:${lngR}:${areaR}:${Buffer.from(paramStr).toString("base64").slice(0, 16)}`;
}

// ─── 输入验证 Schema ─────────────────────────────────────────

const estimateInput = z.object({
  cityId:          z.number().int().positive(),
  latitude:        z.number().min(-90).max(90),
  longitude:       z.number().min(-180).max(180),
  area:            z.number().positive().max(10000),
  floor:           z.number().int().min(0).default(0),
  totalFloors:     z.number().int().min(0).default(0),
  rooms:           z.string().max(20).default(""),
  buildYear:       z.number().int().min(1900).max(2030).optional(),
  decoration:      z.enum(["rough", "simple", "fine", "luxury"]).default("simple"),
  transactionType: z.enum(["sale", "rent"]).default("sale"),
  estateId:        z.number().int().optional(),
  community:       z.string().max(100).optional(),
  useMl:           z.boolean().default(true),
  noCache:         z.boolean().default(false),
});

// ─── tRPC 路由 ───────────────────────────────────────────────

export const valuationProxyRouter = router({

  // ─── 核心估价接口 ─────────────────────────────────────────
  estimate: protectedProcedure
    .input(estimateInput)
    .mutation(async ({ input }) => {
      const cacheKey = buildCacheKey(
        input.cityId, input.latitude, input.longitude, input.area,
        { floor: input.floor, rooms: input.rooms, decoration: input.decoration }
      );

      // 读取缓存
      if (!input.noCache) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return { ...JSON.parse(cached), fromCache: true };
          }
        } catch { /* Redis 不可用时跳过缓存 */ }
      }

      // 调用 Python 微服务
      const result = await callValuationService(
        "/api/v1/valuation/estimate",
        "POST",
        {
          city_id:          input.cityId,
          latitude:         input.latitude,
          longitude:        input.longitude,
          area:             input.area,
          floor:            input.floor,
          total_floors:     input.totalFloors,
          rooms:            input.rooms,
          build_year:       input.buildYear ?? null,
          decoration:       input.decoration,
          transaction_type: input.transactionType,
          estate_id:        input.estateId ?? null,
          community:        input.community ?? null,
          use_ml:           input.useMl,
        }
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "估价计算失败",
        });
      }

      // 写入缓存
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result.data));
      } catch { /* Redis 不可用时跳过 */ }

      return { ...result.data, fromCache: false };
    }),

  // ─── 批量估价 ────────────────────────────────────────────
  batchEstimate: protectedProcedure
    .input(z.object({
      requests: z.array(estimateInput).max(20),
    }))
    .mutation(async ({ input }) => {
      const result = await callValuationService(
        "/api/v1/valuation/batch",
        "POST",
        {
          requests: input.requests.map(r => ({
            city_id:          r.cityId,
            latitude:         r.latitude,
            longitude:        r.longitude,
            area:             r.area,
            floor:            r.floor,
            total_floors:     r.totalFloors,
            rooms:            r.rooms,
            build_year:       r.buildYear ?? null,
            decoration:       r.decoration,
            transaction_type: r.transactionType,
          })),
        }
      );
      return result;
    }),

  // ─── 触发模型训练（仅管理员） ─────────────────────────────
  trainModel: protectedProcedure
    .input(z.object({
      cityId:        z.number().int().positive(),
      geohashPrefix: z.string().max(8).default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      // 权限检查：仅 admin 可触发训练
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可触发模型训练" });
      }

      const result = await callValuationService(
        "/api/v1/model/train",
        "POST",
        { city_id: input.cityId, geohash_prefix: input.geohashPrefix }
      );
      return result;
    }),

  // ─── 查询模型状态 ────────────────────────────────────────
  modelStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await callValuationService("/api/v1/model/status", "GET");
    }),

  // ─── 城市市场统计 ────────────────────────────────────────
  cityStats: protectedProcedure
    .input(z.object({ cityId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const cacheKey = `valuation:citystats:${input.cityId}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch { }

      const result = await callValuationService(
        `/api/v1/city/${input.cityId}/stats`,
        "GET"
      );

      try {
        await redis.setex(cacheKey, 1800, JSON.stringify(result)); // 30分钟缓存
      } catch { }

      return result;
    }),

  // ─── GeoHash 编码工具 ────────────────────────────────────
  encodeGeoHash: publicProcedure
    .input(z.object({
      lat:       z.number().min(-90).max(90),
      lng:       z.number().min(-180).max(180),
      precision: z.number().int().min(1).max(12).default(6),
    }))
    .query(async ({ input }) => {
      const result = await callValuationService(
        `/api/v1/geohash/encode?lat=${input.lat}&lng=${input.lng}&precision=${input.precision}`,
        "GET"
      );
      return result;
    }),

  // ─── 微服务健康检查 ──────────────────────────────────────
  serviceHealth: protectedProcedure
    .query(async () => {
      try {
        const result = await callValuationService("/health", "GET", undefined, 3000);
        return { available: true, ...result };
      } catch (err: any) {
        return { available: false, error: err.message };
      }
    }),
});
