/**
 * 分库分表路由 - 楼盘/楼栋/房屋/案例 CRUD
 * ============================================================
 * 所有操作均通过 shard-db.ts 路由到对应的大区分库和物理分表
 * Sharding Key: city_id
 */

import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import {
  getPoolByCityId,
  getDbByCityId,
  getCityShardInfo,
  queryAllShards,
  checkShardHealth,
  getCityRegion,
  getShardPool,
  type ShardRegion,
} from "../lib/shard-db";
import { TRPCError } from "@trpc/server";

// ─── 楼盘操作 ──────────────────────────────────────────────────
const estateInput = z.object({
  cityId:       z.number().int().positive(),
  name:         z.string().min(1).max(200),
  districtId:   z.number().int().optional(),
  address:      z.string().max(500).optional(),
  developer:    z.string().max(200).optional(),
  buildYear:    z.number().int().optional(),
  propertyType: z.string().max(100).optional(),
  totalUnits:   z.number().int().optional(),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
  geohash:      z.string().max(12).optional(),
});

export const shardDirectoryRouter = router({
  // ─── 分库健康检查 ────────────────────────────────────────────
  shardHealth: protectedProcedure.query(async () => {
    const health = await checkShardHealth();
    return health;
  }),

  // ─── 获取城市分片信息 ────────────────────────────────────────
  getCityShardInfo: protectedProcedure
    .input(z.object({ cityId: z.number() }))
    .query(({ input }) => {
      return getCityShardInfo(input.cityId);
    }),

  // ─── 楼盘：创建 ─────────────────────────────────────────────
  estates: router({
    create: protectedProcedure
      .input(estateInput)
      .mutation(async ({ input }) => {
        const { cityId } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);

        // 计算 GeoHash（如果提供了经纬度）
        let geohash = input.geohash;
        if (!geohash && input.latitude && input.longitude) {
          geohash = encodeGeoHash(input.latitude, input.longitude, 8);
        }

        const [result] = await pool.execute(
          `INSERT INTO ${info.tableEstates}
            (city_id, name, district_id, address, developer, build_year, property_type, total_units, latitude, longitude, geohash, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            cityId, input.name, input.districtId ?? null,
            input.address ?? null, input.developer ?? null,
            input.buildYear ?? null, input.propertyType ?? null,
            input.totalUnits ?? null, input.latitude ?? null,
            input.longitude ?? null, geohash ?? null,
          ]
        ) as any;

        return { id: result.insertId, shardInfo: info };
      }),

    // ─── 楼盘：查询列表 ─────────────────────────────────────────
    list: protectedProcedure
      .input(z.object({
        cityId:     z.number().int().positive(),
        page:       z.number().int().default(1),
        pageSize:   z.number().int().max(100).default(20),
        search:     z.string().optional(),
        districtId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { cityId, page, pageSize, search, districtId } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ? AND is_active = 1";
        const params: any[] = [cityId];

        if (districtId) { where += " AND district_id = ?"; params.push(districtId); }
        if (search) {
          where += " AND (name LIKE ? OR address LIKE ?)";
          params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await pool.execute(
          `SELECT * FROM ${info.tableEstates} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        ) as any;

        const [[countRow]] = await pool.execute(
          `SELECT COUNT(*) as cnt FROM ${info.tableEstates} ${where}`,
          params
        ) as any;

        return { items: rows, total: countRow.cnt, page, pageSize, shardInfo: info };
      }),

    // ─── 楼盘：详情 ─────────────────────────────────────────────
    get: protectedProcedure
      .input(z.object({ cityId: z.number(), id: z.number() }))
      .query(async ({ input }) => {
        const info = getCityShardInfo(input.cityId);
        const pool = getPoolByCityId(input.cityId);
        const [[row]] = await pool.execute(
          `SELECT * FROM ${info.tableEstates} WHERE id = ? AND city_id = ?`,
          [input.id, input.cityId]
        ) as any;
        if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "楼盘不存在" });
        return row;
      }),

    // ─── 楼盘：更新 ─────────────────────────────────────────────
    update: protectedProcedure
      .input(estateInput.partial().extend({ id: z.number(), cityId: z.number() }))
      .mutation(async ({ input }) => {
        const { id, cityId, ...fields } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);
        const setClauses: string[] = [];
        const params: any[] = [];
        const fieldMap: Record<string, string> = {
          name: "name", districtId: "district_id", address: "address",
          developer: "developer", buildYear: "build_year",
          propertyType: "property_type", totalUnits: "total_units",
          latitude: "latitude", longitude: "longitude", geohash: "geohash",
        };
        for (const [key, col] of Object.entries(fieldMap)) {
          if ((fields as any)[key] !== undefined) {
            setClauses.push(`${col} = ?`);
            params.push((fields as any)[key]);
          }
        }
        if (setClauses.length === 0) return { affected: 0 };
        params.push(id, cityId);
        const [result] = await pool.execute(
          `UPDATE ${info.tableEstates} SET ${setClauses.join(", ")} WHERE id = ? AND city_id = ?`,
          params
        ) as any;
        return { affected: result.affectedRows };
      }),

    // ─── 楼盘：删除（软删除） ────────────────────────────────────
    delete: protectedProcedure
      .input(z.object({ cityId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        const info = getCityShardInfo(input.cityId);
        const pool = getPoolByCityId(input.cityId);
        await pool.execute(
          `UPDATE ${info.tableEstates} SET is_active = 0 WHERE id = ? AND city_id = ?`,
          [input.id, input.cityId]
        );
        return { success: true };
      }),
  }),

  // ─── 楼栋：查询 ─────────────────────────────────────────────
  buildings: router({
    list: protectedProcedure
      .input(z.object({
        cityId:   z.number().int().positive(),
        estateId: z.number().optional(),
        page:     z.number().int().default(1),
        pageSize: z.number().int().max(100).default(20),
        search:   z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { cityId, estateId, page, pageSize, search } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ?";
        const params: any[] = [cityId];
        if (estateId) { where += " AND estate_id = ?"; params.push(estateId); }
        if (search) { where += " AND name LIKE ?"; params.push(`%${search}%`); }

        const [rows] = await pool.execute(
          `SELECT * FROM ${info.tableBuildings} ${where} ORDER BY name LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        ) as any;
        const [[countRow]] = await pool.execute(
          `SELECT COUNT(*) as cnt FROM ${info.tableBuildings} ${where}`, params
        ) as any;
        return { items: rows, total: countRow.cnt, page, pageSize };
      }),

    create: protectedProcedure
      .input(z.object({
        cityId:        z.number(),
        estateId:      z.number(),
        name:          z.string().min(1),
        floors:        z.number().optional(),
        unitsPerFloor: z.number().optional(),
        totalUnits:    z.number().optional(),
        buildingType:  z.string().optional(),
        avgPrice:      z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { cityId, estateId, name, floors, unitsPerFloor, totalUnits, buildingType, avgPrice } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);
        const [result] = await pool.execute(
          `INSERT INTO ${info.tableBuildings} (city_id, estate_id, name, floors, units_per_floor, total_units, building_type, avg_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cityId, estateId, name, floors ?? null, unitsPerFloor ?? null, totalUnits ?? null, buildingType ?? null, avgPrice ?? null]
        ) as any;
        return { id: result.insertId };
      }),
  }),

  // ─── 案例：查询（支持 GeoHash 周边搜索） ─────────────────────
  cases: router({
    list: protectedProcedure
      .input(z.object({
        cityId:          z.number().int().positive(),
        page:            z.number().int().default(1),
        pageSize:        z.number().int().max(100).default(20),
        search:          z.string().optional(),
        transactionType: z.enum(["sale", "rent"]).optional(),
        minPrice:        z.number().optional(),
        maxPrice:        z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { cityId, page, pageSize, search, transactionType, minPrice, maxPrice } = input;
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ?";
        const params: any[] = [cityId];
        if (transactionType) { where += " AND transaction_type = ?"; params.push(transactionType); }
        if (minPrice) { where += " AND unit_price >= ?"; params.push(minPrice); }
        if (maxPrice) { where += " AND unit_price <= ?"; params.push(maxPrice); }
        if (search) { where += " AND (address LIKE ? OR community LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

        const [rows] = await pool.execute(
          `SELECT * FROM ${info.tableCases} ${where} ORDER BY deal_date DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        ) as any;
        const [[countRow]] = await pool.execute(
          `SELECT COUNT(*) as cnt FROM ${info.tableCases} ${where}`, params
        ) as any;
        return { items: rows, total: countRow.cnt, page, pageSize, shardInfo: info };
      }),

    // ─── GeoHash 周边案例搜索（估价引擎核心） ────────────────────
    nearbySearch: protectedProcedure
      .input(z.object({
        cityId:    z.number(),
        geohash:   z.string().min(4),   // 至少 4 位（约 39km 精度）
        precision: z.number().int().min(4).max(8).default(6), // 6位≈1.2km
        limit:     z.number().int().max(200).default(50),
        minDate:   z.string().optional(), // ISO 日期字符串，过滤最近N个月
      }))
      .query(async ({ input }) => {
        const { cityId, geohash, precision, limit, minDate } = input;
        const prefix = geohash.slice(0, precision);
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);

        let where = "WHERE city_id = ? AND geohash LIKE ? AND is_anomaly = 0";
        const params: any[] = [cityId, `${prefix}%`];
        if (minDate) { where += " AND deal_date >= ?"; params.push(minDate); }

        const [rows] = await pool.execute(
          `SELECT id, address, area, floor, total_floors, unit_price, total_price,
                  deal_date, community, rooms, decoration, build_year,
                  latitude, longitude, geohash
           FROM ${info.tableCases} ${where}
           ORDER BY deal_date DESC LIMIT ?`,
          [...params, limit]
        ) as any;
        return { items: rows, prefix, shardInfo: info };
      }),

    // ─── 批量写入案例（爬虫数据入库） ────────────────────────────
    batchInsert: protectedProcedure
      .input(z.object({
        cityId: z.number(),
        cases: z.array(z.object({
          address:         z.string().optional(),
          area:            z.number().optional(),
          floor:           z.number().optional(),
          totalFloors:     z.number().optional(),
          unitPrice:       z.number().optional(),
          totalPrice:      z.number().optional(),
          dealDate:        z.string().optional(),
          community:       z.string().optional(),
          rooms:           z.string().optional(),
          decoration:      z.string().optional(),
          buildYear:       z.number().optional(),
          latitude:        z.number().optional(),
          longitude:       z.number().optional(),
          source:          z.string().optional(),
          sourceId:        z.string().optional(),
          transactionType: z.enum(["sale", "rent"]).default("sale"),
        })),
      }))
      .mutation(async ({ input }) => {
        const { cityId, cases } = input;
        if (cases.length === 0) return { inserted: 0 };
        const info = getCityShardInfo(cityId);
        const pool = getPoolByCityId(cityId);

        let inserted = 0;
        for (const c of cases) {
          let geohash: string | null = null;
          if (c.latitude && c.longitude) {
            geohash = encodeGeoHash(c.latitude, c.longitude, 8);
          }
          try {
            await pool.execute(
              `INSERT IGNORE INTO ${info.tableCases}
               (city_id, address, area, floor, total_floors, unit_price, total_price,
                deal_date, community, rooms, decoration, build_year,
                latitude, longitude, geohash, source, source_id, transaction_type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                cityId, c.address ?? null, c.area ?? null, c.floor ?? null,
                c.totalFloors ?? null, c.unitPrice ?? null, c.totalPrice ?? null,
                c.dealDate ?? null, c.community ?? null, c.rooms ?? null,
                c.decoration ?? null, c.buildYear ?? null,
                c.latitude ?? null, c.longitude ?? null, geohash,
                c.source ?? null, c.sourceId ?? null, c.transactionType,
              ]
            );
            inserted++;
          } catch { /* 重复数据跳过 */ }
        }
        return { inserted, shardInfo: info };
      }),
  }),

  // ─── 全局统计（跨所有分库） ────────────────────────────────────
  globalStats: protectedProcedure.query(async () => {
    const regions: ShardRegion[] = ["south", "east", "north", "central", "west"];
    const stats: Record<string, any> = {};

    await Promise.all(regions.map(async (region) => {
      try {
        const pool = getShardPool(region);
        const tables = ["estates", "buildings", "units", "cases"];
        const regionStats: Record<string, number> = {};
        for (const table of tables) {
          let total = 0;
          for (let i = 0; i < 4; i++) {
            try {
              const [[row]] = await pool.execute(
                `SELECT COUNT(*) as cnt FROM ${table}_${i}`
              ) as any;
              total += Number(row.cnt);
            } catch { /* 表不存在时跳过 */ }
          }
          regionStats[table] = total;
        }
        stats[region] = regionStats;
      } catch {
        stats[region] = { error: "connection failed" };
      }
    }));

    return stats;
  }),
});

// ─── GeoHash 编码工具函数 ──────────────────────────────────────
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeoHash(lat: number, lng: number, precision: number = 8): string {
  let idx = 0, bit = 0, evenBit = true;
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  let hash = "";

  while (hash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) { idx = idx * 2 + 1; lngMin = lngMid; }
      else { idx = idx * 2; lngMax = lngMid; }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) { idx = idx * 2 + 1; latMin = latMid; }
      else { idx = idx * 2; latMax = latMid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      hash += BASE32[idx];
      bit = 0; idx = 0;
    }
  }
  return hash;
}
