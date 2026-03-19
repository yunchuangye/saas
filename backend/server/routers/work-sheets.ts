/**
 * 工作底稿路由
 * 建议书第一阶段：合规化改造
 * 
 * 工作底稿分类：
 *   field_survey      - 现场勘察记录
 *   comparable_analysis - 可比案例分析
 *   valuation_calc    - 估价计算过程
 *   compliance_check  - 合规性检查
 *   other             - 其他
 */
import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";

const CATEGORIES = ["field_survey", "comparable_analysis", "valuation_calc", "compliance_check", "other"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  field_survey: "现场勘察记录",
  comparable_analysis: "可比案例分析",
  valuation_calc: "估价计算过程",
  compliance_check: "合规性检查",
  other: "其他",
};

export const workSheetsRouter = router({
  /**
   * 获取报告的工作底稿列表
   */
  list: protectedProcedure
    .input(z.object({
      reportId: z.number().optional(),
      projectId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      let whereClause = sql`w.author_id = ${ctx.user.id}`;
      if (input.reportId) {
        whereClause = sql`w.report_id = ${input.reportId}`;
      } else if (input.projectId) {
        whereClause = sql`w.project_id = ${input.projectId}`;
      }

      const result = await ctx.db.execute(
        sql`SELECT w.*, u.name as author_name
        FROM work_sheets w
        LEFT JOIN users u ON w.author_id = u.id
        WHERE ${whereClause}
        ORDER BY w.created_at DESC`
      ) as any;
      return (result[0] ?? []).map((row: any) => ({
        ...row,
        categoryLabel: CATEGORY_LABELS[row.category] ?? row.category,
      }));
    }),

  /**
   * 获取单个工作底稿
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.execute(
        sql`SELECT w.*, u.name as author_name
        FROM work_sheets w
        LEFT JOIN users u ON w.author_id = u.id
        WHERE w.id = ${input.id}`
      ) as any;
      const row = result[0]?.[0];
      if (!row) throw new Error("工作底稿不存在");
      return { ...row, categoryLabel: CATEGORY_LABELS[row.category] ?? row.category };
    }),

  /**
   * 创建工作底稿
   */
  create: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      projectId: z.number(),
      title: z.string().min(1),
      category: z.enum(CATEGORIES).default("other"),
      content: z.string().optional(),
      attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const attachmentsJson = input.attachments ? JSON.stringify(input.attachments) : null;
      const result = await ctx.db.execute(
        sql`INSERT INTO work_sheets (report_id, project_id, author_id, title, category, content, attachments, status)
        VALUES (${input.reportId}, ${input.projectId}, ${ctx.user.id}, ${input.title}, ${input.category}, ${input.content || null}, ${attachmentsJson}, 'draft')`
      ) as any;
      return { id: (result[0] as any).insertId, success: true };
    }),

  /**
   * 更新工作底稿
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      category: z.enum(CATEGORIES).optional(),
      content: z.string().optional(),
      attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 验证权限
      const existing = await ctx.db.execute(
        sql`SELECT id, author_id, status FROM work_sheets WHERE id = ${input.id}`
      ) as any;
      const row = existing[0]?.[0];
      if (!row) throw new Error("工作底稿不存在");
      if (row.author_id !== ctx.user.id) throw new Error("无权修改此工作底稿");
      if (row.status === "approved") throw new Error("已审批的工作底稿不能修改");

      const attachmentsJson = input.attachments ? JSON.stringify(input.attachments) : undefined;
      await ctx.db.execute(
        sql`UPDATE work_sheets SET
          ${input.title ? sql`title = ${input.title},` : sql``}
          ${input.category ? sql`category = ${input.category},` : sql``}
          ${input.content !== undefined ? sql`content = ${input.content},` : sql``}
          ${attachmentsJson !== undefined ? sql`attachments = ${attachmentsJson},` : sql``}
          updated_at = NOW()
        WHERE id = ${input.id}`
      );
      return { success: true };
    }),

  /**
   * 删除工作底稿
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.execute(
        sql`SELECT id, author_id, status FROM work_sheets WHERE id = ${input.id}`
      ) as any;
      const row = existing[0]?.[0];
      if (!row) throw new Error("工作底稿不存在");
      if (row.author_id !== ctx.user.id) throw new Error("无权删除此工作底稿");
      if (row.status === "approved") throw new Error("已审批的工作底稿不能删除");

      await ctx.db.execute(sql`DELETE FROM work_sheets WHERE id = ${input.id}`);
      return { success: true };
    }),

  /**
   * 获取工作底稿分类列表
   */
  categories: protectedProcedure.query(() => {
    return CATEGORIES.map((key) => ({ key, label: CATEGORY_LABELS[key] }));
  }),
});
