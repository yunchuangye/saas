'use client'

import { useState, useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts'

// ============================================================
// 类型定义
// ============================================================
interface EstateOption { id: number; name: string; pinyinInitials: string; pinyinFull?: string; address?: string | null; developer?: string | null; cityId?: number; buildYear?: number | null; propertyType?: string | null; totalUnits?: number | null }
interface BuildingOption { id: number; name: string; totalFloors?: number }
interface UnitOption { id: number; unitNumber: string; floor: number | null; area?: string; rooms?: number; orientation?: string; decoration?: string }

// ============================================================
// 拼音首字母搜索下拉组件
// ============================================================
function EstateSearchInput({
  cityId, value, onChange, onSelect
}: {
  cityId?: number
  value: string
  onChange: (v: string) => void
  onSelect: (e: EstateOption) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: results = [] } = trpc.propertySearch.searchEstates.useQuery(
    { query: value, cityId, limit: 15 },
    { enabled: value.length > 0 && !!cityId }
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="输入楼盘名或拼音首字母（如 WKJY）"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => value.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(e => (
            <div
              key={e.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
              onMouseDown={() => { onSelect(e); onChange(e.name); setOpen(false) }}
            >
              <div className="font-medium text-gray-900">{e.name}</div>
              <div className="text-xs text-gray-500">{e.address || ''} · 首字母: {e.pinyinInitials}</div>
            </div>
          ))}
        </div>
      )}
      {open && value.length > 0 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-400 text-center">
          未找到匹配楼盘
        </div>
      )}
    </div>
  )
}

