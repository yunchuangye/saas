/**
 * 房地产智能估价引擎
 * 依据《房地产估价规范》GB/T 50291-2015
 * 实现三大评估方法：市场比较法、收益法、成本法
 */

// ============================================================
// 类型定义
// ============================================================

export interface PropertyInput {
  // 基本信息
  propertyType: 'residential' | 'commercial' | 'office' | 'industrial' | 'land'
  city: string
  district: string
  address: string
  buildingAge: number        // 楼龄（年）
  totalFloors: number        // 总楼层
  floor: number              // 所在楼层
  buildingArea: number       // 建筑面积（㎡）
  landArea?: number          // 土地面积（㎡，商业/工业用）
  orientation: 'south' | 'north' | 'east' | 'west' | 'south_north' | 'other'
  decoration: 'rough' | 'simple' | 'medium' | 'fine' | 'luxury'
  hasElevator: boolean
  hasParking: boolean
  purpose: 'mortgage' | 'transaction' | 'tax' | 'insurance' | 'litigation'

  // 比较法参数
  comparables?: ComparableProperty[]

  // 收益法参数（商业/办公/出租住宅）
  monthlyRent?: number       // 月租金（元/月）
  vacancyRate?: number       // 空置率（%）
  operatingExpenseRate?: number  // 运营费用率（%）
  capRate?: number           // 资本化率（%）

  // 成本法参数
  landPrice?: number         // 地价（元/㎡）
  constructionCost?: number  // 建安费用（元/㎡）
}

export interface ComparableProperty {
  address: string
  transactionPrice: number   // 成交价（元/㎡）
  transactionDate: string    // 成交日期
  buildingArea: number
  buildingAge: number
  floor: number
  totalFloors: number
  decoration: string
  hasElevator: boolean
  hasParking: boolean
}

export interface ValuationResult {
  // 综合估价
  finalValue: number         // 最终评估价值（元）
  unitPrice: number          // 单价（元/㎡）
  confidenceLevel: 'high' | 'medium' | 'low'
  valuationDate: string

  // 三法结果
  comparativeResult?: MethodResult
  incomeResult?: MethodResult
  costResult?: MethodResult

  // 权重分配
  weights: {
    comparative: number
    income: number
    cost: number
  }

  // 调整系数明细
  adjustments: AdjustmentDetail[]

  // 市场行情参考
  marketData: MarketData

  // 估价说明
  methodology: string
  assumptions: string[]
  limitations: string[]
}

export interface MethodResult {
  method: string
  value: number
  unitPrice: number
  details: Record<string, number | string>
}

export interface AdjustmentDetail {
  factor: string
  description: string
  coefficient: number
  impact: number
}

export interface MarketData {
  cityAvgPrice: number       // 城市均价（元/㎡）
  districtAvgPrice: number   // 区域均价（元/㎡）
  priceIndex: number         // 价格指数（相对城市均价）
  marketTrend: 'rising' | 'stable' | 'declining'
  trendRate: number          // 年涨跌幅（%）
}

// ============================================================
// 城市基准价格数据库（基于2024-2025年市场数据）
// ============================================================

