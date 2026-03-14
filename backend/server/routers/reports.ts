import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { reports, reportFiles, type InsertReport } from "../lib/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const reportsRouter = router({
  // 列表
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        status: z.string().optional(),
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, status, projectId } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [];
      if (status) conditions.push(eq(reports.status, status as any));
      if (projectId) conditions.push(eq(reports.projectId, projectId));

      const role = ctx.user.role;
      if (role === "appraiser") {
        conditions.push(eq(reports.authorId, ctx.user.id));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db
        .select()
        .from(reports)
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(whereClause);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 获取单个报告
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.id))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      const files = await ctx.db
        .select()
        .from(reportFiles)
        .where(eq(reportFiles.reportId, input.id));

      return { ...report, files };
    }),

  // 创建报告
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        content: z.string().optional(),
        valuationResult: z.number().optional(),
        valuationMin: z.number().optional(),
        valuationMax: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(reports).values({
        projectId: input.projectId,
        title: input.title,
        content: input.content || null,
        valuationResult: input.valuationResult ? String(input.valuationResult) : null,
        valuationMin: input.valuationMin ? String(input.valuationMin) : null,
        valuationMax: input.valuationMax ? String(input.valuationMax) : null,
        authorId: ctx.user.id,
        status: "draft",
      } as InsertReport);

      return { id: (result as any).insertId, success: true };
    }),

  // 更新报告
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        valuationResult: z.number().optional(),
        valuationMin: z.number().optional(),
        valuationMax: z.number().optional(),
        status: z.enum(["draft", "submitted", "reviewing", "approved", "rejected", "archived"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      const data: any = { updatedAt: new Date() };
      if (updateData.title) data.title = updateData.title;
      if (updateData.content !== undefined) data.content = updateData.content;
      if (updateData.valuationResult) data.valuationResult = String(updateData.valuationResult);
      if (updateData.valuationMin) data.valuationMin = String(updateData.valuationMin);
      if (updateData.valuationMax) data.valuationMax = String(updateData.valuationMax);
      if (updateData.status) data.status = updateData.status;

      await ctx.db.update(reports).set(data as Partial<InsertReport>).where(eq(reports.id, id));
      return { success: true };
    }),

  // 提交报告
  submit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(reports)
        .set({ status: "submitted", updatedAt: new Date() } as Partial<InsertReport>)
        .where(eq(reports.id, input.id));
      return { success: true };
    }),

  // 审核报告
  review: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        approved: z.boolean(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(reports)
        .set({
          status: input.approved ? "approved" : "rejected",
          reviewerId: ctx.user.id,
          updatedAt: new Date(),
        } as Partial<InsertReport>)
        .where(eq(reports.id, input.id));
      return { success: true };
    }),

  // AI 辅助审核
  aiAssist: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);

      if (!report) throw new TRPCError({ code: "NOT_FOUND" });

      // 模拟 AI 审核结果
      const aiResult = {
        score: Math.floor(Math.random() * 20) + 80,
        issues: [
          "估价方法描述完整",
          "市场比较案例充分",
          "结论合理",
        ],
        suggestions: "报告质量良好，建议补充更多市场数据支撑。",
      };

      await ctx.db
        .update(reports)
        .set({
          aiReviewResult: JSON.stringify(aiResult),
          aiScore: aiResult.score,
          updatedAt: new Date(),
        } as Partial<InsertReport>)
        .where(eq(reports.id, input.reportId));

      return aiResult;
    }),

  // 归档报告
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(reports)
        .set({ status: "archived", updatedAt: new Date() } as Partial<InsertReport>)
        .where(eq(reports.id, input.id));
      return { success: true };
    }),

  // 已归档列表
  listArchived: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.status, "archived"))
        .orderBy(desc(reports.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "archived"));

      return { items, total: totalResult.count, page, pageSize };
    }),
});
