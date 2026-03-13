import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { organizations, orgMembers, users, openclawConfigs, openclawTasks, operationLogs } from "../lib/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const orgRouter = router({
  // 获取当前用户的组织
  mine: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.orgId) return null;

    const [org] = await ctx.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, ctx.user.orgId))
      .limit(1);

    return org || null;
  }),

  // 获取组织成员
  members: protectedProcedure
    .input(z.object({ orgId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const orgId = input.orgId || ctx.user.orgId;
      if (!orgId) return [];

      const members = await ctx.db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.orgId, orgId));

      return members;
    }),

  // 创建组织
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["appraiser", "bank", "investor"]),
      license: z.string().optional(),
      address: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(organizations).values({ ...input, isActive: true });
      const orgId = (result as any).insertId;

      // 将当前用户加入组织
      await ctx.db.insert(orgMembers).values({
        orgId,
        userId: ctx.user.id,
        role: "admin",
      });

      await ctx.db.update(users).set({ orgId }).where(eq(users.id, ctx.user.id));

      return { id: orgId, success: true };
    }),

  // 列出所有组织（管理员）
  list: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20), type: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, type } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (type) conditions.push(eq(organizations.type, type as any));

      const items = await ctx.db
        .select()
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(organizations.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { items, total: totalResult.count, page, pageSize };
    }),
});

export const openclawRouter = router({
  // 获取配置列表
  listConfigs: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(openclawConfigs)
        .orderBy(desc(openclawConfigs.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db.select({ count: count() }).from(openclawConfigs);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 创建配置
  createConfig: adminProcedure
    .input(z.object({
      name: z.string(),
      apiUrl: z.string().optional(),
      apiKey: z.string().optional(),
      targetCityIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(openclawConfigs).values({
        name: input.name,
        apiUrl: input.apiUrl || null,
        apiKey: input.apiKey || null,
        targetCityIds: input.targetCityIds ? JSON.stringify(input.targetCityIds) : null,
        isActive: true,
      });
      return { id: (result as any).insertId, success: true };
    }),

  // 更新配置
  updateConfig: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      apiUrl: z.string().optional(),
      apiKey: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await ctx.db.update(openclawConfigs).set({ ...data, updatedAt: new Date() }).where(eq(openclawConfigs.id, id));
      return { success: true };
    }),

  // 任务列表
  listTasks: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(openclawTasks)
        .orderBy(desc(openclawTasks.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db.select({ count: count() }).from(openclawTasks);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 创建任务
  createTask: adminProcedure
    .input(z.object({ configId: z.number(), cityId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(openclawTasks).values({
        configId: input.configId,
        cityId: input.cityId || null,
        status: "pending",
      });
      return { id: (result as any).insertId, success: true };
    }),
});

export const logsRouter = router({
  list: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(operationLogs)
        .orderBy(desc(operationLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db.select({ count: count() }).from(operationLogs);

      return { items, total: totalResult.count, page, pageSize };
    }),
});

export const adminUsersRouter = router({
  // 用户列表
  list: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      role: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, role } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (role) conditions.push(eq(users.role, role as any));

      const items = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          orgId: users.orgId,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 更新用户状态
  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.id));
      return { success: true };
    }),
});
