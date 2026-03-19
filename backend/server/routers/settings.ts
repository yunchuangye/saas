import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { systemSettings, type InsertSystemSetting } from "../lib/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// 管理员专用 procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
  }
  return next();
});

export const settingsRouter = router({
  // 获取所有设置
  getAll: adminProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.select().from(systemSettings);
    // 转换为 key-value 对象
    const result: Record<string, string | null> = {};
    for (const item of items) {
      result[item.keyName] = item.value;
    }
    return result;
  }),

  // 获取单个设置
  get: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input, ctx }) => {
      const [item] = await ctx.db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.keyName, input.key))
        .limit(1);
      return item ?? null;
    }),

  // 批量更新设置
  updateBatch: adminProcedure
    .input(z.object({
      settings: z.record(z.string().nullable()),
    }))
    .mutation(async ({ input, ctx }) => {
      const entries = Object.entries(input.settings);
      for (const [key, value] of entries) {
        // 先检查是否存在
        const [existing] = await ctx.db
          .select({ id: systemSettings.id })
          .from(systemSettings)
          .where(eq(systemSettings.keyName, key))
          .limit(1);

        if (existing) {
          await ctx.db
            .update(systemSettings)
            .set({ value: value ?? null } as any)
            .where(eq(systemSettings.keyName, key));
        } else {
          await ctx.db.insert(systemSettings).values({
            keyName: key,
            value: value ?? null,
          } as any);
        }
      }
      return { success: true, updatedCount: entries.length };
    }),

  // 更新单个设置
  update: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.string().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [existing] = await ctx.db
        .select({ id: systemSettings.id })
        .from(systemSettings)
        .where(eq(systemSettings.keyName, input.key))
        .limit(1);

      if (existing) {
        await ctx.db
          .update(systemSettings)
          .set({ value: input.value } as any)
          .where(eq(systemSettings.keyName, input.key));
      } else {
        await ctx.db.insert(systemSettings).values({
          keyName: input.key,
          value: input.value,
        } as any);
      }
      return { success: true };
    }),

  // 测试 AI 连接
  testAI: adminProcedure
    .input(z.object({
      provider: z.string(),
      model: z.string(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { OpenAI } = await import("openai");
        const client = new OpenAI({
          apiKey: input.apiKey || process.env.OPENAI_API_KEY || "",
          baseURL: input.baseUrl || undefined,
        });
        const resp = await client.chat.completions.create({
          model: input.model,
          messages: [{ role: "user", content: "Hello, respond with just 'OK'" }],
          max_tokens: 10,
        });
        const reply = resp.choices[0]?.message?.content ?? "";
        return { success: true, message: `连接成功，模型响应: ${reply}` };
      } catch (err: any) {
        return { success: false, message: `连接失败: ${err.message}` };
      }
    }),
});