const CITY_BASE_PRICES: Record<string, {
  residential: number   // 住宅均价（元/㎡）
  commercial: number    // 商业均价（元/㎡）
  office: number        // 办公均价（元/㎡）
  industrial: number    // 工业均价（元/㎡）
  trend: number         // 年涨幅（%）
  districts: Record<string, number>  // 区域系数
}> = {
  '北京': {
    residential: 68000, commercial: 85000, office: 75000, industrial: 18000,
    trend: 2.5,
    districts: { '朝阳': 1.15, '海淀': 1.25, '西城': 1.30, '东城': 1.28, '丰台': 0.95, '通州': 0.80, '昌平': 0.78, '大兴': 0.82, '顺义': 0.85, '其他': 0.75 }
  },
  '上海': {
    residential: 65000, commercial: 80000, office: 72000, industrial: 16000,
    trend: 2.0,
    districts: { '浦东': 1.10, '黄浦': 1.35, '静安': 1.30, '徐汇': 1.20, '长宁': 1.15, '虹口': 1.05, '杨浦': 1.00, '闵行': 0.90, '宝山': 0.85, '松江': 0.80, '其他': 0.75 }
  },
  '深圳': {
    residential: 72000, commercial: 90000, office: 80000, industrial: 20000,
    trend: 1.5,
    districts: { '南山': 1.30, '福田': 1.25, '罗湖': 1.10, '宝安': 0.95, '龙华': 0.90, '龙岗': 0.85, '盐田': 1.00, '光明': 0.80, '其他': 0.78 }
  },
  '广州': {
    residential: 38000, commercial: 50000, office: 45000, industrial: 12000,
    trend: 1.8,
    districts: { '天河': 1.30, '越秀': 1.25, '海珠': 1.15, '荔湾': 1.10, '白云': 0.90, '番禺': 0.85, '黄埔': 0.95, '花都': 0.75, '其他': 0.72 }
  },
  '杭州': {
    residential: 32000, commercial: 42000, office: 38000, industrial: 10000,
    trend: 3.0,
    districts: { '西湖': 1.30, '上城': 1.20, '拱墅': 1.10, '滨江': 1.25, '余杭': 0.90, '萧山': 0.88, '临安': 0.75, '其他': 0.78 }
  },
  '成都': {
    residential: 22000, commercial: 30000, office: 26000, industrial: 8000,
    trend: 2.2,
    districts: { '锦江': 1.20, '青羊': 1.15, '金牛': 1.05, '武侯': 1.18, '成华': 1.00, '高新': 1.25, '天府新区': 1.10, '双流': 0.85, '其他': 0.80 }
  },
  '武汉': {
    residential: 18000, commercial: 25000, office: 22000, industrial: 7000,
    trend: 1.5,
    districts: { '江汉': 1.20, '武昌': 1.15, '洪山': 1.10, '江岸': 1.12, '硚口': 1.00, '青山': 0.90, '东湖高新': 1.18, '其他': 0.82 }
  },
  '南京': {
    residential: 28000, commercial: 36000, office: 32000, industrial: 9000,
    trend: 2.0,
    districts: { '鼓楼': 1.25, '玄武': 1.20, '秦淮': 1.15, '建邺': 1.18, '栖霞': 0.95, '雨花台': 1.05, '江宁': 0.90, '其他': 0.82 }
  },
  '重庆': {
    residential: 15000, commercial: 20000, office: 18000, industrial: 6000,
    trend: 1.8,
    districts: { '渝中': 1.25, '江北': 1.15, '南岸': 1.10, '渝北': 1.05, '九龙坡': 1.00, '沙坪坝': 1.05, '巴南': 0.85, '其他': 0.80 }
  },
  '西安': {
    residential: 16000, commercial: 22000, office: 19000, industrial: 6500,
    trend: 2.5,
    districts: { '碑林': 1.20, '雁塔': 1.25, '未央': 1.10, '莲湖': 1.15, '灞桥': 0.90, '高新区': 1.28, '经开区': 1.05, '其他': 0.82 }
  }
}

const DEFAULT_CITY: { residential: number; commercial: number; office: number; industrial: number; trend: number; districts: Record<string, number> } = { residential: 12000, commercial: 18000, office: 15000, industrial: 5000, trend: 1.0, districts: { '其他': 1.0 } }

// ============================================================
// 调整系数表
// ============================================================

// 楼层系数（住宅）
function getFloorCoefficient(floor: number, totalFloors: number, hasElevator: boolean, propertyType: string): number {
  if (propertyType !== 'residential') return 1.0
  const ratio = floor / totalFloors
  if (!hasElevator) {
    // 无电梯：1-2层最优，高层折价
    if (floor === 1) return 0.95
    if (floor === 2) return 1.02
    if (floor === 3) return 1.05
    if (floor === 4) return 1.00
    if (floor === 5) return 0.92
    if (floor === 6) return 0.85
    return 0.80
  } else {
    // 有电梯：中高层溢价
    if (ratio <= 0.15) return 0.92  // 底层
    if (ratio <= 0.30) return 0.97
    if (ratio <= 0.50) return 1.00
    if (ratio <= 0.70) return 1.05
    if (ratio <= 0.85) return 1.08
    if (ratio <= 0.95) return 1.06
    return 1.02  // 顶层（采光好但隔热差）
  }
}

