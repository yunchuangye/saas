import { z } from "zod";
import { router, publicProcedure, protectedProcedure, JWT_SECRET_KEY } from "../lib/trpc";
import { users, organizations, type InsertUser } from "../lib/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

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
        throw new TRPCError({ code: "UNAUTHORIZED", message: "用户名或密码错误" });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "账号已被禁用" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
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
    ctx.res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
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
      await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, ctx.user.id));
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
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const valid = await bcrypt.compare(input.oldPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "原密码错误" });
      }

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await ctx.db
        .update(users)
        .set({ passwordHash: newHash, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
