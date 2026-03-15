/**
 * OpenClaw AI 功能路由
 * 包含：AI智能采集、AI数据清洗、AI价格预测、AI案例匹配、AI异常检测、AI批量估值
 */
import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../lib/trpc'
import { db } from '../lib/db'
import { cases, estates, buildings, units, cities, crawlJobs, crawlLogs } from '../lib/schema'
import {
  eq, desc, and, gte, lte, sql, isNotNull, isNull, like, or, count, ne, inArray
} from 'drizzle-orm'
import {
  calculateValuation,
  comparativeApproach,
  incomeApproach,
  costApproach,
  getAreaRange,
  AREA_RANGE_LABELS,
  type PropertyInput,
} from '../lib/valuation-engine'
import {
  getOrBuildEstatePriceMatrix,
  refreshEstatePriceMatrix,
  refreshAllEstatePriceMatrices,
  getEstatePriceMatrixSummary,
} from '../lib/estate-price-matrix-service'
import OpenAI from 'openai'

// ============================================================
// OpenAI 客户端（懒加载）
// ============================================================
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    })
  }
  return _openai
}

// ============================================================
// 工具函数
// ============================================================
function calcSimilarity(a: any, b: any): number {
  const areaDiff = Math.abs(Number(a.area) - Number(b.area)) / Math.max(Number(a.area), 1)
  const floorRatioA = a.totalFloors ? (a.floor || 0) / a.totalFloors : 0.5
  const floorRatioB = b.totalFloors ? (b.floor || 0) / b.totalFloors : 0.5
  const floorDiff = Math.abs(floorRatioA - floorRatioB)
  const score = 1 - (areaDiff * 0.6 + floorDiff * 0.4)
  return Math.max(0, Math.min(1, score))
}

