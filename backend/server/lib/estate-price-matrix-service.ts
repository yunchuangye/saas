/**
 * 楼盘价格矩阵缓存服务 v1.0
 *
 * 功能：
 * 1. 从数据库 units 表按楼盘 + 面积段统计均价、标准差、样本量
 * 2. 构建 EstatePriceMatrix 并注入 valuation-engine 的缓存
 * 3. 支持按需刷新（单楼盘）和全量刷新
 * 4. 提供查询接口供 tRPC 路由调用
 *
 * 数据来源：
 *   - units 表（楼盘挂牌/备案价格，字段 listed_price / total_price）
 *   - cases 表（真实成交案例，字段 unit_price）
 *   - 两者均有则以 cases 成交价优先，units 作为补充
 */

import { db } from './db'
import { units, buildings, estates, cases } from './schema'
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm'
import {
  type EstatePriceMatrix,
  type AreaRange,
  getAreaRange,
  injectEstatePriceMatrix,
  injectEstatePriceMatrixBatch,
  clearEstatePriceMatrixCache,
} from './valuation-engine'

// ============================================================
// 面积段边界常量
// ============================================================

const AREA_RANGE_BOUNDS: Record<AreaRange, [number, number]> = {
  S:  [0,   50],
  M1: [50,  70],
  M2: [70,  90],
  L1: [90,  120],
  L2: [120, 150],
  XL: [150, 9999],
}

// ============================================================
// 统计辅助：计算标准差
// ============================================================

function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

// ============================================================
// 核心：从数据库构建单楼盘价格矩阵
// ============================================================

export async function buildEstatePriceMatrix(estateId: number): Promise<EstatePriceMatrix | null> {
  // 1. 获取楼盘基本信息
  const estateRows = await db
    .select({ id: estates.id, name: estates.name })
    .from(estates)
    .where(eq(estates.id, estateId))
    .limit(1)

  if (!estateRows.length) return null
  const estate = estateRows[0]

  // 2. 从 cases 表获取该楼盘的真实成交案例（优先）
  //    cases 表通过 estate_id 关联
  const caseRows = await db
    .select({
      unitPrice: cases.unitPrice,
      buildingArea: cases.area,
    })
    .from(cases)
    .where(
      and(
        eq(cases.estateId, estateId),
        gte(cases.unitPrice, '1000'),    // 过滤明显异常値
        lte(cases.unitPrice, '500000'),
        gte(cases.area, '10'),
        lte(cases.area, '2000'),
      )
    )

  // 3. 从 units 表获取该楼盘的挂牌/备案价格（补充）
  //    units 通过 buildings.estate_id 关联
  const unitRows = await db
    .select({
      listedPrice: units.unitPrice,
      totalPrice: units.totalPrice,
      buildingArea: units.buildArea,
    })
    .from(units)
    .innerJoin(buildings, eq(units.buildingId, buildings.id))
    .where(
      and(
        eq(buildings.estateId, estateId),
        gte(units.buildArea, '10'),
        lte(units.buildArea, '2000'),
      )
    )

  // 4. 合并数据点（单价 + 面积）
  interface DataPoint { unitPrice: number; area: number; source: 'case' | 'unit' }
  const dataPoints: DataPoint[] = []

  for (const row of caseRows) {
    if (row.unitPrice && row.buildingArea) {
      dataPoints.push({ unitPrice: Number(row.unitPrice), area: Number(row.buildingArea), source: 'case' })
    }
  }

  for (const row of unitRows) {
    if (!row.buildingArea) continue
    // 优先用 unit_price（备案单价），否则用 total_price / 面积
    let unitPrice: number | null = null
    if (row.listedPrice && Number(row.listedPrice) > 0) {
      unitPrice = Number(row.listedPrice)
    } else if (row.totalPrice && Number(row.totalPrice) > 0 && Number(row.buildingArea) > 0) {
      unitPrice = Math.round(Number(row.totalPrice) / Number(row.buildingArea))
    }
    if (unitPrice && unitPrice >= 1000 && unitPrice <= 500000) {
      dataPoints.push({ unitPrice, area: Number(row.buildingArea), source: 'unit' })
    }
  }

  if (!dataPoints.length) return null

  // 5. 按面积段分组统计
  const areaRanges: AreaRange[] = ['S', 'M1', 'M2', 'L1', 'L2', 'XL']
  const areaRangePrices: EstatePriceMatrix['areaRangePrices'] = {}

  for (const range of areaRanges) {
    const [minArea, maxArea] = AREA_RANGE_BOUNDS[range]
    const rangePoints = dataPoints.filter(
      p => p.area >= minArea && p.area < maxArea
    )

    if (rangePoints.length === 0) continue

    // 去除极端值（IQR 方法，剔除 P5 以下和 P95 以上）
    const prices = rangePoints.map(p => p.unitPrice).sort((a, b) => a - b)
    const p5Idx  = Math.floor(prices.length * 0.05)
    const p95Idx = Math.ceil(prices.length * 0.95) - 1
    const filteredPrices = prices.slice(p5Idx, p95Idx + 1)

    if (!filteredPrices.length) continue

    const avgPrice = Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length)
    const minPrice = filteredPrices[0]
    const maxPrice = filteredPrices[filteredPrices.length - 1]
    const stdDev   = Math.round(calcStdDev(filteredPrices))

    areaRangePrices[range] = {
      avgPrice,
      minPrice,
      maxPrice,
      sampleCount: filteredPrices.length,
      stdDev,
      lastUpdated: new Date().toISOString(),
    }
  }

  // 6. 计算楼盘整体均价（所有面积段合并，同样去极端值）
  const allPrices = dataPoints.map(p => p.unitPrice).sort((a, b) => a - b)
  const p5Idx  = Math.floor(allPrices.length * 0.05)
  const p95Idx = Math.ceil(allPrices.length * 0.95) - 1
  const filteredAll = allPrices.slice(p5Idx, p95Idx + 1)
  const overallAvgPrice = filteredAll.length
    ? Math.round(filteredAll.reduce((a, b) => a + b, 0) / filteredAll.length)
    : 0

  const matrix: EstatePriceMatrix = {
    estateId,
    estateName: estate.name || `楼盘${estateId}`,
    overallAvgPrice,
    overallSampleCount: filteredAll.length,
    areaRangePrices,
    updatedAt: new Date().toISOString(),
  }

  return matrix
}

