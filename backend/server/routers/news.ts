import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { news, type InsertNews } from "../lib/schema";
import { eq, desc, count, like, and, or } from "drizzle-orm";

export const newsRouter = router({
  // 新闻列表（管理员）
  list: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        keyword: z.string().optional(),
        status: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, keyword, status, category } = input;
      const offset = (page - 1) * pageSize;

      const conditions: any[] = [];
      if (keyword) {
        conditions.push(
          or(
            like(news.title, `%${keyword}%`),
            like(news.summary, `%${keyword}%`)
          )
        );
      }
      if (status) conditions.push(eq(news.status, status));
      if (category) conditions.push(eq(news.category, category));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await ctx.db
        .select()
        .from(news)
        .where(whereClause)
        .orderBy(desc(news.isPinned), desc(news.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(news)
        .where(whereClause);

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 获取单条新闻
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [item] = await ctx.db
        .select()
        .from(news)
        .where(eq(news.id, input.id));
      if (!item) throw new Error("新闻不存在");
      return item;
    }),

  // 创建新闻
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(300),
        summary: z.string().max(500).optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.enum(["industry", "policy", "company"]).default("industry"),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
        isPinned: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db.insert(news).values({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === "published" ? new Date() : null,
      } as InsertNews);
      return { id: (result as any).insertId, success: true };
    }),

  // 更新新闻
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(300).optional(),
        summary: z.string().max(500).optional(),
        content: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.enum(["industry", "policy", "company"]).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      // 如果状态改为已发布，记录发布时间
      if (data.status === "published") {
        updateData.publishedAt = new Date();
      }
      await ctx.db.update(news).set(updateData).where(eq(news.id, id));
      return { success: true };
    }),

  // 删除新闻
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.delete(news).where(eq(news.id, input.id));
      return { success: true };
    }),

  // 切换置顶
  togglePin: adminProcedure
    .input(z.object({ id: z.number(), isPinned: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(news)
        .set({ isPinned: input.isPinned } as Partial<InsertNews>)
        .where(eq(news.id, input.id));
      return { success: true };
    }),
});
