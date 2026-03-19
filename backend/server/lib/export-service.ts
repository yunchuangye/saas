/**
 * 数据导出服务
 * 支持：Excel（exceljs）、PDF（pdf-lib）、CSV
 * 导出类型：项目列表、报告列表、房屋案例、账单记录、全量数据
 */
import ExcelJS from "exceljs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { sql } from "drizzle-orm";

// 导出文件存储目录
const EXPORT_DIR = path.join(process.cwd(), "uploads", "exports");
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

// ============================================================
// 工具函数
// ============================================================
function formatDate(d: any): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("zh-CN"); } catch { return String(d); }
}

function formatAmount(v: any): string {
  if (v == null) return "";
  return `¥${Number(v).toLocaleString("zh-CN")}`;
}

// ============================================================
// Excel 导出
// ============================================================
async function exportToExcel(opts: {
  title: string;
  headers: { key: string; header: string; width?: number }[];
  rows: any[];
  filename: string;
}): Promise<string> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "估价平台";
  wb.created = new Date();

  const ws = wb.addWorksheet(opts.title);

  // 标题行
  ws.mergeCells(1, 1, 1, opts.headers.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = opts.title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1D4ED8" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  // 导出时间
  ws.mergeCells(2, 1, 2, opts.headers.length);
  const timeCell = ws.getCell(2, 1);
  timeCell.value = `导出时间：${new Date().toLocaleString("zh-CN")}`;
  timeCell.font = { size: 10, color: { argb: "FF6B7280" } };
  timeCell.alignment = { horizontal: "right" };

  // 表头
  const headerRow = ws.addRow(opts.headers.map(h => h.header));
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  });
  headerRow.height = 24;

  // 设置列宽
  opts.headers.forEach((h, i) => {
    ws.getColumn(i + 1).key = h.key;
    ws.getColumn(i + 1).width = h.width || 18;
  });

  // 数据行
  opts.rows.forEach((row, idx) => {
    const dataRow = ws.addRow(opts.headers.map(h => row[h.key] ?? ""));
    dataRow.eachCell(cell => {
      cell.alignment = { vertical: "middle", wrapText: true };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
      }
    });
    dataRow.height = 20;
  });

  // 统计行
  const totalRow = ws.addRow(["合计", ...Array(opts.headers.length - 1).fill("")]);
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };

  const filePath = path.join(EXPORT_DIR, opts.filename);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

// ============================================================
// PDF 导出（简单表格样式）
// ============================================================
async function exportToPdf(opts: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  filename: string;
}): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 841.89; // A4 横向
  const PAGE_H = 595.28;
  const MARGIN = 40;
  const ROW_H = 22;
  const HEADER_H = 28;
  const COL_W = (PAGE_W - MARGIN * 2) / opts.headers.length;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const drawText = (text: string, x: number, py: number, size = 10, isBold = false, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(String(text).substring(0, 30), {
      x, y: py, size, font: isBold ? boldFont : font, color,
    });
  };

  // 标题
  drawText(opts.title, MARGIN, y - 16, 16, true, rgb(0.11, 0.3, 0.87));
  y -= 36;
  if (opts.subtitle) {
    drawText(opts.subtitle, MARGIN, y, 9, false, rgb(0.5, 0.5, 0.5));
    y -= 20;
  }
  drawText(`导出时间：${new Date().toLocaleString("zh-CN")}  共 ${opts.rows.length} 条记录`, MARGIN, y, 9, false, rgb(0.5, 0.5, 0.5));
  y -= 24;

  // 分页绘制
  const drawPage = () => {
    // 表头背景
    page.drawRectangle({ x: MARGIN, y: y - HEADER_H, width: PAGE_W - MARGIN * 2, height: HEADER_H, color: rgb(0.11, 0.3, 0.87) });
    opts.headers.forEach((h, i) => {
      drawText(h, MARGIN + i * COL_W + 4, y - HEADER_H + 8, 9, true, rgb(1, 1, 1));
    });
    y -= HEADER_H;
  };

  drawPage();

  opts.rows.forEach((row, idx) => {
    if (y < MARGIN + ROW_H + 20) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      drawPage();
    }

    // 斑马纹
    if (idx % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - ROW_H, width: PAGE_W - MARGIN * 2, height: ROW_H, color: rgb(0.97, 0.98, 1) });
    }

    row.forEach((cell, i) => {
      drawText(String(cell || "").substring(0, 25), MARGIN + i * COL_W + 4, y - ROW_H + 6, 8);
    });

    // 行分隔线
    page.drawLine({ start: { x: MARGIN, y: y - ROW_H }, end: { x: PAGE_W - MARGIN, y: y - ROW_H }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
    y -= ROW_H;
  });

  // 页脚
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`第 ${i + 1} / ${pages.length} 页  |  估价平台数据导出`, {
      x: MARGIN, y: 20, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });
  });

  const filePath = path.join(EXPORT_DIR, opts.filename);
  fs.writeFileSync(filePath, await pdfDoc.save());
  return filePath;
}