// 朝向系数
function getOrientationCoefficient(orientation: string): number {
  const map: Record<string, number> = {
    'south_north': 1.05,  // 南北通透
    'south': 1.03,
    'east': 0.98,
    'west': 0.96,
    'north': 0.92,
    'other': 0.95
  }
  return map[orientation] || 1.0
}

// 装修系数
function getDecorationCoefficient(decoration: string): number {
  const map: Record<string, number> = {
    'rough': 0.88,
    'simple': 0.93,
    'medium': 1.00,
    'fine': 1.08,
    'luxury': 1.18
  }
  return map[decoration] || 1.0
}

// 楼龄折旧系数（基于成新率）
function getAgeCoefficient(buildingAge: number, propertyType: string): number {
  // 房屋经济寿命：住宅50年，商业40年，工业30年
  const economicLife = propertyType === 'industrial' ? 30 : propertyType === 'commercial' ? 40 : 50
  const depreciationRate = buildingAge / economicLife
  // 成新率 = 1 - 折旧率（采用直线折旧法，最低成新率20%）
  const intactRate = Math.max(0.20, 1 - depreciationRate * 0.85)
  return intactRate
}

// 停车位系数
function getParkingCoefficient(hasParking: boolean): number {
  return hasParking ? 1.02 : 0.98
}

// 电梯系数（非楼层因素）
function getElevatorCoefficient(hasElevator: boolean, totalFloors: number): number {
  if (totalFloors <= 6) return 1.0
  return hasElevator ? 1.03 : 0.90
}

// 时间调整系数（将历史成交价调整到当前）
function getTimeAdjustment(transactionDate: string, trendRate: number): number {
  const txDate = new Date(transactionDate)
  const now = new Date()
  const yearsDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  return Math.pow(1 + trendRate / 100, yearsDiff)
}

// ============================================================
// 方法一：市场比较法
// ============================================================

export function comparativeApproach(input: PropertyInput, cityData: typeof DEFAULT_CITY): MethodResult {
  const districtCoef = getDistrictCoefficient(input.city, input.district)
  const basePrice = (cityData as any)[input.propertyType] || cityData.residential

  // 如果有可比案例，使用真实案例
  if (input.comparables && input.comparables.length >= 2) {
    const adjustedPrices: number[] = []

    for (const comp of input.comparables) {
      let price = comp.transactionPrice

      // 时间调整
      price *= getTimeAdjustment(comp.transactionDate, cityData.trend)

      // 楼龄差异调整（每年±0.8%）
      const ageDiff = comp.buildingAge - input.buildingAge
      price *= (1 + ageDiff * 0.008)

      // 楼层调整
      const subjectFloorCoef = getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType)
      const compFloorCoef = getFloorCoefficient(comp.floor, comp.totalFloors, comp.hasElevator, input.propertyType)
      price *= subjectFloorCoef / compFloorCoef

      // 装修调整
      const subjectDecCoef = getDecorationCoefficient(input.decoration)
      const compDecCoef = getDecorationCoefficient(comp.decoration)
      price *= subjectDecCoef / compDecCoef

      // 停车位调整
      if (input.hasParking !== comp.hasParking) {
        price *= input.hasParking ? 1.02 : 0.98
      }

      adjustedPrices.push(price)
    }

    // 加权平均（最近成交权重更高）
    const weights = adjustedPrices.map((_, i) => 1 / (i + 1))
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    const weightedPrice = adjustedPrices.reduce((sum, p, i) => sum + p * weights[i] / totalWeight, 0)

    return {
      method: '市场比较法',
      value: Math.round(weightedPrice * input.buildingArea),
      unitPrice: Math.round(weightedPrice),
      details: {
        comparableCount: input.comparables.length,
        avgComparablePrice: Math.round(adjustedPrices.reduce((a, b) => a + b, 0) / adjustedPrices.length),
        adjustedUnitPrice: Math.round(weightedPrice),
        timeAdjustmentApplied: '是',
        physicalAdjustmentApplied: '是'
      }
    }
  }

  // 无可比案例时，使用城市基准价格模型
  let unitPrice = basePrice * districtCoef

  // 应用各项调整系数
  unitPrice *= getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType)
  unitPrice *= getOrientationCoefficient(input.orientation)
  unitPrice *= getDecorationCoefficient(input.decoration)
  unitPrice *= getAgeCoefficient(input.buildingAge, input.propertyType)
  unitPrice *= getParkingCoefficient(input.hasParking)
  unitPrice *= getElevatorCoefficient(input.hasElevator, input.totalFloors)

  return {
    method: '市场比较法',
    value: Math.round(unitPrice * input.buildingArea),
    unitPrice: Math.round(unitPrice),
    details: {
      cityBasePrice: basePrice,
      districtCoefficient: districtCoef,
      floorCoefficient: getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType),
      orientationCoefficient: getOrientationCoefficient(input.orientation),
      decorationCoefficient: getDecorationCoefficient(input.decoration),
      ageCoefficient: getAgeCoefficient(input.buildingAge, input.propertyType),
      adjustedUnitPrice: Math.round(unitPrice)
    }
  }
}

