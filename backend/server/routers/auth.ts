import { z } from "zod";
import { router, publicProcedure, protectedProcedure, JWT_SECRET_KEY } from "../lib/trpc";
import { users, organizations, operationLogs, type InsertUser, type InsertOperationLog } from "../lib/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

// 获取真实 IP（支持反向代理）
function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || req.ip || "unknown";
}

// 写入操作日志（异步，不阻塞主流程）
async function writeLog(
  db: any,
  data: {
    userId?: number | null;
    username?: string | null;
    action: string;
    resource?: string;
    detail?: string;
    ip?: string;
    userAgent?: string;
    status?: "success" | "failed";
  }
) {
  try {
    await db.insert(operationLogs).values({
      userId: data.userId ?? null,
      username: data.username ?? null,
      action: data.action,
      resource: data.resource ?? "auth",
      detail: data.detail ?? null,
      ip: data.ip ?? null,
      ipAddress: data.ip ?? null,
      status: data.status ?? "success",
      userAgent: data.userAgent ?? null,
    } as InsertOperationLog);
  } catch (e) {
    // 日志写入失败不影响主流程
    console.error("[OperationLog] 写入失败:", e);
  }
}

export const authRouter = router({
  // 登录
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password } = input;
      const ip = getClientIp(ctx.req);
      const userAgent = (ctx.req.headers["user-agent"] || "").substring(0, 500);

      // 查找用户（支持用户名、手机号、邮箱）
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(
          or(
            eq(users.username, username),
            eq(users.phone, username),
            eq(users.email, username)
          )
        )
        .limit(1);

      if (!user) {
        // 记录登录失败（用户不存在）
        writeLog(ctx.db, {
          username,
          action: "用户登录",
          resource: "auth",
          detail: `登录失败：用户名 "${username}" 不存在`,
          ip,
          userAgent,
          status: "failed",
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }

      if (!user.isActive) {
        writeLog(ctx.db, {
          userId: user.id,
          username: user.username,
          action: "用户登录",
          resource: "auth",
          detail: `登录失败：账号已被禁用`,
          ip,
          userAgent,
          status: "failed",
        });
        throw new TRPCError({ code: "FORBIDDEN", message: "账号已被禁用" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        writeLog(ctx.db, {
          userId: user.id,
          username: user.username,
          action: "用户登录",
          resource: "auth",
          detail: `登录失败：密码错误`,
          ip,
          userAgent,
          status: "failed",
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          orgId: user.orgId,
        },
        JWT_SECRET_KEY,
        { expiresIn: "7d" }
      );

      // 设置 cookie
      ctx.res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      });

      // 记录登录成功
      writeLog(ctx.db, {
        userId: user.id,
        username: user.username,
        action: "用户登录",
        resource: "auth",
        detail: `登录成功，角色：${user.role}`,
        ip,
        userAgent,
        status: "success",
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.realName || user.username,
          realName: user.realName,
          role: user.role,
          orgId: user.orgId,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
      };
    }),

  // 注册
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(2).max(50),
        password: z.string().min(6),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        displayName: z.string().optional(),
        role: z.enum(["appraiser", "bank", "investor", "customer"]).default("customer"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password, phone, email, displayName, role } = input;
      const ip = getClientIp(ctx.req);
      const userAgent = (ctx.req.headers["user-agent"] || "").substring(0, 500);

      // 检查用户名是否已存在
      const [existing] = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "用户名已存在" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await ctx.db.insert(users).values({
        username,
        passwordHash,
        phone: phone || null,
        email: email || null,
        displayName: displayName || username,
        role,
        isActive: true,
      } as InsertUser);

      const userId = (result as any).insertId;

      const token = jwt.sign(
        { id: userId, username, role, orgId: null },
        JWT_SECRET_KEY,
        { expiresIn: "7d" }
      );

      ctx.res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      });

      // 记录注册日志
      writeLog(ctx.db, {
        userId,
        username,
        action: "用户注册",
        resource: "auth",
        detail: `新用户注册成功，角色：${role}`,
        ip,
        userAgent,
        status: "success",
      });

      return {
        token,
        user: { id: userId, username, displayName: displayName || username, role, orgId: null },
      };
    }),

  // 获取当前用户信息
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.realName || user.username,
      realName: user.realName,
      role: user.role,
      orgId: user.orgId,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    };
  }),

  // 获取用户详细资料
  profile: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
    }

    let org = null;
    if (user.orgId) {
      const [orgData] = await ctx.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user.orgId))
        .limit(1);
      org = orgData || null;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.realName || user.username,
      realName: user.realName,
      role: user.role,
      orgId: user.orgId,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      organization: org,
    };
  }),

  // 登出
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const ip = getClientIp(ctx.req);
    const userAgent = (ctx.req.headers["user-agent"] || "").substring(0, 500);

    ctx.res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    // 记录登出日志
    writeLog(ctx.db, {
      userId: ctx.user.id,
      username: ctx.user.username,
      action: "用户登出",
      resource: "auth",
      detail: `用户主动登出`,
      ip,
      userAgent,
      status: "success",
    });

    return { success: true };
  }),

  // 更新个人信息
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const userAgent = (ctx.req.headers["user-agent"] || "").substring(0, 500);

      await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, ctx.user.id));

      writeLog(ctx.db, {
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "更新个人信息",
        resource: "user",
        resourceId: ctx.user.id,
        detail: `更新字段：${Object.keys(input).join(", ")}`,
        ip,
        userAgent,
        status: "success",
      });

      return { success: true };
    }),

  // 修改密码
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const userAgent = (ctx.req.headers["user-agent"] || "").substring(0, 500);

      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const valid = await bcrypt.compare(input.oldPassword, user.passwordHash);
      if (!valid) {
        writeLog(ctx.db, {
          userId: ctx.user.id,
          username: ctx.user.username,
          action: "修改密码",
          resource: "user",
          resourceId: ctx.user.id,
          detail: "修改密码失败：原密码错误",
          ip,
          userAgent,
          status: "failed",
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "原密码错误" });
      }

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await ctx.db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, ctx.user.id));

      writeLog(ctx.db, {
        userId: ctx.user.id,
        username: ctx.user.username,
        action: "修改密码",
        resource: "user",
        resourceId: ctx.user.id,
        detail: "密码修改成功",
        ip,
        userAgent,
        status: "success",
      });

      return { success: true };
    }),
});
