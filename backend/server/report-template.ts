// 一张纸简易估价说明 HTML 模板生成器

export function generateReportHTML(record: any, comparableCases: any[], llmAnalysisText: string, reportData: any): string {
  const formatMoney = (v: number) => {
    if (!v) return '—'
    if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿元`
    if (v >= 10000) return `${(v / 10000).toFixed(2)}万元`
    return `${v.toLocaleString()}元`
  }
  const formatNum = (v: number) => v ? v.toLocaleString('zh-CN') : '—'
  const now = new Date().toLocaleDateString('zh-CN')
  const reportNo = `估字第${String(record.id).padStart(5, '0')}号`
  const finalValue = Number(record.estimatedValue || record.valuationResult || 0)
  const unitPrice = Number(record.unitPrice || 0)
  const area = Number(record.buildingArea || record.area || 0)
  const valueMin = Number(record.valuationMin || finalValue * 0.82)
  const valueMax = Number(record.valuationMax || finalValue * 1.18)
  // 预计税费（按市场价的约 5.6% 计算）
  const taxFee = Math.round(finalValue * 0.056)
  // 预估净值
  const netValue = finalValue - taxFee
  // 强制变现净值（80%）
  const forceValue = Math.round(netValue * 0.8)
  // 物业用途
  const propertyUse = record.propertyType === 'residential' ? '住宅'
    : record.propertyType === 'commercial' ? '商业'
    : record.propertyType === 'office' ? '办公'
    : '住宅'
  const decorMap: Record<string, string> = { rough: '毛坯', simple: '简装', medium: '中装', fine: '精装', luxury: '豪装' }
  const purposeMap: Record<string, string> = { mortgage: '房地产抵押贷款', transaction: '买卖交易', tax: '税务申报', insurance: '保险理赔', litigation: '司法诉讼' }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>关于估价对象有关情况的说明</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SimSun', '宋体', 'Microsoft YaHei', '微软雅黑', serif; font-size: 14px; color: #000; background: #fff; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 18mm 15mm 22mm; position: relative; }
  .report-no { text-align: right; font-size: 13px; margin-bottom: 8px; }
  h1 { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 4px; margin-bottom: 20px; }
  .client-name { font-size: 15px; font-weight: bold; margin-bottom: 12px; }
  .intro { font-size: 14px; line-height: 2; margin-bottom: 16px; text-indent: 2em; }
  table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
  table.main-table th, table.main-table td { border: 1px solid #000; padding: 5px 4px; text-align: center; vertical-align: middle; }
  table.main-table th { background: #f0f0f0; font-weight: bold; }
  .notes { margin-bottom: 16px; }
  .notes p { font-size: 13px; line-height: 1.9; }
  .notes .title { font-weight: bold; margin-bottom: 6px; font-size: 14px; }
  .sign-area { display: flex; justify-content: space-between; margin-top: 24px; align-items: flex-end; }
  .sign-left { font-size: 13px; line-height: 2.4; }
  .sign-right { text-align: right; font-size: 13px; line-height: 2.4; }
  .seal-circle { display: inline-block; width: 90px; height: 90px; border: 2px dashed #ccc; border-radius: 50%; text-align: center; line-height: 90px; color: #bbb; font-size: 11px; margin-left: 10px; vertical-align: middle; }
  .page-footer { text-align: center; font-size: 12px; margin-top: 30px; color: #333; }
  .result-summary { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; }
  .result-summary span { margin-right: 24px; }
  .result-summary strong { color: #c0392b; font-size: 15px; }
  @media print {
    body { background: white; }
    .no-print { display: none !important; }
    .page { margin: 0; padding: 15mm 18mm 12mm 22mm; }
  }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #1d4ed8; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; z-index: 999; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ 打印 / 保存PDF</button>
<div class="page">
  <div class="report-no">${reportNo}</div>
  <h1>关于估价对象有关情况的说明</h1>

  <div class="client-name">${record.clientName || '委托人'}</div>

  <div class="intro">
    承蒙委托，我公司对${record.address || record.propertyAddress || '待估物业'}${propertyUse}房地产进行初步预估，现就有关情况说明如下：
  </div>

  <table class="main-table">
    <thead>
      <tr>
        <th>房地产名称</th>
        <th>产权证号</th>
        <th>权利人</th>
        <th>物业用途</th>
        <th>现状用途</th>
        <th>楼层</th>
        <th>建筑面积(㎡)</th>
        <th>购建价款(元)</th>
        <th>预估单价(元/㎡)</th>
        <th>预估总价(元)</th>
        <th>预计税费(元)</th>
        <th>预估净值(元)</th>
        <th>强制变现净值(元)</th>
        <th>备注</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${record.address || '—'}</td>
        <td>${record.propertyNo || '—'}</td>
        <td>${record.ownerName || record.clientName || '—'}</td>
        <td>${propertyUse}</td>
        <td>${propertyUse}</td>
        <td>${record.floor || '—'}</td>
        <td>${area}</td>
        <td>${record.purchasePrice ? Number(record.purchasePrice).toLocaleString() : '—'}</td>
        <td><strong>${formatNum(unitPrice)}</strong></td>
        <td>${finalValue ? Number(finalValue).toLocaleString() : '—'}</td>
        <td>${taxFee ? taxFee.toLocaleString() : '—'}</td>
        <td>${netValue ? netValue.toLocaleString() : '—'}</td>
        <td>${forceValue ? forceValue.toLocaleString() : '—'}</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>

  <div class="result-summary">
    <span>估价低值：<strong>${formatMoney(valueMin)}</strong></span>
    <span>估价中值：<strong>${formatMoney(finalValue)}</strong></span>
    <span>估价高值：<strong>${formatMoney(valueMax)}</strong></span>
    <span>置信度：${record.confidenceLevel === 'high' ? '高' : record.confidenceLevel === 'medium' ? '中' : '低'}</span>
  </div>

  <div class="notes">
    <div class="title">特殊情况说明：</div>
    <p>1、预估目的是为委托方确定房地产${purposeMap[record.purpose] || '抵押贷款'}额度提供价值参考依据；</p>
    <p>2、预估时以委托方提供的《不动产权证书》（复印件）为依据；</p>
    <p>3、我公司未对估价对象进行现场勘查；</p>
    <p>4、该估价结果是我公司出具正式估价报告前对物业价值的预先估定，其估值与正式估价报告会有一定范围的调整，最终结果应以出具的正式报告为准；</p>
    <p>5、本次预估按当地市地税务局及当地国土部门的有关规定进行税费测算，所测算之预计税费仅供参考，具体数值以当地市相关部门测算为准；</p>
    <p>6、此预估结果仅委托方作初步的数据参考，我公司不承担以此为依据而放贷款所引发的任何责任；</p>
    <p>7、表中强制变现净值按预估结果80%的变现率进行计算。</p>
    ${llmAnalysisText ? `<p style="margin-top:8px;"><strong>AI分析摘要：</strong>${llmAnalysisText.substring(0, 200)}${llmAnalysisText.length > 200 ? '…' : ''}</p>` : ''}
  </div>

  <div class="sign-area">
    <div class="sign-left">
      <p>估价人员（签字）：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
      <p>联系方式：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
    </div>
    <div class="sign-right">
      <p>gujia.app 智能估价系统 <span class="seal-circle">公章</span></p>
      <p>${now}</p>
    </div>
  </div>

  <div class="page-footer">第 1 页，共 1 页</div>
</div>
</body>
</html>`
}
