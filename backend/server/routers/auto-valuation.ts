import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '../lib/trpc'
import { db } from '../lib/db'
import { autoValuations, cases, cities, districts, estates, buildings, units } from '../lib/schema'
import { eq, desc, and, gte, lte, sql, isNotNull, like, or } from 'drizzle-orm'
import { calculateValuation, formatCurrency, PropertyInput } from '../lib/valuation-engine'
import { getMonthlyPriceTrend } from './property-search'
import OpenAI from 'openai'

// 懒加载 OpenAI 客户端：仅在配置了 OPENAI_API_KEY 时才初始化
// 未配置时 AI 分析功能将优雅降级，不影响后端正常启动
let _openai: OpenAI | null = null
function getOpenAIClient(): OpenAI | null {
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
// 从案例库检索相似案例（住宅专用）
// ============================================================
async function findComparableCases(params: {
  cityId: number
  propertyType: string
  area: number
  floor: number
  totalFloors: number
  limit?: number
}) {
  const { cityId, propertyType, area, floor, totalFloors, limit = 6 } = params
  const areaMin = area * 0.7
  const areaMax = area * 1.3

  const results = await db
    .select()
    .from(cases)
    .where(
      and(
        eq(cases.cityId, cityId),
        eq(cases.propertyType, propertyType),
        eq(cases.isAnomaly, false),
        gte(cases.area, areaMin.toString()),
        lte(cases.area, areaMax.toString()),
      )
    )
    .orderBy(desc(cases.transactionDate))
    .limit(limit * 3) // 多取一些，再筛选

  // 按相似度排序（面积差异 + 楼层差异综合评分）
  const scored = results.map(c => {
    const areaDiff = Math.abs(Number(c.area) - area) / area
    const floorRatio = c.totalFloors ? (c.floor || 0) / c.totalFloors : 0.5
    const targetFloorRatio = totalFloors ? floor / totalFloors : 0.5
    const floorDiff = Math.abs(floorRatio - targetFloorRatio)
    const score = areaDiff * 0.6 + floorDiff * 0.4
    return { ...c, similarityScore: score }
  })

  scored.sort((a, b) => a.similarityScore - b.similarityScore)
  return scored.slice(0, limit)
}

// ============================================================
// LLM 辅助分析
// ============================================================
async function generateLLMAnalysis(params: {
  input: any
  result: any
  comparableCases: any[]
  cityName: string
}): Promise<{ analysis: string; confidenceScore: number; riskLevel: string; keyFactors: string[] }> {
  const { input, result, comparableCases, cityName } = params

  const prompt = `你是一位资深的房地产评估师，拥有20年从业经验，精通《房地产估价规范》GB/T 50291-2015。
请对以下物业估价结果进行专业分析：

【待估物业信息】
- 城市：${cityName}${input.district ? ' ' + input.district : ''}
- 地址：${input.address}
- 物业类型：${input.propertyType === 'residential' ? '住宅' : input.propertyType === 'commercial' ? '商业' : input.propertyType === 'office' ? '办公' : '工业'}
- 建筑面积：${input.buildingArea}㎡
- 楼层：${input.floor}/${input.totalFloors}层
- 楼龄：${input.buildingAge}年
- 朝向：${input.orientation === 'south_north' ? '南北通透' : input.orientation === 'south' ? '南' : input.orientation === 'north' ? '北' : input.orientation === 'east' ? '东' : '西'}
- 装修：${input.decoration === 'rough' ? '毛坯' : input.decoration === 'simple' ? '简装' : input.decoration === 'medium' ? '中等装修' : input.decoration === 'fine' ? '精装' : '豪装'}
- 有无电梯：${input.hasElevator ? '有' : '无'}
- 有无停车位：${input.hasParking ? '有' : '无'}

【估价结果】
- 综合估价：${formatCurrency(result.finalValue)}（单价：${result.unitPrice.toLocaleString('zh-CN')}元/㎡）
- 估价区间：${formatCurrency(result.valuationMin || result.finalValue * 0.9)} ~ ${formatCurrency(result.valuationMax || result.finalValue * 1.1)}
- 置信度：${result.confidenceLevel === 'high' ? '高' : result.confidenceLevel === 'medium' ? '中' : '低'}
${result.comparativeResult ? `- 比较法结果：${result.comparativeResult.unitPrice.toLocaleString('zh-CN')}元/㎡` : ''}
${result.costResult ? `- 成本法结果：${result.costResult.unitPrice.toLocaleString('zh-CN')}元/㎡` : ''}

【参考案例】（共${comparableCases.length}个）
${comparableCases.slice(0, 5).map((c, i) => 
  `${i+1}. ${c.address || '同区域案例'} | 面积${Number(c.area).toFixed(0)}㎡ | ${c.floor}/${c.totalFloors}层 | 成交单价${Number(c.unitPrice || c.unit_price).toLocaleString('zh-CN')}元/㎡ | 成交时间${new Date(c.transactionDate || c.transaction_date).toLocaleDateString('zh-CN')}`
).join('\n')}

请从以下几个维度进行专业分析（总字数控制在400-600字）：
1. **估价合理性评价**：结合参考案例，评价本次估价结果的合理性
2. **关键影响因素**：分析影响该物业价值的主要正面和负面因素
3. **市场行情判断**：结合当前市场环境，判断该区域价格走势
4. **风险提示**：指出可能影响估价准确性的风险因素
5. **建议**：对委托方给出具体建议

同时，请给出：
- 置信度评分（0-100分）
- 风险等级（低/中/高）
- 关键影响因素列表（3-5个，简短词语）

请以JSON格式返回，格式如下：
{
  "analysis": "专业分析文字...",
  "confidenceScore": 85,
  "riskLevel": "低",
  "keyFactors": ["因素1", "因素2", "因素3"]
}`

  // 检查是否配置了 OpenAI API Key
  const openaiClient = getOpenAIClient()
  if (!openaiClient) {
    console.log('[AI 分析] 未配置 OPENAI_API_KEY，跳过 AI 分析，返回默认结果')
    return {
      analysis: '未配置 AI 分析服务（OPENAI_API_KEY），请在后端 .env 中配置后重启服务以启用智能分析功能。',
      confidenceScore: 70,
      riskLevel: '中',
      keyFactors: ['市场波动', '楼龄折旧', '区位因素'],
    }
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(content)
    return {
      analysis: parsed.analysis || '分析生成失败',
      confidenceScore: parsed.confidenceScore || 75,
      riskLevel: parsed.riskLevel || '中',
      keyFactors: parsed.keyFactors || [],
    }
  } catch (err) {
    console.error('LLM 分析失败:', err)
    return {
      analysis: '智能分析暂时不可用，请参考估价数据进行判断。',
      confidenceScore: 70,
      riskLevel: '中',
      keyFactors: ['市场波动', '楼龄折旧', '区位因素'],
    }
  }
}

// ============================================================
// 输入 Schema
// ============================================================
const PropertyInputSchema = z.object({
  propertyType: z.enum(['residential', 'commercial', 'office', 'industrial', 'land']),
  city: z.string(),
  cityId: z.number().optional(),
  district: z.string().default(''),
  address: z.string(),
  buildingAge: z.number().min(0).max(100),
  totalFloors: z.number().min(1).max(200),
  floor: z.number().min(1).max(200),
  buildingArea: z.number().min(1).max(100000),
  rooms: z.number().optional(),
  landArea: z.number().optional(),
  orientation: z.enum(['south', 'north', 'east', 'west', 'south_north', 'other']),
  decoration: z.enum(['rough', 'simple', 'medium', 'fine', 'luxury']),
  hasElevator: z.boolean(),
  hasParking: z.boolean(),
  purpose: z.enum(['mortgage', 'transaction', 'tax', 'insurance', 'litigation']),
  monthlyRent: z.number().optional(),
  vacancyRate: z.number().optional(),
  operatingExpenseRate: z.number().optional(),
  capRate: z.number().optional(),
  landPrice: z.number().optional(),
  constructionCost: z.number().optional(),
  enableLLM: z.boolean().default(true),
  // 新增：楼盘/楼栋/房屋关联
  estateId: z.number().optional(),
  buildingId: z.number().optional(),
  unitId: z.number().optional(),
  estateName: z.string().optional(),
  buildingName: z.string().optional(),
  unitNumber: z.string().optional(),
})

export const autoValuationRouter = router({
  // ============================================================
  // 执行智能估价（住宅自动切换案例比较法 + LLM）
  // ============================================================
  calculate: protectedProcedure
    .input(PropertyInputSchema)
    .mutation(async ({ input, ctx }) => {
      const isResidential = input.propertyType === 'residential'

      // 1. 从案例库检索相似案例（住宅优先）
      let dbComparables: any[] = []
      if (input.cityId) {
        dbComparables = await findComparableCases({
          cityId: input.cityId,
          propertyType: input.propertyType === 'residential' ? '住宅' : 
                        input.propertyType === 'commercial' ? '商业' :
                        input.propertyType === 'office' ? '办公' : '工业',
          area: input.buildingArea,
          floor: input.floor,
          totalFloors: input.totalFloors,
          limit: 6,
        })
      }

      // 2. 将数据库案例转换为比较法格式
      const comparables = dbComparables.map(c => ({
        address: c.address || '同区域案例',
        transactionPrice: Number(c.unitPrice || c.unit_price || 0),
        transactionDate: c.transactionDate ? new Date(c.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        buildingArea: Number(c.area || 0),
        buildingAge: 5, // 默认楼龄
        floor: c.floor || 1,
        totalFloors: c.totalFloors || 1,
        decoration: 'medium',
        hasElevator: (c.totalFloors || 1) > 6,
        hasParking: false,
      })).filter(c => c.transactionPrice > 0)

      // 3. 运行估价引擎
      const engineInput: PropertyInput = {
        propertyType: input.propertyType,
        city: input.city,
        district: input.district,
        address: input.address,
        buildingAge: input.buildingAge,
        totalFloors: input.totalFloors,
        floor: input.floor,
        buildingArea: input.buildingArea,
        landArea: input.landArea,
        orientation: input.orientation,
        decoration: input.decoration,
        hasElevator: input.hasElevator,
        hasParking: input.hasParking,
        purpose: input.purpose,
        monthlyRent: input.monthlyRent,
        vacancyRate: input.vacancyRate,
        operatingExpenseRate: input.operatingExpenseRate,
        capRate: input.capRate,
        landPrice: input.landPrice,
        constructionCost: input.constructionCost,
        comparables: comparables.length >= 2 ? comparables : undefined,
      }
      const result = calculateValuation(engineInput)

      // 4. 计算估价区间（±10%~15%，置信度越高区间越窄）
      const intervalRate = result.confidenceLevel === 'high' ? 0.08 : 
                           result.confidenceLevel === 'medium' ? 0.12 : 0.18
      const valuationMin = Math.round(result.finalValue * (1 - intervalRate))
      const valuationMax = Math.round(result.finalValue * (1 + intervalRate))

      // 5. LLM 辅助分析
      let llmResult = null
      if (input.enableLLM) {
        llmResult = await generateLLMAnalysis({
          input,
          result: { ...result, valuationMin, valuationMax },
          comparableCases: dbComparables,
          cityName: input.city,
        })
      }

      // 6. 确定使用的方法描述
      const methodUsed = isResidential && comparables.length >= 2
        ? `案例比较法（${comparables.length}个参考案例）+ LLM辅助分析`
        : `比较法(${Math.round(result.weights.comparative * 100)}%) + 收益法(${Math.round(result.weights.income * 100)}%) + 成本法(${Math.round(result.weights.cost * 100)}%)`

      // 7. 保存到数据库
      const [saved] = await db.insert(autoValuations).values({
        userId: ctx.user.id,
        address: input.address,
        cityId: input.cityId || null,
        area: input.buildingArea.toString(),
        floor: input.floor,
        propertyType: input.propertyType,
        valuationResult: result.finalValue.toString(),
        valuationMin: valuationMin.toString(),
        valuationMax: valuationMax.toString(),
        confidence: (result.confidenceLevel === 'high' ? 90 : result.confidenceLevel === 'medium' ? 75 : 60).toString(),
        method: methodUsed,
        comparableCases: JSON.stringify(dbComparables.slice(0, 6)),
        aiAnalysis: llmResult?.analysis || null,
        status: 'completed',
        // 扩展字段
        orgId: ctx.user.orgId || null,
        propertyAddress: input.address,
        buildingArea: input.buildingArea.toString(),
        totalFloors: input.totalFloors,
        buildingAge: input.buildingAge,
        orientation: input.orientation,
        decoration: input.decoration,
        hasElevator: input.hasElevator ? 1 : 0,
        hasParking: input.hasParking ? 1 : 0,
        purpose: input.purpose,
        district: input.district,
        cityName: input.city,
        estimatedValue: result.finalValue.toString(),
        unitPrice: result.unitPrice.toString(),
        confidenceLevel: result.confidenceLevel,
        reportData: JSON.stringify({ input, result, comparables: dbComparables, llmResult }),
        llmAnalysis: llmResult ? JSON.stringify(llmResult) : null,
        comparableCount: dbComparables.length,
      } as any)

      // 8. 获取月份价格趋势（用于报告图表）
      let monthlyTrend: any[] = []
      let scatterData: any[] = []
      if (input.cityId) {
        monthlyTrend = await getMonthlyPriceTrend({
          cityId: input.cityId,
          estateId: input.estateId,
          propertyType: input.propertyType === 'residential' ? '住宅' : 
                        input.propertyType === 'commercial' ? '商业' :
                        input.propertyType === 'office' ? '办公' : '工业',
          months: 18,
        })

        // 获取散点数据（最近24个月）
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 24)
        const scatterConditions: any[] = [
          eq(cases.cityId, input.cityId),
          eq(cases.isAnomaly, false),
          isNotNull(cases.unitPrice),
          gte(cases.transactionDate, startDate),
        ]
        if (input.estateId) scatterConditions.push(eq(cases.estateId, input.estateId))

        const rawScatter = await db
          .select({
            id: cases.id,
            area: cases.area,
            unitPrice: cases.unitPrice,
            transactionDate: cases.transactionDate,
            floor: cases.floor,
            address: cases.address,
          })
          .from(cases)
          .where(and(...scatterConditions))
          .orderBy(desc(cases.transactionDate))
          .limit(150)

        scatterData = rawScatter.map(c => ({
          id: c.id,
          area: Number(c.area),
          unitPrice: Number(c.unitPrice),
          date: c.transactionDate ? new Date(c.transactionDate).toISOString().slice(0, 7) : null,
          floor: c.floor,
          address: c.address,
        }))
      }

      // 9. 获取楼盘信息
      let estateInfo: any = null
      if (input.estateId) {
        const [estateRow] = await db.select().from(estates).where(eq(estates.id, input.estateId)).limit(1)
        if (estateRow) {
          estateInfo = {
            id: estateRow.id,
            name: estateRow.name,
            address: estateRow.address,
            developer: estateRow.developer,
            buildYear: estateRow.buildYear,
            propertyType: estateRow.propertyType,
          }
        }
      }

      // 10. 获取楼栋信息
      let buildingInfo: any = null
      if (input.buildingId) {
        const [buildingRow] = await db.select().from(buildings).where(eq(buildings.id, input.buildingId)).limit(1)
        if (buildingRow) buildingInfo = buildingRow
      }

      // 11. 获取房屋单元信息
      let unitInfo: any = null
      if (input.unitId) {
        const [unitRow] = await db.select().from(units).where(eq(units.id, input.unitId)).limit(1)
        if (unitRow) unitInfo = unitRow
      }

      return {
        id: (saved as any).insertId,
        // 估价核心结果
        finalValue: result.finalValue,
        unitPrice: result.unitPrice,
        valuationMin,
        valuationMax,
        confidenceLevel: result.confidenceLevel,
        confidenceScore: llmResult?.confidenceScore || (result.confidenceLevel === 'high' ? 90 : 75),
        valuationDate: result.valuationDate,
        // 三法结果
        comparativeResult: result.comparativeResult,
        incomeResult: result.incomeResult,
        costResult: result.costResult,
        weights: result.weights,
        // 调整系数
        adjustments: result.adjustments,
        // 市场数据
        marketData: result.marketData,
        // 参考案例
        comparableCases: dbComparables.slice(0, 6),
        comparableCount: dbComparables.length,
        // LLM 分析
        llmAnalysis: llmResult?.analysis || null,
        llmConfidenceScore: llmResult?.confidenceScore || null,
        llmRiskLevel: llmResult?.riskLevel || null,
        llmKeyFactors: llmResult?.keyFactors || [],
        // 方法说明
        method: methodUsed,
        methodology: result.methodology,
        assumptions: result.assumptions,
        limitations: result.limitations,
        // 格式化
        formattedValue: formatCurrency(result.finalValue),
        formattedMin: formatCurrency(valuationMin),
        formattedMax: formatCurrency(valuationMax),
        formattedUnitPrice: `${result.unitPrice.toLocaleString('zh-CN')}元/㎡`,
        // 新增：楼盘/楼栋/房屋信息
        estateInfo,
        buildingInfo,
        unitInfo,
        estateName: input.estateName || estateInfo?.name || null,
        buildingName: input.buildingName || buildingInfo?.name || null,
        unitNumber: input.unitNumber || unitInfo?.unitNumber || null,
        // 新增：价格趋势图数据
        monthlyTrend,
        scatterData,
        // 价格统计
        priceStats: monthlyTrend.length > 0 ? {
          latestAvgPrice: monthlyTrend[monthlyTrend.length - 1]?.avgPrice || 0,
          firstAvgPrice: monthlyTrend[0]?.avgPrice || 0,
          priceChange: monthlyTrend.length >= 2
            ? ((monthlyTrend[monthlyTrend.length - 1]?.avgPrice - monthlyTrend[0]?.avgPrice) / monthlyTrend[0]?.avgPrice * 100).toFixed(1)
            : '0',
          totalDataPoints: scatterData.length,
          monthCount: monthlyTrend.length,
        } : null,
      }
    }),

  // ============================================================
  // 获取历史估价记录
  // ============================================================
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const records = await db
        .select()
        .from(autoValuations)
        .where(eq(autoValuations.userId, ctx.user.id))
        .orderBy(desc(autoValuations.createdAt))
        .limit(input.limit)
        .offset(input.offset)

      return records.map(r => ({
        ...r,
        comparableCases: r.comparableCases ? JSON.parse(r.comparableCases as string) : [],
        reportData: null, // 列表不返回完整报告数据
      }))
    }),

  // ============================================================
  // 获取单条估价记录（用于查看报告）
  // ============================================================
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [record] = await db
        .select()
        .from(autoValuations)
        .where(eq(autoValuations.id, input.id))
        .limit(1)

      if (!record) throw new Error('估价记录不存在')

      return {
        ...record,
        comparableCases: record.comparableCases ? JSON.parse(record.comparableCases as string) : [],
        reportData: record.reportData ? JSON.parse(record.reportData as string) : null,
        llmAnalysis: record.llmAnalysis ? JSON.parse(record.llmAnalysis as string) : null,
      }
    }),

  // ============================================================
  // 获取城市列表（用于估价表单）
  // ============================================================
  getCities: protectedProcedure
    .query(async () => {
      return await db.select().from(cities).orderBy(cities.name)
    }),

  // ============================================================
  // 获取案例库统计（用于展示数据质量）
  // ============================================================
  getCaseStats: protectedProcedure
    .input(z.object({ cityId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = input.cityId ? [eq(cases.cityId, input.cityId)] : []
      
      const [stats] = await db
        .select({
          total: sql<number>`COUNT(*)`,
          residential: sql<number>`SUM(CASE WHEN property_type = '住宅' THEN 1 ELSE 0 END)`,
          commercial: sql<number>`SUM(CASE WHEN property_type = '商业' THEN 1 ELSE 0 END)`,
          office: sql<number>`SUM(CASE WHEN property_type = '办公' THEN 1 ELSE 0 END)`,
          avgPrice: sql<number>`AVG(unit_price)`,
          latestDate: sql<string>`MAX(transaction_date)`,
        })
        .from(cases)
        .where(and(...conditions, eq(cases.isAnomaly, false)))

      return stats
    }),
})