// ============================================================
// 主页面
// ============================================================
export default function ValuationPage() {
  // 表单状态
  const [step, setStep] = useState<1 | 2>(1)
  const [cityId, setCityId] = useState<number | undefined>()
  const [cityName, setCityName] = useState('')
  const [estateQuery, setEstateQuery] = useState('')
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingOption | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null)
  const [form, setForm] = useState({
    propertyType: 'residential',
    district: '',
    address: '',
    buildingArea: 90,
    floor: 10,
    totalFloors: 28,
    buildingAge: 5,
    rooms: 3,
    orientation: 'south_north',
    decoration: 'fine',
    hasElevator: true,
    hasParking: true,
    purpose: 'mortgage',
    enableLLM: true,
  })

  // 结果状态
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 数据查询
  const { data: cities = [] } = trpc.autoValuation.getCities.useQuery()
  const { data: buildings = [] } = trpc.propertySearch.getBuildingsByEstate.useQuery(
    { estateId: selectedEstate?.id ?? 0 },
    { enabled: !!selectedEstate }
  )
  const { data: units = [] } = trpc.propertySearch.getUnitsByBuilding.useQuery(
    { buildingId: selectedBuilding?.id ?? 0 },
    { enabled: !!selectedBuilding }
  )

  const calculateMutation = trpc.autoValuation.calculate.useMutation({
    onSuccess: (data) => { setResult(data); setLoading(false) },
    onError: (e) => { setError(e.message); setLoading(false) },
  })

  // 选择楼栋时自动填充总层数
  useEffect(() => {
    if (selectedBuilding?.totalFloors) {
      setForm(f => ({ ...f, totalFloors: selectedBuilding.totalFloors! }))
    }
  }, [selectedBuilding])

  // 选择房屋单元时自动填充
  useEffect(() => {
    if (selectedUnit) {
      setForm(f => ({
        ...f,
        floor: selectedUnit.floor ?? f.floor,
        buildingArea: selectedUnit.area ? Number(selectedUnit.area) : f.buildingArea,
        orientation: selectedUnit.orientation || f.orientation,
        decoration: selectedUnit.decoration || f.decoration,
      }))
    }
  }, [selectedUnit])

  const handleSubmit = () => {
    if (!cityId) { setError('请选择城市'); return }
    if (!form.address && !selectedEstate) { setError('请填写物业地址或选择楼盘'); return }
    setLoading(true)
    setError('')
    setResult(null)
    calculateMutation.mutate({
      ...form,
      city: cityName,
      cityId,
      address: selectedEstate
        ? `${selectedEstate.name}${selectedBuilding ? ' ' + selectedBuilding.name : ''}${selectedUnit ? ' ' + selectedUnit.unitNumber : ''}`
        : form.address,
      estateId: selectedEstate?.id,
      buildingId: selectedBuilding?.id,
      unitId: selectedUnit?.id,
      estateName: selectedEstate?.name,
      buildingName: selectedBuilding?.name,
      unitNumber: selectedUnit?.unitNumber,
    } as any)
  }

  const formatMoney = (v: number) => {
    if (!v) return '—'
    if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿元`
    if (v >= 10000) return `${(v / 10000).toFixed(0)}万元`
    return `${v.toLocaleString()}元`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">智能自动估价</h1>
          <p className="text-sm text-gray-500 mt-1">支持楼盘/楼栋/房屋数据库检索，自动生成评估报告</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* 物业类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">物业类型</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.propertyType}
                onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))}
              >
                <option value="residential">住宅</option>
                <option value="commercial">商业</option>
                <option value="office">办公</option>
                <option value="industrial">工业</option>
              </select>
            </div>

            {/* 估价目的 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">估价目的</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              >
                <option value="mortgage">抵押贷款</option>
                <option value="transaction">买卖交易</option>
                <option value="tax">税务评估</option>
                <option value="insurance">保险理赔</option>
                <option value="litigation">司法诉讼</option>
              </select>
            </div>

            {/* 城市选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在城市</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={cityId || ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  setCityId(id)
                  const city = cities.find(c => c.id === id)
                  setCityName(city?.name || '')
                  setSelectedEstate(null)
                  setSelectedBuilding(null)
                  setSelectedUnit(null)
                  setEstateQuery('')
                }}
              >
                <option value="">请选择城市</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区域（可选）</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：朝阳区、南山区"
                value={form.district}
                onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              />
            </div>

            {/* 楼盘搜索 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                楼盘名称
                <span className="ml-2 text-xs text-blue-500 font-normal">支持中文或拼音首字母（如 WKJY = 万科俊园）</span>
              </label>
              <EstateSearchInput
                cityId={cityId}
                value={estateQuery}
                onChange={setEstateQuery}
                onSelect={e => {
                  setSelectedEstate(e)
                  setSelectedBuilding(null)
                  setSelectedUnit(null)
                }}
              />
              {selectedEstate && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  ✓ 已选择：{selectedEstate.name}
                  {selectedEstate.developer && <span className="text-gray-400">· {selectedEstate.developer}</span>}
                  <button className="ml-2 text-gray-400 hover:text-red-500" onClick={() => { setSelectedEstate(null); setEstateQuery('') }}>×</button>
                </div>
              )}
            </div>

            {/* 楼栋选择 */}
            {selectedEstate && buildings.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">楼栋</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedBuilding?.id || ''}
                  onChange={e => {
                    const b = buildings.find(b => b.id === Number(e.target.value))
                    setSelectedBuilding(b ? { id: b.id, name: b.name, totalFloors: b.floors ?? undefined } : null)
                    setSelectedUnit(null)
                  }}
                >
                  <option value="">请选择楼栋</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}（{b.floors}层）</option>)}
                </select>
              </div>
            )}

            {/* 房屋单元选择 */}
            {selectedBuilding && units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">房屋单元</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedUnit?.id || ''}
                  onChange={e => {
                    const u = units.find(u => u.id === Number(e.target.value))
                    setSelectedUnit(u ? { id: u.id, unitNumber: u.unitNumber, floor: u.floor, area: u.area ?? undefined, rooms: u.rooms ?? undefined, orientation: u.orientation ?? undefined, decoration: undefined } : null)
                  }}
                >
                  <option value="">请选择房屋（可选）</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber} · {u.floor}层 · {u.area}㎡</option>)}
                </select>
              </div>
            )}

            {/* 手动地址（无楼盘时） */}
            {!selectedEstate && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：朝阳公园南路1号2栋15层03室"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                />
              </div>
            )}

            {/* 建筑面积 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">建筑面积（㎡）</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.buildingArea}
                onChange={e => setForm(f => ({ ...f, buildingArea: Number(e.target.value) }))}
              />
            </div>

            {/* 楼层 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在楼层 / 总层数</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="所在楼层"
                  value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: Number(e.target.value) }))}
                />
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="总层数"
                  value={form.totalFloors}
                  onChange={e => setForm(f => ({ ...f, totalFloors: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* 楼龄 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">楼龄（年）</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.buildingAge}
                onChange={e => setForm(f => ({ ...f, buildingAge: Number(e.target.value) }))}
              />
            </div>

            {/* 朝向 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">朝向</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.orientation}
                onChange={e => setForm(f => ({ ...f, orientation: e.target.value }))}
              >
                <option value="south_north">南北通透</option>
                <option value="south">朝南</option>
                <option value="north">朝北</option>
                <option value="east">朝东</option>
                <option value="west">朝西</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* 装修 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">装修情况</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.decoration}
                onChange={e => setForm(f => ({ ...f, decoration: e.target.value }))}
              >
                <option value="rough">毛坯</option>
                <option value="simple">简装</option>
                <option value="medium">中等装修</option>
                <option value="fine">精装</option>
                <option value="luxury">豪装</option>
              </select>
            </div>

            {/* 电梯/停车 */}
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={form.hasElevator}
                  onChange={e => setForm(f => ({ ...f, hasElevator: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">有电梯</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={form.hasParking}
                  onChange={e => setForm(f => ({ ...f, hasParking: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">有停车位</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={form.enableLLM}
                  onChange={e => setForm(f => ({ ...f, enableLLM: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">AI 智能分析</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  正在估价...
                </>
              ) : '开始智能估价'}
            </button>
          </div>
        </div>

        {/* 估价报告 */}
        {result && <ValuationReport result={result} form={form} cityName={cityName} selectedEstate={selectedEstate} selectedBuilding={selectedBuilding} selectedUnit={selectedUnit} />}
      </div>
    </div>
  )
}

// ============================================================
// 估价报告组件
// ============================================================
function ValuationReport({ result, form, cityName, selectedEstate, selectedBuilding, selectedUnit }: {
  result: any; form: any; cityName: string
  selectedEstate: EstateOption | null; selectedBuilding: BuildingOption | null; selectedUnit: UnitOption | null
}) {
  const formatMoney = (v: number) => {
    if (!v) return '—'
    if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿元`
    if (v >= 10000) return `${(v / 10000).toFixed(0)}万元`
    return `${v.toLocaleString()}元`
  }

  const priceChange = result.priceStats?.priceChange
  const isUp = priceChange && Number(priceChange) > 0

  // 月份趋势图数据
  const trendData = (result.monthlyTrend || []).map((d: any) => ({
    month: d.month,
    avgPrice: Number(d.avgPrice),
    maxPrice: Number(d.maxPrice),
    minPrice: Number(d.minPrice),
    count: Number(d.count),
  }))

  // 散点图数据（按月份分色）
  const scatterData = (result.scatterData || []).map((d: any) => ({
    area: d.area,
    unitPrice: d.unitPrice,
    month: d.month,
    address: d.address,
  }))

  const handlePrint = () => window.print()

  const handleViewReport = () => {
    if (result.id) {
      window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8721'}/api/valuation-report/${result.id}`, '_blank')
    }
  }

  return (
    <div className="space-y-5" id="valuation-report">
      {/* 物业信息卡 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
          物业基本信息
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {selectedEstate && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-500 mb-1">楼盘</div>
              <div className="font-semibold text-gray-900 text-sm">{selectedEstate.name}</div>
              {selectedEstate.developer && <div className="text-xs text-gray-400">{selectedEstate.developer}</div>}
            </div>
          )}
          {selectedBuilding && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-500 mb-1">楼栋</div>
              <div className="font-semibold text-gray-900 text-sm">{selectedBuilding.name}</div>
              <div className="text-xs text-gray-400">共{selectedBuilding.totalFloors}层</div>
            </div>
          )}
          {selectedUnit && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-500 mb-1">房屋单元</div>
              <div className="font-semibold text-gray-900 text-sm">{selectedUnit.unitNumber}</div>
              <div className="text-xs text-gray-400">{selectedUnit.floor}层</div>
            </div>
          )}
          <InfoCard label="建筑面积" value={`${form.buildingArea} ㎡`} />
          <InfoCard label="楼层/总层" value={`${form.floor}/${form.totalFloors} 层`} />
          <InfoCard label="楼龄" value={`${form.buildingAge} 年`} />
          <InfoCard label="朝向" value={form.orientation === 'south_north' ? '南北通透' : form.orientation === 'south' ? '朝南' : form.orientation} />
          <InfoCard label="装修" value={form.decoration === 'fine' ? '精装' : form.decoration === 'rough' ? '毛坯' : form.decoration === 'luxury' ? '豪装' : form.decoration} />
        </div>
      </div>

      {/* 估价结果卡 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
          估价结果
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 rounded-xl border border-orange-200 bg-orange-50">
            <div className="text-xs text-orange-500 mb-1">估价低值</div>
            <div className="text-xl font-bold text-orange-600">{formatMoney(result.valuationMin)}</div>
            <div className="text-xs text-gray-400 mt-1">{result.valuationMin && form.buildingArea ? `${Math.round(result.valuationMin / form.buildingArea).toLocaleString()} 元/㎡` : ''}</div>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="text-xs opacity-80 mb-1">综合估价（推荐）</div>
            <div className="text-2xl font-bold">{formatMoney(result.finalValue)}</div>
            <div className="text-xs opacity-70 mt-1">{result.unitPrice ? `${result.unitPrice.toLocaleString()} 元/㎡` : ''}</div>
          </div>
          <div className="text-center p-4 rounded-xl border border-green-200 bg-green-50">
            <div className="text-xs text-green-500 mb-1">估价高值</div>
            <div className="text-xl font-bold text-green-600">{formatMoney(result.valuationMax)}</div>
            <div className="text-xs text-gray-400 mt-1">{result.valuationMax && form.buildingArea ? `${Math.round(result.valuationMax / form.buildingArea).toLocaleString()} 元/㎡` : ''}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">采用方法：{result.method}</span>
          <span className={`px-3 py-1 rounded-full text-xs ${result.confidenceLevel === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            置信度：{result.confidenceLevel === 'high' ? '高' : result.confidenceLevel === 'medium' ? '中' : '低'}
          </span>
          {result.llmConfidenceScore && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">AI置信度：{result.llmConfidenceScore}分</span>
          )}
          {result.llmRiskLevel && (
            <span className={`px-3 py-1 rounded-full text-xs ${result.llmRiskLevel === '低' ? 'bg-green-100 text-green-700' : result.llmRiskLevel === '高' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              风险等级：{result.llmRiskLevel}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">参考案例：{result.comparableCount || 0} 个</span>
        </div>
      </div>

      {/* 月份价格趋势图 */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
              月份价格趋势
            </h2>
            {result.priceStats && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">共 {result.priceStats.monthCount} 个月数据</span>
                <span className={`font-semibold ${isUp ? 'text-red-500' : 'text-green-500'}`}>
                  {isUp ? '↑' : '↓'} {Math.abs(Number(priceChange))}%
                </span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: any, name: string) => [`${Number(v).toLocaleString()} 元/㎡`, name === 'avgPrice' ? '均价' : name === 'maxPrice' ? '最高价' : '最低价']}
                labelFormatter={l => `${l} 月`}
              />
              <Legend formatter={v => v === 'avgPrice' ? '月均价' : v === 'maxPrice' ? '最高价' : '最低价'} />
              <Area type="monotone" dataKey="avgPrice" stroke="#3b82f6" strokeWidth={2.5} fill="url(#avgGrad)" dot={{ r: 3 }} name="avgPrice" />
              <Line type="monotone" dataKey="maxPrice" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="maxPrice" />
              <Line type="monotone" dataKey="minPrice" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="minPrice" />
              <ReferenceLine y={result.unitPrice} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={2}
                label={{ value: `本次估价 ${result.unitPrice?.toLocaleString()}`, position: 'right', fontSize: 11, fill: '#f59e0b' }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* 价格统计摘要 */}
          {result.priceStats && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              <StatBox label="最新月均价" value={`${result.priceStats.latestAvgPrice?.toLocaleString()} 元/㎡`} />
              <StatBox label="起始月均价" value={`${result.priceStats.firstAvgPrice?.toLocaleString()} 元/㎡`} />
              <StatBox label="价格涨跌幅" value={`${isUp ? '+' : ''}${priceChange}%`} color={isUp ? 'text-red-500' : 'text-green-500'} />
              <StatBox label="数据采集点" value={`${result.priceStats.totalDataPoints} 个`} />
            </div>
          )}
        </div>
      )}

      {/* 价格采集点散点图 */}
      {scatterData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
              价格采集点分析
            </h2>
            <span className="text-sm text-gray-400">共 {scatterData.length} 个采集点</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="area" name="面积" unit="㎡" tick={{ fontSize: 11 }} label={{ value: '建筑面积(㎡)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis dataKey="unitPrice" name="单价" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow">
                        <p className="font-medium">{d.address || '案例'}</p>
                        <p>面积：{d.area} ㎡</p>
                        <p>单价：{d.unitPrice?.toLocaleString()} 元/㎡</p>
                        <p>时间：{d.month}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter data={scatterData} fill="#3b82f6" opacity={0.6} />
              <ReferenceLine y={result.unitPrice} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={2} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">黄色虚线为本次估价单价，蓝色点为历史成交案例采集点</p>
        </div>
      )}

      {/* 参考案例 */}
      {result.comparableCases?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
            参考案例（{result.comparableCases.length} 个）
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">地址</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">面积(㎡)</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">楼层</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">成交单价(元/㎡)</th>
                  <th className="text-right px-3 py-2 text-gray-500 font-medium">成交时间</th>
                </tr>
              </thead>
              <tbody>
                {result.comparableCases.map((c: any, i: number) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{c.address || '同区域案例'}</td>
                    <td className="px-3 py-2 text-right">{Number(c.area || 0).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right">{c.floor || '—'}/{c.totalFloors || '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold text-blue-600">
                      {Number(c.unitPrice || c.unit_price || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {c.transactionDate ? new Date(c.transactionDate).toLocaleDateString('zh-CN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI 分析 */}
      {result.llmAnalysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-purple-600 rounded-full inline-block"></span>
            AI 专业分析报告
          </h2>
          {result.llmKeyFactors?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {result.llmKeyFactors.map((f: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{f}</span>
              ))}
            </div>
          )}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {result.llmAnalysis}
          </div>
        </div>
      )}

      {/* 声明 */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-400 leading-relaxed">
        <p>1. 本报告由 gujia.app 智能估价系统自动生成，仅供参考，不构成正式估价报告。</p>
        <p>2. 正式估价报告须由持有国家注册房地产估价师资格证书的估价师签章方可生效。</p>
        <p>3. 本报告所引用的市场数据来源于系统案例库，数据截止日期为报告生成日。</p>
        <p>4. 估价结果受市场波动、政策变化等因素影响，有效期为报告生成之日起6个月内。</p>
        <p className="mt-1">报告编号：RPT-AUTO-{result.id} &nbsp;|&nbsp; 生成时间：{new Date().toLocaleString('zh-CN')}</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end no-print">
        <button
          onClick={handleViewReport}
          className="px-5 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 flex items-center gap-2"
        >
          📄 查看/打印 PDF 报告
        </button>
        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          🖨️ 直接打印
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="font-medium text-gray-800 text-sm">{value}</div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`font-semibold text-sm ${color || 'text-gray-800'}`}>{value}</div>
    </div>
  )
}
