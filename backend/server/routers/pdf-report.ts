import { z } from 'zod'
import { router, protectedProcedure } from '../lib/trpc'
import { db } from '../lib/db'
import { autoValuations } from '../lib/schema'
import { eq } from 'drizzle-orm'
import { formatCurrency } from '../lib/valuation-engine'

// 生成估价报告的 HTML 内容（用于前端渲染和 PDF 导出）
function generateReportHTML(data: {
  record: any
  reportData: any
  llmResult: any
}): string {
  const { record, reportData, llmResult } = data
  const input = reportData?.input || {}
  const result = reportData?.result || {}
  const comparables = reportData?.comparables || []

  const propertyTypeMap: Record<string, string> = {
    residential: '住宅', commercial: '商业', office: '办公', industrial: '工业', land: '土地'
  }
  const decorationMap: Record<string, string> = {
    rough: '毛坯', simple: '简装', medium: '中等装修', fine: '精装', luxury: '豪装'
  }
  const orientationMap: Record<string, string> = {
    south: '南', north: '北', east: '东', west: '西', south_north: '南北通透', other: '其他'
  }
  const purposeMap: Record<string, string> = {
    mortgage: '抵押贷款', transaction: '买卖交易', tax: '税务申报', insurance: '保险理赔', litigation: '司法诉讼'
  }

  const finalValue = Number(record.estimatedValue || record.valuationResult || 0)
  const unitPrice = Number(record.unitPrice || 0)
  const valuationMin = Number(record.valuationMin || finalValue * 0.9)
  const valuationMax = Number(record.valuationMax || finalValue * 1.1)
  const confidence = Number(record.confidence || 75)
  const confidenceLevel = record.confidenceLevel || (confidence >= 85 ? 'high' : confidence >= 70 ? 'medium' : 'low')
  const confidenceLabelMap: Record<string, string> = { high: '高', medium: '中', low: '低' }
  const confidenceColorMap: Record<string, string> = { high: '#16a34a', medium: '#d97706', low: '#dc2626' }

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const reportNo = `AV-${new Date().getFullYear()}-${String(record.id).padStart(6, '0')}`

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>房地产自动估价报告 ${reportNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SimSun', 'STSong', serif; color: #1a1a1a; background: #fff; font-size: 14px; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  
  /* 封面 */
  .cover { text-align: center; padding: 60px 0; border-bottom: 3px solid #1e40af; margin-bottom: 40px; }
  .cover .logo { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 8px; letter-spacing: 2px; }
  .cover .logo-sub { font-size: 14px; color: #6b7280; margin-bottom: 40px; }
  .cover h1 { font-size: 26px; color: #111827; margin-bottom: 16px; font-weight: bold; }
  .cover .report-no { font-size: 14px; color: #6b7280; margin-bottom: 40px; }
  .cover .value-box { display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px 48px; border-radius: 12px; margin: 20px 0; }
  .cover .value-box .label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
  .cover .value-box .value { font-size: 36px; font-weight: bold; letter-spacing: 1px; }
  .cover .value-box .unit-price { font-size: 16px; opacity: 0.9; margin-top: 8px; }
  .cover .range-box { margin: 16px 0; color: #374151; font-size: 15px; }
  .cover .meta { margin-top: 40px; color: #6b7280; font-size: 13px; line-height: 2; }
  
  /* 章节 */
  .section { margin-bottom: 36px; }
  .section-title { font-size: 18px; font-weight: bold; color: #1e40af; border-left: 4px solid #1e40af; padding-left: 12px; margin-bottom: 20px; }
  
  /* 信息表格 */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .info-item { display: flex; border-bottom: 1px solid #e5e7eb; }
  .info-item:last-child { border-bottom: none; }
  .info-item:nth-child(odd):last-child { grid-column: span 2; }
  .info-label { background: #f3f4f6; padding: 10px 16px; font-weight: bold; color: #374151; width: 120px; flex-shrink: 0; font-size: 13px; }
  .info-value { padding: 10px 16px; color: #111827; font-size: 13px; }
  
  /* 方法权重 */
  .method-bars { margin: 16px 0; }
  .method-bar { display: flex; align-items: center; margin-bottom: 12px; }
  .method-name { width: 120px; font-size: 13px; color: #374151; }
  .bar-container { flex: 1; background: #e5e7eb; border-radius: 4px; height: 20px; position: relative; }
  .bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; font-size: 12px; color: white; font-weight: bold; }
  .method-value { width: 100px; text-align: right; font-size: 13px; color: #374151; }
  
  /* 案例对比表 */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1e40af; color: white; padding: 10px 8px; text-align: center; font-weight: bold; }
  td { padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
  tr.subject-row { background: #eff6ff; font-weight: bold; }
  
  /* 调整系数 */
  .adj-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .adj-table th { background: #374151; color: white; padding: 8px 12px; text-align: left; }
  .adj-table td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  .adj-table tr:nth-child(even) { background: #f9fafb; }
  .coef-positive { color: #16a34a; font-weight: bold; }
  .coef-negative { color: #dc2626; font-weight: bold; }
  .coef-neutral { color: #374151; }
  
  /* LLM 分析 */
  .ai-box { background: linear-gradient(135deg, #eff6ff, #f0f9ff); border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; }
  .ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .ai-icon { background: #1e40af; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
  .ai-title { font-size: 15px; font-weight: bold; color: #1e40af; }
  .ai-content { color: #374151; font-size: 13px; line-height: 1.8; white-space: pre-wrap; }
  .key-factors { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .factor-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
  
  /* 置信度 */
  .confidence-box { display: flex; align-items: center; gap: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px; }
  .confidence-meter { flex: 1; }
  .confidence-bar { height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
  .confidence-fill { height: 100%; border-radius: 6px; }
  .confidence-label { font-size: 24px; font-weight: bold; }
  
  /* 免责声明 */
  .disclaimer { background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; font-size: 12px; color: #92400e; line-height: 1.8; }
  
  /* 页脚 */
  .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  
  @media print {
    body { font-size: 12px; }
    .page { padding: 20px; }
    .cover { padding: 40px 0; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- 封面 -->
  <div class="cover">
    <div class="logo">固价 · 智能估价平台</div>
    <div class="logo-sub">GU JIA · AI Valuation Platform</div>
    <h1>房地产自动估价报告</h1>
    <div class="report-no">报告编号：${reportNo} &nbsp;|&nbsp; 估价时点：${today}</div>
    
    <div class="value-box">
      <div class="label">综合估价结果</div>
      <div class="value">${formatCurrency(finalValue)}</div>
      <div class="unit-price">单价：${unitPrice.toLocaleString('zh-CN')} 元/㎡</div>
    </div>
    
    <div class="range-box">
      估价区间：${formatCurrency(valuationMin)} ~ ${formatCurrency(valuationMax)}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      置信度：<span style="color:${confidenceColorMap[confidenceLevel]};font-weight:bold">${confidenceLabelMap[confidenceLevel]}（${confidence}分）</span>
    </div>
    
    <div class="meta">
      物业地址：${record.propertyAddress || record.address || '—'}<br>
      物业类型：${propertyTypeMap[input.propertyType] || '住宅'} &nbsp;|&nbsp; 
      建筑面积：${Number(record.buildingArea || record.area || 0).toFixed(0)} ㎡ &nbsp;|&nbsp;
      楼层：${record.floor || '—'}/${record.totalFloors || '—'} 层<br>
      估价目的：${purposeMap[input.purpose] || '—'} &nbsp;|&nbsp;
      估价方法：${record.method || '综合估价法'}
    </div>
  </div>

  <!-- 1. 物业基本信息 -->
  <div class="section">
    <div class="section-title">一、物业基本信息</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">物业地址</div>
        <div class="info-value">${record.propertyAddress || record.address || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">所在城市</div>
        <div class="info-value">${record.cityName || input.city || '—'}${record.district ? ' ' + record.district : ''}</div>
      </div>
      <div class="info-item">
        <div class="info-label">物业类型</div>
        <div class="info-value">${propertyTypeMap[input.propertyType] || '住宅'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">建筑面积</div>
        <div class="info-value">${Number(record.buildingArea || record.area || 0).toFixed(2)} ㎡</div>
      </div>
      <div class="info-item">
        <div class="info-label">所在楼层</div>
        <div class="info-value">${record.floor || '—'} 层（共 ${record.totalFloors || '—'} 层）</div>
      </div>
      <div class="info-item">
        <div class="info-label">楼龄</div>
        <div class="info-value">${record.buildingAge || '—'} 年</div>
      </div>
      <div class="info-item">
        <div class="info-label">朝向</div>
        <div class="info-value">${orientationMap[record.orientation || input.orientation] || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">装修标准</div>
        <div class="info-value">${decorationMap[record.decoration || input.decoration] || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">电梯</div>
        <div class="info-value">${record.hasElevator ? '有电梯' : '无电梯'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">停车位</div>
        <div class="info-value">${record.hasParking ? '有停车位' : '无停车位'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">估价目的</div>
        <div class="info-value">${purposeMap[input.purpose] || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">估价时点</div>
        <div class="info-value">${today}</div>
      </div>
    </div>
  </div>

  <!-- 2. 估价结果 -->
  <div class="section">
    <div class="section-title">二、估价结果</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">综合估价</div>
        <div class="info-value" style="font-size:18px;font-weight:bold;color:#1e40af">${formatCurrency(finalValue)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">估价单价</div>
        <div class="info-value" style="font-size:16px;font-weight:bold;color:#1e40af">${unitPrice.toLocaleString('zh-CN')} 元/㎡</div>
      </div>
      <div class="info-item">
        <div class="info-label">估价下限</div>
        <div class="info-value">${formatCurrency(valuationMin)}（单价 ${Math.round(valuationMin / Number(record.buildingArea || record.area || 1)).toLocaleString('zh-CN')} 元/㎡）</div>
      </div>
      <div class="info-item">
        <div class="info-label">估价上限</div>
        <div class="info-value">${formatCurrency(valuationMax)}（单价 ${Math.round(valuationMax / Number(record.buildingArea || record.area || 1)).toLocaleString('zh-CN')} 元/㎡）</div>
      </div>
      <div class="info-item">
        <div class="info-label">置信度</div>
        <div class="info-value" style="color:${confidenceColorMap[confidenceLevel]};font-weight:bold">${confidenceLabelMap[confidenceLevel]}（${confidence}分）</div>
      </div>
      <div class="info-item">
        <div class="info-label">参考案例数</div>
        <div class="info-value">${comparables.length} 个</div>
      </div>
    </div>
  </div>

  <!-- 3. 估价方法 -->
  ${result.weights ? `
  <div class="section">
    <div class="section-title">三、估价方法及权重</div>
    <p style="color:#374151;font-size:13px;margin-bottom:16px">${result.methodology || '本次评估综合运用市场比较法、收益法和成本法，根据物业类型和市场数据质量分配权重。'}</p>
    <div class="method-bars">
      <div class="method-bar">
        <div class="method-name">市场比较法</div>
        <div class="bar-container">
          <div class="bar-fill" style="width:${Math.round(result.weights.comparative * 100)}%;background:#1e40af">
            ${result.comparativeResult ? result.comparativeResult.unitPrice.toLocaleString('zh-CN') + ' 元/㎡' : ''}
          </div>
        </div>
        <div class="method-value">权重 ${Math.round(result.weights.comparative * 100)}%</div>
      </div>
      ${result.incomeResult ? `
      <div class="method-bar">
        <div class="method-name">收益法</div>
        <div class="bar-container">
          <div class="bar-fill" style="width:${Math.round(result.weights.income * 100)}%;background:#0891b2">
            ${result.incomeResult.unitPrice.toLocaleString('zh-CN')} 元/㎡
          </div>
        </div>
        <div class="method-value">权重 ${Math.round(result.weights.income * 100)}%</div>
      </div>` : ''}
      ${result.costResult ? `
      <div class="method-bar">
        <div class="method-name">成本法</div>
        <div class="bar-container">
          <div class="bar-fill" style="width:${Math.round(result.weights.cost * 100)}%;background:#7c3aed">
            ${result.costResult.unitPrice.toLocaleString('zh-CN')} 元/㎡
          </div>
        </div>
        <div class="method-value">权重 ${Math.round(result.weights.cost * 100)}%</div>
      </div>` : ''}
    </div>
  </div>` : ''}

  <!-- 4. 参考案例对比 -->
  ${comparables.length > 0 ? `
  <div class="section">
    <div class="section-title">四、参考案例对比</div>
    <table>
      <thead>
        <tr>
          <th>案例</th>
          <th>地址</th>
          <th>面积(㎡)</th>
          <th>楼层</th>
          <th>成交单价(元/㎡)</th>
          <th>成交时间</th>
          <th>与待估物业差异</th>
        </tr>
      </thead>
      <tbody>
        <tr class="subject-row">
          <td>待估物业</td>
          <td>${(record.propertyAddress || record.address || '—').substring(0, 15)}</td>
          <td>${Number(record.buildingArea || record.area || 0).toFixed(0)}</td>
          <td>${record.floor || '—'}/${record.totalFloors || '—'}</td>
          <td style="color:#1e40af;font-weight:bold">${unitPrice.toLocaleString('zh-CN')}</td>
          <td>${today}</td>
          <td>—</td>
        </tr>
        ${comparables.slice(0, 6).map((c: any, i: number) => {
          const caseUnitPrice = Number(c.unitPrice || c.unit_price || 0)
          const diff = caseUnitPrice - unitPrice
          const diffPct = unitPrice > 0 ? ((diff / unitPrice) * 100).toFixed(1) : '0'
          const diffColor = diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#374151'
          const transDate = c.transactionDate ? new Date(c.transactionDate).toLocaleDateString('zh-CN') : '—'
          return `<tr>
            <td>案例${i + 1}</td>
            <td>${(c.address || '同区域案例').substring(0, 15)}</td>
            <td>${Number(c.area || 0).toFixed(0)}</td>
            <td>${c.floor || '—'}/${c.totalFloors || '—'}</td>
            <td>${caseUnitPrice.toLocaleString('zh-CN')}</td>
            <td>${transDate}</td>
            <td style="color:${diffColor}">${diff >= 0 ? '+' : ''}${diffPct}%</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- 5. 调整系数说明 -->
  ${result.adjustments && result.adjustments.length > 0 ? `
  <div class="section">
    <div class="section-title">五、调整系数明细</div>
    <table class="adj-table">
      <thead>
        <tr>
          <th>调整因素</th>
          <th>说明</th>
          <th>调整系数</th>
          <th>价值影响（元）</th>
        </tr>
      </thead>
      <tbody>
        ${result.adjustments.map((adj: any) => {
          const coefClass = adj.coefficient > 1 ? 'coef-positive' : adj.coefficient < 1 ? 'coef-negative' : 'coef-neutral'
          const impactSign = adj.impact >= 0 ? '+' : ''
          return `<tr>
            <td><strong>${adj.factor}</strong></td>
            <td>${adj.description}</td>
            <td class="${coefClass}">${adj.coefficient.toFixed(3)}</td>
            <td class="${adj.impact >= 0 ? 'coef-positive' : 'coef-negative'}">${impactSign}${adj.impact.toLocaleString('zh-CN')}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <!-- 6. 市场行情 -->
  ${result.marketData ? `
  <div class="section">
    <div class="section-title">六、市场行情参考</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">城市均价</div>
        <div class="info-value">${result.marketData.cityAvgPrice?.toLocaleString('zh-CN') || '—'} 元/㎡</div>
      </div>
      <div class="info-item">
        <div class="info-label">区域均价</div>
        <div class="info-value">${result.marketData.districtAvgPrice?.toLocaleString('zh-CN') || '—'} 元/㎡</div>
      </div>
      <div class="info-item">
        <div class="info-label">区位指数</div>
        <div class="info-value">${result.marketData.priceIndex || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">市场趋势</div>
        <div class="info-value" style="color:${result.marketData.marketTrend === 'rising' ? '#16a34a' : result.marketData.marketTrend === 'declining' ? '#dc2626' : '#d97706'}">
          ${result.marketData.marketTrend === 'rising' ? '↑ 上涨趋势' : result.marketData.marketTrend === 'declining' ? '↓ 下跌趋势' : '→ 平稳趋势'}
          （${result.marketData.trendRate >= 0 ? '+' : ''}${result.marketData.trendRate}%/年）
        </div>
      </div>
    </div>
  </div>` : ''}

  <!-- 7. AI 智能分析 -->
  ${llmResult?.analysis ? `
  <div class="section">
    <div class="section-title">七、AI 智能分析</div>
    <div class="ai-box">
      <div class="ai-header">
        <div class="ai-icon">AI</div>
        <div class="ai-title">专业评估师 AI 辅助分析</div>
        <div style="margin-left:auto;font-size:12px;color:#6b7280">风险等级：<span style="font-weight:bold;color:${llmResult.riskLevel === '低' ? '#16a34a' : llmResult.riskLevel === '高' ? '#dc2626' : '#d97706'}">${llmResult.riskLevel}</span></div>
      </div>
      <div class="ai-content">${llmResult.analysis}</div>
      ${llmResult.keyFactors?.length > 0 ? `
      <div class="key-factors">
        <span style="font-size:12px;color:#6b7280;margin-right:4px">关键因素：</span>
        ${llmResult.keyFactors.map((f: string) => `<span class="factor-tag">${f}</span>`).join('')}
      </div>` : ''}
    </div>
  </div>` : ''}

  <!-- 8. 估价假设与限制条件 -->
  <div class="section">
    <div class="section-title">${llmResult?.analysis ? '八' : '七'}、估价假设与限制条件</div>
    <p style="font-size:13px;font-weight:bold;color:#374151;margin-bottom:8px">估价假设：</p>
    <ul style="font-size:13px;color:#374151;padding-left:20px;margin-bottom:16px;line-height:2">
      ${(result.assumptions || [
        '估价时点为报告出具日，市场条件以当日为准',
        '物业不存在重大质量缺陷或法律纠纷',
        '土地使用权在剩余年限内可正常使用',
        '周边基础设施和配套设施保持现状',
        '宏观经济政策和房地产调控政策保持稳定'
      ]).map((a: string) => `<li>${a}</li>`).join('')}
    </ul>
    <p style="font-size:13px;font-weight:bold;color:#374151;margin-bottom:8px">限制条件：</p>
    <ul style="font-size:13px;color:#374151;padding-left:20px;line-height:2">
      ${(result.limitations || [
        '本估价结果仅供参考，不构成交易建议',
        '实际成交价格可能因市场波动、谈判因素等与估价结果存在差异',
        '如物业存在重大变化，本估价结果将失效'
      ]).map((l: string) => `<li>${l}</li>`).join('')}
    </ul>
  </div>

  <!-- 免责声明 -->
  <div class="disclaimer">
    <strong>免责声明：</strong>本报告由固价智能估价平台自动生成，基于市场比较法、收益法、成本法及人工智能辅助分析。
    估价结果仅供参考，不构成任何法律意义上的正式估价报告。如需用于抵押贷款、司法诉讼等正式用途，
    请委托具有相应资质的专业估价机构出具正式估价报告。本平台对因使用本报告而产生的任何损失不承担责任。
  </div>

  <!-- 页脚 -->
  <div class="footer">
    <p>固价 · 智能估价平台 &nbsp;|&nbsp; 报告编号：${reportNo} &nbsp;|&nbsp; 生成时间：${new Date().toLocaleString('zh-CN')}</p>
    <p style="margin-top:4px">本报告由 AI 自动生成，仅供参考</p>
  </div>

</div>
</body>
</html>`
}

export const pdfReportRouter = router({
  // 获取估价报告 HTML（前端渲染后可打印为 PDF）
  getReportHTML: protectedProcedure
    .input(z.object({ valuationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const [record] = await db
        .select()
        .from(autoValuations)
        .where(eq(autoValuations.id, input.valuationId))
        .limit(1)

      if (!record) throw new Error('估价记录不存在')

      const reportData = record.reportData ? JSON.parse(record.reportData as string) : {}
      const llmResult = record.llmAnalysis ? JSON.parse(record.llmAnalysis as string) : null

      const html = generateReportHTML({ record, reportData, llmResult })

      return { html, reportNo: `AV-${new Date().getFullYear()}-${String(record.id).padStart(6, '0')}` }
    }),
})
