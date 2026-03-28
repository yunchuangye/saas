/**
 * 通知增强路由
 * 用户通知偏好设置、发送记录查询、手动测试发送
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import { sendNotification } from "../lib/notify-service";

export const notifyEnhancedRouter = router({
  // 获取通知偏好
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await ctx.db.execute(
      sql`SELECT * FROM notification_preferences WHERE user_id = ${ctx.user.id}`
    ) as any[];
    return prefs || {
      user_id: ctx.user.id,
      inapp_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      events: null,
    };
  }),

  // 更新通知偏好
  updatePreferences: protectedProcedure
    .input(z.object({
      inappEnabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      events: z.record(z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.execute(sql`
        INSERT INTO notification_preferences (user_id, inapp_enabled, email_enabled, sms_enabled, events)
        VALUES (${ctx.user.id}, ${input.inappEnabled ?? true}, ${input.emailEnabled ?? true},
          ${input.smsEnabled ?? false}, ${input.events ? JSON.stringify(input.events) : null})
        ON DUPLICATE KEY UPDATE
          inapp_enabled = COALESCE(${input.inappEnabled ?? null}, inapp_enabled),
          email_enabled = COALESCE(${input.emailEnabled ?? null}, email_enabled),
          sms_enabled = COALESCE(${input.smsEnabled ?? null}, sms_enabled),
          events = COALESCE(${input.events ? JSON.stringify(input.events) : null}, events),
          updated_at = NOW()
      `);
      return { success: true };
    }),

  // 通知发送记录
  sendHistory: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      channel: z.enum(["inapp", "email", "sms"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const channelFilter = input.channel ? sql`AND channel = ${input.channel}` : sql``;
      const items = await ctx.db.execute(
        sql`SELECT * FROM notification_sends
            WHERE user_id = ${ctx.user.id} ${channelFilter}
            ORDER BY created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any[];
      const [{ total }] = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM notification_sends WHERE user_id = ${ctx.user.id}`
      ) as any[];
      return { items, total: Number(total) };
    }),

  // 测试发送通知（开发调试用）
  testSend: protectedProcedure
    .input(z.object({
      channel: z.enum(["email", "sms"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await sendNotification({
        userId: ctx.user.id,
        event: "system.announcement",
        data: { content: `这是一条来自${input.channel === "email" ? "邮件" : "短信"}渠道的测试通知，发送时间：${new Date().toLocaleString("zh-CN")}` },
        forceEmail: input.channel === "email",
        forceSms: input.channel === "sms",
      });
      return { success: true, message: `测试${input.channel === "email" ? "邮件" : "短信"}已发送` };
    }),

  // 管理员：全平台通知统计
  adminStats: adminProcedure.query(async ({ ctx }) => {
    const [stats] = await ctx.db.execute(sql`
      SELECT
        COUNT(*) as total_sends,
        SUM(CASE WHEN channel='email' AND status='sent' THEN 1 ELSE 0 END) as email_sent,
        SUM(CASE WHEN channel='email' AND status='failed' THEN 1 ELSE 0 END) as email_failed,
        SUM(CASE WHEN channel='sms' AND status='sent' THEN 1 ELSE 0 END) as sms_sent,
        SUM(CASE WHEN channel='sms' AND status='failed' THEN 1 ELSE 0 END) as sms_failed
      FROM notification_sends
    `) as any[];

    const [inappStats] = await ctx.db.execute(sql`
      SELECT COUNT(*) as total, SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) as unread
      FROM notifications
    `) as any[];

    return { ...stats, inapp_total: inappStats?.total, inapp_unread: inappStats?.unread };
  }),

  // 管理员：向指定角色/用户批量发送通知
  adminBroadcast: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      targetRole: z.enum(["all", "appraiser", "bank", "investor", "customer"]).default("all"),
      sendEmail: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // 安全修复：删除 sql.raw(字符串拼接)，改用 Drizzle 参数化条件片段
      // targetRole 已经由 z.enum() 校验，但此处仍使用参数绑定确保安全
      const roleCondition = input.targetRole !== "all"
        ? sql`WHERE role = ${input.targetRole}`
        : sql``;

      const users = await ctx.db.execute(
        sql`SELECT id FROM users ${roleCondition}`
      ) as any[];

      let count = 0;
      for (const user of users) {
        await ctx.db.execute(sql`
          INSERT INTO notifications (user_id, title, content, type, is_read, trigger_event)
          VALUES (${user.id}, ${input.title}, ${input.content}, 'system', 0, 'system.announcement')
        `).catch(() => {});
        count++;
      }

      return { success: true, sentCount: count };
    }),
});
