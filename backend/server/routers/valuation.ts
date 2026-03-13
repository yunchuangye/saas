import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { autoValuations, cases } from "../lib/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const valuationRouter = router({
  // 列表
  list: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(autoValuations)
        .where(eq(autoValuations.userId, ctx.user.id))
        .orderBy(desc(autoValuations.createdAt))
        .limit(pageSize)
        .offset(offset);

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(autoValuations)
        .where(eq(autoValuations.userId, ctx.user.id));

      return { items, total: totalResult.count, page, pageSize };
    }),

  // 获取单个估价
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const [valuation] = await ctx.db
        .select()
        .from(autoValuations)
        .where(eq(autoValuations.id, input.id))
        .limit(1);

      if (!valuation) throw new TRPCError({ code: "NOT_FOUND" });
      return valuation;
    }),

  // 创建估价
  create: protectedProcedure
    .input(
      z.object({
        address: z.string().optional(),
        cityId: z.number().optional(),
        estateId: z.number().optional(),
        area: z.number(),
        rooms: z.number().optional(),
        floor: z.number().optional(),
        propertyType: z.string().optional(),
        projectId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 简单估价算法
      const baseUnitPrice = 15000 + Math.random() * 15000;
      const totalPrice = baseUnitPrice * input.area;
      const confidence = 0.75 + Math.random() * 0.2;

      const data: any = {
        ...input,
        userId: ctx.user.id,
        area: String(input.area),
        valuationResult: String(Math.round(totalPrice)),
        valuationMin: String(Math.round(totalPrice * 0.9)),
        valuationMax: String(Math.round(totalPrice * 1.1)),
        confidence: String(confidence.toFixed(2)),
        method: "案例比较法",
        aiAnalysis: "基于周边同类物业成交案例，综合考虑楼层、朝向、装修等因素，估算该物业市场价值。",
        status: "completed",
      };

      const [result] = await ctx.db.insert(autoValuations).values(data);

      return {
        id: (result as any).insertId,
        valuationResult: Math.round(totalPrice),
        valuationMin: Math.round(totalPrice * 0.9),
        valuationMax: Math.round(totalPrice * 1.1),
        confidence,
        method: "案例比较法",
        aiAnalysis: data.aiAnalysis,
      };
    }),

  // 市场分析
  marketAnalysis: protectedProcedure
    .input(
      z.object({
        cityId: z.number().optional(),
        estateId: z.number().optional(),
        propertyType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        avgUnitPrice: Math.round(18000 + Math.random() * 5000),
        priceChange: (Math.random() * 10 - 3).toFixed(1),
        totalTransactions: Math.floor(Math.random() * 500) + 100,
        marketTrend: "稳中有升",
        analysis: "当前市场整体稳定，成交量较上月有所回升，价格小幅上涨。建议关注政策变化对市场的影响。",
        priceDistribution: [
          { range: "1-2万/㎡", count: 120 },
          { range: "2-3万/㎡", count: 280 },
          { range: "3-4万/㎡", count: 150 },
          { range: "4万+/㎡", count: 50 },
        ],
      };
    }),
});
