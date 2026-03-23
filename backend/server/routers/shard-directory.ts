/**
 * 单库分表路由 - 楼盘/楼栋/房屋/案例 CRUD
 * ============================================================
 * 所有操作均通过 shard-db.ts 路由到 gujia 主库的对应分表
 * Sharding Key: city_id（city_id % 8 → 分表后缀 _0 ~ _7）
 */

import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import {
  getCityShardInfo,
  getCityShardInfoWithStats,
  queryShardTable,
  queryAllShards,
  executeShardTable,
  checkShardTablesHealth,
  encodeGeoHash,
  getAllTableNames,
  SHARD_COUNT,
} from "../lib/shard-db";
import { db } from "../lib/db";
import { TRPCError } from "@trpc/server";

// ─── 楼盘输入验证 ────────────────────────────────────────────
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

  // ─── 分表健康检查 ────────────────────────────────────────────
  shardHealth: protectedProcedure.query(async () => {
    const result = await checkShardTablesHealth();
    return result;
  }),

  // ─── 获取城市分片信息（含统计数据） ────────────────────────────
  getCityShardInfo: protectedProcedure
    .input(z.object({ cityId: z.number() }))
    .query(async ({ input }) => {
      return getCityShardInfoWithStats(input.cityId);
    }),

  // ─── 楼盘操作 ────────────────────────────────────────────────
  estates: router({

    // 创建楼盘
    create: protectedProcedure
      .input(estateInput)
      .mutation(async ({ input }) => {
        const { cityId } = input;
        const info = getCityShardInfo(cityId);

        let geohash = input.geohash;
        if (!geohash && input.latitude && input.longitude) {
          geohash = encodeGeoHash(input.latitude, input.longitude, 8);
        }

        const result = await executeShardTable(
          cityId, "estates",
          `INSERT INTO {{TABLE}}
            (city_id, name, district_id, address, developer, build_year,
             property_type, total_units, latitude, longitude, geohash, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            cityId, input.name, input.districtId ?? null,
            input.address ?? null, input.developer ?? null,
            input.buildYear ?? null, input.propertyType ?? null,
            input.totalUnits ?? null, input.latitude ?? null,
            input.longitude ?? null, geohash ?? null,
          ]
        );

        return { id: result.insertId, shardInfo: info };
      }),

    // 查询楼盘列表（支持分页、搜索）
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
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ? AND is_active = 1";
        const params: any[] = [cityId];

        if (districtId) { where += " AND district_id = ?"; params.push(districtId); }
        if (search) {
          where += " AND (name LIKE ? OR address LIKE ?)";
          params.push(`%${search}%`, `%${search}%`);
        }

        const rows = await queryShardTable(
          cityId, "estates",
          `SELECT * FROM {{TABLE}} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );

        const countRows = await queryShardTable(
          cityId, "estates",
          `SELECT COUNT(*) as cnt FROM {{TABLE}} ${where}`,
          params
        );

        return {
          items: rows,
          total: Number(countRows[0]?.cnt ?? 0),
          page,
          pageSize,
          shardInfo: info,
        };
      }),

    // 楼盘详情
    get: protectedProcedure
      .input(z.object({ cityId: z.number(), id: z.number() }))
      .query(async ({ input }) => {
        const rows = await queryShardTable(
          input.cityId, "estates",
          `SELECT * FROM {{TABLE}} WHERE id = ? AND city_id = ?`,
          [input.id, input.cityId]
        );
        if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "楼盘不存在" });
        return rows[0];
      }),

    // 更新楼盘
    update: protectedProcedure
      .input(estateInput.partial().extend({ id: z.number(), cityId: z.number() }))
      .mutation(async ({ input }) => {
        const { id, cityId, ...fields } = input;
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
        const result = await executeShardTable(
          cityId, "estates",
          `UPDATE {{TABLE}} SET ${setClauses.join(", ")} WHERE id = ? AND city_id = ?`,
          params
        );
        return { affected: result.affectedRows };
      }),

    // 删除楼盘（软删除）
    delete: protectedProcedure
      .input(z.object({ cityId: z.number(), id: z.number() }))
      .mutation(async ({ input }) => {
        await executeShardTable(
          input.cityId, "estates",
          `UPDATE {{TABLE}} SET is_active = 0 WHERE id = ? AND city_id = ?`,
          [input.id, input.cityId]
        );
        return { success: true };
      }),
  }),

  // ─── 楼栋操作 ────────────────────────────────────────────────
  buildings: router({

    // 查询楼栋列表
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
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ?";
        const params: any[] = [cityId];
        if (estateId) { where += " AND estate_id = ?"; params.push(estateId); }
        if (search) { where += " AND name LIKE ?"; params.push(`%${search}%`); }

        const rows = await queryShardTable(
          cityId, "buildings",
          `SELECT * FROM {{TABLE}} ${where} ORDER BY name LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );
        const countRows = await queryShardTable(
          cityId, "buildings",
          `SELECT COUNT(*) as cnt FROM {{TABLE}} ${where}`,
          params
        );
        return { items: rows, total: Number(countRows[0]?.cnt ?? 0), page, pageSize };
      }),

    // 创建楼栋
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
        const result = await executeShardTable(
          cityId, "buildings",
          `INSERT INTO {{TABLE}} (city_id, estate_id, name, floors, units_per_floor, total_units, building_type, avg_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cityId, estateId, name, floors ?? null, unitsPerFloor ?? null, totalUnits ?? null, buildingType ?? null, avgPrice ?? null]
        );
        return { id: result.insertId };
      }),
  }),

  // ─── 成交案例操作 ────────────────────────────────────────────
  cases: router({

    // 查询案例列表（支持无限滚动）
    list: protectedProcedure
      .input(z.object({
        cityId:          z.number().int().positive(),
        page:            z.number().int().default(1),
        pageSize:        z.number().int().max(100).default(30),
        search:          z.string().optional(),
        transactionType: z.enum(["sale", "rent"]).optional(),
        minPrice:        z.number().optional(),
        maxPrice:        z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { cityId, page, pageSize, search, transactionType, minPrice, maxPrice } = input;
        const info = getCityShardInfo(cityId);
        const offset = (page - 1) * pageSize;

        let where = "WHERE city_id = ?";
        const params: any[] = [cityId];
        if (transactionType) { where += " AND transaction_type = ?"; params.push(transactionType); }
        if (minPrice) { where += " AND unit_price >= ?"; params.push(minPrice); }
        if (maxPrice) { where += " AND unit_price <= ?"; params.push(maxPrice); }
        if (search) {
          where += " AND (address LIKE ? OR community LIKE ?)";
          params.push(`%${search}%`, `%${search}%`);
        }

        const rows = await queryShardTable(
          cityId, "cases",
          `SELECT * FROM {{TABLE}} ${where} ORDER BY deal_date DESC LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );
        const countRows = await queryShardTable(
          cityId, "cases",
          `SELECT COUNT(*) as cnt FROM {{TABLE}} ${where}`,
          params
        );
        return {
          items: rows,
          total: Number(countRows[0]?.cnt ?? 0),
          page,
          pageSize,
          shardInfo: info,
        };
      }),

    // GeoHash 周边案例搜索（估价引擎核心）
    nearbySearch: protectedProcedure
      .input(z.object({
        cityId:    z.number(),
        geohash:   z.string().min(4),
        precision: z.number().int().min(4).max(8).default(6),
        limit:     z.number().int().max(200).default(50),
        minDate:   z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { cityId, geohash, precision, limit, minDate } = input;
        const prefix = geohash.slice(0, precision);
        const info = getCityShardInfo(cityId);

        let where = "WHERE city_id = ? AND geohash LIKE ?";
        const params: any[] = [cityId, `${prefix}%`];
        if (minDate) { where += " AND deal_date >= ?"; params.push(minDate); }

        const rows = await queryShardTable(
          cityId, "cases",
          `SELECT id, address, area, floor, total_floors, unit_price, total_price,
                  deal_date, community, rooms, latitude, longitude, geohash
           FROM {{TABLE}} ${where}
           ORDER BY deal_date DESC LIMIT ?`,
          [...params, limit]
        );
        return { items: rows, prefix, shardInfo: info };
      }),

    // 批量写入案例（爬虫数据入库）
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
          buildYear:       z.number().optional(),
          latitude:        z.number().optional(),
          longitude:       z.number().optional(),
          source:          z.string().optional(),
          transactionType: z.enum(["sale", "rent"]).default("sale"),
        })),
      }))
      .mutation(async ({ input }) => {
        const { cityId, cases } = input;
        if (cases.length === 0) return { inserted: 0 };
        const info = getCityShardInfo(cityId);

        let inserted = 0;
        for (const c of cases) {
          let geohash: string | null = null;
          if (c.latitude && c.longitude) {
            geohash = encodeGeoHash(c.latitude, c.longitude, 8);
          }
          try {
            await executeShardTable(
              cityId, "cases",
              `INSERT IGNORE INTO {{TABLE}}
               (city_id, address, area, floor, total_floors, unit_price, total_price,
                deal_date, community, rooms, build_year,
                latitude, longitude, geohash, source, transaction_type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                cityId, c.address ?? null, c.area ?? null, c.floor ?? null,
                c.totalFloors ?? null, c.unitPrice ?? null, c.totalPrice ?? null,
                c.dealDate ?? null, c.community ?? null, c.rooms ?? null,
                c.buildYear ?? null, c.latitude ?? null, c.longitude ?? null,
                geohash, c.source ?? null, c.transactionType,
              ]
            );
            inserted++;
          } catch { /* 重复数据跳过 */ }
        }
        return { inserted, shardInfo: info };
      }),
  }),

  // ─── 全局统计（跨所有分表聚合） ──────────────────────────────
  globalStats: protectedProcedure.query(async () => {
    const tableTypes = ["estates", "buildings", "units", "cases"] as const;
    const stats: Record<string, number> = {};

    await Promise.all(
      tableTypes.map(async (tableType) => {
        const rows = await queryAllShards(
          tableType,
          `SELECT COUNT(*) as cnt FROM {{TABLE}}`
        );
        stats[tableType] = rows.reduce((sum, r) => sum + Number(r.cnt ?? 0), 0);
      })
    );

    // 同时查询城市统计
    const [cityRows] = await (db as any).execute(
      `SELECT region, region_name, COUNT(*) as city_count FROM cities WHERE is_active=1 GROUP BY region, region_name`
    ) as any;

    // 城市总数
    const [totalRow] = await (db as any).execute(
      `SELECT COUNT(*) as cnt FROM cities WHERE is_active=1`
    ) as any;
    const totalCities = Number(totalRow?.[0]?.cnt ?? 298);

    return {
      tables: stats,
      shardCount: SHARD_COUNT,
      cities: cityRows,
      totalCities,
    };
  }),

  // ─── 城市列表（按大区分组） ────────────────────────────────────────
  listCities: protectedProcedure
    .input(z.object({
      region:  z.string().optional(),
      tier:    z.number().int().min(1).max(5).optional(),
      search:  z.string().optional(),
    }))
    .query(async ({ input }) => {
      let where = "WHERE is_active=1";
      const params: any[] = [];
      if (input.region) { where += " AND region=?"; params.push(input.region); }
      if (input.tier)   { where += " AND tier=?";   params.push(input.tier); }
      if (input.search) {
        where += " AND (name LIKE ? OR pinyin LIKE ?)";
        params.push(`%${input.search}%`, `%${input.search}%`);
      }
      const [rows] = await (db as any).execute(
        `SELECT id, name, pinyin, province, region, region_name, tier
         FROM cities ${where}
         ORDER BY tier ASC, id ASC
         LIMIT 500`,
        params
      ) as any;
      return rows as Array<{
        id: number; name: string; pinyin: string;
        province: string; region: string; region_name: string; tier: number;
      }>;
    }),
});
