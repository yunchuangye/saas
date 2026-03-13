import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import Redis from "ioredis";
import * as schema from "./schema";

// MySQL 连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "gujia",
  password: process.env.DB_PASSWORD || "gujia123456",
  database: process.env.DB_NAME || "gujia",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

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