// ============================================================
// 方法二：收益法（直接资本化法）
// ============================================================

export function incomeApproach(input: PropertyInput, cityData: typeof DEFAULT_CITY): MethodResult | null {
  // 收益法适用于商业、办公、工业及出租型住宅
  if (!input.monthlyRent || input.monthlyRent <= 0) {
    // 根据市场数据估算租金
    const basePrice = (cityData as any)[input.propertyType] || cityData.residential
    const districtCoef = getDistrictCoefficient(input.city, input.district)
    // 租售比：住宅约1.5-2%，商业约4-6%，办公约3-5%
    const rentalYield = input.propertyType === 'residential' ? 0.018
      : input.propertyType === 'commercial' ? 0.05
      : input.propertyType === 'office' ? 0.04
      : 0.06
    input.monthlyRent = Math.round(basePrice * districtCoef * input.buildingArea * rentalYield / 12)
  }

  const vacancyRate = (input.vacancyRate || 5) / 100
  const opExpenseRate = (input.operatingExpenseRate || 20) / 100

  // 年毛收入
  const grossAnnualIncome = input.monthlyRent * 12

  // 有效毛收入（扣除空置损失）
  const effectiveGrossIncome = grossAnnualIncome * (1 - vacancyRate)

  // 净营业收入（NOI）
  const noi = effectiveGrossIncome * (1 - opExpenseRate)

  // 资本化率（综合还原利率）
  // 基准：10年期国债收益率约2.5% + 风险溢价
  const riskPremium = input.propertyType === 'residential' ? 2.5
    : input.propertyType === 'commercial' ? 3.5
    : input.propertyType === 'office' ? 3.0
    : 4.0
  const capRate = (input.capRate || (2.5 + riskPremium)) / 100

  // 直接资本化：V = NOI / R
  const value = noi / capRate

  return {
    method: '收益法（直接资本化法）',
    value: Math.round(value),
    unitPrice: Math.round(value / input.buildingArea),
    details: {
      monthlyRent: input.monthlyRent,
      grossAnnualIncome: Math.round(grossAnnualIncome),
      vacancyRate: `${((vacancyRate) * 100).toFixed(1)}%`,
      effectiveGrossIncome: Math.round(effectiveGrossIncome),
      operatingExpenseRate: `${(opExpenseRate * 100).toFixed(1)}%`,
      netOperatingIncome: Math.round(noi),
      capitalizationRate: `${(capRate * 100).toFixed(2)}%`,
      estimatedValue: Math.round(value)
    }
  }
}

// ============================================================
// 方法三：成本法（重置成本法）
// ============================================================

