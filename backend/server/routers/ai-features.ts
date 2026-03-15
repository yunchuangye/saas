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
import { calculateValuation, type PropertyInput } from '../lib/valuation-engine'
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

  /** 单套房屋价格预测（调用估价引擎） */
  predictSinglePrice: protectedProcedure
    .input(z.object({
      cityId: z.number(),
      propertyType: z.string().default('住宅'),
      area: z.number(),
      floor: z.number(),
      totalFloors: z.number(),
      buildingAge: z.number().default(10),
      decoration: z.string().default('medium'),
      orientation: z.string().default('south'),
      hasElevator: z.boolean().default(true),
      address: z.string().default(''),
    }))
    .mutation(async ({ input }) => {
      // 从数据库查找相似案例
      const areaMin = input.area * 0.7
      const areaMax = input.area * 1.3
      const comparableCases = await db.select().from(cases)
        .where(and(
          eq(cases.cityId, input.cityId),
          eq(cases.isAnomaly, false),
          isNotNull(cases.unitPrice),
          gte(cases.area, areaMin.toString()),
          lte(cases.area, areaMax.toString()),
        ))
        .orderBy(desc(cases.transactionDate))
        .limit(20)

      if (comparableCases.length === 0) {
        return { error: '数据库中暂无足够的相似案例，无法预测', comparableCount: 0 }
      }

      // 计算加权均价
      const scored = comparableCases.map(c => ({
        ...c,
        similarity: calcSimilarity(input, c),
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 6)

      const totalWeight = scored.reduce((s, c) => s + c.similarity, 0)
      const weightedPrice = scored.reduce((s, c) => s + Number(c.unitPrice) * c.similarity, 0) / (totalWeight || 1)

      // 调整系数（楼层、装修、楼龄）
      let adjustFactor = 1.0
      const floorRatio = input.totalFloors > 0 ? input.floor / input.totalFloors : 0.5
      if (floorRatio > 0.7) adjustFactor *= 1.05
      else if (floorRatio < 0.2) adjustFactor *= 0.95
      if (input.decoration === 'fine' || input.decoration === 'luxury') adjustFactor *= 1.08
      else if (input.decoration === 'rough') adjustFactor *= 0.92
      if (input.buildingAge > 20) adjustFactor *= 0.90
      else if (input.buildingAge < 5) adjustFactor *= 1.05
      if (input.hasElevator && input.totalFloors > 6) adjustFactor *= 1.03

      const predictedUnitPrice = Math.round(weightedPrice * adjustFactor)
      const totalPrice = Math.round(predictedUnitPrice * input.area)
      const confidence = Math.min(95, 60 + scored.length * 5)

      // 获取价格趋势（最近6个月）
      const trendData = await db.select({
        month: sql<string>`DATE_FORMAT(transaction_date, '%Y-%m')`,
        avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
      }).from(cases)
        .where(and(
          eq(cases.cityId, input.cityId),
          eq(cases.isAnomaly, false),
          isNotNull(cases.unitPrice),
          gte(cases.transactionDate, new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000)),
        ))
        .groupBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)

      return {
        predictedUnitPrice,
        totalPrice,
        confidence,
        adjustFactor: Math.round(adjustFactor * 100) / 100,
        comparableCount: scored.length,
        comparableCases: scored.map(c => ({
          id: c.id,
          address: c.address,
          area: Number(c.area),
          unitPrice: Number(c.unitPrice),
          transactionDate: c.transactionDate,
          similarity: Math.round(c.similarity * 100),
        })),
        priceTrend: trendData,
        factors: [
          { name: '楼层系数', value: floorRatio > 0.7 ? '+5%' : floorRatio < 0.2 ? '-5%' : '0%', impact: floorRatio > 0.7 ? 'positive' : floorRatio < 0.2 ? 'negative' : 'neutral' },
          { name: '装修系数', value: input.decoration === 'fine' || input.decoration === 'luxury' ? '+8%' : input.decoration === 'rough' ? '-8%' : '0%', impact: input.decoration === 'fine' || input.decoration === 'luxury' ? 'positive' : input.decoration === 'rough' ? 'negative' : 'neutral' },
          { name: '楼龄系数', value: input.buildingAge > 20 ? '-10%' : input.buildingAge < 5 ? '+5%' : '0%', impact: input.buildingAge > 20 ? 'negative' : input.buildingAge < 5 ? 'positive' : 'neutral' },
          { name: '电梯系数', value: input.hasElevator && input.totalFloors > 6 ? '+3%' : '0%', impact: input.hasElevator && input.totalFloors > 6 ? 'positive' : 'neutral' },
        ],
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

  /** 单个案例估值（供批量调用） */
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

      // 查找相似案例
      const areaMin = area * 0.7
      const areaMax = area * 1.3
      const comparables = await db.select().from(cases)
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

      if (comparables.length === 0) {
        return { caseId: input.caseId, error: '无足够参考案例', status: 'failed' }
      }

      // 加权均价
      const scored = comparables.map(comp => ({
        ...comp,
        similarity: calcSimilarity({ area, floor, totalFloors }, comp),
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 6)

      const totalWeight = scored.reduce((s, c) => s + c.similarity, 0)
      const weightedPrice = scored.reduce((s, c) => s + Number(c.unitPrice) * c.similarity, 0) / (totalWeight || 1)

      // 方法调整
      let methodFactor = 1.0
      if (input.method === 'income') methodFactor = 0.95
      else if (input.method === 'cost') methodFactor = 0.92
      else if (input.method === 'ai') methodFactor = 1.02

      const estimatedUnitPrice = Math.round(weightedPrice * methodFactor)
      const totalPrice = Math.round(estimatedUnitPrice * area)
      const confidence = Math.min(95, 55 + scored.length * 6)
      const deviation = c.unitPrice ? Math.round(((estimatedUnitPrice - Number(c.unitPrice)) / Number(c.unitPrice)) * 100) : null

      return {
        caseId: input.caseId,
        address: c.address,
        area,
        method: input.method,
        estimatedUnitPrice,
        totalPrice,
        actualUnitPrice: Number(c.unitPrice),
        deviation,
        confidence,
        comparableCount: scored.length,
        status: 'done' as const,
      }
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
