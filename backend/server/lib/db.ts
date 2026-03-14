import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import Redis from "ioredis";
import * as fs from "fs";
import * as schema from "./schema";

// MySQL 连接池（优先使用 Unix socket，避免 TCP 认证问题）
// 注意：由于 ESM import hoisting，dotenv 可能在此之前未加载，使用硬编码默认值作为备用
const socketPath = process.env.DB_SOCKET || "/var/run/mysqld/mysqld.sock";
const poolConfig: mysql.PoolOptions = {
  user: process.env.DB_USER || "gujia",
  password: process.env.DB_PASSWORD || "gujia_dev_2026",  // 与 .env 保持一致
  database: process.env.DB_NAME || "gujia",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
};
// 如果存在 socket 文件则使用 socket，否则使用 TCP
if (fs.existsSync(socketPath)) {
  (poolConfig as any).socketPath = socketPath;
} else {
  poolConfig.host = process.env.DB_HOST || "localhost";
  poolConfig.port = parseInt(process.env.DB_PORT || "3306");
}
const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool, { schema, mode: "default" });

// Redis 连接
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

export { pool };