export function costApproach(input: PropertyInput, cityData: typeof DEFAULT_CITY): MethodResult {
  const districtCoef = getDistrictCoefficient(input.city, input.district)

  // 土地价格（元/㎡建筑面积）
  const landUnitPrice = input.landPrice || (cityData.residential * districtCoef * 0.35)
  const landValue = landUnitPrice * input.buildingArea

  // 建安费用（元/㎡）- 按物业类型和装修标准
  const baseCost: Record<string, number> = {
    residential: 3500, commercial: 4500, office: 4200, industrial: 2800, land: 0
  }
  const decorationCost: Record<string, number> = {
    rough: 0, simple: 500, medium: 1200, fine: 2500, luxury: 5000
  }
  const constructionCostPerSqm = input.constructionCost
    || (baseCost[input.propertyType] || 3500) + (decorationCost[input.decoration] || 1200)

  // 建安费用总额
  const constructionCost = constructionCostPerSqm * input.buildingArea

  // 开发费用（勘察设计、管理费等，约建安费的8%）
  const developmentCost = constructionCost * 0.08

  // 投资利息（建设期平均2年，贷款利率4.35%）
  const interestCost = (constructionCost + developmentCost) * 0.0435 * 1.5

  // 开发利润（约建安费的10%）
  const profitCost = constructionCost * 0.10

  // 重置成本（全新状态）
  const replacementCost = constructionCost + developmentCost + interestCost + profitCost

  // 折旧（物质折旧 + 功能折旧 + 经济折旧）
  const physicalDepreciation = replacementCost * (1 - getAgeCoefficient(input.buildingAge, input.propertyType))
  const functionalDepreciation = input.buildingAge > 20 ? replacementCost * 0.03 : 0  // 功能过时折旧
  const economicDepreciation = replacementCost * 0.01  // 外部经济折旧

  // 建筑物现值
  const buildingValue = replacementCost - physicalDepreciation - functionalDepreciation - economicDepreciation

  // 房地产总价值 = 土地价值 + 建筑物现值
  const totalValue = landValue + buildingValue

  return {
    method: '成本法（重置成本法）',
    value: Math.round(totalValue),
    unitPrice: Math.round(totalValue / input.buildingArea),
    details: {
      landUnitPrice: Math.round(landUnitPrice),
      landValue: Math.round(landValue),
      constructionCostPerSqm: constructionCostPerSqm,
      constructionCost: Math.round(constructionCost),
      developmentCost: Math.round(developmentCost),
      replacementCost: Math.round(replacementCost),
      physicalDepreciation: Math.round(physicalDepreciation),
      intactRate: `${(getAgeCoefficient(input.buildingAge, input.propertyType) * 100).toFixed(1)}%`,
      buildingValue: Math.round(buildingValue),
      totalValue: Math.round(totalValue)
    }
  }
}

// ============================================================
// 综合估价（加权平均）
// ============================================================

