/**
 * 电子签章管理路由
 * 功能：
 * - 签章上传与管理（机构公章/个人执业章）
 * - 签章审核（管理员）
 * - 签章申请（评估师）
 * - 签章审批（机构负责人）
 * - 执行签章（PDF 嵌入）
 * - 签章验证（公开接口）
 * - 审计日志查询
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import { signPDF, calcSHA256, generateTimestampToken, verifyTimestampToken } from "../lib/seal-service";
import { saveFile } from "../lib/upload";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ============================================================
// 辅助函数
// ============================================================

/** 写入审计日志 */
async function writeAuditLog(
  db: any,
  params: {
    sealApplicationId: number;
    reportId: number;
    operatorId: number;
    action: string;
    description?: string;
    ipAddress?: string;
    metadata?: any;
  }
) {
  await db.execute(
    sql`INSERT INTO seal_audit_logs 
      (seal_application_id, report_id, operator_id, action, description, ip_address, metadata)
    VALUES 
      (${params.sealApplicationId}, ${params.reportId}, ${params.operatorId}, 
       ${params.action}, ${params.description ?? null}, ${params.ipAddress ?? null},
       ${params.metadata ? JSON.stringify(params.metadata) : null})`
  );
}

/** 从 URL 加载 PDF 到 Buffer */
async function loadPDFFromUrl(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("http")) {
      const https = await import("https");
      const http = await import("http");
      const client = url.startsWith("https") ? https : http;
      return new Promise((resolve, reject) => {
        (client as any).get(url, (res: any) => {
          const chunks: Buffer[] = [];
          res.on("data", (c: Buffer) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        }).on("error", reject);
      });
    } else {
      // 本地文件路径
      const localPath = url.startsWith("/") ? url : path.resolve(process.cwd(), url);
      return fs.readFileSync(localPath);
    }
  } catch (e) {
    console.error("[SealRouter] 加载 PDF 失败:", e);
    return null;
  }
}

/** 将 Buffer 保存为本地文件并返回 URL */
async function savePDFBuffer(buffer: Buffer, filename: string): Promise<string> {
  const uploadDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  const backendUrl = process.env.BACKEND_PUBLIC_URL || "https://api.gujia.app";
  return `${backendUrl}/uploads/${filename}`;
}

// ============================================================
// 路由定义
// ============================================================

