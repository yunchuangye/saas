import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { projects, bids, users, organizations } from "../lib/schema";
import { eq, and, desc, like, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const projectListInput = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const projectsRouter = router({
  // 列表
  list: protectedProcedure
    .input(projectListInput)
    .query(async ({ input, ctx }) => {
      const { page, pageSize, status, search } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (status) conditions.push(eq(projects.status, status as any));
      if (search) conditions.push(like(projects.title, `%${search}%`));

      const role = ctx.user.role;
      if (role === "appraiser" && ctx.user.orgId) {
        // 评估师可以看到：分配给自己组织的项目 OR 自己创建的项目
        const { or } = await import("drizzle-orm");
        conditions.push(or(
          eq(projects.assignedOrgId, ctx.user.orgId),
          eq(projects.clientId, ctx.user.id)
        ) as any);
      } else if ((role === "bank" || role === "investor") && ctx.user.orgId) {
        conditions.push(eq(projects.clientOrgId, ctx.user.orgId));
      } else if (role === "customer") {
        conditions.push(eq(projects.clientId, ctx.user.id));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(whereClause);

      const items = await ctx.db
        .select()
        .from(projects)
        .where(whereClause)
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        items,
        total: totalResult.count,
        page,
        pageSize,
        totalPages: Math.ceil(totalResult.count / pageSize),
      };
    }),

  // 竞价中的项目
  listBidding: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.status, "bidding"))
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "bidding"));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 进行中的项目
  listActive: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [eq(projects.status, "active")];
      if (ctx.user.orgId) {
        if (ctx.user.role === "appraiser") {
          conditions.push(eq(projects.assignedOrgId, ctx.user.orgId));
        } else {
          conditions.push(eq(projects.clientOrgId, ctx.user.orgId));
        }
      }

      const items = await ctx.db
        .select()
        .from(projects)
        .where(and(...conditions))
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(...conditions));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 已完成的项目
  listCompleted: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.status, "completed"))
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "completed"));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 获取单个项目
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [project] = await ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "项目不存在" });
      }

      return project;
    }),

  // 创建项目
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        propertyAddress: z.string().optional(),
        propertyType: z.string().optional(),
        area: z.number().optional(),
        deadline: z.string().optional(),
        cityId: z.number().optional(),
        estateId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 自动生成项目编号
      const year = new Date().getFullYear();
      const [countResult] = await ctx.db.select({ count: count() }).from(projects);
      const seq = String((countResult.count || 0) + 1).padStart(4, "0");
      const projectNo = `PRJ-${year}-${seq}`;

      const [result] = await ctx.db.insert(projects).values({
        projectNo,
        title: input.title,
        description: input.description || null,
        propertyAddress: input.propertyAddress || null,
        propertyType: input.propertyType || null,
        area: input.area ? String(input.area) : null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        cityId: input.cityId || null,
        estateId: input.estateId || null,
        clientId: ctx.user.id,
        clientOrgId: ctx.user.orgId || null,
        bankOrgId: ctx.user.orgId || null,
        bankUserId: ctx.user.id,
        // 评估师创建项目时，自动将自己的组织设为 assignedOrgId
        assignedOrgId: ctx.user.role === "appraiser" && ctx.user.orgId ? ctx.user.orgId : null,
        assignedUserId: ctx.user.role === "appraiser" ? ctx.user.id : null,
        status: ctx.user.role === "appraiser" ? "active" : "bidding",
      });

      return { id: (result as any).insertId, success: true };
    }),

  // 更新项目状态
  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["bidding", "active", "completed", "cancelled"]) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(projects)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(projects.id, input.id));
      return { success: true };
    }),
});

export const bidsRouter = router({
  // 提交竞价
  submit: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        price: z.number(),
        days: z.number().optional(),
        estimatedDays: z.number().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.orgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "需要所属组织才能竞价" });
      }

      const [result] = await ctx.db.insert(bids).values({
        projectId: input.projectId,
        orgId: ctx.user.orgId,
        userId: ctx.user.id,
        price: String(input.price),
        days: input.days ?? input.estimatedDays ?? 30,
        message: input.message || null,
        status: "pending",
      });

      return { id: (result as any).insertId, success: true };
    }),

  // 按项目查询竞价
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.db
        .select()
        .from(bids)
        .where(eq(bids.projectId, input.projectId))
        .orderBy(desc(bids.createdAt));

      return items;
    }),

  // 按组织查询竞价
  listByOrg: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.orgId) return { items: [], total: 0, page: 1, pageSize: 20 };

      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(bids)
        .where(eq(bids.orgId, ctx.user.orgId))
        .orderBy(desc(bids.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(bids)
        .where(eq(bids.orgId, ctx.user.orgId));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 接受竞价
  accept: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [bid] = await ctx.db
        .select()
        .from(bids)
        .where(eq(bids.id, input.bidId))
        .limit(1);

      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db
        .update(bids)
        .set({ status: "accepted" })
        .where(eq(bids.id, input.bidId));

      await ctx.db
        .update(projects)
        .set({
          status: "active",
          assignedOrgId: bid.orgId,
          assignedUserId: bid.userId,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, bid.projectId));

      return { success: true };
    }),

  // award 别名（兼容前端调用）
  award: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [bid] = await ctx.db.select().from(bids).where(eq(bids.id, input.bidId)).limit(1);
      if (!bid) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.update(bids).set({ status: "awarded" }).where(eq(bids.id, input.bidId));
      await ctx.db.update(projects).set({
        status: "active",
        assignedOrgId: bid.orgId,
        assignedUserId: bid.userId,
        updatedAt: new Date(),
      }).where(eq(projects.id, bid.projectId));
      return { success: true };
    }),

  // listAll 管理员查看全部竞价
  listAll: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;
      const items = await ctx.db.select().from(bids).orderBy(desc(bids.createdAt)).limit(pageSize).offset(offset);
      const [totalResult] = await ctx.db.select({ count: count() }).from(bids);
      return { items, total: totalResult.count, page, pageSize };
    }),
});
