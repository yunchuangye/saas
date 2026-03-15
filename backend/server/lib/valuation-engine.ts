/**
 * 房地产智能估价引擎 v2.0
 * 依据《房地产估价规范》GB/T 50291-2015
 * 实现三大评估方法：市场比较法、收益法、成本法
 *
 * v2.0 优化：
 * - 引入面积段（AreaRange）精细化分类
 * - 市场比较法采用三级降级策略：
 *   Level 1：同楼盘 + 同面积段真实成交案例（最高精度）
 *   Level 2：同楼盘对应面积段统计均价（楼盘价格矩阵）
 *   Level 3：同楼盘整体均价 + 面积段非线性调整系数
 *   Fallback：城市/区域基准价格（兜底）
 * - 新增面积段非线性溢价/折价调整系数（基于217万套真实数据统计）
 * - 楼盘价格矩阵由外部服务注入，支持实时刷新
 */

// ============================================================
// 类型定义
// ============================================================

/**
 * 面积段枚举
 * 基于市场惯例与数据分布划分为 6 档
 */
export type AreaRange = 'S' | 'M1' | 'M2' | 'L1' | 'L2' | 'XL'

export const AREA_RANGE_LABELS: Record<AreaRange, string> = {
  S:  '50㎡以下（极小户型/单身公寓）',
  M1: '50-70㎡（刚需两房）',
  M2: '70-90㎡（标准三房）',
  L1: '90-120㎡（改善三/四房）',
  L2: '120-150㎡（舒适大平层）',
  XL: '150㎡以上（豪宅/别墅）',
}

/**
 * 获取面积段
 */
export function getAreaRange(area: number): AreaRange {
  if (area < 50)  return 'S'
  if (area < 70)  return 'M1'
  if (area < 90)  return 'M2'
  if (area < 120) return 'L1'
  if (area < 150) return 'L2'
  return 'XL'
}

/**
 * 楼盘价格矩阵（由外部服务注入，支持热更新）
 * key: estateId
 */
export interface EstatePriceMatrix {
  estateId: number
  estateName: string
  overallAvgPrice: number          // 楼盘整体均价（元/㎡）
  overallSampleCount: number       // 样本总量
  areaRangePrices: Partial<Record<AreaRange, {
    avgPrice: number               // 面积段均价（元/㎡）
    minPrice: number
    maxPrice: number
    sampleCount: number            // 样本量
    stdDev: number                 // 标准差
    lastUpdated: string            // 最近更新时间
  }>>
  updatedAt: string
}

// 全局楼盘价格矩阵缓存（由 estate-price-matrix-service 维护）
const _estatePriceMatrixCache = new Map<number, EstatePriceMatrix>()

/**
 * 注入/更新楼盘价格矩阵（供外部服务调用）
 */
export function injectEstatePriceMatrix(matrix: EstatePriceMatrix): void {
  _estatePriceMatrixCache.set(matrix.estateId, matrix)
}

/**
 * 批量注入楼盘价格矩阵
 */
export function injectEstatePriceMatrixBatch(matrices: EstatePriceMatrix[]): void {
  for (const m of matrices) {
    _estatePriceMatrixCache.set(m.estateId, m)
  }
}

/**
 * 获取楼盘价格矩阵
 */
export function getEstatePriceMatrix(estateId: number): EstatePriceMatrix | undefined {
  return _estatePriceMatrixCache.get(estateId)
}

/**
 * 清空楼盘价格矩阵缓存（用于测试或强制刷新）
 */