// ============================================================
// 路由定义
// ============================================================
export const aiFeaturesRouter = router({

  // ──────────────────────────────────────────────────────────
  // 1. AI 智能采集
  // ──────────────────────────────────────────────────────────

  /** 获取采集配置（数据源、城市列表） */
  getCollectConfig: protectedProcedure.query(async () => {
    const cityList = await db.select({ id: cities.id, name: cities.name }).from(cities).orderBy(cities.name)
    return {
      sources: [
        { id: 'lianjia', name: '链家', desc: '链家网成交案例', available: true },
        { id: 'beike', name: '贝壳', desc: '贝壳找房成交案例', available: true },
        { id: 'anjuke', name: '安居客', desc: '安居客挂牌信息', available: true },
        { id: 'szfdc', name: '深圳住建局', desc: '深圳市住建局预售许可信息', available: true },
        { id: 'fang58', name: '58同城', desc: '58同城房源信息', available: false },
      ],
      cities: cityList,
      dataTypes: [
        { id: 'sold_cases', name: '成交案例' },
        { id: 'listing', name: '挂牌信息' },
        { id: 'estate_info', name: '楼盘信息' },
      ],
    }
  }),

  /** 创建并启动采集任务（对接 crawl_jobs 表） */
  startCollect: adminProcedure
    .input(z.object({
      source: z.enum(['lianjia', 'beike', 'anjuke', 'szfdc', 'fang58', 'custom']),
      cityId: z.number(),
      dataType: z.enum(['sold_cases', 'listing', 'estate_info']),
      maxPages: z.number().min(1).max(100).default(5),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      keyword: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [city] = await db.select({ name: cities.name }).from(cities).where(eq(cities.id, input.cityId)).limit(1)
      const cityName = city?.name || '未知城市'
      const jobName = `${cityName}-${input.source}-${input.dataType}-${new Date().toLocaleDateString('zh-CN')}`
      const [job] = await db.insert(crawlJobs).values({
        name: jobName,
        source: input.source as any,
        dataType: input.dataType,
        cityId: input.cityId,
        cityName,
        keyword: input.keyword,
        maxPages: input.maxPages,
        concurrency: 2,
        delayMin: 2000,
        delayMax: 5000,
        useProxy: false,
        scheduleType: 'manual',
        createdBy: ctx.user.id,
        status: 'pending',
      } as any).$returningId()

      // 写入采集日志
      await db.insert(crawlLogs).values({
        jobId: job.id,
        level: 'info',
        message: `任务已创建：${jobName}，目标城市：${cityName}，数据源：${input.source}，最大页数：${input.maxPages}`,
        createdAt: new Date(),
      } as any).catch(() => {})

      return { jobId: job.id, jobName, cityName, status: 'pending' }
    }),

  /** 获取采集任务列表（最近 20 条） */
  listCollectJobs: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize
      const [jobs, totalResult] = await Promise.all([
        db.select().from(crawlJobs).orderBy(desc(crawlJobs.createdAt)).limit(input.pageSize).offset(offset),
        db.select({ count: count() }).from(crawlJobs),
      ])
      return { jobs, total: totalResult[0]?.count ?? 0 }
    }),

  /** 获取采集任务日志 */
  getCollectLogs: protectedProcedure
    .input(z.object({ jobId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const where = input.jobId ? eq(crawlLogs.jobId, input.jobId) : undefined
      const logs = await db.select().from(crawlLogs)
        .where(where)
        .orderBy(desc(crawlLogs.createdAt))
        .limit(input.limit)
      return logs
    }),

  /** 获取采集统计数据 */
  getCollectStats: protectedProcedure.query(async () => {
    const [totalCases] = await db.select({ count: count() }).from(cases)
    const [totalJobs] = await db.select({ count: count() }).from(crawlJobs)
    const [runningJobs] = await db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'running'))
    const [completedJobs] = await db.select({ count: count() }).from(crawlJobs).where(eq(crawlJobs.status, 'completed'))
    const recentJobs = await db.select({
      id: crawlJobs.id, name: crawlJobs.name, source: crawlJobs.source,
      status: crawlJobs.status, successCount: crawlJobs.successCount,
      createdAt: crawlJobs.createdAt, completedAt: crawlJobs.completedAt,
    }).from(crawlJobs).orderBy(desc(crawlJobs.createdAt)).limit(5)
    return {
      totalCases: totalCases.count,
      totalJobs: totalJobs.count,
      runningJobs: runningJobs.count,
      completedJobs: completedJobs.count,
      recentJobs,
    }
  }),

  // ──────────────────────────────────────────────────────────
  // 2. AI 数据清洗
  // ──────────────────────────────────────────────────────────

  /** 扫描数据质量问题 */
  scanDataQuality: protectedProcedure
    .input(z.object({ cityId: z.number().optional() }))
    .query(async ({ input }) => {
      const baseWhere = input.cityId ? eq(cases.cityId, input.cityId) : undefined

      // 总案例数
      const [totalResult] = await db.select({ count: count() }).from(cases).where(baseWhere)
      const total = totalResult.count

      // 缺失字段检测
      const [missingArea] = await db.select({ count: count() }).from(cases)
        .where(and(baseWhere, isNull(cases.area)))
      const [missingPrice] = await db.select({ count: count() }).from(cases)
        .where(and(baseWhere, isNull(cases.unitPrice)))
      const [missingDate] = await db.select({ count: count() }).from(cases)
        .where(and(baseWhere, isNull(cases.transactionDate)))
      const [missingAddress] = await db.select({ count: count() }).from(cases)
        .where(and(baseWhere, isNull(cases.address)))

      // 重复案例检测（同地址+同面积+同成交日期）
      const duplicateResult = await db.execute(sql`
        SELECT COUNT(*) as dup_count FROM (
          SELECT address, area, transaction_date, COUNT(*) as cnt
          FROM cases
          ${input.cityId ? sql`WHERE city_id = ${input.cityId}` : sql``}
          GROUP BY address, area, transaction_date
          HAVING cnt > 1
        ) t
      `) as any
      const duplicateGroups = Number(duplicateResult[0]?.[0]?.dup_count || 0)

      // 价格异常检测（单价超出均值 ±3 倍标准差）
      const priceStats = await db.execute(sql`
        SELECT 
          AVG(unit_price) as avg_price,
          STDDEV(unit_price) as std_price
        FROM cases
        WHERE unit_price IS NOT NULL
        ${input.cityId ? sql`AND city_id = ${input.cityId}` : sql``}
      `) as any
      const avgPrice = Number(priceStats[0]?.[0]?.avg_price || 0)
      const stdPrice = Number(priceStats[0]?.[0]?.std_price || 0)
      const priceMin = avgPrice - 3 * stdPrice
      const priceMax = avgPrice + 3 * stdPrice

      const [anomalyPriceResult] = await db.select({ count: count() }).from(cases)
        .where(and(
          baseWhere,
          isNotNull(cases.unitPrice),
          or(
            lte(cases.unitPrice, priceMin.toString()),
            gte(cases.unitPrice, priceMax.toString())
          )
        ))

      // 已标记异常
      const [markedAnomaly] = await db.select({ count: count() }).from(cases)
        .where(and(baseWhere, eq(cases.isAnomaly, true)))

      return {
        total,
        issues: {
          missingArea: missingArea.count,
          missingPrice: missingPrice.count,
          missingDate: missingDate.count,
          missingAddress: missingAddress.count,
          duplicateGroups,
          anomalyPrice: anomalyPriceResult.count,
          markedAnomaly: markedAnomaly.count,
        },
        priceStats: { avg: Math.round(avgPrice), std: Math.round(stdPrice), min: Math.round(priceMin), max: Math.round(priceMax) },
        cleanRate: total > 0 ? Math.round((1 - (missingArea.count + missingPrice.count + duplicateGroups + anomalyPriceResult.count) / (total * 4)) * 100) : 100,
      }
    }),

  /** 获取重复案例列表 */
  getDuplicateCases: protectedProcedure
    .input(z.object({ cityId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const result = await db.execute(sql`
        SELECT c.id, c.address, c.area, c.unit_price, c.transaction_date, c.source, c.property_type,
               dup.cnt as duplicate_count
        FROM cases c
        INNER JOIN (
          SELECT address, area, transaction_date, COUNT(*) as cnt
          FROM cases
          ${input.cityId ? sql`WHERE city_id = ${input.cityId}` : sql``}
          GROUP BY address, area, transaction_date
          HAVING cnt > 1
        ) dup ON c.address = dup.address AND c.area = dup.area 
              AND (c.transaction_date = dup.transaction_date OR (c.transaction_date IS NULL AND dup.transaction_date IS NULL))
        ORDER BY c.address, c.id
        LIMIT ${input.limit}
      `) as any
      return (result[0] as any[]) || []
    }),

  /** 获取价格异常案例列表 */
  getAnomalyCases: protectedProcedure
    .input(z.object({ cityId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      // 计算价格统计
      const priceStats = await db.execute(sql`
        SELECT AVG(unit_price) as avg_price, STDDEV(unit_price) as std_price
        FROM cases WHERE unit_price IS NOT NULL
        ${input.cityId ? sql`AND city_id = ${input.cityId}` : sql``}
      `) as any
      const avgPrice = Number(priceStats[0]?.[0]?.avg_price || 0)
      const stdPrice = Number(priceStats[0]?.[0]?.std_price || 0)
      const priceMin = avgPrice - 3 * stdPrice
      const priceMax = avgPrice + 3 * stdPrice

      const anomalies = await db.select().from(cases)
        .where(and(
          input.cityId ? eq(cases.cityId, input.cityId) : undefined,
          isNotNull(cases.unitPrice),
          or(
            lte(cases.unitPrice, priceMin.toString()),
            gte(cases.unitPrice, priceMax.toString())
          )
        ))
        .orderBy(desc(cases.unitPrice))
        .limit(input.limit)

      return anomalies.map(c => ({
        ...c,
        anomalyType: Number(c.unitPrice) > priceMax ? '价格过高' : '价格过低',
        deviation: avgPrice > 0 ? Math.round(((Number(c.unitPrice) - avgPrice) / avgPrice) * 100) : 0,
        avgPrice: Math.round(avgPrice),
      }))
    }),

  /** 标记/取消标记异常案例 */
  markAnomaly: adminProcedure
    .input(z.object({
      caseId: z.number(),
      isAnomaly: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(cases)
        .set({ isAnomaly: input.isAnomaly, anomalyReason: input.reason || null })
        .where(eq(cases.id, input.caseId))
      return { success: true }
    }),

  /** 批量清洗：标记所有统计异常案例 */
  batchMarkAnomalies: adminProcedure
    .input(z.object({ cityId: z.number().optional(), dryRun: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      const priceStats = await db.execute(sql`
        SELECT AVG(unit_price) as avg_price, STDDEV(unit_price) as std_price
        FROM cases WHERE unit_price IS NOT NULL
        ${input.cityId ? sql`AND city_id = ${input.cityId}` : sql``}
      `) as any
      const avgPrice = Number(priceStats[0]?.[0]?.avg_price || 0)
      const stdPrice = Number(priceStats[0]?.[0]?.std_price || 0)
      const priceMin = avgPrice - 3 * stdPrice
      const priceMax = avgPrice + 3 * stdPrice

      const toMark = await db.select({ id: cases.id }).from(cases)
        .where(and(
          input.cityId ? eq(cases.cityId, input.cityId) : undefined,
          isNotNull(cases.unitPrice),
          eq(cases.isAnomaly, false),
          or(lte(cases.unitPrice, priceMin.toString()), gte(cases.unitPrice, priceMax.toString()))
        ))

      if (!input.dryRun && toMark.length > 0) {
        const ids = toMark.map(c => c.id)
        await db.update(cases)
          .set({ isAnomaly: true, anomalyReason: '价格超出均值3倍标准差，系统自动标记' })
          .where(inArray(cases.id, ids))
      }
      return { count: toMark.length, dryRun: input.dryRun, avgPrice: Math.round(avgPrice) }
    }),

  // ──────────────────────────────────────────────────────────
  // 3. AI 价格预测
  // ──────────────────────────────────────────────────────────

  /** 获取历史价格趋势（真实数据库数据） */
  getPriceTrend: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      propertyType: z.string().default('住宅'),
      months: z.number().default(12),
    }))
    .query(async ({ input }) => {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - input.months)
      const conditions: any[] = [
        eq(cases.isAnomaly, false),
        isNotNull(cases.unitPrice),
        gte(cases.transactionDate, startDate),
      ]
      if (input.cityId) conditions.push(eq(cases.cityId, input.cityId))
      if (input.estateId) conditions.push(eq(cases.estateId, input.estateId))
      if (input.propertyType) conditions.push(eq(cases.propertyType, input.propertyType))

      const rawData = await db.select({
        month: sql<string>`DATE_FORMAT(transaction_date, '%Y-%m')`,
        avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
        maxPrice: sql<number>`ROUND(MAX(unit_price), 0)`,
        minPrice: sql<number>`ROUND(MIN(unit_price), 0)`,
        count: sql<number>`COUNT(*)`,
      }).from(cases).where(and(...conditions))
        .groupBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)

      // 基于历史数据生成预测（线性回归）
      const prices = rawData.map(d => Number(d.avgPrice))
      let predictedMonths: { month: string; predictedPrice: number; confidence: number }[] = []
      if (prices.length >= 3) {
        const n = prices.length
        const sumX = (n * (n - 1)) / 2
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
        const sumY = prices.reduce((a, b) => a + b, 0)
        const sumXY = prices.reduce((acc, p, i) => acc + i * p, 0)
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n
        const lastDate = rawData[rawData.length - 1]?.month || ''
        for (let i = 1; i <= 6; i++) {
          const [year, month] = lastDate.split('-').map(Number)
          const futureDate = new Date(year, month - 1 + i, 1)
          const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`
          const predictedPrice = Math.round(intercept + slope * (n + i - 1))
          const confidence = Math.max(50, 95 - i * 5)
          predictedMonths.push({ month: futureMonth, predictedPrice: Math.max(0, predictedPrice), confidence })
        }
      }

      return { history: rawData, predictions: predictedMonths }
    }),

  /** 单套房屋价格预测（v2.0 三级降级策略 + 完整估价引擎） */
  predictSinglePrice: protectedProcedure
    .input(z.object({
      cityId: z.number(),
      estateId: z.number().optional(),     // v2.0：传入楼盘ID可触发 Level 2/3
      propertyType: z.string().default('住宅'),
      area: z.number(),
      floor: z.number(),
      totalFloors: z.number(),
      buildingAge: z.number().default(10),
      decoration: z.string().default('medium'),
      orientation: z.string().default('south'),
      hasElevator: z.boolean().default(true),
      hasParking: z.boolean().default(false),
      address: z.string().default(''),
      district: z.string().default('其他'),
    }))
    .mutation(async ({ input }) => {
      // 获取城市名称
      const [cityRow] = await db.select({ name: cities.name })
        .from(cities).where(eq(cities.id, input.cityId)).limit(1)
      const cityName = cityRow?.name || '深圳'

      // v2.0：若传入 estateId，预先加载楼盘价格矩阵（触发 Level 2/3）
      if (input.estateId) {
        await getOrBuildEstatePriceMatrix(input.estateId)
      }

      // 从数据库查找同面积段的相似案例（Level 1 候选）
      const areaRange = getAreaRange(input.area)
      // 面积段边界扩展 ±20% 以确保有足够样本
      const areaMin = input.area * 0.7
      const areaMax = input.area * 1.3
      const conditions: any[] = [
        eq(cases.cityId, input.cityId),
        eq(cases.isAnomaly, false),
        isNotNull(cases.unitPrice),
        gte(cases.area, areaMin.toString()),
        lte(cases.area, areaMax.toString()),
      ]
      if (input.estateId) conditions.push(eq(cases.estateId, input.estateId))

      let comparableCases = await db.select().from(cases)
        .where(and(...conditions))
        .orderBy(desc(cases.transactionDate))
        .limit(20)

      // 若同楼盘案例不足，扩大到全城市同面积段
      if (comparableCases.length < 3 && input.estateId) {
        comparableCases = await db.select().from(cases)
          .where(and(
            eq(cases.cityId, input.cityId),
            eq(cases.isAnomaly, false),
            isNotNull(cases.unitPrice),
            gte(cases.area, areaMin.toString()),
            lte(cases.area, areaMax.toString()),
          ))
          .orderBy(desc(cases.transactionDate))
          .limit(20)
      }

      // 构建 PropertyInput 调用完整估价引擎
      const propInput: PropertyInput = {
        propertyType: 'residential',
        city: cityName,
        district: input.district,
        address: input.address,
        buildingAge: input.buildingAge,
        totalFloors: input.totalFloors,
        floor: input.floor,
        buildingArea: input.area,
        orientation: (input.orientation as any) || 'south',
        decoration: (input.decoration as any) || 'medium',
        hasElevator: input.hasElevator,
        hasParking: input.hasParking,
        purpose: 'transaction',
        estateId: input.estateId,
        comparables: comparableCases.length >= 2 ? comparableCases.map(c => ({
          address: c.address || '',
          transactionPrice: Number(c.unitPrice),
          transactionDate: c.transactionDate instanceof Date
            ? c.transactionDate.toISOString().split('T')[0]
            : String(c.transactionDate || new Date().toISOString().split('T')[0]),
          buildingArea: Number(c.area) || input.area,
          buildingAge: input.buildingAge,
          floor: c.floor || input.floor,
          totalFloors: c.totalFloors || input.totalFloors,
          decoration: c.decoration || 'medium',
          hasElevator: input.hasElevator,
          hasParking: input.hasParking,
        })) : undefined,
      }

      const result = calculateValuation(propInput)

      // 获取价格趋势（最近6个月）
      const trendData = await db.select({
        month: sql<string>`DATE_FORMAT(transaction_date, '%Y-%m')`,
        avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
        sampleCount: sql<number>`COUNT(*)`,
      }).from(cases)
        .where(and(
          eq(cases.cityId, input.cityId),
          eq(cases.isAnomaly, false),
          isNotNull(cases.unitPrice),
          gte(cases.transactionDate, new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000)),
        ))
        .groupBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)

      // 楼盘价格矩阵摘要（若有）
      const matrixSummary = input.estateId
        ? await getEstatePriceMatrixSummary([input.estateId])
        : []

      return {
        predictedUnitPrice: result.unitPrice,
        totalPrice: result.finalValue,
        confidence: result.confidenceLevel === 'high' ? 90 : result.confidenceLevel === 'medium' ? 75 : 60,
        confidenceLevel: result.confidenceLevel,
        priceSource: result.marketData.comparativePriceSource,
        areaRange: AREA_RANGE_LABELS[areaRange],
        comparableCount: comparableCases.length,
        comparableCases: comparableCases.slice(0, 6).map(c => ({
          id: c.id,
          address: c.address,
          area: Number(c.area),
          unitPrice: Number(c.unitPrice),
          transactionDate: c.transactionDate,
          similarity: Math.round(calcSimilarity(input, c) * 100),
        })),
        priceTrend: trendData,
        marketData: result.marketData,
        adjustments: result.adjustments,
        comparativeResult: result.comparativeResult,
        incomeResult: result.incomeResult,
        costResult: result.costResult,
        weights: result.weights,
        matrixSummary: matrixSummary[0] || null,
        factors: result.adjustments.map(a => ({
          name: a.factor,
          value: `${a.coefficient >= 1 ? '+' : ''}${((a.coefficient - 1) * 100).toFixed(1)}%`,
          impact: a.coefficient > 1 ? 'positive' : a.coefficient < 1 ? 'negative' : 'neutral',
          coefficient: a.coefficient,
          impact_amount: a.impact,
        })),
      }
    }),

  // ──────────────────────────────────────────────────────────
  // 4. AI 案例匹配
  // ──────────────────────────────────────────────────────────

  /** 智能匹配相似案例 */
  matchCases: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      area: z.number(),
      floor: z.number().optional(),
      totalFloors: z.number().optional(),
      propertyType: z.string().default('住宅'),
      minSimilarity: z.number().min(0).max(100).default(70),
      limit: z.number().default(20),
      address: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const areaMin = input.area * 0.6
      const areaMax = input.area * 1.4
      const conditions: any[] = [
        eq(cases.isAnomaly, false),
        isNotNull(cases.unitPrice),
        gte(cases.area, areaMin.toString()),
        lte(cases.area, areaMax.toString()),
      ]
      if (input.cityId) conditions.push(eq(cases.cityId, input.cityId))
      if (input.propertyType) conditions.push(eq(cases.propertyType, input.propertyType))

      const candidates = await db.select().from(cases)
        .where(and(...conditions))
        .orderBy(desc(cases.transactionDate))
        .limit(200)

      // 计算相似度并排序
      const scored = candidates.map(c => {
        const areaDiff = Math.abs(Number(c.area) - input.area) / Math.max(input.area, 1)
        const floorRatioA = (input.totalFloors && input.floor) ? input.floor / input.totalFloors : 0.5
        const floorRatioB = (c.totalFloors && c.floor) ? c.floor / c.totalFloors : 0.5
        const floorDiff = Math.abs(floorRatioA - floorRatioB)
        const similarity = Math.max(0, Math.min(100, Math.round((1 - areaDiff * 0.6 - floorDiff * 0.4) * 100)))
        return { ...c, similarity }
      })
        .filter(c => c.similarity >= input.minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.limit)

      return {
        total: scored.length,
        cases: scored.map(c => ({
          id: c.id,
          address: c.address,
          area: Number(c.area),
          floor: c.floor,
          totalFloors: c.totalFloors,
          unitPrice: Number(c.unitPrice),
          totalPrice: Number(c.price),
          transactionDate: c.transactionDate,
          source: c.source,
          propertyType: c.propertyType,
          similarity: c.similarity,
          orientation: c.orientation,
        })),
      }
    }),

  // ──────────────────────────────────────────────────────────
  // 5. AI 异常检测
  // ──────────────────────────────────────────────────────────

  /** 扫描异常案例（真实统计分析） */
  detectAnomalies: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      checkPriceHigh: z.boolean().default(true),
      checkPriceLow: z.boolean().default(true),
      checkArea: z.boolean().default(true),
      checkDate: z.boolean().default(true),
      checkDuplicate: z.boolean().default(true),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const baseWhere = input.cityId ? eq(cases.cityId, input.cityId) : undefined

      // 价格统计
      const priceStats = await db.execute(sql`
        SELECT 
          AVG(unit_price) as avg_price, 
          STDDEV(unit_price) as std_price,
          AVG(area) as avg_area,
          STDDEV(area) as std_area
        FROM cases WHERE unit_price IS NOT NULL AND area IS NOT NULL
        ${input.cityId ? sql`AND city_id = ${input.cityId}` : sql``}
      `) as any
      const avgPrice = Number(priceStats[0]?.[0]?.avg_price || 0)
      const stdPrice = Number(priceStats[0]?.[0]?.std_price || 0)
      const avgArea = Number(priceStats[0]?.[0]?.avg_area || 0)
      const stdArea = Number(priceStats[0]?.[0]?.std_area || 0)

      const anomalies: any[] = []

      // 价格过高
      if (input.checkPriceHigh && avgPrice > 0) {
        const highPriceCases = await db.select().from(cases)
          .where(and(baseWhere, isNotNull(cases.unitPrice), gte(cases.unitPrice, (avgPrice + 2.5 * stdPrice).toString())))
          .orderBy(desc(cases.unitPrice)).limit(30)
        highPriceCases.forEach(c => anomalies.push({
          ...c, anomalyType: '价格过高', risk: 'high',
          desc: `单价 ${Number(c.unitPrice).toLocaleString()} 元/㎡，超出均价 ${Math.round(((Number(c.unitPrice) - avgPrice) / avgPrice) * 100)}%`,
          expected: `≤ ${Math.round(avgPrice + 2.5 * stdPrice).toLocaleString()} 元/㎡`,
        }))
      }

      // 价格过低
      if (input.checkPriceLow && avgPrice > 0 && stdPrice > 0) {
        const lowPriceCases = await db.select().from(cases)
          .where(and(baseWhere, isNotNull(cases.unitPrice), lte(cases.unitPrice, Math.max(0, avgPrice - 2.5 * stdPrice).toString())))
          .orderBy(cases.unitPrice).limit(30)
        lowPriceCases.forEach(c => anomalies.push({
          ...c, anomalyType: '价格过低', risk: 'high',
          desc: `单价 ${Number(c.unitPrice).toLocaleString()} 元/㎡，低于均价 ${Math.round(((avgPrice - Number(c.unitPrice)) / avgPrice) * 100)}%`,
          expected: `≥ ${Math.round(Math.max(0, avgPrice - 2.5 * stdPrice)).toLocaleString()} 元/㎡`,
        }))
      }

      // 面积异常
      if (input.checkArea && avgArea > 0) {
        const areaAnomalies = await db.select().from(cases)
          .where(and(
            baseWhere,
            isNotNull(cases.area),
            or(
              lte(cases.area, Math.max(0, avgArea - 3 * stdArea).toString()),
              gte(cases.area, (avgArea + 3 * stdArea).toString())
            )
          )).limit(20)
        areaAnomalies.forEach(c => anomalies.push({
          ...c, anomalyType: '面积异常', risk: 'medium',
          desc: `建筑面积 ${Number(c.area)} ㎡，偏离均值 ${Math.round(Math.abs(Number(c.area) - avgArea) / avgArea * 100)}%`,
          expected: `${Math.round(avgArea - 2 * stdArea)}～${Math.round(avgArea + 2 * stdArea)} ㎡`,
        }))
      }

      // 日期异常（成交日期在未来）
      if (input.checkDate) {
        const futureCases = await db.select().from(cases)
          .where(and(baseWhere, isNotNull(cases.transactionDate), gte(cases.transactionDate, new Date())))
          .limit(20)
        futureCases.forEach(c => anomalies.push({
          ...c, anomalyType: '日期异常', risk: 'medium',
          desc: `成交日期 ${c.transactionDate?.toLocaleDateString()} 为未来日期`,
          expected: `≤ ${new Date().toLocaleDateString()}`,
        }))
      }

      // 去重后返回（同一案例可能触发多个异常）
      const seen = new Set<number>()
      const uniqueAnomalies = anomalies.filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      }).slice(0, input.limit)

      return {
        total: uniqueAnomalies.length,
        stats: {
          avgPrice: Math.round(avgPrice),
          stdPrice: Math.round(stdPrice),
          avgArea: Math.round(avgArea),
          high: anomalies.filter(a => a.risk === 'high').length,
          medium: anomalies.filter(a => a.risk === 'medium').length,
          low: anomalies.filter(a => a.risk === 'low').length,
        },
        anomalies: uniqueAnomalies.map(a => ({
          id: a.id,
          address: a.address,
          area: Number(a.area),
          unitPrice: Number(a.unitPrice),
          transactionDate: a.transactionDate,
          source: a.source,
          anomalyType: a.anomalyType,
          risk: a.risk,
          desc: a.desc,
          expected: a.expected,
          isMarked: a.isAnomaly,
        })),
      }
    }),

  // ──────────────────────────────────────────────────────────
  // 6. AI 批量估值
  // ──────────────────────────────────────────────────────────

  /** 获取可批量估值的案例列表（未估值的） */
  getBatchValuationCandidates: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      limit: z.number().default(50),
      onlyUnvalued: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [eq(cases.isAnomaly, false), isNotNull(cases.area)]
      if (input.cityId) conditions.push(eq(cases.cityId, input.cityId))

      const caseList = await db.select().from(cases)
        .where(and(...conditions))
        .orderBy(desc(cases.transactionDate))
        .limit(input.limit)

      return caseList.map(c => ({
        id: c.id,
        address: c.address,
        area: Number(c.area),
        floor: c.floor,
        totalFloors: c.totalFloors,
        propertyType: c.propertyType,
        transactionDate: c.transactionDate,
        actualUnitPrice: Number(c.unitPrice),
        cityId: c.cityId,
        status: 'pending' as const,
      }))
    }),

  /** 单个案例估值（v2.0 对接三级降级策略引擎） */
  valuateSingleCase: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      method: z.enum(['market', 'income', 'cost', 'ai']).default('market'),
    }))
    .mutation(async ({ input }) => {
      const [c] = await db.select().from(cases).where(eq(cases.id, input.caseId)).limit(1)
      if (!c) throw new Error('案例不存在')

      const area = Number(c.area) || 100
      const floor = c.floor || 10
      const totalFloors = c.totalFloors || 20

      // 获取城市名称
      const [cityRow] = c.cityId
        ? await db.select({ name: cities.name }).from(cities).where(eq(cities.id, c.cityId)).limit(1)
        : [{ name: '深圳' }]
      const cityName = cityRow?.name || '深圳'

      // v2.0：若案例有关联楼盘，预加载楼盘价格矩阵
      if (c.estateId) {
        await getOrBuildEstatePriceMatrix(c.estateId)
      }

      // 查找同楼盘同面积段的相似案例（Level 1 候选）
      const areaMin = area * 0.7
      const areaMax = area * 1.3
      const conditions: any[] = [
        eq(cases.cityId, c.cityId!),
        eq(cases.isAnomaly, false),
        isNotNull(cases.unitPrice),
        ne(cases.id, input.caseId),
        gte(cases.area, areaMin.toString()),
        lte(cases.area, areaMax.toString()),
      ]
      if (c.estateId) conditions.push(eq(cases.estateId, c.estateId))

      let comparables = await db.select().from(cases)
        .where(and(...conditions))
        .orderBy(desc(cases.transactionDate))
        .limit(10)

      // 同楼盘案例不足，扩大到全城市
      if (comparables.length < 2 && c.estateId) {
        comparables = await db.select().from(cases)
          .where(and(
            eq(cases.cityId, c.cityId!),
            eq(cases.isAnomaly, false),
            isNotNull(cases.unitPrice),
            ne(cases.id, input.caseId),
            gte(cases.area, areaMin.toString()),
            lte(cases.area, areaMax.toString()),
          ))
          .orderBy(desc(cases.transactionDate))
          .limit(10)
      }

      // 构建 PropertyInput
      const propInput: PropertyInput = {
        propertyType: 'residential',
        city: cityName,
        district: '其他',
        address: c.address || '',
        buildingAge: 10,
        totalFloors,
        floor,
        buildingArea: area,
        orientation: 'south',
        decoration: (c.decoration as any) || 'medium',
        hasElevator: totalFloors > 6,
        hasParking: false,
        purpose: 'transaction',
        estateId: c.estateId || undefined,
        comparables: comparables.length >= 2 ? comparables.map(comp => ({
          address: comp.address || '',
          transactionPrice: Number(comp.unitPrice),
          transactionDate: comp.transactionDate instanceof Date
            ? comp.transactionDate.toISOString().split('T')[0]
            : String(comp.transactionDate || new Date().toISOString().split('T')[0]),
          buildingArea: Number(comp.area) || area,
          buildingAge: 10,
          floor: comp.floor || floor,
          totalFloors: comp.totalFloors || totalFloors,
          decoration: comp.decoration || 'medium',
          hasElevator: totalFloors > 6,
          hasParking: false,
        })) : undefined,
      }

      // 根据 method 选择估价方法
      let estimatedUnitPrice: number
      let methodName: string
      let confidence: number

      if (input.method === 'market' || input.method === 'ai') {
        const result = calculateValuation(propInput)
        estimatedUnitPrice = result.unitPrice
        methodName = result.comparativeResult?.method || '市场比较法'
        confidence = result.confidenceLevel === 'high' ? 90 : result.confidenceLevel === 'medium' ? 75 : 60
        if (input.method === 'ai') estimatedUnitPrice = Math.round(estimatedUnitPrice * 1.02)
      } else if (input.method === 'income') {
        const cityData = { residential: 72000, commercial: 90000, office: 80000, industrial: 20000, trend: 1.5, districts: { '其他': 1.0 } }
        const incomeResult = incomeApproach(propInput, cityData)
        estimatedUnitPrice = incomeResult?.unitPrice || 0
        methodName = '收益法'
        confidence = 65
      } else {
        const cityData = { residential: 72000, commercial: 90000, office: 80000, industrial: 20000, trend: 1.5, districts: { '其他': 1.0 } }
        const costResult = costApproach(propInput, cityData)
        estimatedUnitPrice = costResult.unitPrice
        methodName = '成本法'
        confidence = 60
      }

      const totalPrice = Math.round(estimatedUnitPrice * area)
      const deviation = c.unitPrice ? Math.round(((estimatedUnitPrice - Number(c.unitPrice)) / Number(c.unitPrice)) * 100) : null

      return {
        caseId: input.caseId,
        address: c.address,
        area,
        method: input.method,
        methodName,
        estimatedUnitPrice,
        totalPrice,
        actualUnitPrice: Number(c.unitPrice),
        deviation,
        confidence,
        comparableCount: comparables.length,
        priceSource: propInput.comparables ? 'Level 1 - 真实案例' : (c.estateId ? 'Level 2/3 - 楼盘价格矩阵' : 'Fallback - 城市基准'),
        status: 'done' as const,
      }
    }),

  // ──────────────────────────────────────────────────────────
  // 7. 楼盘价格矩阵（v2.0 新增）
  // ──────────────────────────────────────────────────────────

  /** 获取单楼盘价格矩阵（各面积段均价） */
  getEstatePriceMatrix: protectedProcedure
    .input(z.object({ estateId: z.number() }))
    .query(async ({ input }) => {
      const matrix = await getOrBuildEstatePriceMatrix(input.estateId)
      if (!matrix) return null
      return {
        estateId: matrix.estateId,
        estateName: matrix.estateName,
        overallAvgPrice: matrix.overallAvgPrice,
        overallSampleCount: matrix.overallSampleCount,
        updatedAt: matrix.updatedAt,
        areaRanges: Object.entries(matrix.areaRangePrices).map(([range, data]) => ({
          range,
          label: AREA_RANGE_LABELS[range as any] || range,
          avgPrice: data!.avgPrice,
          minPrice: data!.minPrice,
          maxPrice: data!.maxPrice,
          sampleCount: data!.sampleCount,
          stdDev: data!.stdDev,
          lastUpdated: data!.lastUpdated,
        })),
      }
    }),

  /** 刷新单楼盘价格矩阵 */
  refreshEstatePriceMatrix: adminProcedure
    .input(z.object({ estateId: z.number() }))
    .mutation(async ({ input }) => {
      const matrix = await refreshEstatePriceMatrix(input.estateId)
      if (!matrix) return { success: false, message: '楼盘无数据或不存在' }
      return {
        success: true,
        estateId: matrix.estateId,
        estateName: matrix.estateName,
        overallAvgPrice: matrix.overallAvgPrice,
        sampleCount: matrix.overallSampleCount,
        areaRangeCount: Object.keys(matrix.areaRangePrices).length,
        updatedAt: matrix.updatedAt,
      }
    }),

  /** 全量刷新所有楼盘价格矩阵 */
  refreshAllEstatePriceMatrices: adminProcedure
    .mutation(async () => {
      const result = await refreshAllEstatePriceMatrices({ limit: 5000 })
      return {
        success: true,
        ...result,
        message: `共刷新 ${result.refreshed} 个楼盘价格矩阵，跳过 ${result.skipped} 个，失败 ${result.errors} 个`,
      }
    }),

  /** 批量获取楼盘价格矩阵摘要 */
  getEstatePriceMatrixSummary: protectedProcedure
    .input(z.object({ estateIds: z.array(z.number()).max(50) }))
    .query(async ({ input }) => {
      return getEstatePriceMatrixSummary(input.estateIds)
    }),

  /** 批量估值统计（已完成的估值汇总） */
  getBatchValuationStats: protectedProcedure
    .input(z.object({ cityId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions: any[] = [eq(cases.isAnomaly, false), isNotNull(cases.unitPrice)]
      if (input.cityId) conditions.push(eq(cases.cityId, input.cityId))

      const [totalResult] = await db.select({ count: count() }).from(cases).where(and(...conditions))
      const priceStats = await db.execute(sql`
        SELECT 
          ROUND(AVG(unit_price), 0) as avg_price,
          ROUND(MIN(unit_price), 0) as min_price,
          ROUND(MAX(unit_price), 0) as max_price,
          ROUND(AVG(area), 1) as avg_area,
          COUNT(*) as total
        FROM cases WHERE unit_price IS NOT NULL AND is_anomaly = 0
        ${input.cityId ? sql`AND city_id = ${input.cityId}` : sql``}
      `) as any
      const stats = priceStats[0]?.[0] || {}

      return {
        total: totalResult.count,
        avgPrice: Number(stats.avg_price || 0),
        minPrice: Number(stats.min_price || 0),
        maxPrice: Number(stats.max_price || 0),
        avgArea: Number(stats.avg_area || 0),
      }
    }),
})
