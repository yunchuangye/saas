/**
 * 三级审核路由
 * 建议书第一阶段：合规化改造
 * 
 * 审核流程：
 *   Level 1: 内部复核（同机构评估师互审）
 *   Level 2: 同行评审（资深评估师）
 *   Level 3: 主任审核（机构负责人/主任评估师）
 */
import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { eq, and, desc, sql } from "drizzle-orm";
import { reports } from "../lib/schema";

// 审核级别映射
const REVIEW_LEVELS = {
  NONE: 0,
  INTERNAL: 1,   // 内部复核
  PEER: 2,        // 同行评审
  CHIEF: 3,       // 主任审核
  COMPLETED: 4,   // 完成
} as const;

export const threeLevelReviewRouter = router({
  /**
   * 提交报告进入三级审核流程
   */
  submitForReview: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId));
      if (!report) throw new Error("报告不存在");
      if (report.authorId !== ctx.user.id) throw new Error("无权操作此报告");
      if ((report as any).review_level > 0) throw new Error("报告已在审核流程中");

      await ctx.db.execute(
        sql`UPDATE reports SET 
          status = 'reviewing',
          review_level = 1,
          internal_review_status = 'pending',
          submitted_at = NOW(),
          updated_at = NOW()
        WHERE id = ${input.reportId}`
      );
      return { success: true, message: "报告已提交，进入内部复核阶段" };
    }),

  /**
   * 内部复核（Level 1）
   */
  internalReview: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      approved: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId));
      if (!report) throw new Error("报告不存在");
      if ((report as any).review_level !== REVIEW_LEVELS.INTERNAL) {
        throw new Error("报告当前不在内部复核阶段");
      }
      if (report.authorId === ctx.user.id) throw new Error("不能审核自己的报告");

      if (input.approved) {
        // 通过 → 进入同行评审
        await ctx.db.execute(
          sql`UPDATE reports SET
            internal_review_status = 'approved',
            internal_reviewer_id = ${ctx.user.id},
            internal_review_comment = ${input.comment || null},
            internal_reviewed_at = NOW(),
            review_level = 2,
            peer_review_status = 'pending',
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "内部复核通过，进入同行评审阶段" };
      } else {
        // 驳回 → 退回草稿
        if (!input.comment?.trim()) throw new Error("驳回时必须填写意见");
        await ctx.db.execute(
          sql`UPDATE reports SET
            internal_review_status = 'rejected',
            internal_reviewer_id = ${ctx.user.id},
            internal_review_comment = ${input.comment},
            internal_reviewed_at = NOW(),
            review_level = 0,
            status = 'rejected',
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "内部复核驳回，报告已退回给作者" };
      }
    }),

  /**
   * 同行评审（Level 2）
   */
  peerReview: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      approved: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId));
      if (!report) throw new Error("报告不存在");
      if ((report as any).review_level !== REVIEW_LEVELS.PEER) {
        throw new Error("报告当前不在同行评审阶段");
      }

      if (input.approved) {
        // 通过 → 进入主任审核
        await ctx.db.execute(
          sql`UPDATE reports SET
            peer_review_status = 'approved',
            peer_reviewer_id = ${ctx.user.id},
            peer_review_comment = ${input.comment || null},
            peer_reviewed_at = NOW(),
            review_level = 3,
            chief_review_status = 'pending',
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "同行评审通过，进入主任审核阶段" };
      } else {
        if (!input.comment?.trim()) throw new Error("驳回时必须填写意见");
        await ctx.db.execute(
          sql`UPDATE reports SET
            peer_review_status = 'rejected',
            peer_reviewer_id = ${ctx.user.id},
            peer_review_comment = ${input.comment},
            peer_reviewed_at = NOW(),
            review_level = 0,
            status = 'rejected',
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "同行评审驳回，报告已退回给作者" };
      }
    }),

  /**
   * 主任审核（Level 3）
   */
  chiefReview: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      approved: z.boolean(),
      comment: z.string().optional(),
      finalValue: z.number().optional(), // 主任可以调整最终价值
    }))
    .mutation(async ({ input, ctx }) => {
      const [report] = await ctx.db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId));
      if (!report) throw new Error("报告不存在");
      if ((report as any).review_level !== REVIEW_LEVELS.CHIEF) {
        throw new Error("报告当前不在主任审核阶段");
      }

      if (input.approved) {
        // 主任审核通过 → 报告正式批准
        await ctx.db.execute(
          sql`UPDATE reports SET
            chief_review_status = 'approved',
            chief_reviewer_id = ${ctx.user.id},
            chief_review_comment = ${input.comment || null},
            chief_reviewed_at = NOW(),
            review_level = 4,
            status = 'approved',
            reviewer_id = ${ctx.user.id},
            approved_at = NOW(),
            ${input.finalValue ? sql`final_value = ${input.finalValue},` : sql``}
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "主任审核通过，报告正式批准发布" };
      } else {
        if (!input.comment?.trim()) throw new Error("驳回时必须填写意见");
        await ctx.db.execute(
          sql`UPDATE reports SET
            chief_review_status = 'rejected',
            chief_reviewer_id = ${ctx.user.id},
            chief_review_comment = ${input.comment},
            chief_reviewed_at = NOW(),
            review_level = 0,
            status = 'rejected',
            updated_at = NOW()
          WHERE id = ${input.reportId}`
        );
        return { success: true, message: "主任审核驳回，报告已退回给作者" };
      }
    }),

  /**
   * 获取报告的三级审核状态
   */
  getReviewStatus: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input, ctx }) => {
      const [result] = await ctx.db.execute(
        sql`SELECT 
          id, report_no, title, status, review_level,
          internal_review_status, internal_reviewer_id, internal_review_comment, internal_reviewed_at,
          peer_review_status, peer_reviewer_id, peer_review_comment, peer_reviewed_at,
          chief_review_status, chief_reviewer_id, chief_review_comment, chief_reviewed_at
        FROM reports WHERE id = ${input.reportId}`
      ) as any;
      if (!result || !result[0]) throw new Error("报告不存在");
      return result[0];
    }),

  /**
   * 获取待我审核的报告列表
   */
  pendingMyReview: protectedProcedure
    .query(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      // 根据用户角色返回对应级别的待审核报告
      const result = await ctx.db.execute(
        sql`SELECT r.id, r.report_no, r.title, r.status, r.review_level,
          r.internal_review_status, r.peer_review_status, r.chief_review_status,
          r.created_at, r.submitted_at,
          u.display_name as author_name
        FROM reports r
        LEFT JOIN users u ON r.author_id = u.id
        WHERE r.review_level > 0 AND r.review_level < 4
          AND r.author_id != ${ctx.user.id}
        ORDER BY r.submitted_at DESC
        LIMIT 50`
      ) as any;
      return result[0] ?? [];
    }),
});