// ============================================================
// 各类型导出逻辑
// ============================================================
export async function exportProjects(filters: any, format: "excel" | "pdf" | "csv", orgId?: number): Promise<{ filePath: string; rowCount: number }> {
  const whereClause = orgId ? `WHERE p.org_id = ${orgId}` : "";
  const rows = await db.execute(sql.raw(`
    SELECT p.id, p.project_no, p.title, p.status, p.property_type, p.city, p.district,
      p.total_area, p.budget_min, p.budget_max, p.deadline, p.created_at,
      o.name as org_name, u.name as creator_name
    FROM projects p
    LEFT JOIN organizations o ON p.org_id = o.id
    LEFT JOIN users u ON p.created_by = u.id
    ${whereClause}
    ORDER BY p.created_at DESC LIMIT 5000
  `)) as any[];

  const statusMap: Record<string, string> = {
    draft: "草稿", published: "已发布", in_progress: "进行中",
    completed: "已完成", cancelled: "已取消",
  };

  const formatted = rows.map(r => ({
    ...r,
    status: statusMap[r.status] || r.status,
    budget_range: r.budget_min && r.budget_max ? `${formatAmount(r.budget_min)} ~ ${formatAmount(r.budget_max)}` : "",
    total_area: r.total_area ? `${r.total_area} ㎡` : "",
    created_at: formatDate(r.created_at),
    deadline: formatDate(r.deadline),
  }));

  const headers = [
    { key: "project_no", header: "项目编号", width: 20 },
    { key: "title", header: "项目名称", width: 30 },
    { key: "status", header: "状态", width: 12 },
    { key: "property_type", header: "物业类型", width: 15 },
    { key: "city", header: "城市", width: 12 },
    { key: "district", header: "区域", width: 12 },
    { key: "total_area", header: "面积", width: 12 },
    { key: "budget_range", header: "预算范围", width: 25 },
    { key: "org_name", header: "委托机构", width: 20 },
    { key: "creator_name", header: "创建人", width: 12 },
    { key: "deadline", header: "截止日期", width: 14 },
    { key: "created_at", header: "创建时间", width: 14 },
  ];

  const ts = Date.now();
  let filePath: string;

  if (format === "excel") {
    filePath = await exportToExcel({ title: "项目列表", headers, rows: formatted, filename: `projects_${ts}.xlsx` });
  } else if (format === "pdf") {
    filePath = await exportToPdf({
      title: "项目列表",
      subtitle: `共 ${formatted.length} 个项目`,
      headers: headers.slice(0, 8).map(h => h.header),
      rows: formatted.map(r => headers.slice(0, 8).map(h => String(r[h.key] || ""))),
      filename: `projects_${ts}.pdf`,
    });
  } else {
    // CSV
    const csvLines = [headers.map(h => h.header).join(",")];
    formatted.forEach(r => csvLines.push(headers.map(h => `"${String(r[h.key] || "").replace(/"/g, '""')}"`).join(",")));
    filePath = path.join(EXPORT_DIR, `projects_${ts}.csv`);
    fs.writeFileSync(filePath, "\uFEFF" + csvLines.join("\n"), "utf8");
  }

  return { filePath, rowCount: formatted.length };
}

