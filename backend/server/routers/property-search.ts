import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { db } from '../lib/db'
import { estates, buildings, units, cases, cities } from '../lib/schema'
import { eq, and, like, or, desc, gte, lte, sql, isNotNull } from 'drizzle-orm'
import { pinyin } from 'pinyin-pro'

// ============================================================
// 工具函数：生成拼音首字母
// ============================================================
function toPinyinInitials(text: string): string {
  try {
    const result = pinyin(text, { pattern: 'first', toneType: 'none', separator: '' })
    return result.toUpperCase()
  } catch {
    return ''
  }
}

function toPinyinFull(text: string): string {
  try {
    const result = pinyin(text, { toneType: 'none', separator: '' })
    return result.toUpperCase()
  } catch {
    return ''
  }
}

// 判断搜索词是否匹配（支持中文、拼音全拼、首字母）
function matchesQuery(name: string, query: string): boolean {
  if (!query) return true
  const q = query.trim().toUpperCase()
  if (!q) return true

  // 1. 中文直接包含
  if (name.includes(query.trim())) return true

  // 2. 拼音首字母匹配
  const initials = toPinyinInitials(name)
  if (initials.includes(q)) return true

  // 3. 全拼包含
  const full = toPinyinFull(name)
  if (full.includes(q)) return true

  return false
}