export function clearEstatePriceMatrixCache(): void {
  _estatePriceMatrixCache.clear()
}

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

  // 楼盘信息（v2.0 新增，用于三级降级策略）
  estateId?: number          // 楼盘 ID（有则优先使用楼盘价格矩阵）

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

  // 市场行情参考（v2.0 增强）
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
  cityAvgPrice: number            // 城市均价（元/㎡）
  districtAvgPrice: number        // 区域均价（元/㎡）
  estateAvgPrice?: number         // 楼盘整体均价（元/㎡，v2.0 新增）
  estateAreaRangeAvgPrice?: number // 楼盘面积段均价（元/㎡，v2.0 新增）
  areaRange?: string              // 面积段描述（v2.0 新增）
  comparativePriceSource?: string // 比较法基准价格来源（v2.0 新增）
  priceIndex: number              // 价格指数（相对城市均价）
  marketTrend: 'rising' | 'stable' | 'declining'
  trendRate: number               // 年涨跌幅（%）
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

const DEFAULT_CITY: {
  residential: number; commercial: number; office: number; industrial: number
  trend: number; districts: Record<string, number>
} = { residential: 12000, commercial: 18000, office: 15000, industrial: 5000, trend: 1.0, districts: { '其他': 1.0 } }

// ============================================================
// 调整系数表
// ============================================================

/**
 * 面积段非线性溢价/折价系数
 * 基于数据库 217 万套真实房源数据统计（相对于 L1 段 90-120㎡ 基准）
 *
 * 数据依据（units 表统计）：
 *   S  (<50㎡)   均价 ~11,746  → 相对 L1(11,265) 溢价 +4.3%
 *   M1 (50-70㎡) 均价 ~11,638  → 相对 L1 溢价 +3.3%
 *   M2 (70-90㎡) 均价 ~10,851  → 相对 L1 折价 -3.7%
 *   L1 (90-120㎡)均价 ~11,265  → 基准 1.00
 *   L2 (120-150㎡)均价~13,168  → 相对 L1 溢价 +16.9%
 *   XL (≥150㎡)  均价 ~18,000+ → 相对 L1 溢价 +60%+
 *
 * 注：此系数仅在无楼盘面积段均价时作为补充调整使用；
 *     若已有楼盘面积段均价，则不再叠加此系数（避免双重调整）。
 */
function getAreaRangeCoefficient(area: number): number {
  const range = getAreaRange(area)
  const coefficients: Record<AreaRange, number> = {
    S:  1.043,   // 极小户型：总价低、学区属性，单价溢价 4.3%
    M1: 1.033,   // 刚需两房：流动性强，单价溢价 3.3%
    M2: 0.963,   // 标准三房：供应量最大，单价微折价 3.7%
    L1: 1.000,   // 改善三/四房：基准
    L2: 1.169,   // 大平层：稀缺性溢价 16.9%
    XL: 1.600,   // 豪宅/别墅：顶豪溢价（≥150㎡ 均价约为基准 1.6 倍）
  }
  return coefficients[range]
}

// 楼层系数（住宅）
function getFloorCoefficient(
  floor: number, totalFloors: number,
  hasElevator: boolean, propertyType: string
): number {
  if (propertyType !== 'residential') return 1.0
  const ratio = floor / totalFloors
  if (!hasElevator) {
    if (floor === 1) return 0.95
    if (floor === 2) return 1.02
    if (floor === 3) return 1.05
    if (floor === 4) return 1.00
    if (floor === 5) return 0.92
    if (floor === 6) return 0.85
    return 0.80
  } else {
    if (ratio <= 0.15) return 0.92  // 底层
    if (ratio <= 0.30) return 0.97
    if (ratio <= 0.50) return 1.00
    if (ratio <= 0.70) return 1.05
    if (ratio <= 0.85) return 1.08
    if (ratio <= 0.95) return 1.06
    return 1.02  // 顶层
  }
}