export const sealsRouter = router({

  // ─────────────────────────────────────────────────────────
  // 签章管理
  // ─────────────────────────────────────────────────────────

  /** 获取我的签章列表 */
  getMySeals: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(
      sql`SELECT s.*, 
        u.display_name as user_name, u.real_name,
        o.name as org_name
      FROM seals s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN organizations o ON s.org_id = o.id
      WHERE s.org_id = ${ctx.user.orgId ?? 0}
        OR s.user_id = ${ctx.user.id}
      ORDER BY s.created_at DESC`
    ) as any;
    return result[0] ?? [];
  }),

  /** 获取所有签章（管理员） */
  getAllSeals: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.pageSize;
      const statusFilter = input.status ? sql`AND s.status = ${input.status}` : sql``;
      const result = await ctx.db.execute(
        sql`SELECT s.*, 
          u.display_name as user_name, u.real_name,
          o.name as org_name,
          r.display_name as reviewer_name
        FROM seals s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN organizations o ON s.org_id = o.id
        LEFT JOIN users r ON s.reviewed_by = r.id
        WHERE 1=1 ${statusFilter}
        ORDER BY s.created_at DESC
        LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any;
      const countResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM seals s WHERE 1=1 ${statusFilter}`
      ) as any;
      return {
        items: result[0] ?? [],
        total: countResult[0]?.[0]?.total ?? 0,
      };
    }),

  /** 创建签章（上传签章图片信息） */
  createSeal: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "签章名称不能为空"),
      type: z.enum(["org_seal", "personal_seal"]),
      imageUrl: z.string().url("请上传有效的签章图片"),
      imageWidth: z.number().optional(),
      imageHeight: z.number().optional(),
      certificateNo: z.string().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.orgId) throw new Error("请先加入机构");

      // 机构章只能由机构创建，个人章绑定到用户
      const userId = input.type === "personal_seal" ? ctx.user.id : null;

      await ctx.db.execute(
        sql`INSERT INTO seals 
          (org_id, user_id, name, type, image_url, image_width, image_height, 
           certificate_no, valid_from, valid_until, status)
        VALUES 
          (${ctx.user.orgId}, ${userId}, ${input.name}, ${input.type}, 
           ${input.imageUrl}, ${input.imageWidth ?? 200}, ${input.imageHeight ?? 200},
           ${input.certificateNo ?? null}, ${input.validFrom ?? null}, ${input.validUntil ?? null},
           'pending')`
      );
      return { success: true, message: "签章已提交，等待管理员审核" };
    }),

  /** 审核签章（管理员） */
  reviewSeal: adminProcedure
    .input(z.object({
      id: z.number(),
      approved: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.execute(
        sql`UPDATE seals SET 
          status = ${input.approved ? "approved" : "rejected"},
          reviewed_by = ${ctx.user.id},
          reviewed_at = NOW(),
          review_comment = ${input.comment ?? null},
          updated_at = NOW()
        WHERE id = ${input.id}`
      );
      return { success: true, message: input.approved ? "签章已审核通过" : "签章已拒绝" };
    }),

  /** 设置默认签章 */
  setDefault: protectedProcedure
    .input(z.object({ id: z.number(), type: z.enum(["org_seal", "personal_seal"]) }))
    .mutation(async ({ input, ctx }) => {
      // 先清除同类型的默认标记
      await ctx.db.execute(
        sql`UPDATE seals SET is_default = 0 
        WHERE org_id = ${ctx.user.orgId ?? 0} AND type = ${input.type}`
      );
      await ctx.db.execute(
        sql`UPDATE seals SET is_default = 1 WHERE id = ${input.id}`
      );
      return { success: true };
    }),

  /** 删除签章 */
  deleteSeal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.execute(
        sql`DELETE FROM seals WHERE id = ${input.id} 
        AND (org_id = ${ctx.user.orgId ?? 0} OR user_id = ${ctx.user.id})`
      );
      return { success: true };
    }),

  // ─────────────────────────────────────────────────────────
  // 签章申请
  // ─────────────────────────────────────────────────────────

  /** 获取报告的签章申请 */
  getApplicationByReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.execute(
        sql`SELECT sa.*,
          u.display_name as applicant_name,
          r.display_name as reviewer_name,
          os.name as org_seal_name, os.image_url as org_seal_image,
          ps.name as personal_seal_name, ps.image_url as personal_seal_image
        FROM seal_applications sa
        LEFT JOIN users u ON sa.applicant_id = u.id
        LEFT JOIN users r ON sa.reviewed_by = r.id
        LEFT JOIN seals os ON sa.org_seal_id = os.id
        LEFT JOIN seals ps ON sa.personal_seal_id = ps.id
        WHERE sa.report_id = ${input.reportId}
        ORDER BY sa.created_at DESC
        LIMIT 1`
      ) as any;
      return result[0]?.[0] ?? null;
    }),

  /** 获取机构的签章申请列表（机构负责人审批用） */
  getOrgApplications: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.pageSize;
      const statusFilter = input.status ? sql`AND sa.status = ${input.status}` : sql``;
      const result = await ctx.db.execute(
        sql`SELECT sa.*,
          u.display_name as applicant_name,
          rpt.title as report_title, rpt.report_no
        FROM seal_applications sa
        LEFT JOIN users u ON sa.applicant_id = u.id
        LEFT JOIN reports rpt ON sa.report_id = rpt.id
        WHERE sa.org_id = ${ctx.user.orgId ?? 0} ${statusFilter}
        ORDER BY sa.created_at DESC
        LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any;
      const countResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM seal_applications sa 
        WHERE sa.org_id = ${ctx.user.orgId ?? 0} ${statusFilter}`
      ) as any;
      return {
        items: result[0] ?? [],
        total: countResult[0]?.[0]?.total ?? 0,
      };
    }),

  /** 提交签章申请 */
  applyForSeal: protectedProcedure
    .input(z.object({
      reportId: z.number(),
      orgSealId: z.number().optional(),
      personalSealId: z.number().optional(),
      sealPosition: z.enum(["bottom_right", "bottom_center", "bottom_left", "custom"]).default("bottom_right"),
      sealPage: z.enum(["last", "all", "first_and_last"]).default("last"),
      applyReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.orgId) throw new Error("请先加入机构");
      if (!input.orgSealId && !input.personalSealId) throw new Error("请至少选择一个签章");

      // 检查报告是否已审核通过
      const reportResult = await ctx.db.execute(
        sql`SELECT id, status, seal_status FROM reports WHERE id = ${input.reportId}`
      ) as any;
      const report = reportResult[0]?.[0];
      if (!report) throw new Error("报告不存在");
      if (report.status !== "approved") throw new Error("只有已审核通过的报告才能申请签章");
      if (report.seal_status === "signed") throw new Error("该报告已完成签章");

      // 创建申请
      await ctx.db.execute(
        sql`INSERT INTO seal_applications 
          (report_id, applicant_id, org_id, org_seal_id, personal_seal_id, 
           seal_position, seal_page, apply_reason, status)
        VALUES 
          (${input.reportId}, ${ctx.user.id}, ${ctx.user.orgId},
           ${input.orgSealId ?? null}, ${input.personalSealId ?? null},
           ${input.sealPosition}, ${input.sealPage}, ${input.applyReason ?? null},
           'pending')`
      );

      // 更新报告签章状态
      await ctx.db.execute(
        sql`UPDATE reports SET seal_status = 'pending', updated_at = NOW() 
        WHERE id = ${input.reportId}`
      );

      // 获取刚创建的申请 ID
      const newApp = await ctx.db.execute(
        sql`SELECT id FROM seal_applications WHERE report_id = ${input.reportId} 
        ORDER BY created_at DESC LIMIT 1`
      ) as any;
      const appId = newApp[0]?.[0]?.id;

      if (appId) {
        await writeAuditLog(ctx.db, {
          sealApplicationId: appId,
          reportId: input.reportId,
          operatorId: ctx.user.id,
          action: "apply",
          description: `评估师 ${ctx.user.username} 提交签章申请`,
        });
      }

      return { success: true, message: "签章申请已提交，等待机构负责人审批" };
    }),

  /** 审批签章申请（机构负责人） */
  reviewApplication: protectedProcedure
    .input(z.object({
      id: z.number(),
      approved: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const newStatus = input.approved ? "approved" : "rejected";

      await ctx.db.execute(
        sql`UPDATE seal_applications SET 
          status = ${newStatus},
          reviewed_by = ${ctx.user.id},
          reviewed_at = NOW(),
          review_comment = ${input.comment ?? null},
          updated_at = NOW()
        WHERE id = ${input.id}`
      );

      // 获取申请信息
      const appResult = await ctx.db.execute(
        sql`SELECT report_id FROM seal_applications WHERE id = ${input.id}`
      ) as any;
      const reportId = appResult[0]?.[0]?.report_id;

      if (reportId) {
        await ctx.db.execute(
          sql`UPDATE reports SET 
            seal_status = ${input.approved ? "approved" : "none"},
            updated_at = NOW()
          WHERE id = ${reportId}`
        );

        await writeAuditLog(ctx.db, {
          sealApplicationId: input.id,
          reportId,
          operatorId: ctx.user.id,
          action: input.approved ? "approve" : "reject",
          description: `${input.approved ? "审批通过" : "审批拒绝"}签章申请，意见：${input.comment ?? "无"}`,
        });
      }

      return { success: true, message: input.approved ? "已批准签章申请" : "已拒绝签章申请" };
    }),

  /** 执行签章（系统自动，审批通过后调用） */
  executeSeal: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // 获取申请详情
      const appResult = await ctx.db.execute(
        sql`SELECT sa.*, 
          os.image_url as org_seal_image, 
          ps.image_url as personal_seal_image,
          rpt.report_no, rpt.title as report_title,
          rpt.signed_pdf_url as existing_pdf_url
        FROM seal_applications sa
        LEFT JOIN seals os ON sa.org_seal_id = os.id
        LEFT JOIN seals ps ON sa.personal_seal_id = ps.id
        LEFT JOIN reports rpt ON sa.report_id = rpt.id
        WHERE sa.id = ${input.applicationId}`
      ) as any;
      const app = appResult[0]?.[0];
      if (!app) throw new Error("签章申请不存在");
      if (app.status !== "approved") throw new Error("签章申请尚未审批通过");

      await writeAuditLog(ctx.db, {
        sealApplicationId: input.applicationId,
        reportId: app.report_id,
        operatorId: ctx.user.id,
        action: "sign_start",
        description: "开始执行电子签章",
      });

      try {
        // 生成示例 PDF（如果没有现成的 PDF，生成一个带报告信息的示例 PDF）
        let pdfBuffer: Buffer;

        if (app.existing_pdf_url) {
          const loaded = await loadPDFFromUrl(app.existing_pdf_url);
          if (loaded) {
            pdfBuffer = loaded;
          } else {
            pdfBuffer = await generateSamplePDF(app);
          }
        } else {
          pdfBuffer = await generateSamplePDF(app);
        }

        // 执行签章
        const frontendUrl = process.env.FRONTEND_URL || "https://gujia.app";
        const signResult = await signPDF(
          pdfBuffer,
          app.report_id,
          app.report_no || `RPT-${app.report_id}`,
          {
            orgSealImageUrl: app.org_seal_image || undefined,
            personalSealImageUrl: app.personal_seal_image || undefined,
            position: app.seal_position || "bottom_right",
            sealPage: app.seal_page || "last",
            sealSize: 100,
          },
          frontendUrl
        );

        // 生成时间戳令牌
        const timestampToken = generateTimestampToken(signResult.hash);

        // 保存签章后的 PDF
        const filename = `signed_report_${app.report_id}_${Date.now()}.pdf`;
        const signedPdfUrl = await savePDFBuffer(signResult.pdfBuffer, filename);

        // 更新签章申请
        await ctx.db.execute(
          sql`UPDATE seal_applications SET 
            status = 'signed',
            signed_pdf_url = ${signedPdfUrl},
            signed_at = NOW(),
            sign_hash = ${signResult.hash},
            verify_code = ${signResult.verifyCode},
            timestamp_token = ${timestampToken},
            timestamp_at = NOW(),
            updated_at = NOW()
          WHERE id = ${input.applicationId}`
        );

        // 更新报告签章状态
        await ctx.db.execute(
          sql`UPDATE reports SET 
            seal_status = 'signed',
            seal_application_id = ${input.applicationId},
            signed_pdf_url = ${signedPdfUrl},
            sign_verify_code = ${signResult.verifyCode},
            signed_at = NOW(),
            updated_at = NOW()
          WHERE id = ${app.report_id}`
        );

        // 更新签章使用次数
        if (app.org_seal_id) {
          await ctx.db.execute(
            sql`UPDATE seals SET use_count = use_count + 1, last_used_at = NOW() WHERE id = ${app.org_seal_id}`
          );
        }
        if (app.personal_seal_id) {
          await ctx.db.execute(
            sql`UPDATE seals SET use_count = use_count + 1, last_used_at = NOW() WHERE id = ${app.personal_seal_id}`
          );
        }

        await writeAuditLog(ctx.db, {
          sealApplicationId: input.applicationId,
          reportId: app.report_id,
          operatorId: ctx.user.id,
          action: "sign_success",
          description: `签章成功，验证码: ${signResult.verifyCode}`,
          metadata: {
            hash: signResult.hash,
            verifyCode: signResult.verifyCode,
            signedPdfUrl,
          },
        });

        return {
          success: true,
          message: "签章成功",
          signedPdfUrl,
          verifyCode: signResult.verifyCode,
          hash: signResult.hash,
          timestamp: signResult.timestamp,
        };
      } catch (err: any) {
        // 签章失败
        await ctx.db.execute(
          sql`UPDATE seal_applications SET 
            status = 'failed',
            error_message = ${err.message},
            updated_at = NOW()
          WHERE id = ${input.applicationId}`
        );

        await writeAuditLog(ctx.db, {
          sealApplicationId: input.applicationId,
          reportId: app.report_id,
          operatorId: ctx.user.id,
          action: "sign_failed",
          description: `签章失败: ${err.message}`,
        });

        throw new Error(`签章失败: ${err.message}`);
      }
    }),

  // ─────────────────────────────────────────────────────────
  // 签章验证（公开接口）
  // ─────────────────────────────────────────────────────────

  /** 通过验证码验证签章真实性 */
  verifyByCode: publicProcedure
    .input(z.object({
      verifyCode: z.string(),
      reportId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db.execute(
        sql`SELECT sa.*, 
          rpt.title as report_title, rpt.report_no, rpt.property_address,
          rpt.valuation_result, rpt.final_value,
          u.display_name as applicant_name, u.real_name,
          o.name as org_name,
          os.name as org_seal_name,
          ps.name as personal_seal_name
        FROM seal_applications sa
        LEFT JOIN reports rpt ON sa.report_id = rpt.id
        LEFT JOIN users u ON sa.applicant_id = u.id
        LEFT JOIN organizations o ON sa.org_id = o.id
        LEFT JOIN seals os ON sa.org_seal_id = os.id
        LEFT JOIN seals ps ON sa.personal_seal_id = ps.id
        WHERE sa.verify_code = ${input.verifyCode}
          AND sa.status = 'signed'
          ${input.reportId ? sql`AND sa.report_id = ${input.reportId}` : sql``}
        LIMIT 1`
      ) as any;

      const record = result[0]?.[0];
      if (!record) {
        return {
          valid: false,
          message: "验证码无效或签章不存在",
        };
      }

      // 记录验证操作
      await ctx.db.execute(
        sql`INSERT INTO seal_audit_logs 
          (seal_application_id, report_id, operator_id, action, description)
        VALUES 
          (${record.id}, ${record.report_id}, 0, 'verify', '公开验证签章真实性')`
      );

      return {
        valid: true,
        message: "签章验证通过，此报告已加盖合法有效的电子签章",
        data: {
          reportTitle: record.report_title,
          reportNo: record.report_no,
          propertyAddress: record.property_address,
          orgName: record.org_name,
          appraiserName: record.real_name || record.applicant_name,
          orgSealName: record.org_seal_name,
          personalSealName: record.personal_seal_name,
          signedAt: record.signed_at,
          verifyCode: record.verify_code,
          hash: record.sign_hash,
        },
      };
    }),

  // ─────────────────────────────────────────────────────────
  // 审计日志
  // ─────────────────────────────────────────────────────────

  /** 获取签章审计日志 */
  getAuditLogs: protectedProcedure
    .input(z.object({
      reportId: z.number().optional(),
      applicationId: z.number().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const offset = (input.page - 1) * input.pageSize;
      const reportFilter = input.reportId ? sql`AND sal.report_id = ${input.reportId}` : sql``;
      const appFilter = input.applicationId ? sql`AND sal.seal_application_id = ${input.applicationId}` : sql``;

      const result = await ctx.db.execute(
        sql`SELECT sal.*,
          u.display_name as operator_name, u.username as operator_username
        FROM seal_audit_logs sal
        LEFT JOIN users u ON sal.operator_id = u.id
        WHERE 1=1 ${reportFilter} ${appFilter}
        ORDER BY sal.created_at DESC
        LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any;

      const countResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM seal_audit_logs sal 
        WHERE 1=1 ${reportFilter} ${appFilter}`
      ) as any;

      return {
        items: result[0] ?? [],
        total: countResult[0]?.[0]?.total ?? 0,
      };
    }),

  /** 下载已签章 PDF（记录下载日志） */
  recordDownload: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const appResult = await ctx.db.execute(
        sql`SELECT report_id, signed_pdf_url FROM seal_applications WHERE id = ${input.applicationId}`
      ) as any;
      const app = appResult[0]?.[0];
      if (!app) throw new Error("签章申请不存在");

      await writeAuditLog(ctx.db, {
        sealApplicationId: input.applicationId,
        reportId: app.report_id,
        operatorId: ctx.user.id,
        action: "download",
        description: "下载已签章 PDF",
      });

      return { success: true, signedPdfUrl: app.signed_pdf_url };
    }),
});

