/**
 * 单库分表路由引擎（Single Database Sharding）
 * ============================================================
 * 数据库：gujia（唯一主库，无需多个数据库实例）
 * 分表规则：city_id % SHARD_COUNT，分为 8 张物理表（_0 ~ _7）
 *
 * 物理表清单（每类 8 张，共 32 张）：
 *   estates_0  ~ estates_7   （楼盘）
 *   buildings_0 ~ buildings_7 （楼栋）
 *   units_0    ~ units_7     （房屋）
 *   cases_0    ~ cases_7     （成交案例）
 *
 * 城市 → 分表映射示例：
 *   北京 (city_id=1)   → 1 % 8 = 1 → estates_1, cases_1
 *   天津 (city_id=2)   → 2 % 8 = 2 → estates_2, cases_2
 *   深圳 (city_id=174) → 174 % 8 = 6 → estates_6, cases_6
 *   上海 (city_id=35)  → 35 % 8 = 3 → estates_3, cases_3
 *
 * 扩容方案：
 *   当前 8 张分表 → 可扩展至 16 张（需执行数据迁移脚本）
 *   迁移时修改 SHARD_COUNT 并执行 migrate_shard.sql
 */

import { db } from "./db";

// ─── 分表配置 ────────────────────────────────────────────────
/** 分表数量，必须为 2 的幂次（方便后续翻倍扩容） */
export const SHARD_COUNT = 8;

// ─── 分表后缀计算 ────────────────────────────────────────────

/**
 * 根据 city_id 计算分表后缀（0 ~ SHARD_COUNT-1）
 * @example getShardSuffix(1)   → 1  (北京)
 * @example getShardSuffix(174) → 6  (深圳)
 * @example getShardSuffix(35)  → 3  (上海)
 */
export function getShardSuffix(cityId: number): number {
  return ((cityId % SHARD_COUNT) + SHARD_COUNT) % SHARD_COUNT;
}

/**
 * 获取指定城市的所有物理表名
 */
export function getTableNames(cityId: number) {
  const suffix = getShardSuffix(cityId);
  return {
    estates:   `estates_${suffix}`,
    buildings: `buildings_${suffix}`,
    units:     `units_${suffix}`,
    cases:     `cases_${suffix}`,
    suffix,
  };
}

/**
 * 获取单个物理表名
 */
export function getShardTableName(
  baseTable: "estates" | "buildings" | "units" | "cases",
  cityId: number
): string {
  return `${baseTable}_${getShardSuffix(cityId)}`;
}

/**
 * 获取所有分表名（用于跨分表全局查询）
 */
export function getAllTableNames() {
  const result: { estates: string[]; buildings: string[]; units: string[]; cases: string[] } = {
    estates:   [],
    buildings: [],
    units:     [],
    cases:     [],
  };
  for (let i = 0; i < SHARD_COUNT; i++) {
    result.estates.push(`estates_${i}`);
    result.buildings.push(`buildings_${i}`);
    result.units.push(`units_${i}`);
    result.cases.push(`cases_${i}`);
  }
  return result;
}

// ─── 分表查询工具 ────────────────────────────────────────────

/**
 * 在指定城市的分表中执行 SELECT 查询
 * SQL 中使用 {{TABLE}} 作为表名占位符
 *
 * @example
 * const rows = await queryShardTable(1, "estates", "SELECT * FROM {{TABLE}} WHERE city_id=? LIMIT 20", [1]);
 */
export async function queryShardTable(
  cityId: number,
  tableType: "estates" | "buildings" | "units" | "cases",
  sql: string,
  params: any[] = []
): Promise<any[]> {
  const tables = getTableNames(cityId);
  const tableName = tables[tableType];
  const fullSql = sql.replace(/\{\{TABLE\}\}/g, `\`${tableName}\``);
  const [rows] = await (db as any).execute(fullSql, params);
  return rows as any[];
}

/**
 * 跨所有分表并行查询（用于全局统计、全文搜索）
 * SQL 中使用 {{TABLE}} 作为表名占位符
 *
 * @example
 * const allRows = await queryAllShards("estates", "SELECT COUNT(*) as cnt FROM {{TABLE}}");
 */
export async function queryAllShards(
  tableType: "estates" | "buildings" | "units" | "cases",
  sql: string,
  params: any[] = []
): Promise<any[]> {
  const allTables = getAllTableNames();
  const tableNames = allTables[tableType];

  const results = await Promise.allSettled(
    tableNames.map(async (tableName) => {
      const fullSql = sql.replace(/\{\{TABLE\}\}/g, `\`${tableName}\``);
      try {
        const [rows] = await (db as any).execute(fullSql, params);
        return rows as any[];
      } catch {
        return [] as any[];
      }
    })
  );

  const merged: any[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    }
  }
  return merged;
}

/**
 * 在指定城市的分表中执行写入操作（INSERT/UPDATE/DELETE）
 * SQL 中使用 {{TABLE}} 作为表名占位符
 */
export async function executeShardTable(
  cityId: number,
  tableType: "estates" | "buildings" | "units" | "cases",
  sql: string,
  params: any[] = []
): Promise<any> {
  const tables = getTableNames(cityId);
  const tableName = tables[tableType];
  const fullSql = sql.replace(/\{\{TABLE\}\}/g, `\`${tableName}\``);
  const [result] = await (db as any).execute(fullSql, params);
  return result;
}

