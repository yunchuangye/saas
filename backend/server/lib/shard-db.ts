/**
 * 分库分表路由引擎 (Shard DB Router)
 * ============================================================
 * 替代 ShardingSphere-Proxy，在 Node.js 应用层实现分库路由
 *
 * 分片策略：
 *   - Sharding Key: city_id
 *   - 大区分库：city_id → 华南/华东/华北/华中/西部 5 个 MySQL 数据库
 *   - 分表规则：city_id % 4 → 每个分库内 4 张物理表（_0/_1/_2/_3）
 *
 * 城市-大区映射（基于国家统计局行政区划代码）：
 *   华南 (south)  : 深圳(1) 广州(2) 东莞(3) 佛山(4) 珠海(5) 惠州(6) 中山(7) 汕头(8) 湛江(9) 海口(10)
 *   华东 (east)   : 上海(11) 杭州(12) 南京(13) 苏州(14) 宁波(15) 合肥(16) 福州(17) 厦门(18) 南昌(19) 济南(20)
 *   华北 (north)  : 北京(21) 天津(22) 石家庄(23) 太原(24) 呼和浩特(25) 沈阳(26) 大连(27) 长春(28) 哈尔滨(29) 青岛(30)
 *   华中 (central): 武汉(31) 长沙(32) 郑州(33) 南宁(34) 贵阳(35) 昆明(36) 南宁(37) 桂林(38) 柳州(39) 遵义(40)
 *   西部 (west)   : 成都(41) 重庆(42) 西安(43) 兰州(44) 西宁(45) 银川(46) 乌鲁木齐(47) 拉萨(48) 贵阳(49) 昆明(50)
 */

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as fs from "fs";
import * as schema from "./schema";

// ─── 大区分库配置 ──────────────────────────────────────────────
export type ShardRegion = "south" | "east" | "north" | "central" | "west";

const SHARD_DB_NAMES: Record<ShardRegion, string> = {
  south:   "gujia_south",
  east:    "gujia_east",
  north:   "gujia_north",
  central: "gujia_central",
  west:    "gujia_west",
};

// city_id → 大区映射表
const CITY_REGION_MAP: Record<number, ShardRegion> = {
  // 华南区
  1: "south", 2: "south", 3: "south", 4: "south", 5: "south",
  6: "south", 7: "south", 8: "south", 9: "south", 10: "south",
  // 华东区
  11: "east", 12: "east", 13: "east", 14: "east", 15: "east",
  16: "east", 17: "east", 18: "east", 19: "east", 20: "east",
  // 华北区
  21: "north", 22: "north", 23: "north", 24: "north", 25: "north",
  26: "north", 27: "north", 28: "north", 29: "north", 30: "north",
  // 华中区
  31: "central", 32: "central", 33: "central", 34: "central", 35: "central",
  36: "central", 37: "central", 38: "central", 39: "central", 40: "central",
  // 西部区
  41: "west", 42: "west", 43: "west", 44: "west", 45: "west",
  46: "west", 47: "west", 48: "west", 49: "west", 50: "west",
};

// ─── 分表后缀计算 ──────────────────────────────────────────────
/** 根据 city_id 计算物理表后缀 (0~3) */
export function getTableSuffix(cityId: number): number {
  return cityId % 4;
}

/** 获取分片表名 */
export function getShardTableName(
  baseTable: "estates" | "buildings" | "units" | "cases",
  cityId: number
): string {
  return `${baseTable}_${getTableSuffix(cityId)}`;
}

/** 获取城市对应的大区 */
export function getCityRegion(cityId: number): ShardRegion {
  return CITY_REGION_MAP[cityId] ?? "south"; // 未知城市默认华南
}

