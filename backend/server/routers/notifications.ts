import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { notifications, messages, users, type InsertNotification, type InsertMessage } from "../lib/schema";
import { eq, and, desc, count, like, or } from "drizzle-orm";

export const notificationsRouter = router({
  // 通知列表（当前用户）
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 未读数量
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

    return { count: result.count };
  }),

  // 标记已读
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true } as Partial<InsertNotification>)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  // 全部标记已读
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true } as Partial<InsertNotification>)
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),

  // ============ 管理员接口 ============

  // 管理员：获取所有通知记录（通知管理页面）
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        keyword: z.string().optional(),
        type: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, keyword, type } = input;
      const offset = (page - 1) * pageSize;

      const conditions: any[] = [];
      if (keyword) {
        conditions.push(
          or(like(notifications.title, `%${keyword}%`), like(notifications.content, `%${keyword}%`))
        );
      }
      if (type) conditions.push(eq(notifications.type, type));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 管理员：向指定用户或全体用户发送通知
  adminSend: adminProcedure
    .input(
      z.object({
        target: z.enum(["all", "specific"]).default("all"),
        userIds: z.array(z.number()).optional(),
        title: z.string().min(1, "标题不能为空").max(200),
        content: z.string().optional(),
        type: z.enum(["system", "project", "report", "warning"]).default("system"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { target, userIds, title, content, type } = input;

      let targetUserIds: number[] = [];

      if (target === "specific" && userIds && userIds.length > 0) {
        targetUserIds = userIds;
      } else {
        // 广播：获取所有用户 ID
        const allUsers = await ctx.db.select({ id: users.id }).from(users);
        targetUserIds = allUsers.map((u) => u.id);
      }

      if (targetUserIds.length === 0) {
        return { success: false, sentCount: 0, message: "没有找到目标用户" };
      }

      // 批量插入通知
      await ctx.db.insert(notifications).values(
        targetUserIds.map((uid) => ({
          userId: uid,
          title,
          content: content || null,
          type,
          isRead: false,
        } as InsertNotification))
      );

      return { success: true, sentCount: targetUserIds.length };
    }),

  // 管理员：删除通知
  adminDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(notifications).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // 管理员：获取通知统计
  adminStats: adminProcedure.query(async ({ ctx }) => {
    const [total] = await ctx.db.select({ count: count() }).from(notifications);
    const [unread] = await ctx.db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.isRead, false));
    return { total: total.count, unread: unread.count };
  }),
});

export const messagesRouter = router({
  // 消息列表
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        projectId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, projectId } = input;
      const offset = (page - 1) * pageSize;

      let conditions: any[] = [eq(messages.toUserId, ctx.user.id)];
      if (projectId) conditions.push(eq(messages.projectId, projectId));

      const items = await ctx.db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(messages)
        .where(and(...conditions));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 发送消息
  send: protectedProcedure
    .input(
      z.object({
        toUserId: z.number(),
        content: z.string().min(1),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(messages).values({
        fromUserId: ctx.user.id,
        toUserId: input.toUserId,
        content: input.content,
        projectId: input.projectId || null,
        isRead: false,
      } as InsertMessage);

      return { id: (result as any).insertId, success: true };
    }),

  // 标记已读
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(messages)
        .set({ isRead: true } as Partial<InsertMessage>)
        .where(and(eq(messages.id, input.id), eq(messages.toUserId, ctx.user.id)));
      return { success: true };
    }),
});
