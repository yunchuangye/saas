import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { notifications, messages } from "../lib/schema";
import { eq, and, desc, count } from "drizzle-orm";

export const notificationsRouter = router({
  // 通知列表
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
        .set({ isRead: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  // 全部标记已读
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));
    return { success: true };
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
      });

      return { id: (result as any).insertId, success: true };
    }),

  // 标记已读
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(messages)
        .set({ isRead: true })
        .where(and(eq(messages.id, input.id), eq(messages.toUserId, ctx.user.id)));
      return { success: true };
    }),
});