export async function exportReports(filters: any, format: "excel" | "pdf" | "csv", orgId?: number): Promise<{ filePath: string; rowCount: number }> {
  const whereClause = orgId ? `WHERE r.org_id = ${orgId}` : "";
  const rows = await db.execute(sql.raw(`
    SELECT r.id, r.report_no, r.title, r.status, r.valuation_method,
      r.estimated_value, r.value_per_sqm, r.total_area,
      r.created_at, r.submitted_at, r.approved_at,
      u.name as author_name, o.name as org_name, p.title as project_title
    FROM reports r
    LEFT JOIN users u ON r.author_id = u.id
    LEFT JOIN organizations o ON r.org_id = o.id
    LEFT JOIN projects p ON r.project_id = p.id
    ${whereClause}
    ORDER BY r.created_at DESC LIMIT 5000
  `)) as any[];

  const statusMap: Record<string, string> = {
    draft: "草稿", submitted: "待审核", approved: "已通过",
    rejected: "已驳回", signed: "已签章",
  };
  const methodMap: Record<string, string> = {
    market: "市场比较法", income: "收益法", cost: "成本法", hypothesis: "假设开发法",
  };

  const formatted = rows.map(r => ({
    ...r,
    status: statusMap[r.status] || r.status,
    valuation_method: methodMap[r.valuation_method] || r.valuation_method,
    estimated_value: r.estimated_value ? formatAmount(r.estimated_value) : "",
    value_per_sqm: r.value_per_sqm ? `${Number(r.value_per_sqm).toLocaleString()} 元/㎡` : "",
    total_area: r.total_area ? `${r.total_area} ㎡` : "",
    created_at: formatDate(r.created_at),
    submitted_at: formatDate(r.submitted_at),
    approved_at: formatDate(r.approved_at),
  }));

  const headers = [
    { key: "report_no", header: "报告编号", width: 20 },
    { key: "title", header: "报告名称", width: 30 },
    { key: "status", header: "状态", width: 12 },
    { key: "project_title", header: "关联项目", width: 25 },
    { key: "valuation_method", header: "估价方法", width: 15 },
    { key: "estimated_value", header: "估价结果", width: 18 },
    { key: "value_per_sqm", header: "单价", width: 18 },
    { key: "total_area", header: "面积", width: 12 },
    { key: "author_name", header: "评估师", width: 12 },
    { key: "org_name", header: "机构", width: 20 },
    { key: "submitted_at", header: "提交时间", width: 14 },
    { key: "approved_at", header: "审核时间", width: 14 },
  ];

  const ts = Date.now();
  let filePath: string;

  if (format === "excel") {
    filePath = await exportToExcel({ title: "报告列表", headers, rows: formatted, filename: `reports_${ts}.xlsx` });
  } else if (format === "pdf") {
    filePath = await exportToPdf({
      title: "报告列表",
      subtitle: `共 ${formatted.length} 份报告`,
      headers: headers.slice(0, 8).map(h => h.header),
      rows: formatted.map(r => headers.slice(0, 8).map(h => String(r[h.key] || ""))),
      filename: `reports_${ts}.pdf`,
    });
  } else {
    const csvLines = [headers.map(h => h.header).join(",")];
    formatted.forEach(r => csvLines.push(headers.map(h => `"${String(r[h.key] || "").replace(/"/g, '""')}"`).join(",")));
    filePath = path.join(EXPORT_DIR, `reports_${ts}.csv`);
    fs.writeFileSync(filePath, "\uFEFF" + csvLines.join("\n"), "utf8");
  }

  return { filePath, rowCount: formatted.length };
}

export async function exportBilling(filters: any, format: "excel" | "pdf" | "csv", orgId?: number): Promise<{ filePath: string; rowCount: number }> {
  const whereClause = orgId ? `WHERE br.org_id = ${orgId}` : "";
  const rows = await db.execute(sql.raw(`
    SELECT br.id, br.type, br.description, br.amount, br.status, br.created_at,
      o.name as org_name
    FROM billing_records br
    LEFT JOIN organizations o ON br.org_id = o.id
    ${whereClause}
    ORDER BY br.created_at DESC LIMIT 5000
  `)) as any[];

  const formatted = rows.map(r => ({
    ...r,
    amount: formatAmount(r.amount / 100),
    created_at: formatDate(r.created_at),
  }));

  const headers = [
    { key: "id", header: "账单ID", width: 10 },
    { key: "type", header: "类型", width: 15 },
    { key: "description", header: "描述", width: 35 },
    { key: "amount", header: "金额", width: 15 },
    { key: "status", header: "状态", width: 12 },
    { key: "org_name", header: "机构", width: 20 },
    { key: "created_at", header: "时间", width: 16 },
  ];

  const ts = Date.now();
  let filePath: string;

  if (format === "excel") {
    filePath = await exportToExcel({ title: "账单记录", headers, rows: formatted, filename: `billing_${ts}.xlsx` });
  } else if (format === "pdf") {
    filePath = await exportToPdf({
      title: "账单记录",
      headers: headers.map(h => h.header),
      rows: formatted.map(r => headers.map(h => String(r[h.key] || ""))),
      filename: `billing_${ts}.pdf`,
    });
  } else {
    const csvLines = [headers.map(h => h.header).join(",")];
    formatted.forEach(r => csvLines.push(headers.map(h => `"${String(r[h.key] || "").replace(/"/g, '""')}"`).join(",")));
    filePath = path.join(EXPORT_DIR, `billing_${ts}.csv`);
    fs.writeFileSync(filePath, "\uFEFF" + csvLines.join("\n"), "utf8");
  }

  return { filePath, rowCount: formatted.length };
}

export { EXPORT_DIR };