// ============================================================
// 月份价格趋势数据
// ============================================================
async function getMonthlyPriceTrend(params: {
  cityId?: number
  estateId?: number
  propertyType?: string
  months?: number
}) {
  const { cityId, estateId, propertyType = '住宅', months = 12 } = params

  // 计算起始日期（N个月前）
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const conditions: any[] = [
    eq(cases.isAnomaly, false),
    isNotNull(cases.unitPrice),
    gte(cases.transactionDate, startDate),
  ]

  if (cityId) conditions.push(eq(cases.cityId, cityId))
  if (estateId) conditions.push(eq(cases.estateId, estateId))
  if (propertyType) conditions.push(eq(cases.propertyType, propertyType))

  const rawData = await db
    .select({
      month: sql<string>`DATE_FORMAT(transaction_date, '%Y-%m')`,
      avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
      maxPrice: sql<number>`ROUND(MAX(unit_price), 0)`,
      minPrice: sql<number>`ROUND(MIN(unit_price), 0)`,
      count: sql<number>`COUNT(*)`,
      totalArea: sql<number>`ROUND(SUM(area), 1)`,
    })
    .from(cases)
    .where(and(...conditions))
    .groupBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(transaction_date, '%Y-%m')`)

  return rawData
}

// ============================================================
// 路由定义
// ============================================================
export const propertySearchRouter = router({

  // ----------------------------------------------------------
  // 搜索楼盘（支持中文 + 拼音首字母）
  // ----------------------------------------------------------
  searchEstates: protectedProcedure
    .input(z.object({
      query: z.string().default(''),
      cityId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const { query, cityId, limit } = input

      // 从数据库获取候选楼盘
      const conditions: any[] = [eq(estates.isActive, true)]
      if (cityId) conditions.push(eq(estates.cityId, cityId))

      // 如果有查询词且是中文，直接用 SQL LIKE
      const isChinese = query && /[\u4e00-\u9fa5]/.test(query)
      if (isChinese) {
        conditions.push(like(estates.name, `%${query}%`))
      }

      const allEstates = await db
        .select({
          id: estates.id,
          name: estates.name,
          cityId: estates.cityId,
          address: estates.address,
          developer: estates.developer,
          buildYear: estates.buildYear,
          propertyType: estates.propertyType,
          totalUnits: estates.totalUnits,
        })
        .from(estates)
        .where(and(...conditions))
        .orderBy(estates.name)
        .limit(isChinese ? limit : 200) // 非中文搜索需要在内存中过滤

      // 拼音/首字母过滤（仅在非中文搜索时）
      let filtered = allEstates
      if (query && !isChinese) {
        filtered = allEstates.filter(e => matchesQuery(e.name, query))
      }

      // 为每个楼盘添加拼音首字母
      return filtered.slice(0, limit).map(e => ({
        ...e,
        pinyinInitials: toPinyinInitials(e.name),
        pinyinFull: toPinyinFull(e.name),
      }))
    }),

  // ----------------------------------------------------------
  // 获取楼盘下的楼栋列表
  // ----------------------------------------------------------
  getBuildingsByEstate: protectedProcedure
    .input(z.object({
      estateId: z.number(),
    }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(buildings)
        .where(eq(buildings.estateId, input.estateId))
        .orderBy(buildings.name)

      return result
    }),

  // ----------------------------------------------------------
  // 获取楼栋下的房屋单元列表
  // ----------------------------------------------------------
  getUnitsByBuilding: protectedProcedure
    .input(z.object({
      buildingId: z.number(),
      floor: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const conditions: any[] = [eq(units.buildingId, input.buildingId)]
      if (input.floor) conditions.push(eq(units.floor, input.floor))

      const result = await db
        .select()
        .from(units)
        .where(and(...conditions))
        .orderBy(units.floor, units.unitNumber)

      return result
    }),

  // ----------------------------------------------------------
  // 获取楼盘详情（含统计数据）
  // ----------------------------------------------------------
  getEstateDetail: protectedProcedure
    .input(z.object({ estateId: z.number() }))
    .query(async ({ input }) => {
      const [estate] = await db
        .select()
        .from(estates)
        .where(eq(estates.id, input.estateId))
        .limit(1)

      if (!estate) throw new Error('楼盘不存在')

      // 楼栋数量
      const [buildingCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(buildings)
        .where(eq(buildings.estateId, input.estateId))

      // 案例统计
      const [caseStats] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
          maxPrice: sql<number>`ROUND(MAX(unit_price), 0)`,
          minPrice: sql<number>`ROUND(MIN(unit_price), 0)`,
          latestDate: sql<string>`MAX(transaction_date)`,
        })
        .from(cases)
        .where(and(eq(cases.estateId, input.estateId), eq(cases.isAnomaly, false)))

      return {
        ...estate,
        buildingCount: buildingCount?.count || 0,
        caseStats: caseStats || null,
        pinyinInitials: toPinyinInitials(estate.name),
      }
    }),

  // ----------------------------------------------------------
  // 获取月份价格趋势（用于报告图表）
  // ----------------------------------------------------------
  getMonthlyTrend: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      propertyType: z.string().default('住宅'),
      months: z.number().default(12),
    }))
    .query(async ({ input }) => {
      const trend = await getMonthlyPriceTrend(input)
      return trend
    }),

  // ----------------------------------------------------------
  // 获取价格采集点分析（散点图数据）
  // ----------------------------------------------------------
  getPriceScatterData: protectedProcedure
    .input(z.object({
      cityId: z.number().optional(),
      estateId: z.number().optional(),
      propertyType: z.string().default('住宅'),
      months: z.number().default(24),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const { cityId, estateId, propertyType, months, limit } = input

      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const conditions: any[] = [
        eq(cases.isAnomaly, false),
        isNotNull(cases.unitPrice),
        gte(cases.transactionDate, startDate),
      ]

      if (cityId) conditions.push(eq(cases.cityId, cityId))
      if (estateId) conditions.push(eq(cases.estateId, estateId))
      if (propertyType) conditions.push(eq(cases.propertyType, propertyType))

      const data = await db
        .select({
          id: cases.id,
          address: cases.address,
          area: cases.area,
          floor: cases.floor,
          totalFloors: cases.totalFloors,
          unitPrice: cases.unitPrice,
          price: cases.price,
          transactionDate: cases.transactionDate,
          orientation: cases.orientation,
          isAnomaly: cases.isAnomaly,
        })
        .from(cases)
        .where(and(...conditions))
        .orderBy(desc(cases.transactionDate))
        .limit(limit)

      return data.map(c => ({
        ...c,
        area: Number(c.area),
        unitPrice: Number(c.unitPrice),
        price: Number(c.price),
        month: c.transactionDate
          ? new Date(c.transactionDate).toISOString().slice(0, 7)
          : null,
      }))
    }),

  // ----------------------------------------------------------
  // 获取楼盘内案例统计（用于估价参考）
  // ----------------------------------------------------------
  getEstateCaseSummary: protectedProcedure
    .input(z.object({
      estateId: z.number(),
      propertyType: z.string().default('住宅'),
    }))
    .query(async ({ input }) => {
      const { estateId, propertyType } = input

      // 最近12个月案例
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 12)

      const [summary] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          avgPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
          medianPrice: sql<number>`ROUND(AVG(unit_price), 0)`,
          maxPrice: sql<number>`ROUND(MAX(unit_price), 0)`,
          minPrice: sql<number>`ROUND(MIN(unit_price), 0)`,
          avgArea: sql<number>`ROUND(AVG(area), 1)`,
        })
        .from(cases)
        .where(and(
          eq(cases.estateId, estateId),
          eq(cases.propertyType, propertyType),
          eq(cases.isAnomaly, false),
          gte(cases.transactionDate, startDate),
        ))

      // 最近3个月趋势
      const recentMonths = await getMonthlyPriceTrend({
        estateId,
        propertyType,
        months: 6,
      })

      return {
        summary: summary || { count: 0, avgPrice: 0, maxPrice: 0, minPrice: 0, avgArea: 0 },
        recentTrend: recentMonths,
      }
    }),
})

export { getMonthlyPriceTrend }