// ─── 连接池管理 ────────────────────────────────────────────────
const socketPath = process.env.DB_SOCKET || "/var/run/mysqld/mysqld.sock";
const basePoolConfig: mysql.PoolOptions = {
  user:     process.env.DB_USER     || "gujia",
  password: process.env.DB_PASSWORD || "gujia_dev_2026",
  waitForConnections: true,
  connectionLimit: 5,   // 每个分库连接池较小
  queueLimit: 0,
};
if (fs.existsSync(socketPath)) {
  (basePoolConfig as any).socketPath = socketPath;
} else {
  basePoolConfig.host = process.env.DB_HOST || "localhost";
  basePoolConfig.port = parseInt(process.env.DB_PORT || "3306");
}

// 懒加载连接池缓存
const _poolCache = new Map<ShardRegion, mysql.Pool>();
const _dbCache   = new Map<ShardRegion, ReturnType<typeof drizzle>>();

/** 获取指定大区的连接池（懒加载） */
export function getShardPool(region: ShardRegion): mysql.Pool {
  if (!_poolCache.has(region)) {
    const pool = mysql.createPool({
      ...basePoolConfig,
      database: SHARD_DB_NAMES[region],
    });
    _poolCache.set(region, pool);
  }
  return _poolCache.get(region)!;
}

/** 获取指定大区的 Drizzle ORM 实例（懒加载） */
export function getShardDb(region: ShardRegion) {
  if (!_dbCache.has(region)) {
    const pool = getShardPool(region);
    const db = drizzle(pool, { schema, mode: "default" });
    _dbCache.set(region, db);
  }
  return _dbCache.get(region)!;
}

/** 根据 city_id 直接获取对应的 Drizzle ORM 实例 */
export function getDbByCityId(cityId: number) {
  const region = getCityRegion(cityId);
  return getShardDb(region);
}

/** 根据 city_id 直接获取对应的 mysql2 Pool */
export function getPoolByCityId(cityId: number): mysql.Pool {
  const region = getCityRegion(cityId);
  return getShardPool(region);
}

// ─── 跨分库查询工具 ────────────────────────────────────────────
/**
 * 并行查询所有大区（用于全局搜索、统计等场景）
 * @param fn 对每个大区执行的查询函数
 */
export async function queryAllShards<T>(
  fn: (db: ReturnType<typeof drizzle>, region: ShardRegion) => Promise<T[]>
): Promise<T[]> {
  const regions: ShardRegion[] = ["south", "east", "north", "central", "west"];
  const results = await Promise.allSettled(
    regions.map(region => fn(getShardDb(region), region))
  );
  const merged: T[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    }
  }
  return merged;
}

/**
 * 在指定分库中执行原生 SQL（用于复杂聚合查询）
 */
export async function executeOnShard(
  cityId: number,
  sql: string,
  params: any[] = []
): Promise<any[]> {
  const pool = getPoolByCityId(cityId);
  const [rows] = await pool.execute(sql, params);
  return rows as any[];
}

// ─── 健康检查 ──────────────────────────────────────────────────
export async function checkShardHealth(): Promise<Record<ShardRegion, "ok" | "error">> {
  const regions: ShardRegion[] = ["south", "east", "north", "central", "west"];
  const result: Record<string, "ok" | "error"> = {};
  await Promise.all(
    regions.map(async (region) => {
      try {
        const pool = getShardPool(region);
        const conn = await pool.getConnection();
        await conn.query("SELECT 1");
        conn.release();
        result[region] = "ok";
      } catch {
        result[region] = "error";
      }
    })
  );
  return result as Record<ShardRegion, "ok" | "error">;
}

// ─── 城市信息工具 ──────────────────────────────────────────────
export interface CityShardInfo {
  cityId: number;
  region: ShardRegion;
  dbName: string;
  tableEstates: string;
  tableBuildings: string;
  tableUnits: string;
  tableCases: string;
}

export function getCityShardInfo(cityId: number): CityShardInfo {
  const region = getCityRegion(cityId);
  return {
    cityId,
    region,
    dbName: SHARD_DB_NAMES[region],
    tableEstates:  getShardTableName("estates",   cityId),
    tableBuildings: getShardTableName("buildings", cityId),
    tableUnits:    getShardTableName("units",      cityId),
    tableCases:    getShardTableName("cases",      cityId),
  };
}