// ============================================================
// 游客公开估价接口（无需登录）
// ============================================================
export const guestValuationRouter = router({
  // 获取城市列表（公开）
  getCities: publicProcedure
    .query(async () => {
      return await db.select().from(cities).orderBy(cities.name)
    }),
  // 搜索楼盘（公开，按城市/区域/关键词）
  searchEstates: publicProcedure
    .input(z.object({
      cityId: z.number(),
      districtId: z.number().optional(),
      keyword: z.string().min(1).max(50),
    }))
    .query(async ({ input }) => {
      const kw = `%${input.keyword}%`
      // 判断是否为纯字母输入（拼音首字母缩写搜索）
      const isAlpha = /^[a-zA-Z]+$/.test(input.keyword)
      const kwUpper = input.keyword.toUpperCase()
      const searchCond = isAlpha
        ? or(like(estates.pinyin, `${kwUpper}%`), like(estates.name, kw))
        : or(like(estates.name, kw), like(estates.address, kw))
      const conditions: any[] = [
        eq(estates.cityId, input.cityId),
        eq(estates.isActive, true),
        searchCond,
      ]
      if (input.districtId) {
        conditions.push(eq(estates.districtId, input.districtId))
      }
      const rows = await db.select({
        id: estates.id,
        name: estates.name,
        pinyin: estates.pinyin,
        address: estates.address,
        districtId: estates.districtId,
        developer: estates.developer,
        buildYear: estates.buildYear,
        propertyType: estates.propertyType,
        totalUnits: estates.totalUnits,
      })
        .from(estates)
        .where(and(...conditions))
        .orderBy(estates.name)
        .limit(20)
      return rows
    }),
  // 获取楼盘详情（公开）
  getEstateDetail: publicProcedure
    .input(z.object({ estateId: z.number() }))
    .query(async ({ input }) => {
      const [row] = await db.select().from(estates).where(eq(estates.id, input.estateId)).limit(1)
      if (!row) return null
      // 获取该楼盘的近期成交均价
      const recentCases = await db.select({
        unitPrice: cases.unitPrice,
        area: cases.area,
        transactionDate: cases.transactionDate,
      })
        .from(cases)
        .where(and(eq(cases.estateId, input.estateId), eq(cases.isAnomaly, false)))
        .orderBy(desc(cases.transactionDate))
        .limit(10)
      const avgUnitPrice = recentCases.length > 0
        ? Math.round(recentCases.reduce((s, c) => s + Number(c.unitPrice || 0), 0) / recentCases.filter(c => Number(c.unitPrice) > 0).length)
        : null
      return {
        ...row,
        avgUnitPrice: avgUnitPrice || null,
        recentCaseCount: recentCases.length,
      }
    }),
  // 游客估价（公开，不保存记录）
  calculate: publicProcedure
    .input(z.object({
      propertyType: z.enum(['residential', 'commercial', 'office', 'industrial']).default('residential'),
      city: z.string(),
      cityId: z.number().optional(),
      district: z.string().default(''),
      districtId: z.number().optional(),
      estateId: z.number().optional(),
      estateName: z.string().optional(),
      address: z.string().default(''),
      buildingAge: z.number().min(0).max(100).default(10),
      totalFloors: z.number().min(1).max(200).default(18),
      floor: z.number().min(1).max(200).default(8),
      buildingArea: z.number().min(10).max(10000),
      orientation: z.enum(['south', 'north', 'east', 'west', 'south_north', 'other']).default('south'),
      decoration: z.enum(['rough', 'simple', 'medium', 'fine', 'luxury']).default('medium'),
      hasElevator: z.boolean().default(true),
      hasParking: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      // 1. 优先从楼盘关联的真实案例中检索
      let dbComparables: any[] = []
      let estateInfo: any = null

      if (input.estateId) {
        // 获取楼盘信息
        const [estateRow] = await db.select().from(estates).where(eq(estates.id, input.estateId)).limit(1)
        if (estateRow) {
          estateInfo = {
            id: estateRow.id,
            name: estateRow.name,
            address: estateRow.address,
            developer: estateRow.developer,
            buildYear: estateRow.buildYear,
            propertyType: estateRow.propertyType,
          }
          // 优先使用该楼盘的真实成交案例
          const estateCases = await db.select()
            .from(cases)
            .where(and(eq(cases.estateId, input.estateId), eq(cases.isAnomaly, false)))
            .orderBy(desc(cases.transactionDate))
            .limit(10)
          if (estateCases.length >= 2) {
            dbComparables = estateCases
          }
        }
      }

      // 2. 如果楼盘案例不足，从城市/区域案例库补充
      if (dbComparables.length < 3 && input.cityId) {
        const cityComparables = await findComparableCases({
          cityId: input.cityId,
          propertyType: input.propertyType === 'residential' ? '住宅' :
                        input.propertyType === 'commercial' ? '商业' :
                        input.propertyType === 'office' ? '办公' : '工业',
          area: input.buildingArea,
          floor: input.floor,
          totalFloors: input.totalFloors,
          limit: 6,
        })
        // 合并，去重
        const existingIds = new Set(dbComparables.map((c: any) => c.id))
        for (const c of cityComparables) {
          if (!existingIds.has(c.id)) dbComparables.push(c)
        }
      }

      // 3. 将数据库案例转换为比较法格式
      const comparables = dbComparables.map(c => ({
        address: c.address || estateInfo?.name || '同区域案例',
        transactionPrice: Number(c.unitPrice || c.unit_price || 0),
        transactionDate: c.transactionDate ? new Date(c.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        buildingArea: Number(c.area || 0),
        buildingAge: estateInfo?.buildYear ? new Date().getFullYear() - estateInfo.buildYear : 5,
        floor: c.floor || 1,
        totalFloors: c.totalFloors || input.totalFloors || 18,
        decoration: 'medium',
        hasElevator: (c.totalFloors || input.totalFloors || 18) > 6,
        hasParking: false,
      })).filter(c => c.transactionPrice > 0)

      // 4. 运行估价引擎
      const addressStr = estateInfo?.address || input.address || `${input.city}${input.district}某物业`
      const buildingAgeCalc = estateInfo?.buildYear
        ? Math.max(0, new Date().getFullYear() - estateInfo.buildYear)
        : input.buildingAge

      const engineInput: PropertyInput = {
        propertyType: input.propertyType,
        city: input.city,
        district: input.district,
        address: addressStr,
        buildingAge: buildingAgeCalc,
        totalFloors: input.totalFloors,
        floor: input.floor,
        buildingArea: input.buildingArea,
        orientation: input.orientation,
        decoration: input.decoration,
        hasElevator: input.hasElevator,
        hasParking: input.hasParking,
        purpose: 'mortgage',
        comparables: comparables.length >= 2 ? comparables : undefined,
      }
      const result = calculateValuation(engineInput)
      // 精确估价（不给区间，给精确数字）
      const finalValue = Math.round(result.finalValue)
      const unitPrice = Math.round(result.unitPrice)
      return {
        finalValue,
        unitPrice,
        formattedValue: formatCurrency(finalValue),
        formattedUnitPrice: `${unitPrice.toLocaleString('zh-CN')}元/㎡`,
        confidenceLevel: result.confidenceLevel,
        method: result.methodology || '市场比较法',
        comparableCount: dbComparables.length,
        valuationDate: new Date().toISOString().split('T')[0],
        estateInfo: estateInfo ? {
          id: estateInfo.id,
          name: estateInfo.name,
          address: estateInfo.address,
          developer: estateInfo.developer,
          buildYear: estateInfo.buildYear,
        } : null,
        estateName: input.estateName || estateInfo?.name || null,
      }
    }),
  // 获取区域列表（公开）
  getDistricts: publicProcedure
    .input(z.object({ cityId: z.number() }))
    .query(async ({ input }) => {
      return await db.select({ id: districts.id, name: districts.name, cityId: districts.cityId })
        .from(districts)
        .where(and(eq(districts.cityId, input.cityId), eq(districts.isActive, true)))
        .orderBy(districts.id)
    }),
  // 获取平台银行列表（公开）
  getBanks: publicProcedure
    .query(async () => {
      const { organizations } = await import('../lib/schema')
      return await db.select({
        id: organizations.id,
        name: organizations.name,
        address: organizations.address,
        rating: organizations.rating,
        description: organizations.description,
        logo: organizations.logo,
        contactPhone: organizations.contactPhone,
      }).from(organizations)
        .where(and(eq(organizations.type, 'bank'), eq(organizations.isActive, true)))
        .orderBy(desc(organizations.rating))
        .limit(10)
    }),
  // 获取平台评估机构列表（公开）
  getAppraisers: publicProcedure
    .query(async () => {
      const { organizations } = await import('../lib/schema')
      return await db.select({
        id: organizations.id,
        name: organizations.name,
        address: organizations.address,
        rating: organizations.rating,
        description: organizations.description,
        logo: organizations.logo,
        contactPhone: organizations.contactPhone,
      }).from(organizations)
        .where(and(eq(organizations.type, 'appraiser'), eq(organizations.isActive, true)))
        .orderBy(desc(organizations.rating))
        .limit(10)
    }),
})