// ─── GeoHash 工具 ────────────────────────────────────────────
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * 将经纬度编码为 GeoHash 字符串
 * @param lat 纬度
 * @param lng 经度
 * @param precision 精度：5≈4.9km, 6≈1.2km, 7≈152m
 */
export function encodeGeoHash(lat: number, lng: number, precision = 6): string {
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = "";
  let bits = 0;
  let hashValue = 0;
  let isLng = true;

  while (hash.length < precision) {
    if (isLng) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { hashValue = (hashValue << 1) + 1; minLng = mid; }
      else            { hashValue = (hashValue << 1) + 0; maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { hashValue = (hashValue << 1) + 1; minLat = mid; }
      else            { hashValue = (hashValue << 1) + 0; maxLat = mid; }
    }
    isLng = !isLng;
    bits++;
    if (bits === 5) {
      hash += BASE32[hashValue];
      bits = 0;
      hashValue = 0;
    }
  }
  return hash;
}

// ─── 健康检查 ────────────────────────────────────────────────

/**
 * 检查所有分表是否存在（健康检查用）
 */
export async function checkShardTablesHealth(): Promise<{
  healthy: boolean;
  totalTables: number;
  missingTables: string[];
}> {
  const allTables = getAllTableNames();
  const allTableNames = [
    ...allTables.estates,
    ...allTables.buildings,
    ...allTables.units,
    ...allTables.cases,
  ];

  const results = await Promise.allSettled(
    allTableNames.map(async (tableName) => {
      await (db as any).execute(`SELECT 1 FROM \`${tableName}\` LIMIT 1`);
      return tableName;
    })
  );

  const missingTables: string[] = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      missingTables.push(allTableNames[i]);
    }
  }

  return {
    healthy: missingTables.length === 0,
    totalTables: allTableNames.length,
    missingTables,
  };
}

// ─── 城市分片信息 ────────────────────────────────────────────

export interface CityShardInfo {
  cityId: number;
  shardSuffix: number;
  shardIndex: number;          // alias for shardSuffix, for frontend compatibility
  shardCount: number;
  dbName: string;
  tableEstates:   string;
  tableBuildings: string;
  tableUnits:     string;
  tableCases:     string;
  description:    string;
  // 统计数据（需异步查询时为 undefined）
  estateCount?:   number;
  buildingCount?: number;
  unitCount?:     number;
  caseCount?:     number;
  region?:        string;
}

/**
 * 获取城市的分片信息（同步，仅返回路由元数据）
 */
export function getCityShardInfo(cityId: number): CityShardInfo {
  const tables = getTableNames(cityId);
  return {
    cityId,
    shardSuffix:    tables.suffix,
    shardIndex:     tables.suffix,
    shardCount:     SHARD_COUNT,
    dbName:         "gujia",
    tableEstates:   tables.estates,
    tableBuildings: tables.buildings,
    tableUnits:     tables.units,
    tableCases:     tables.cases,
    description:    `city_id(${cityId}) % ${SHARD_COUNT} = ${tables.suffix}`,
  };
}

/**
 * 获取城市的分片信息（含真实数据统计，异步）
 */
export async function getCityShardInfoWithStats(cityId: number): Promise<CityShardInfo> {
  const base = getCityShardInfo(cityId);
  try {
    const [estateRows, buildingRows, caseRows] = await Promise.all([
      (db as any).execute(`SELECT COUNT(*) as cnt FROM \`${base.tableEstates}\` WHERE city_id=?`, [cityId]),
      (db as any).execute(`SELECT COUNT(*) as cnt FROM \`${base.tableBuildings}\` WHERE city_id=?`, [cityId]),
      (db as any).execute(`SELECT COUNT(*) as cnt FROM \`${base.tableCases}\` WHERE city_id=?`, [cityId]),
    ]);
    // 同时查询城市大区信息
    const [cityRows] = await (db as any).execute(
      `SELECT region FROM cities WHERE id=? LIMIT 1`, [cityId]
    ) as any;
    return {
      ...base,
      estateCount:   Number(estateRows[0]?.[0]?.cnt ?? 0),
      buildingCount: Number(buildingRows[0]?.[0]?.cnt ?? 0),
      caseCount:     Number(caseRows[0]?.[0]?.cnt ?? 0),
      region:        cityRows?.[0]?.region ?? "",
    };
  } catch {
    return base;
  }
}

// ─── 兼容旧接口（保持向后兼容） ──────────────────────────────
/** @deprecated 使用 getShardSuffix 替代 */
export const getTableSuffix = getShardSuffix;
/** @deprecated 使用 checkShardTablesHealth 替代 */
export async function checkShardHealth() {
  const result = await checkShardTablesHealth();
  return { gujia: result.healthy ? "ok" : "error" } as Record<string, "ok" | "error">;
}
/** @deprecated 单库模式无需 getPoolByCityId，使用 db 直接操作 */
export function getPoolByCityId(_cityId: number) { return null; }
/** @deprecated 单库模式无需 getDbByCityId，使用 db 直接操作 */
export function getDbByCityId(_cityId: number) { return null; }
