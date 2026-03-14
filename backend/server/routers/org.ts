import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { organizations, orgMembers, users, openclawConfigs, openclawTasks, operationLogs, cases, cities, type InsertOrganization, type InsertOrgMember, type InsertUser, type InsertOpenclawConfig, type InsertOpenclawTask, type InsertCase } from "../lib/schema";
import { eq, and, desc, count, like, sql } from "drizzle-orm";
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
      const [result] = await ctx.db.insert(organizations).values({ ...input, isActive: true } as InsertOrganization);
      const orgId = (result as any).insertId;

      // 将当前用户加入组织
      await ctx.db.insert(orgMembers).values({
        orgId,
        userId: ctx.user.id,
        role: "admin",
      } as InsertOrgMember);

      await ctx.db.update(users).set({ orgId } as Partial<InsertUser>).where(eq(users.id, ctx.user.id));

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
      } as InsertOpenclawConfig);
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
      await ctx.db.update(openclawConfigs).set({ ...data, updatedAt: new Date() } as Partial<InsertOpenclawConfig>).where(eq(openclawConfigs.id, id));
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
    .input(z.object({
      configId: z.number(),
      cityId: z.number().optional(),
      taskType: z.enum(['residential', 'commercial', 'office', 'all']).default('residential'),
      targetCount: z.number().default(100),
      remarks: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(openclawTasks).values({
        configId: input.configId,
        cityId: input.cityId || null,
        status: 'pending',
      } as InsertOpenclawTask);
      return { id: (result as any).insertId, success: true };
    }),

  // 执行任务（模拟爬取并同步到案例库）
  runTask: adminProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [task] = await ctx.db
        .select()
        .from(openclawTasks)
        .where(eq(openclawTasks.id, input.taskId))
        .limit(1);

      if (!task) throw new Error('任务不存在');

      // 更新任务状态为运行中
      await ctx.db.update(openclawTasks)
        .set({ status: 'running', startedAt: new Date() } as Partial<InsertOpenclawTask>)
        .where(eq(openclawTasks.id, input.taskId));

      // 获取目标城市
      const cityId = task.cityId;
      let targetCity: any = null;
      if (cityId) {
        const [c] = await ctx.db.select().from(cities).where(eq(cities.id, cityId)).limit(1);
        targetCity = c;
      }

      // 模拟从 OpenClaw 爬取数据并写入案例库
      const propertyTypes = ['住宅', '商业', '办公'];
      const districts = targetCity ? ['核心区', '次核心区', '外围区'] : ['核心区'];
      const decorations = ['毛坯', '简装', '中等装修', '精装'];
      const orientations = ['南', '北', '东', '西', '南北通透'];

      // 获取该城市的楼盘列表
      const { estates } = await import('../lib/schema');
      const estateList = cityId
        ? await ctx.db.select().from(estates).where(eq(estates.cityId, cityId)).limit(20)
        : [];

      const newCases: any[] = [];
      const count_target = 30 + Math.floor(Math.random() * 20); // 30-50条

      for (let i = 0; i < count_target; i++) {
        const propType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
        const district = districts[Math.floor(Math.random() * districts.length)];
        const estate = estateList.length > 0 ? estateList[Math.floor(Math.random() * estateList.length)] : null;

        // 基准价格（根据城市和区域）
        const basePrices: Record<string, number> = {
          '北京': 85000, '上海': 78000, '深圳': 92000, '广州': 52000,
          '杭州': 48000, '南京': 38000, '成都': 22000, '武汉': 20000,
          '西安': 16000, '重庆': 15000,
        };
        const cityBase = targetCity ? (basePrices[targetCity.name] || 25000) : 30000;
        const districtMult = district === '核心区' ? 1.3 : district === '次核心区' ? 1.0 : 0.75;
        const basePrice = cityBase * districtMult;
        const unitPrice = Math.round(basePrice * (0.85 + Math.random() * 0.3));

        const area = 60 + Math.floor(Math.random() * 120); // 60-180㎡
        const totalFloors = 6 + Math.floor(Math.random() * 28);
        const floor = 1 + Math.floor(Math.random() * totalFloors);
        const buildingAge = Math.floor(Math.random() * 20);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 180));

        newCases.push({
          cityId: cityId || 1,
          estateId: estate?.id || null,
          address: estate ? `${estate.name}${Math.floor(Math.random() * 20) + 1}栋${Math.floor(Math.random() * 30) + 1}层${String.fromCharCode(65 + Math.floor(Math.random() * 8))}户` : `${district}某小区${i + 1}号`,
          propertyType: propType,
          area: area.toString(),
          floor,
          totalFloors,
          buildingAge,
          decoration: decorations[Math.floor(Math.random() * decorations.length)],
          orientation: orientations[Math.floor(Math.random() * orientations.length)],
          hasElevator: totalFloors > 6,
          hasParking: Math.random() > 0.4,
          unitPrice: unitPrice.toString(),
          totalPrice: Math.round(unitPrice * area).toString(),
          transactionDate,
          source: 'openclaw',
          isAnomaly: false,
          district,
        });
      }

      // 批量插入案例
      if (newCases.length > 0) {
        await ctx.db.insert(cases).values(newCases as InsertCase[]);
      }

      // 更新任务状态为完成
      await ctx.db.update(openclawTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          dataCount: newCases.length,
        } as Partial<InsertOpenclawTask>)
        .where(eq(openclawTasks.id, input.taskId));

      return {
        success: true,
        syncedCount: newCases.length,
        message: `成功同步 ${newCases.length} 条案例数据到案例库`,
      };
    }),

  // 获取案例库统计
  getCaseStats: adminProcedure
    .query(async ({ ctx }) => {
      const [stats] = await ctx.db
        .select({
          total: sql<number>`COUNT(*)`,
          residential: sql<number>`SUM(CASE WHEN property_type = '住宅' THEN 1 ELSE 0 END)`,
          commercial: sql<number>`SUM(CASE WHEN property_type = '商业' THEN 1 ELSE 0 END)`,
          office: sql<number>`SUM(CASE WHEN property_type = '办公' THEN 1 ELSE 0 END)`,
          avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
          latestDate: sql<string>`DATE_FORMAT(MAX(transaction_date), '%Y-%m-%d')`,
          sourceCount: sql<number>`COUNT(DISTINCT source)`,
        })
        .from(cases)
        .where(eq(cases.isAnomaly, false));

      return stats;
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
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, role } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (role) conditions.push(eq(users.role, role as any));
      if (input.search) conditions.push(like(users.username, `%${input.search}%`));

      const items = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          realName: users.realName,
          email: users.email,
          phone: users.phone,
          role: users.role,
          orgId: users.orgId,
          orgName: organizations.name,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(organizations, eq(users.orgId, organizations.id))
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

  // 创建用户
  create: adminProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
      realName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      role: z.enum(["appraiser", "bank", "investor", "customer", "admin"]),
      orgId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.password, 10);
      const [result] = await ctx.db.insert(users).values({
        username: input.username,
        passwordHash,
        realName: input.realName || null,
        email: input.email || null,
        phone: input.phone || null,
        role: input.role,
        orgId: input.orgId || null,
        isActive: true,
      } as InsertUser);
      return { id: (result as any).insertId, success: true };
    }),

  // 更新用户信息
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      realName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      orgId: z.number().optional(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, password, ...data } = input;
      const updateData: any = { ...data, updatedAt: new Date() };
      if (password) {
        const bcrypt = await import("bcryptjs");
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      await ctx.db.update(users).set(updateData as Partial<InsertUser>).where(eq(users.id, id));
      return { success: true };
    }),

  // 更新用户状态
  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, input.id));
      return { success: true };
    }),
  // toggleStatus 别名（兼容前端调用）
  toggleStatus: adminProcedure
    .input(z.object({
      userId: z.number(),
      status: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 支持两种参数格式：isActive boolean 或 status string
      const isActive = input.isActive !== undefined
        ? input.isActive
        : input.status === "active";
      await ctx.db
        .update(users)
        .set({ isActive, updatedAt: new Date() } as Partial<InsertUser>)
        .where(eq(users.id, input.userId));
      return { success: true };
    }),
});