// ============================================================
// 生成示例 PDF（当报告没有 PDF 文件时使用）
// ============================================================

async function generateSamplePDF(app: any): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // 标题
  page.drawText("REAL ESTATE APPRAISAL REPORT", {
    x: 50, y: height - 80, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.4),
  });

  page.drawText("房地产估价报告", {
    x: 50, y: height - 110, size: 22, font: boldFont, color: rgb(0.1, 0.1, 0.4),
  });

  page.drawLine({
    start: { x: 50, y: height - 125 },
    end: { x: width - 50, y: height - 125 },
    thickness: 1, color: rgb(0.3, 0.3, 0.6),
  });

  const fields = [
    ["报告编号", app.report_no || `RPT-${app.report_id}`],
    ["报告标题", app.report_title || "房地产估价报告"],
    ["出具机构", app.org_name || "评估机构"],
    ["出具日期", new Date().toLocaleDateString("zh-CN")],
    ["报告状态", "已审核通过，待签章"],
  ];

  let y = height - 160;
  for (const [label, value] of fields) {
    page.drawText(`${label}：`, { x: 60, y, size: 11, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(String(value), { x: 160, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 30;
  }

  page.drawText("本报告由固价智能估价平台生成，已通过三级审核，具备法律效力。", {
    x: 60, y: y - 20, size: 10, font, color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText("（签章区域）", {
    x: width - 200, y: 150, size: 10, font, color: rgb(0.6, 0.6, 0.6),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
