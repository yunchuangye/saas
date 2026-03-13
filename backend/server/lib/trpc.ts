import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "gujia-secret-key-2026";

export type UserPayload = {
  id: number;
  username: string;
  role: string;
  orgId?: number | null;
};

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user: UserPayload | null = null;

  // 从 cookie 或 Authorization header 获取 token
  const token =
    req.cookies?.token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as UserPayload;
      user = payload;
    } catch {
      // token 无效，忽略
    }
  }

  return { req, res, user, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 需要登录的 procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// 需要管理员权限的 procedure
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录" });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理员权限" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const JWT_SECRET_KEY = JWT_SECRET;