// ============================================================
// 按需刷新：单楼盘
// ============================================================

export async function refreshEstatePriceMatrix(estateId: number): Promise<EstatePriceMatrix | null> {
  const matrix = await buildEstatePriceMatrix(estateId)
  if (matrix) {
    injectEstatePriceMatrix(matrix)
  }
  return matrix
}

// ============================================================
// 全量刷新：所有有数据的楼盘
// ============================================================

export async function refreshAllEstatePriceMatrices(options?: {
  cityId?: number
  limit?: number
  onProgress?: (done: number, total: number) => void
}): Promise<{ refreshed: number; skipped: number; errors: number }> {
  // 查询有 units 或 cases 数据的楼盘 ID
  const estateIdsWithUnits = await db
    .selectDistinct({ estateId: buildings.estateId })
    .from(buildings)
    .innerJoin(units, eq(units.buildingId, buildings.id))
    .limit(options?.limit || 10000)

  const estateIdsWithCases = await db
    .selectDistinct({ estateId: cases.estateId })
    .from(cases)
    .where(gte(cases.unitPrice, '1000'))

  const allEstateIds = new Set<number>([
    ...estateIdsWithUnits.map(r => r.estateId).filter((id): id is number => id !== null),
    ...estateIdsWithCases.map(r => r.estateId).filter((id): id is number => id !== null),
  ])

  clearEstatePriceMatrixCache()

  let refreshed = 0
  let skipped = 0
  let errors = 0
  const total = allEstateIds.size
  const estateIdArr = Array.from(allEstateIds)

  // 批量处理（每批 50 个，避免数据库连接过载）
  const BATCH_SIZE = 50
  for (let i = 0; i < estateIdArr.length; i += BATCH_SIZE) {
    const batch = estateIdArr.slice(i, i + BATCH_SIZE)
    const matrices: EstatePriceMatrix[] = []

    await Promise.all(
      batch.map(async (estateId) => {
        try {
          const matrix = await buildEstatePriceMatrix(estateId)
          if (matrix) {
            matrices.push(matrix)
            refreshed++
          } else {
            skipped++
          }
        } catch {
          errors++
        }
      })
    )

    if (matrices.length) {
      injectEstatePriceMatrixBatch(matrices)
    }

    options?.onProgress?.(Math.min(i + BATCH_SIZE, total), total)
  }

  return { refreshed, skipped, errors }
}

// ============================================================
// 查询接口：获取楼盘价格矩阵（先查缓存，未命中则实时构建）
// ============================================================

export async function getOrBuildEstatePriceMatrix(estateId: number): Promise<EstatePriceMatrix | null> {
  // 先查内存缓存
  const { getEstatePriceMatrix } = await import('./valuation-engine')
  const cached = getEstatePriceMatrix(estateId)
  if (cached) return cached

  // 缓存未命中，实时构建并注入
  return refreshEstatePriceMatrix(estateId)
}

// ============================================================
// 查询接口：获取多楼盘价格矩阵摘要（用于前端展示）
// ============================================================

export async function getEstatePriceMatrixSummary(estateIds: number[]): Promise<{
  estateId: number
  estateName: string
  overallAvgPrice: number
  sampleCount: number
  areaRanges: Array<{
    range: AreaRange
    label: string
    avgPrice: number
    sampleCount: number
  }>
}[]> {
  const results = []
  for (const estateId of estateIds) {
    const matrix = await getOrBuildEstatePriceMatrix(estateId)
    if (!matrix) continue

    const areaRanges = Object.entries(matrix.areaRangePrices).map(([range, data]) => ({
      range: range as AreaRange,
      label: `${range}段`,
      avgPrice: data!.avgPrice,
      sampleCount: data!.sampleCount,
    }))

    results.push({
      estateId,
      estateName: matrix.estateName,
      overallAvgPrice: matrix.overallAvgPrice,
      sampleCount: matrix.overallSampleCount,
      areaRanges,
    })
  }
  return results
}
