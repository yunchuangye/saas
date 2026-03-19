/**
 * 平台超管路由（Platform Admin）
 * 完全独立于 SaaS 租户，使用独立的 platform_admins 表和 JWT
 * 职责：租户管理、收入监控、内容运营、数据运营
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../lib/trpc";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const PLATFORM_JWT_SECRET = process.env.PLATFORM_JWT_SECRET || "platform-admin-secret-2026";

// 平台超管专用 procedure（检查 role === 'platform_admin'）
const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "platform_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅平台超管可访问此接口" });
  }
  return next({ ctx });
});

export const platformAdminRouter = router({
  // ============================================================
  // 平台超管认证（独立登录，不与 SaaS 租户混用）
  // ============================================================

  /** 平台超管登录 */
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT * FROM platform_admins WHERE (username=? OR email=?) AND is_active=1`,
        [input.username, input.username]
      )) as any;
      const admin = (rows as any)[0];
      if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "账号不存在或已禁用" });

      // 首次登录时密码为占位符，允许任意密码并强制修改
      let passwordValid = false;
      if (admin.password_hash.startsWith("$2b$")) {
        passwordValid = await bcrypt.compare(input.password, admin.password_hash);
      } else {
        // 占位符密码，首次登录强制修改
        passwordValid = true;
      }
      if (!passwordValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "密码错误" });

      // 更新最后登录时间
      await ctx.db.execute(sql.raw(
        `UPDATE platform_admins SET last_login_at=NOW() WHERE id=?`,
        [admin.id]
      ));

      // 生成平台超管专用 JWT（role: platform_admin）
      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: "platform_admin" },
        PLATFORM_JWT_SECRET,
        { expiresIn: "24h" }
      );

      // 写入操作日志
      await ctx.db.execute(sql.raw(
        `INSERT INTO platform_operation_logs (admin_id, action, details) VALUES (?,?,?)`,
        [admin.id, "login", JSON.stringify({ username: admin.username })]
      ));

      return {
        token,
        admin: { id: admin.id, username: admin.username, name: admin.name, email: admin.email },
        isFirstLogin: !admin.password_hash.startsWith("$2b$"),
      };
    }),

  /** 修改平台超管密码 */
  changePassword: platformAdminProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT password_hash FROM platform_admins WHERE id=?`, [ctx.user.id]
      )) as any;
      const admin = (rows as any)[0];
      if (!admin) throw new TRPCError({ code: "NOT_FOUND" });
      if (admin.password_hash.startsWith("$2b$")) {
        const valid = await bcrypt.compare(input.currentPassword, admin.password_hash);
        if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "当前密码错误" });
      }
      const newHash = await bcrypt.hash(input.newPassword, 10);
      await ctx.db.execute(sql.raw(`UPDATE platform_admins SET password_hash=? WHERE id=?`, [newHash, ctx.user.id]));
      return { success: true };
    }),

  // ============================================================
  // 租户管理（SaaS 机构管理）
  // ============================================================

  /** 获取所有租户（机构）列表 */
  listTenants: platformAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      keyword: z.string().optional(),
      orgType: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, keyword, orgType, status } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE 1=1";
      const params: any[] = [];
      if (keyword) { where += " AND (o.name LIKE ? OR o.contact_email LIKE ?)"; params.push(`%${keyword}%`, `%${keyword}%`); }
      if (orgType) { where += " AND o.org_type = ?"; params.push(orgType); }
      if (status) { where += " AND o.status = ?"; params.push(status); }
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT o.*, 
          (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
          (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) as project_count,
          os.plan_id, os.status as sub_status, os.expires_at as sub_expires
         FROM organizations o 
         LEFT JOIN org_subscriptions os ON o.id = os.org_id AND os.status = 'active'
         ${where} ORDER BY o.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total FROM organizations o ${where}`, params
      )) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),

  /** 获取租户详情 */
  getTenant: platformAdminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT o.*, 
          (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id) as user_count,
          (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) as project_count,
          (SELECT SUM(agreed_price) FROM transactions t WHERE t.org_id = o.id AND t.status='completed') as total_transaction_amount
         FROM organizations o WHERE o.id = ?`,
        [input.id]
      )) as any;
      if (!(rows as any)[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return (rows as any)[0];
    }),

  /** 审核租户（通过/拒绝注册） */
  reviewTenant: platformAdminProcedure
    .input(z.object({
      orgId: z.number(),
      action: z.enum(["approve", "reject", "suspend", "reactivate"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const statusMap: Record<string, string> = {
        approve: "active",
        reject: "rejected",
        suspend: "suspended",
        reactivate: "active",
      };
      await ctx.db.execute(sql.raw(
        `UPDATE organizations SET status=? WHERE id=?`,
        [statusMap[input.action], input.orgId]
      ));
      await ctx.db.execute(sql.raw(
        `INSERT INTO platform_operation_logs (admin_id, action, target_type, target_id, details) VALUES (?,?,?,?,?)`,
        [ctx.user.id, `tenant_${input.action}`, "organization", String(input.orgId), JSON.stringify({ reason: input.reason })]
      ));
      return { success: true };
    }),

  /** 强制修改租户套餐 */
  setTenantPlan: platformAdminProcedure
    .input(z.object({
      orgId: z.number(),
      planId: z.string(),
      expiresAt: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 更新或插入订阅记录
      await ctx.db.execute(sql.raw(
        `INSERT INTO org_subscriptions (org_id, plan_id, status, start_date, expires_at) VALUES (?,?,'active',NOW(),?) ON DUPLICATE KEY UPDATE plan_id=?, status='active', expires_at=?`,
        [input.orgId, input.planId, input.expiresAt||null, input.planId, input.expiresAt||null]
      ));
      await ctx.db.execute(sql.raw(
        `INSERT INTO platform_operation_logs (admin_id, action, target_type, target_id, details) VALUES (?,?,?,?,?)`,
        [ctx.user.id, "set_tenant_plan", "organization", String(input.orgId), JSON.stringify({ planId: input.planId, reason: input.reason })]
      ));
      return { success: true };
    }),

  // ============================================================
  // 平台收入监控
  // ============================================================

  /** 平台收入概览 */
  revenueOverview: platformAdminProcedure
    .query(async ({ ctx }) => {
      // 本月收入
      const [monthRows] = await ctx.db.execute(sql.raw(
        `SELECT SUM(amount) as revenue FROM billing_records WHERE status='paid' AND DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m')`
      )) as any;
      // 上月收入
      const [lastMonthRows] = await ctx.db.execute(sql.raw(
        `SELECT SUM(amount) as revenue FROM billing_records WHERE status='paid' AND DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(),INTERVAL 1 MONTH),'%Y-%m')`
      )) as any;
      // 年度收入
      const [yearRows] = await ctx.db.execute(sql.raw(
        `SELECT SUM(amount) as revenue FROM billing_records WHERE status='paid' AND YEAR(created_at) = YEAR(NOW())`
      )) as any;
      // 活跃订阅数
      const [subRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as count, plan_id FROM org_subscriptions WHERE status='active' GROUP BY plan_id`
      )) as any;
      // 近12个月收入趋势
      const [trendRows] = await ctx.db.execute(sql.raw(
        `SELECT DATE_FORMAT(created_at,'%Y-%m') as month, SUM(amount) as revenue, COUNT(*) as orders FROM billing_records WHERE status='paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month`
      )) as any;
      // 租户总数
      const [tenantRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN created_at >= DATE_SUB(NOW(),INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_30d FROM organizations`
      )) as any;
      return {
        monthRevenue: Number((monthRows as any)[0]?.revenue || 0),
        lastMonthRevenue: Number((lastMonthRows as any)[0]?.revenue || 0),
        yearRevenue: Number((yearRows as any)[0]?.revenue || 0),
        subscriptions: subRows,
        revenueTrend: trendRows,
        tenants: (tenantRows as any)[0],
      };
    }),

  /** 平台全局统计 */
  platformStats: platformAdminProcedure
    .query(async ({ ctx }) => {
      const [userRows] = await ctx.db.execute(sql.raw(
        `SELECT role, COUNT(*) as count FROM users GROUP BY role`
      )) as any;
      const [projectRows] = await ctx.db.execute(sql.raw(
        `SELECT status, COUNT(*) as count FROM projects GROUP BY status`
      )) as any;
      const [reportRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved FROM reports`
      )) as any;
      const [listingRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status='sold' THEN 1 ELSE 0 END) as sold FROM listings`
      )) as any;
      const [txRows] = await ctx.db.execute(sql.raw(
        `SELECT COUNT(*) as total, SUM(agreed_price) as total_amount FROM transactions WHERE status='completed'`
      )) as any;
      return {
        users: userRows,
        projects: projectRows,
        reports: (reportRows as any)[0],
        listings: (listingRows as any)[0],
        transactions: (txRows as any)[0],
      };
    }),

  // ============================================================
  // 内容运营
  // ============================================================

  /** 获取平台公告列表 */
  listAnnouncements: platformAdminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT * FROM news WHERE type='announcement' ORDER BY created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}`
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM news WHERE type='announcement'`)) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0 };
    }),

  /** 发布平台公告 */
  publishAnnouncement: platformAdminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.execute(sql.raw(
        `INSERT INTO news (title, content, type, status, author_id, is_pinned) VALUES (?,?,'announcement','published',?,?)`,
        [input.title, input.content, ctx.user.id, input.isPinned ? 1 : 0]
      ));
      await ctx.db.execute(sql.raw(
        `INSERT INTO platform_operation_logs (admin_id, action, details) VALUES (?,?,?)`,
        [ctx.user.id, "publish_announcement", JSON.stringify({ title: input.title })]
      ));
      return { success: true };
    }),

  // ============================================================
  // 操作日志
  // ============================================================

  /** 获取平台操作日志 */
  listOperationLogs: platformAdminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(50),
      action: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, action } = input;
      const offset = (page - 1) * pageSize;
      let where = "WHERE 1=1";
      const params: any[] = [];
      if (action) { where += " AND l.action = ?"; params.push(action); }
      const [rows] = await ctx.db.execute(sql.raw(
        `SELECT l.*, a.name as admin_name FROM platform_operation_logs l LEFT JOIN platform_admins a ON l.admin_id = a.id ${where} ORDER BY l.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
        params
      )) as any;
      const [countRows] = await ctx.db.execute(sql.raw(`SELECT COUNT(*) as total FROM platform_operation_logs l ${where}`, params)) as any;
      return { items: rows, total: (countRows as any)[0]?.total || 0, page, pageSize };
    }),
});