// 朝向系数
function getOrientationCoefficient(orientation: string): number {
  const map: Record<string, number> = {
    'south_north': 1.05,
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
  const economicLife = propertyType === 'industrial' ? 30 : propertyType === 'commercial' ? 40 : 50
  const depreciationRate = buildingAge / economicLife
  return Math.max(0.20, 1 - depreciationRate * 0.85)
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
// 方法一：市场比较法（v2.0 三级降级策略）
// ============================================================

/**
 * 市场比较法
 *
 * 三级降级策略（住宅物业）：
 *   Level 1：传入 comparables（同楼盘/同面积段真实成交案例）→ 加权调整均价
 *   Level 2：楼盘价格矩阵命中对应面积段均价 → 直接作为基准 + 物理系数调整
 *   Level 3：楼盘价格矩阵命中整体均价 → 整体均价 × 面积段系数 + 物理系数调整
 *   Fallback：城市/区域基准价格 × 面积段系数 + 物理系数调整
 */
export function comparativeApproach(
  input: PropertyInput,
  cityData: typeof DEFAULT_CITY
): MethodResult {
  const districtCoef = getDistrictCoefficient(input.city, input.district)
  const cityBasePrice = (cityData as any)[input.propertyType] || cityData.residential
  const areaRange = getAreaRange(input.buildingArea)

  // ── Level 1：有可比案例（同楼盘/同面积段真实成交） ──────────────────
  if (input.comparables && input.comparables.length >= 2) {
    const adjustedPrices: number[] = []

    for (const comp of input.comparables) {
      let price = comp.transactionPrice

      // 时间调整
      price *= getTimeAdjustment(comp.transactionDate, cityData.trend)

      // 楼龄差异调整（每年 ±0.8%）
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
      method: '市场比较法（Level 1：真实成交案例）',
      value: Math.round(weightedPrice * input.buildingArea),
      unitPrice: Math.round(weightedPrice),
      details: {
        priceSource: 'Level 1 - 同楼盘/同面积段真实成交案例',
        comparableCount: input.comparables.length,
        areaRange: AREA_RANGE_LABELS[areaRange],
        avgComparablePrice: Math.round(adjustedPrices.reduce((a, b) => a + b, 0) / adjustedPrices.length),
        adjustedUnitPrice: Math.round(weightedPrice),
        timeAdjustmentApplied: '是',
        physicalAdjustmentApplied: '是',
      }
    }
  }

  // ── 物理调整系数（Level 2/3/Fallback 共用） ──────────────────────────
  const floorCoef       = getFloorCoefficient(input.floor, input.totalFloors, input.hasElevator, input.propertyType)
  const orientationCoef = getOrientationCoefficient(input.orientation)
  const decorationCoef  = getDecorationCoefficient(input.decoration)
  const ageCoef         = getAgeCoefficient(input.buildingAge, input.propertyType)
  const parkingCoef     = getParkingCoefficient(input.hasParking)
  const elevatorCoef    = getElevatorCoefficient(input.hasElevator, input.totalFloors)

  const physicalCoef = floorCoef * orientationCoef * decorationCoef * ageCoef * parkingCoef * elevatorCoef

  // ── Level 2：楼盘价格矩阵命中对应面积段均价 ──────────────────────────
  if (input.estateId) {
    const matrix = _estatePriceMatrixCache.get(input.estateId)
    if (matrix) {
      const areaRangeData = matrix.areaRangePrices[areaRange]

      if (areaRangeData && areaRangeData.sampleCount >= 3) {
        // 样本量充足，直接使用楼盘面积段均价作为基准
        // 此基准已内含面积段溢价，无需再叠加 getAreaRangeCoefficient
        const unitPrice = Math.round(areaRangeData.avgPrice * physicalCoef)

        return {
          method: '市场比较法（Level 2：楼盘面积段均价）',
          value: Math.round(unitPrice * input.buildingArea),
          unitPrice,
          details: {
            priceSource: `Level 2 - 楼盘「${matrix.estateName}」${AREA_RANGE_LABELS[areaRange]}均价`,
            estateId: input.estateId,
            estateName: matrix.estateName,
            areaRange: AREA_RANGE_LABELS[areaRange],
            areaRangeAvgPrice: areaRangeData.avgPrice,
            areaRangeSampleCount: areaRangeData.sampleCount,
            areaRangeStdDev: Math.round(areaRangeData.stdDev),
            physicalCoefficient: Math.round(physicalCoef * 1000) / 1000,
            adjustedUnitPrice: unitPrice,
          }
        }
      }

      // ── Level 3：楼盘整体均价 + 面积段非线性系数 ──────────────────────
      if (matrix.overallAvgPrice > 0 && matrix.overallSampleCount >= 5) {
        const areaCoef = getAreaRangeCoefficient(input.buildingArea)
        const unitPrice = Math.round(matrix.overallAvgPrice * areaCoef * physicalCoef)

        return {
          method: '市场比较法（Level 3：楼盘均价+面积段系数）',
          value: Math.round(unitPrice * input.buildingArea),
          unitPrice,
          details: {
            priceSource: `Level 3 - 楼盘「${matrix.estateName}」整体均价 × 面积段系数`,
            estateId: input.estateId,
            estateName: matrix.estateName,
            estateOverallAvgPrice: matrix.overallAvgPrice,
            estateOverallSampleCount: matrix.overallSampleCount,
            areaRange: AREA_RANGE_LABELS[areaRange],
            areaRangeCoefficient: areaCoef,
            physicalCoefficient: Math.round(physicalCoef * 1000) / 1000,
            adjustedUnitPrice: unitPrice,
          }
        }
      }
    }
  }

  // ── Fallback：城市/区域基准价格 + 面积段非线性系数 ───────────────────
  const areaCoef   = getAreaRangeCoefficient(input.buildingArea)
  const unitPrice  = Math.round(cityBasePrice * districtCoef * areaCoef * physicalCoef)

  return {
    method: '市场比较法（Fallback：城市区域基准）',
    value: Math.round(unitPrice * input.buildingArea),
    unitPrice,
    details: {
      priceSource: 'Fallback - 城市/区域基准价格',
      cityBasePrice,
      districtCoefficient: districtCoef,
      areaRange: AREA_RANGE_LABELS[areaRange],
      areaRangeCoefficient: areaCoef,
      floorCoefficient: floorCoef,
      orientationCoefficient: orientationCoef,
      decorationCoefficient: decorationCoef,
      ageCoefficient: ageCoef,
      physicalCoefficient: Math.round(physicalCoef * 1000) / 1000,
      adjustedUnitPrice: unitPrice,
    }
  }
}

// ============================================================
// 方法二：收益法（直接资本化法）
// ============================================================

export function incomeApproach(input: PropertyInput, cityData: typeof DEFAULT_CITY): MethodResult | null {
  if (!input.monthlyRent || input.monthlyRent <= 0) {
    const basePrice = (cityData as any)[input.propertyType] || cityData.residential
    const districtCoef = getDistrictCoefficient(input.city, input.district)
    const rentalYield = input.propertyType === 'residential' ? 0.018
      : input.propertyType === 'commercial' ? 0.05
      : input.propertyType === 'office' ? 0.04
      : 0.06
    // v2.0：若有楼盘面积段均价，以其作为租金估算基准（更准确）
    let rentBasePrice = basePrice * districtCoef
    if (input.estateId) {
      const matrix = _estatePriceMatrixCache.get(input.estateId)
      if (matrix) {
        const areaRange = getAreaRange(input.buildingArea)
        const areaRangeData = matrix.areaRangePrices[areaRange]
        if (areaRangeData && areaRangeData.sampleCount >= 3) {
          rentBasePrice = areaRangeData.avgPrice
        } else if (matrix.overallAvgPrice > 0) {
          rentBasePrice = matrix.overallAvgPrice * getAreaRangeCoefficient(input.buildingArea)
        }
      }
    }
    input.monthlyRent = Math.round(rentBasePrice * input.buildingArea * rentalYield / 12)
  }

  const vacancyRate = (input.vacancyRate || 5) / 100
  const opExpenseRate = (input.operatingExpenseRate || 20) / 100
  const grossAnnualIncome = input.monthlyRent * 12
  const effectiveGrossIncome = grossAnnualIncome * (1 - vacancyRate)
  const noi = effectiveGrossIncome * (1 - opExpenseRate)

  const riskPremium = input.propertyType === 'residential' ? 2.5
    : input.propertyType === 'commercial' ? 3.5
    : input.propertyType === 'office' ? 3.0
    : 4.0
  const capRate = (input.capRate || (2.5 + riskPremium)) / 100
  const value = noi / capRate

  return {
    method: '收益法（直接资本化法）',
    value: Math.round(value),
    unitPrice: Math.round(value / input.buildingArea),
    details: {
      monthlyRent: input.monthlyRent,
      grossAnnualIncome: Math.round(grossAnnualIncome),
      vacancyRate: `${(vacancyRate * 100).toFixed(1)}%`,
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

  // v2.0：地价基准优先使用楼盘面积段均价推算（更贴近实际地价）
  let landBasePrice = cityData.residential * districtCoef
  if (input.estateId) {
    const matrix = _estatePriceMatrixCache.get(input.estateId)
    if (matrix && matrix.overallAvgPrice > 0) {
      landBasePrice = matrix.overallAvgPrice
    }
  }

  const landUnitPrice = input.landPrice || (landBasePrice * 0.35)
  const landValue = landUnitPrice * input.buildingArea

  const baseCost: Record<string, number> = {
    residential: 3500, commercial: 4500, office: 4200, industrial: 2800, land: 0
  }
  const decorationCost: Record<string, number> = {
    rough: 0, simple: 500, medium: 1200, fine: 2500, luxury: 5000
  }
  const constructionCostPerSqm = input.constructionCost
    || (baseCost[input.propertyType] || 3500) + (decorationCost[input.decoration] || 1200)

  const constructionCost = constructionCostPerSqm * input.buildingArea
  const developmentCost = constructionCost * 0.08
  const interestCost = (constructionCost + developmentCost) * 0.0435 * 1.5
  const profitCost = constructionCost * 0.10
  const replacementCost = constructionCost + developmentCost + interestCost + profitCost

  const physicalDepreciation = replacementCost * (1 - getAgeCoefficient(input.buildingAge, input.propertyType))
  const functionalDepreciation = input.buildingAge > 20 ? replacementCost * 0.03 : 0
  const economicDepreciation = replacementCost * 0.01
  const buildingValue = replacementCost - physicalDepreciation - functionalDepreciation - economicDepreciation
  const totalValue = landValue + buildingValue

  return {
    method: '成本法（重置成本法）',
    value: Math.round(totalValue),
    unitPrice: Math.round(totalValue / input.buildingArea),
    details: {
      landUnitPrice: Math.round(landUnitPrice),
      landValue: Math.round(landValue),
      constructionCostPerSqm,
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

  // 获取楼盘价格矩阵信息（用于 marketData 展示）
  let estateAvgPrice: number | undefined
  let estateAreaRangeAvgPrice: number | undefined
  let comparativePriceSource: string = 'Fallback - 城市区域基准'
  const areaRange = getAreaRange(input.buildingArea)

  if (input.estateId) {
    const matrix = _estatePriceMatrixCache.get(input.estateId)
    if (matrix) {
      estateAvgPrice = matrix.overallAvgPrice
      const areaRangeData = matrix.areaRangePrices[areaRange]
      if (areaRangeData && areaRangeData.sampleCount >= 3) {
        estateAreaRangeAvgPrice = areaRangeData.avgPrice
        comparativePriceSource = `Level 2 - 楼盘「${matrix.estateName}」${AREA_RANGE_LABELS[areaRange]}均价`
      } else if (matrix.overallAvgPrice > 0) {
        comparativePriceSource = `Level 3 - 楼盘「${matrix.estateName}」整体均价 × 面积段系数`
      }
    }
  }
  if (input.comparables && input.comparables.length >= 2) {
    comparativePriceSource = 'Level 1 - 同楼盘/同面积段真实成交案例'
  }

  // 执行三种估价方法
  const comparativeResult = comparativeApproach(input, cityData)
  const incomeResult = incomeApproach(input, cityData)
  const costResult = costApproach(input, cityData)

  // 根据物业类型确定权重
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

  // v2.0：当比较法使用了高精度楼盘数据（Level 1/2），提升比较法权重
  if (
    input.propertyType === 'residential' &&
    (comparativePriceSource.startsWith('Level 1') || comparativePriceSource.startsWith('Level 2'))
  ) {
    weights = { comparative: 0.70, income: 0.20, cost: 0.10 }
  }

  // 加权平均
  const finalUnitPrice = Math.round(
    comparativeResult.unitPrice * weights.comparative +
    (incomeResult?.unitPrice || comparativeResult.unitPrice) * weights.income +
    costResult.unitPrice * weights.cost
  )
  const finalValue = Math.round(finalUnitPrice * input.buildingArea)

  // 置信度（三法结果差异越小，置信度越高；Level 1/2 额外加成）
  const prices = [comparativeResult.unitPrice, incomeResult?.unitPrice || 0, costResult.unitPrice].filter(p => p > 0)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
  const maxDeviation = Math.max(...prices.map(p => Math.abs(p - avgPrice) / avgPrice))
  let confidenceLevel: 'high' | 'medium' | 'low' = maxDeviation < 0.10 ? 'high' : maxDeviation < 0.20 ? 'medium' : 'low'

  // Level 1/2 数据质量高，降低置信度门槛
  if (
    comparativePriceSource.startsWith('Level 1') ||
    comparativePriceSource.startsWith('Level 2')
  ) {
    if (confidenceLevel === 'medium' && maxDeviation < 0.25) confidenceLevel = 'high'
    if (confidenceLevel === 'low' && maxDeviation < 0.35) confidenceLevel = 'medium'
  }

  // 调整系数明细（v2.0 新增面积段系数展示）
  const areaCoef = getAreaRangeCoefficient(input.buildingArea)
  const adjustments: AdjustmentDetail[] = [
    {
      factor: '区位系数',
      description: `${input.district}区域相对城市均价调整`,
      coefficient: districtCoef,
      impact: Math.round((districtCoef - 1) * cityAvgPrice * input.buildingArea)
    },
    {
      factor: '面积段系数',
      description: `${AREA_RANGE_LABELS[areaRange]}，相对标准三房（90-120㎡）的溢价/折价`,
      coefficient: areaCoef,
      impact: Math.round((areaCoef - 1) * (estateAreaRangeAvgPrice || estateAvgPrice || districtAvgPrice) * input.buildingArea)
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
    residential: '本次评估采用市场比较法为主要方法（v2.0 三级降级策略），收益法和成本法作为验证。住宅类物业优先使用同楼盘、同面积段的真实成交案例或楼盘价格矩阵作为基准，确保估价结果贴近真实市场。',
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
      estateAvgPrice,
      estateAreaRangeAvgPrice,
      areaRange: AREA_RANGE_LABELS[areaRange],
      comparativePriceSource,
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
      '宏观经济政策和房地产调控政策保持稳定',
      'v2.0：楼盘价格矩阵基于数据库历史成交及挂牌数据统计，每日自动更新'
    ],
    limitations: [
      '本估价结果仅供参考，不构成交易建议',
      '实际成交价格可能因市场波动、谈判因素等与估价结果存在差异',
      '如物业存在重大变化，本估价结果将失效',
      '楼盘价格矩阵样本量不足时（<3条），自动降级至城市/区域基准，精度相应降低'
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
