import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./lib/trpc";
import { db, redis } from "./lib/db";
import { users } from "./lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const app = express();
const PORT = parseInt(process.env.PORT || "3001");

// 中间件
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS 配置
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许所有来源（开发环境）
      callback(null, true);
    },
    credentials: true,
  })
);

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// tRPC 路由
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code !== "UNAUTHORIZED" && error.code !== "NOT_FOUND") {
        console.error(`tRPC error on ${path}:`, error.message);
      }
    },
  })
);

// 初始化数据库（创建默认管理员账号）
async function initDB() {
  try {
    // 检查是否有管理员账号
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (!admin) {
      console.log("Creating default admin user...");
      const hash = await bcrypt.hash("admin123456", 10);
      await db.insert(users).values({
        username: "admin",
        passwordHash: hash,
        displayName: "系统管理员",
        role: "admin",
        isActive: true,
      });
      console.log("Default admin created: admin / admin123456");
    }

    // 创建测试用户
    const testUsers = [
      { username: "appraiser1", role: "appraiser" as const, displayName: "张评估师", password: "test123456" },
      { username: "bank1", role: "bank" as const, displayName: "李银行员", password: "test123456" },
      { username: "investor1", role: "investor" as const, displayName: "王投资人", password: "test123456" },
      { username: "customer1", role: "customer" as const, displayName: "赵客户", password: "test123456" },
    ];

    for (const u of testUsers) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, u.username))
        .limit(1);

      if (!existing) {
        const hash = await bcrypt.hash(u.password, 10);
        await db.insert(users).values({
          username: u.username,
          passwordHash: hash,
          displayName: u.displayName,
          role: u.role,
          isActive: true,
        });
        console.log(`Test user created: ${u.username} / ${u.password}`);
      }
    }
  } catch (err: any) {
    console.error("DB init error:", err.message);
  }
}

// 启动服务
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`\n🚀 gujia.app Backend running on http://localhost:${PORT}`);
  console.log(`📡 tRPC API: http://localhost:${PORT}/api/trpc`);
  console.log(`🔍 Health: http://localhost:${PORT}/health\n`);

  await initDB();
});

export type { AppRouter } from "./routers";
