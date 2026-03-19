/**
 * 白标定制路由
 * 机构可自定义：品牌名称、Logo、主题色、自定义域名、报告页眉页脚、邮件/短信配置
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export const brandingRouter = router({
  // 获取当前机构的白标配置
  get: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId;
    if (!orgId) return null;
    const [branding] = await ctx.db.execute(
      sql`SELECT * FROM org_branding WHERE org_id = ${orgId}`
    ) as any[];

    // 获取机构基础信息
    const [org] = await ctx.db.execute(
      sql`SELECT id, name, logo, type FROM organizations WHERE id = ${orgId}`
    ) as any[];

    return {
      ...branding,
      orgName: org?.name,
      orgLogo: org?.logo,
      // 隐藏敏感字段
      email_smtp_pass: branding?.email_smtp_pass ? "******" : null,
      sms_secret_key: branding?.sms_secret_key ? "******" : null,
    };
  }),

  // 更新品牌基础信息
  updateBasic: protectedProcedure
    .input(z.object({
      brandName: z.string().max(200).optional(),
      logoUrl: z.string().url().optional().or(z.literal("")),
      faviconUrl: z.string().url().optional().or(z.literal("")),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      await ctx.db.execute(sql`
        INSERT INTO org_branding (org_id, brand_name, logo_url, favicon_url, primary_color, secondary_color)
        VALUES (${orgId}, ${input.brandName || null}, ${input.logoUrl || null},
          ${input.faviconUrl || null}, ${input.primaryColor || "#2563eb"}, ${input.secondaryColor || "#64748b"})
        ON DUPLICATE KEY UPDATE
          brand_name = COALESCE(${input.brandName || null}, brand_name),
          logo_url = COALESCE(${input.logoUrl || null}, logo_url),
          favicon_url = COALESCE(${input.faviconUrl || null}, favicon_url),
          primary_color = COALESCE(${input.primaryColor || null}, primary_color),
          secondary_color = COALESCE(${input.secondaryColor || null}, secondary_color),
          updated_at = NOW()
      `);

      // 同步更新 organizations.logo
      if (input.logoUrl) {
        await ctx.db.execute(sql`UPDATE organizations SET logo = ${input.logoUrl} WHERE id = ${orgId}`);
      }

      return { success: true };
    }),

  // 更新自定义域名
  updateDomain: protectedProcedure
    .input(z.object({
      customDomain: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      const verifyToken = crypto.randomBytes(16).toString("hex");

      await ctx.db.execute(sql`
        INSERT INTO org_branding (org_id, custom_domain, domain_verified, domain_verify_token)
        VALUES (${orgId}, ${input.customDomain || null}, 0, ${verifyToken})
        ON DUPLICATE KEY UPDATE
          custom_domain = ${input.customDomain || null},
          domain_verified = 0,
          domain_verify_token = ${verifyToken},
          updated_at = NOW()
      `);

      return {
        success: true,
        verifyToken,
        instruction: `请在您的域名 DNS 中添加 TXT 记录：\n主机记录：_gujia-verify\n记录值：${verifyToken}\n添加后点击"验证域名"按钮`,
      };
    }),

  // 验证自定义域名
  verifyDomain: protectedProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.user.orgId;
    if (!orgId) throw new Error("请先加入机构");

    const [branding] = await ctx.db.execute(
      sql`SELECT custom_domain, domain_verify_token FROM org_branding WHERE org_id = ${orgId}`
    ) as any[];

    if (!branding?.custom_domain) throw new Error("请先设置自定义域名");

    // 实际生产环境：通过 DNS 查询验证 TXT 记录
    // 沙箱环境：直接标记为已验证
    const isVerified = process.env.NODE_ENV !== "production" || await checkDnsTxt(branding.custom_domain, branding.domain_verify_token);

    if (isVerified) {
      await ctx.db.execute(sql`
        UPDATE org_branding SET domain_verified = 1 WHERE org_id = ${orgId}
      `);
      return { success: true, verified: true, message: "域名验证成功" };
    }
    return { success: false, verified: false, message: "DNS TXT 记录未找到，请检查配置后重试" };
  }),

  // 更新报告模板（页眉/页脚/水印）
  updateReportTemplate: protectedProcedure
    .input(z.object({
      reportHeader: z.string().optional(),
      reportFooter: z.string().optional(),
      reportWatermark: z.string().max(50).optional(),
      reportLogoUrl: z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      await ctx.db.execute(sql`
        INSERT INTO org_branding (org_id, report_header, report_footer, report_watermark, report_logo_url)
        VALUES (${orgId}, ${input.reportHeader || null}, ${input.reportFooter || null},
          ${input.reportWatermark || null}, ${input.reportLogoUrl || null})
        ON DUPLICATE KEY UPDATE
          report_header = COALESCE(${input.reportHeader || null}, report_header),
          report_footer = COALESCE(${input.reportFooter || null}, report_footer),
          report_watermark = COALESCE(${input.reportWatermark || null}, report_watermark),
          report_logo_url = COALESCE(${input.reportLogoUrl || null}, report_logo_url),
          updated_at = NOW()
      `);
      return { success: true };
    }),

  // 更新邮件配置
  updateEmailConfig: protectedProcedure
    .input(z.object({
      emailFromName: z.string().max(100).optional(),
      emailFromAddr: z.string().email().optional(),
      emailSmtpHost: z.string().optional(),
      emailSmtpPort: z.number().int().min(1).max(65535).optional(),
      emailSmtpUser: z.string().optional(),
      emailSmtpPass: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      await ctx.db.execute(sql`
        INSERT INTO org_branding (org_id, email_from_name, email_from_addr, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_pass)
        VALUES (${orgId}, ${input.emailFromName || null}, ${input.emailFromAddr || null},
          ${input.emailSmtpHost || null}, ${input.emailSmtpPort || 465},
          ${input.emailSmtpUser || null}, ${input.emailSmtpPass || null})
        ON DUPLICATE KEY UPDATE
          email_from_name = COALESCE(${input.emailFromName || null}, email_from_name),
          email_from_addr = COALESCE(${input.emailFromAddr || null}, email_from_addr),
          email_smtp_host = COALESCE(${input.emailSmtpHost || null}, email_smtp_host),
          email_smtp_port = COALESCE(${input.emailSmtpPort || null}, email_smtp_port),
          email_smtp_user = COALESCE(${input.emailSmtpUser || null}, email_smtp_user),
          email_smtp_pass = COALESCE(${input.emailSmtpPass || null}, email_smtp_pass),
          updated_at = NOW()
      `);
      return { success: true };
    }),

  // 更新短信配置
  updateSmsConfig: protectedProcedure
    .input(z.object({
      smsSign: z.string().max(50).optional(),
      smsProvider: z.enum(["aliyun", "tencent", "mock"]).optional(),
      smsAccessKey: z.string().optional(),
      smsSecretKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      await ctx.db.execute(sql`
        INSERT INTO org_branding (org_id, sms_sign, sms_provider, sms_access_key, sms_secret_key)
        VALUES (${orgId}, ${input.smsSign || null}, ${input.smsProvider || "mock"},
          ${input.smsAccessKey || null}, ${input.smsSecretKey || null})
        ON DUPLICATE KEY UPDATE
          sms_sign = COALESCE(${input.smsSign || null}, sms_sign),
          sms_provider = COALESCE(${input.smsProvider || null}, sms_provider),
          sms_access_key = COALESCE(${input.smsAccessKey || null}, sms_access_key),
          sms_secret_key = COALESCE(${input.smsSecretKey || null}, sms_secret_key),
          updated_at = NOW()
      `);
      return { success: true };
    }),

  // 管理员：查看所有机构白标配置
  adminList: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const items = await ctx.db.execute(sql`
        SELECT ob.*, o.name as org_name, o.type as org_type
        FROM org_branding ob
        JOIN organizations o ON ob.org_id = o.id
        ORDER BY ob.updated_at DESC LIMIT ${input.pageSize} OFFSET ${offset}
      `) as any[];
      const [{ total }] = await ctx.db.execute(sql`SELECT COUNT(*) as total FROM org_branding`) as any[];
      return { items, total: Number(total) };
    }),
});

// DNS TXT 验证（生产环境）
async function checkDnsTxt(domain: string, token: string): Promise<boolean> {
  try {
    const { promises: dns } = await import("dns");
    const records = await dns.resolveTxt(`_gujia-verify.${domain}`);
    return records.some(r => r.join("").includes(token));
  } catch { return false; }
}
