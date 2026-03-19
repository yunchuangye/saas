/**
 * 数据导出路由
 * 创建导出任务、查询任务状态、下载文件
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import { exportProjects, exportReports, exportBilling, EXPORT_DIR } from "../lib/export-service";
import crypto from "crypto";
import path from "path";
import fs from "fs";

function generateTaskNo(): string {
  return `EXP${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export const exportsRouter = router({
  // 创建导出任务（异步执行）
  createTask: protectedProcedure
    .input(z.object({
      type: z.enum(["projects", "reports", "billing", "cases", "full"]),
      format: z.enum(["excel", "pdf", "csv"]).default("excel"),
      filters: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const taskNo = generateTaskNo();
      const orgId = ctx.user.orgId;
      const isAdmin = ctx.user.role === "admin";

      // 创建任务记录
      await ctx.db.execute(sql`
        INSERT INTO export_tasks (task_no, org_id, user_id, type, format, filters, status)
        VALUES (${taskNo}, ${orgId || null}, ${ctx.user.id}, ${input.type}, ${input.format},
          ${input.filters ? JSON.stringify(input.filters) : null}, 'processing')
      `);

      // 异步执行导出（不阻塞请求）
      setImmediate(async () => {
        try {
          let result: { filePath: string; rowCount: number };
          const effectiveOrgId = isAdmin ? undefined : orgId || undefined;

          if (input.type === "projects") {
            result = await exportProjects(input.filters || {}, input.format, effectiveOrgId);
          } else if (input.type === "reports") {
            result = await exportReports(input.filters || {}, input.format, effectiveOrgId);
          } else if (input.type === "billing") {
            result = await exportBilling(input.filters || {}, input.format, effectiveOrgId);
          } else {
            // cases / full：暂时导出项目+报告合并
            const p = await exportProjects(input.filters || {}, input.format, effectiveOrgId);
            result = p;
          }

          const fileSize = fs.statSync(result.filePath).size;
          const fileName = path.basename(result.filePath);
          const fileUrl = `/api/exports/download/${taskNo}/${fileName}`;
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

          await ctx.db.execute(sql`
            UPDATE export_tasks SET status = 'done', total_rows = ${result.rowCount},
              processed_rows = ${result.rowCount}, file_url = ${fileUrl},
              file_size = ${fileSize}, expires_at = ${expiresAt}
            WHERE task_no = ${taskNo}
          `);
        } catch (e: any) {
          console.error("[Export Error]", e);
          await ctx.db.execute(sql`
            UPDATE export_tasks SET status = 'failed', error_msg = ${e.message || "导出失败"}
            WHERE task_no = ${taskNo}
          `);
        }
      });

      return { taskNo, message: "导出任务已创建，请稍后查看结果" };
    }),

  // 查询任务状态
  getTask: protectedProcedure
    .input(z.object({ taskNo: z.string() }))
    .query(async ({ ctx, input }) => {
      const [task] = await ctx.db.execute(
        sql`SELECT * FROM export_tasks WHERE task_no = ${input.taskNo} AND user_id = ${ctx.user.id}`
      ) as any[];
      if (!task) throw new Error("任务不存在");
      return task;
    }),

  // 我的导出任务列表
  myTasks: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const items = await ctx.db.execute(sql`
        SELECT * FROM export_tasks WHERE user_id = ${ctx.user.id}
        ORDER BY created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}
      `) as any[];
      const [{ total }] = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM export_tasks WHERE user_id = ${ctx.user.id}`
      ) as any[];
      return { items, total: Number(total) };
    }),

  // 删除任务（同时删除文件）
  deleteTask: protectedProcedure
    .input(z.object({ taskNo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await ctx.db.execute(
        sql`SELECT * FROM export_tasks WHERE task_no = ${input.taskNo} AND user_id = ${ctx.user.id}`
      ) as any[];
      if (!task) throw new Error("任务不存在");

      // 删除文件
      if (task.file_url) {
        const fileName = task.file_url.split("/").pop();
        const filePath = path.join(EXPORT_DIR, fileName || "");
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await ctx.db.execute(sql`DELETE FROM export_tasks WHERE task_no = ${input.taskNo}`);
      return { success: true };
    }),

  // 管理员：所有导出任务
  adminTasks: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const items = await ctx.db.execute(sql`
        SELECT et.*, u.display_name as user_name, o.name as org_name
        FROM export_tasks et
        LEFT JOIN users u ON et.user_id = u.id
        LEFT JOIN organizations o ON et.org_id = o.id
        ORDER BY et.created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}
      `) as any[];
      const [{ total }] = await ctx.db.execute(sql`SELECT COUNT(*) as total FROM export_tasks`) as any[];
      return { items, total: Number(total) };
    }),
});
