/**
 * 估价偏离度预警 + 批量估价压力测试路由
 * 建议书 AVM 增强模块
 */
import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";

// 偏离度预警阈值配置
const DEFAULT_THRESHOLDS = {
  low: 0.05,      // 5% 低风险
  medium: 0.10,   // 10% 中风险
  high: 0.20,     // 20% 高风险
  critical: 0.30, // 30% 严重风险
};

function getSeverity(deviationPct: number): "low" | "medium" | "high" | "critical" {
  const abs = Math.abs(deviationPct);
  if (abs >= DEFAULT_THRESHOLDS.critical) return "critical";
  if (abs >= DEFAULT_THRESHOLDS.high) return "high";
  if (abs >= DEFAULT_THRESHOLDS.medium) return "medium";
  return "low";
}

export const valuationAlertsRouter = router({
  /**
   * 创建偏离度预警（当人工估价与 AVM 偏差超过阈值时触发）
   */
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      reportId: z.number().optional(),
      autoValuationId: z.number().optional(),
      avmValue: z.number(),
      manualValue: z.number(),
      alertType: z.enum(["deviation", "outlier", "trend"]).default("deviation"),
    }))
    .mutation(async ({ input, ctx }) => {
      const deviationPct = (input.manualValue - input.avmValue) / input.avmValue;
      const severity = getSeverity(deviationPct);
      const thresholdPct = DEFAULT_THRESHOLDS[severity];

      const message = `人工估价（${(input.manualValue / 10000).toFixed(0)}万元）与 AVM 估价（${(input.avmValue / 10000).toFixed(0)}万元）偏差 ${(deviationPct * 100).toFixed(1)}%，超过${thresholdPct * 100}%预警阈值`;

      await ctx.db.execute(
        sql`INSERT INTO valuation_alerts 
          (project_id, report_id, auto_valuation_id, alert_type, severity, avm_value, manual_value, deviation_pct, threshold_pct, message)
        VALUES 
          (${input.projectId}, ${input.reportId ?? null}, ${input.autoValuationId ?? null}, ${input.alertType}, ${severity}, ${input.avmValue}, ${input.manualValue}, ${deviationPct}, ${thresholdPct}, ${message})`
      );

      return { success: true, severity, deviationPct, message };
    }),

  /**
   * 获取预警列表
   */
  list: protectedProcedure
    .input(z.object({
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      isResolved: z.boolean().optional(),
      projectId: z.number().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.pageSize;

      let whereClause = sql`1=1`;
      if (input.severity) whereClause = sql`${whereClause} AND va.severity = ${input.severity}`;
      if (input.isResolved !== undefined) whereClause = sql`${whereClause} AND va.is_resolved = ${input.isResolved ? 1 : 0}`;
      if (input.projectId) whereClause = sql`${whereClause} AND va.project_id = ${input.projectId}`;

      const result = await ctx.db.execute(
        sql`SELECT va.*, p.title as project_title, u.display_name as resolver_name
        FROM valuation_alerts va
        LEFT JOIN projects p ON va.project_id = p.id
        LEFT JOIN users u ON va.resolved_by = u.id
        WHERE ${whereClause}
        ORDER BY va.created_at DESC
        LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any;

      const countResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM valuation_alerts va WHERE ${whereClause}`
      ) as any;

      return {
        items: result[0] ?? [],
        total: countResult[0]?.[0]?.total ?? 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 处理预警（标记为已解决）
   */
  resolve: protectedProcedure
    .input(z.object({
      id: z.number(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.execute(
        sql`UPDATE valuation_alerts SET
          is_resolved = 1,
          resolved_by = ${ctx.user.id},
          resolved_at = NOW()
        WHERE id = ${input.id}`
      );
      return { success: true };
    }),

  /**
   * 预警统计摘要
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(
      sql`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_resolved = 0 THEN 1 ELSE 0 END) as unresolved,
        SUM(CASE WHEN severity = 'critical' AND is_resolved = 0 THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' AND is_resolved = 0 THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' AND is_resolved = 0 THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' AND is_resolved = 0 THEN 1 ELSE 0 END) as low
      FROM valuation_alerts`
    ) as any;
    return result[0]?.[0] ?? { total: 0, unresolved: 0, critical: 0, high: 0, medium: 0, low: 0 };
  }),

  /**
   * 批量估价压力测试
   * 对一批房产进行 AVM 估价，统计结果分布和异常
   */
  batchStressTest: protectedProcedure
    .input(z.object({
      cityId: z.number(),
      items: z.array(z.object({
        address: z.string(),
        area: z.number(),
        floor: z.number(),
        totalFloors: z.number(),
        buildingAge: z.number().default(10),
        propertyType: z.string().default("residential"),
      })).min(1).max(100),
      deviationThreshold: z.number().default(0.15), // 15% 偏差阈值
    }))
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const results: any[] = [];
      let successCount = 0;
      let failCount = 0;

      // 批量查询可比案例（优化：一次性查询）
      const casesResult = await ctx.db.execute(
        sql`SELECT unit_price, area, floor, total_floors, address
        FROM cases 
        WHERE city_id = ${input.cityId} 
          AND unit_price > 0 
          AND status = 'active'
        ORDER BY transaction_date DESC
        LIMIT 500`
      ) as any;
      const allCases = casesResult[0] ?? [];

      for (const item of input.items) {
        try {
          // 简单 AVM：基于相似案例的中位数估价
          const similarCases = allCases.filter((c: any) => {
            const areaDiff = Math.abs(Number(c.area) - item.area) / item.area;
            return areaDiff < 0.3; // 面积差异在 30% 以内
          });

          if (similarCases.length === 0) {
            results.push({ ...item, status: "no_data", estimatedValue: null, unitPrice: null });
            failCount++;
            continue;
          }

          const prices = similarCases.map((c: any) => Number(c.unit_price)).sort((a: number, b: number) => a - b);
          const median = prices[Math.floor(prices.length / 2)];
          const estimatedValue = median * item.area;

          // 楼层修正（简单线性）
          const floorRatio = item.floor / item.totalFloors;
          const floorCorrection = floorRatio > 0.7 ? 1.03 : floorRatio < 0.2 ? 0.97 : 1.0;
          const correctedValue = estimatedValue * floorCorrection;

          results.push({
            ...item,
            status: "success",
            estimatedValue: Math.round(correctedValue),
            unitPrice: Math.round(correctedValue / item.area),
            comparableCount: similarCases.length,
            medianUnitPrice: Math.round(median),
          });
          successCount++;
        } catch (e) {
          results.push({ ...item, status: "error", estimatedValue: null });
          failCount++;
        }
      }

      // 统计分析
      const successResults = results.filter(r => r.status === "success");
      const values = successResults.map(r => r.estimatedValue);
      const unitPrices = successResults.map(r => r.unitPrice);

      const stats = values.length > 0 ? {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        mean: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        avgUnitPrice: Math.round(unitPrices.reduce((a, b) => a + b, 0) / unitPrices.length),
      } : null;

      // 找出异常值（超过均值 ±threshold 的）
      const outliers = stats ? successResults.filter(r => {
        const deviation = Math.abs(r.estimatedValue - stats.mean) / stats.mean;
        return deviation > input.deviationThreshold;
      }) : [];

      const elapsed = Date.now() - startTime;

      return {
        success: true,
        elapsed,
        successCount,
        failCount,
        results,
        stats,
        outliers: outliers.map(o => ({ address: o.address, estimatedValue: o.estimatedValue, deviation: ((o.estimatedValue - (stats?.mean ?? 0)) / (stats?.mean ?? 1) * 100).toFixed(1) + "%" })),
        outlierCount: outliers.length,
      };
    }),

  /**
   * 检查单个估价的偏离度
   */
  checkDeviation: protectedProcedure
    .input(z.object({
      avmValue: z.number(),
      manualValue: z.number(),
    }))
    .query(({ input }) => {
      const deviationPct = (input.manualValue - input.avmValue) / input.avmValue;
      const severity = getSeverity(deviationPct);
      const needsAlert = Math.abs(deviationPct) >= DEFAULT_THRESHOLDS.medium;
      return {
        deviationPct,
        deviationPctStr: (deviationPct * 100).toFixed(2) + "%",
        severity,
        needsAlert,
        thresholds: DEFAULT_THRESHOLDS,
      };
    }),
});
