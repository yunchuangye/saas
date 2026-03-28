/**
 * SaaS 订阅计费路由
 * 建议书商业化模块
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import crypto from "crypto";

// ============================================================
// 安全白名单映射：将枚举值映射为合法的列名字符串
// 避免 sql.raw(userInput) 导致的 SQL 注入风险
// ============================================================

/** feature 枚举 → subscription_plans 表中对应的列名 */
const FEATURE_COLUMN_MAP: Record<string, string> = {
  three_level_review: "feature_three_level_review",
  work_sheets:        "feature_work_sheets",
  batch_valuation:    "feature_batch_valuation",
  api_access:         "feature_api_access",
  white_label:        "feature_white_label",
  priority_support:   "feature_priority_support",
};

/** quota type 枚举 → org_subscriptions / subscription_plans 表中对应的列名 */
const QUOTA_USED_COLUMN_MAP: Record<string, string> = {
  projects:  "used_projects",
  reports:   "used_reports",
  avm_calls: "used_avm_calls",
  api_calls: "used_api_calls",
};

const QUOTA_LIMIT_COLUMN_MAP: Record<string, string> = {
  projects:  "quota_projects",
  reports:   "quota_reports",
  avm_calls: "quota_avm_calls",
  api_calls: "quota_api_calls",
};