export function calculateValuation(input: PropertyInput): ValuationResult {
  const cityData = CITY_BASE_PRICES[input.city] || DEFAULT_CITY
  const districtCoef = getDistrictCoefficient(input.city, input.district)
  const cityAvgPrice = (cityData as any)[input.propertyType] || cityData.residential
  const districtAvgPrice = Math.round(cityAvgPrice * districtCoef)

  // 执行三种估价方法
  const comparativeResult = comparativeApproach(input, cityData)
  const incomeResult = incomeApproach(input, cityData)
  const costResult = costApproach(input, cityData)

  // 根据物业类型确定权重
  // 住宅：比较法为主；商业/办公：收益法为主；工业：成本法为主
  let weights = { comparative: 0.6, income: 0.25, cost: 0.15 }
  if (input.propertyType === 'commercial') {
    weights = { comparative: 0.30, income: 0.50, cost: 0.20 }
  } else if (input.propertyType === 'office') {
    weights = { comparative: 0.35, income: 0.45, cost: 0.20 }
  } else if (input.propertyType === 'industrial') {
    weights = { comparative: 0.25, income: 0.25, cost: 0.50 }
  } else if (input.propertyType === 'land') {
    weights = { comparative: 0.40, income: 0.30, cost: 0.30 }
  }

  // 加权平均
  const finalUnitPrice = Math.round(
    comparativeResult.unitPrice * weights.comparative +
    (incomeResult?.unitPrice || comparativeResult.unitPrice) * weights.income +
    costResult.unitPrice * weights.cost
  )
  const finalValue = Math.round(finalUnitPrice * input.buildingArea)

  // 置信度（三法结果差异越小，置信度越高）
  const prices = [comparativeResult.unitPrice, incomeResult?.unitPrice || 0, costResult.unitPrice].filter(p => p > 0)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const maxDeviation = Math.max(...prices.map(p => Math.abs(p - avgPrice) / avgPrice))
  const confidenceLevel: 'high' | 'medium' | 'low' = maxDeviation < 0.10 ? 'high' : maxDeviation < 0.20 ? 'medium' : 'low'

  // 调整系数明细
  const adjustments: AdjustmentDetail[] = [
    {
      factor: '区位系数',
      description: `${input.district}区域相对城市均价调整`,
      coefficient: districtCoef,
      impact: Math.round((districtCoef - 1) * cityAvgPrice * input.buildingArea)
    },
    {
      factor: '楼层系数',
      description: `${input.floor}/${input.totalFloors}层楼层位置调整`,
      coefficient: getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType),
      impact: Math.round((getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType) - 1) * districtAvgPrice * input.buildingArea)
    },
    {
      factor: '朝向系数',
      description: `${input.orientation}朝向调整`,
      coefficient: getOrientationCoefficient(input.orientation),
      impact: Math.round((getOrientationCoefficient(input.orientation) - 1) * districtAvgPrice * input.buildingArea)
    },
    {
      factor: '装修系数',
      description: `${input.decoration}装修标准调整`,
      coefficient: getDecorationCoefficient(input.decoration),
      impact: Math.round((getDecorationCoefficient(input.decoration) - 1) * districtAvgPrice * input.buildingArea)
    },
    {
      factor: '楼龄折旧',
      description: `楼龄${input.buildingAge}年，成新率${(getAgeCoefficient(input.buildingAge, input.propertyType) * 100).toFixed(1)}%`,
      coefficient: getAgeCoefficient(input.buildingAge, input.propertyType),
      impact: Math.round((getAgeCoefficient(input.buildingAge, input.propertyType) - 1) * districtAvgPrice * input.buildingArea)
    }
  ]

  // 估价说明
  const methodDescriptions: Record<string, string> = {
    residential: '本次评估采用市场比较法为主要方法，收益法和成本法作为验证方法。住宅类物业市场交易活跃，可比案例充分，比较法结果可靠性高。',
    commercial: '本次评估采用收益法为主要方法，市场比较法和成本法作为验证。商业物业价值主要体现在其盈利能力，收益法更能反映物业的内在价值。',
    office: '本次评估采用收益法为主要方法，市场比较法和成本法作为验证。办公物业价值与租金收益密切相关，收益法结果更具参考价值。',
    industrial: '本次评估采用成本法为主要方法，市场比较法和收益法作为验证。工业物业特殊性较强，成本法能更准确反映其重置价值。',
    land: '本次评估综合运用市场比较法、收益法和成本法，结合基准地价修正法，对土地使用权价值进行综合评估。'
  }

  return {
    finalValue,
    unitPrice: finalUnitPrice,
    confidenceLevel,
    valuationDate: new Date().toISOString().split('T')[0],
    comparativeResult,
    incomeResult: incomeResult || undefined,
    costResult,
    weights,
    adjustments,
    marketData: {
      cityAvgPrice,
      districtAvgPrice,
      priceIndex: Math.round(districtCoef * 100) / 100,
      marketTrend: cityData.trend > 2 ? 'rising' : cityData.trend > 0 ? 'stable' : 'declining',
      trendRate: cityData.trend
    },
    methodology: methodDescriptions[input.propertyType] || methodDescriptions.residential,
    assumptions: [
      '估价时点为报告出具日，市场条件以当日为准',
      '物业不存在重大质量缺陷或法律纠纷',
      '土地使用权在剩余年限内可正常使用',
      '周边基础设施和配套设施保持现状',
      '宏观经济政策和房地产调控政策保持稳定'
    ],
    limitations: [
      '本估价结果仅供参考，不构成交易建议',
      '实际成交价格可能因市场波动、谈判因素等与估价结果存在差异',
      '如物业存在重大变化，本估价结果将失效'
    ]
  }
}

// ============================================================
// 辅助函数
// ============================================================

function getDistrictCoefficient(city: string, district: string): number {
  const cityData = CITY_BASE_PRICES[city]
  if (!cityData) return 1.0
  return cityData.districts[district] || cityData.districts['其他'] || 1.0
}

export function formatCurrency(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿元`
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万元`
  return `${value}元`
}