export const billingRouter = router({
  /**
   * 获取所有订阅计划（公开）
   */
  getPlans: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(
      sql`SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC`
    ) as any;
    return result[0] ?? [];
  }),

  /**
   * 获取当前机构的订阅信息
   */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId;
    if (!orgId) return null;

    const result = await ctx.db.execute(
      sql`SELECT os.*, sp.name as plan_name, sp.code as plan_code, sp.price_monthly, sp.price_yearly,
        sp.quota_projects, sp.quota_reports, sp.quota_avm_calls, sp.quota_api_calls, sp.quota_users,
        sp.feature_three_level_review, sp.feature_work_sheets, sp.feature_batch_valuation,
        sp.feature_api_access, sp.feature_white_label, sp.feature_priority_support
      FROM org_subscriptions os
      JOIN subscription_plans sp ON os.plan_id = sp.id
      WHERE os.org_id = ${orgId} AND os.status IN ('active','trial')
      ORDER BY os.created_at DESC
      LIMIT 1`
    ) as any;

    return result[0]?.[0] ?? null;
  }),

  /**
   * 检查功能权限
   */
  checkFeature: protectedProcedure
    .input(z.object({
      feature: z.enum([
        "three_level_review",
        "work_sheets",
        "batch_valuation",
        "api_access",
        "white_label",
        "priority_support",
      ]),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) return { allowed: false, reason: "未加入机构" };

      // 安全修复：通过白名单映射获取列名，杜绝 sql.raw(userInput) 注入
      const featureCol = FEATURE_COLUMN_MAP[input.feature];
      if (!featureCol) return { allowed: false, reason: "未知功能项" };

      // 使用 sql.raw() 时列名已经过白名单校验，不存在注入风险
      const result = await ctx.db.execute(
        sql`SELECT sp.${sql.raw(featureCol)} as allowed
        FROM org_subscriptions os
        JOIN subscription_plans sp ON os.plan_id = sp.id
        WHERE os.org_id = ${orgId} AND os.status IN ('active','trial')
        ORDER BY os.created_at DESC LIMIT 1`
      ) as any;

      const row = result[0]?.[0];
      if (!row) return { allowed: false, reason: "未找到有效订阅" };
      return { allowed: Boolean(row.allowed), reason: row.allowed ? null : "当前套餐不支持此功能，请升级" };
    }),

  /**
   * 检查配额用量
   */
  checkQuota: protectedProcedure
    .input(z.object({
      type: z.enum(["projects", "reports", "avm_calls", "api_calls"]),
    }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) return { allowed: false, used: 0, limit: 0, remaining: 0 };

      // 安全修复：通过白名单映射获取列名，杜绝 sql.raw(userInput) 注入
      const usedCol  = QUOTA_USED_COLUMN_MAP[input.type];
      const limitCol = QUOTA_LIMIT_COLUMN_MAP[input.type];
      if (!usedCol || !limitCol) return { allowed: false, used: 0, limit: 0, remaining: 0 };

      const result = await ctx.db.execute(
        sql`SELECT 
          os.${sql.raw(usedCol)} as used,
          sp.${sql.raw(limitCol)} as quota_limit
        FROM org_subscriptions os
        JOIN subscription_plans sp ON os.plan_id = sp.id
        WHERE os.org_id = ${orgId} AND os.status IN ('active','trial')
        ORDER BY os.created_at DESC LIMIT 1`
      ) as any;

      const row = result[0]?.[0];
      if (!row) return { allowed: false, used: 0, limit: 0, remaining: 0 };

      const used = Number(row.used) || 0;
      const limit = Number(row.quota_limit) || 0;
      const unlimited = limit === -1;
      const remaining = unlimited ? 999999 : Math.max(0, limit - used);
      const allowed = unlimited || remaining > 0;

      return { allowed, used, limit, remaining, unlimited };
    }),

  /**
   * 消耗配额（内部调用）
   */
  consumeQuota: protectedProcedure
    .input(z.object({
      type: z.enum(["projects", "reports", "avm_calls", "api_calls"]),
      amount: z.number().default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) return { success: false };

      // 安全修复：通过白名单映射获取列名，杜绝 sql.raw(userInput) 注入
      const usedColForUpdate = QUOTA_USED_COLUMN_MAP[input.type];
      if (!usedColForUpdate) return { success: false };

      await ctx.db.execute(
        sql`UPDATE org_subscriptions SET
          ${sql.raw(usedColForUpdate)} = ${sql.raw(usedColForUpdate)} + ${input.amount},
          updated_at = NOW()
        WHERE org_id = ${orgId} AND status IN ('active','trial')`
      );
      return { success: true };
    }),

  /**
   * 订阅计划（模拟，实际需对接支付）
   */
  subscribe: protectedProcedure
    .input(z.object({
      planCode: z.string(),
      billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      // 获取计划信息
      const planResult = await ctx.db.execute(
        sql`SELECT * FROM subscription_plans WHERE code = ${input.planCode} AND is_active = 1`
      ) as any;
      const plan = planResult[0]?.[0];
      if (!plan) throw new Error("订阅计划不存在");

      const now = new Date();
      const expiresAt = new Date(now);
      if (input.billingCycle === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const amount = input.billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;

      // 取消旧订阅
      await ctx.db.execute(
        sql`UPDATE org_subscriptions SET status = 'cancelled', updated_at = NOW()
        WHERE org_id = ${orgId} AND status IN ('active','trial')`
      );

      // 创建新订阅
      await ctx.db.execute(
        sql`INSERT INTO org_subscriptions 
          (org_id, plan_id, status, billing_cycle, started_at, expires_at, usage_reset_at, amount_paid)
        VALUES 
          (${orgId}, ${plan.id}, 'active', ${input.billingCycle}, NOW(), ${expiresAt.toISOString().slice(0, 19)}, NOW(), ${amount})`
      );

      // 创建账单记录
      await ctx.db.execute(
        sql`INSERT INTO billing_records (org_id, type, description, amount, status, paid_at)
        VALUES (${orgId}, 'subscription', ${`订阅 ${plan.name}（${input.billingCycle === "yearly" ? "年付" : "月付"}）`}, ${amount}, 'paid', NOW())`
      );

      return { success: true, message: `成功订阅 ${plan.name}`, expiresAt };
    }),

  /**
   * 获取账单历史
   */
  getBillingHistory: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.pageSize;
      const result = await ctx.db.execute(
        sql`SELECT * FROM billing_records WHERE org_id = ${orgId}
        ORDER BY created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any;

      const countResult = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM billing_records WHERE org_id = ${orgId}`
      ) as any;

      return {
        items: result[0] ?? [],
        total: countResult[0]?.[0]?.total ?? 0,
      };
    }),

  /**
   * 获取 API 密钥列表
   */
  getApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.user.orgId;
    if (!orgId) return [];

    const result = await ctx.db.execute(
      sql`SELECT id, name, key_prefix, scopes, rate_limit_per_min, is_active, last_used_at, expires_at, total_calls, created_at
      FROM api_keys WHERE org_id = ${orgId}
      ORDER BY created_at DESC`
    ) as any;
    return result[0] ?? [];
  }),

  /**
   * 创建 API 密钥
   */
  createApiKey: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      scopes: z.array(z.string()).default(["valuation:read"]),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入机构");

      // 生成 API 密钥
      const rawKey = `gj_${crypto.randomBytes(32).toString("hex")}`;
      const keyPrefix = rawKey.substring(0, 10);
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString().slice(0, 19)
        : null;

      await ctx.db.execute(
        sql`INSERT INTO api_keys (org_id, user_id, name, key_prefix, key_hash, scopes, expires_at)
        VALUES (${orgId}, ${ctx.user.id}, ${input.name}, ${keyPrefix}, ${keyHash}, ${JSON.stringify(input.scopes)}, ${expiresAt})`
      );

      // 只在创建时返回完整密钥，之后不再显示
      return { success: true, apiKey: rawKey, keyPrefix, message: "请立即保存此密钥，关闭后将无法再次查看" };
    }),

  /**
   * 禁用/启用 API 密钥
   */
  toggleApiKey: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.execute(
        sql`UPDATE api_keys SET is_active = ${input.isActive ? 1 : 0}, updated_at = NOW()
        WHERE id = ${input.id} AND org_id = ${ctx.user.orgId}`
      );
      return { success: true };
    }),

  /**
   * 删除 API 密钥
   */
  deleteApiKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.execute(
        sql`DELETE FROM api_keys WHERE id = ${input.id} AND org_id = ${ctx.user.orgId}`
      );
      return { success: true };
    }),

  /**
   * 用量统计（管理员）
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.execute(
      sql`SELECT 
        sp.name as plan_name,
        sp.code as plan_code,
        COUNT(os.id) as org_count,
        SUM(br.amount) as total_revenue
      FROM org_subscriptions os
      JOIN subscription_plans sp ON os.plan_id = sp.id
      LEFT JOIN billing_records br ON br.org_id = os.org_id AND br.status = 'paid'
      WHERE os.status IN ('active', 'trial')
      GROUP BY sp.id, sp.name, sp.code
      ORDER BY sp.sort_order`
    ) as any;
    return result[0] ?? [];
  }),
});
