/**
 * 支付路由
 * tRPC: 创建订单、查询订单、订单列表、沙箱模拟支付
 * Express: 微信/支付宝异步回调（在 index.ts 注册）
 */
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../lib/trpc";
import { sql } from "drizzle-orm";
import { createPaymentOrder, verifyWechatNotify, verifyAlipayNotify, generateOrderNo, IS_SANDBOX } from "../lib/payment-service";

export const paymentRouter = router({
  // 创建支付订单
  createOrder: protectedProcedure
    .input(z.object({
      planCode: z.string(),
      billingCycle: z.enum(["monthly", "yearly"]),
      channel: z.enum(["wechat", "alipay"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.user.orgId;
      if (!orgId) throw new Error("请先加入或创建机构");

      // 获取套餐信息
      const [plan] = await ctx.db.execute(
        sql`SELECT * FROM subscription_plans WHERE code = ${input.planCode} AND is_active = 1`
      ) as any[];
      if (!plan) throw new Error("套餐不存在");

      const amount = input.billingCycle === "yearly"
        ? Math.round(plan.price_yearly * 100)
        : Math.round(plan.price_monthly * 100);

      const description = `${plan.name}（${input.billingCycle === "yearly" ? "年付" : "月付"}）`;

      const result = await createPaymentOrder({
        orgId, userId: ctx.user.id,
        planCode: input.planCode,
        billingCycle: input.billingCycle,
        amount, channel: input.channel, description,
      });

      // 写入数据库
      const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟过期
      await ctx.db.execute(sql`
        INSERT INTO payment_orders (order_no, org_id, user_id, plan_code, billing_cycle, amount, channel, status, pay_url, qr_code, expired_at)
        VALUES (${result.orderNo}, ${orgId}, ${ctx.user.id}, ${input.planCode}, ${input.billingCycle}, ${amount}, ${input.channel}, 'pending', ${result.payUrl || ""}, ${(result as any).qrCode || ""}, ${expiredAt})
      `);

      return {
        orderNo: result.orderNo,
        payUrl: result.payUrl,
        qrCode: (result as any).qrCode || null,
        amount,
        channel: input.channel,
        isSandbox: IS_SANDBOX,
        expiredAt,
      };
    }),

  // 查询订单状态
  queryOrder: protectedProcedure
    .input(z.object({ orderNo: z.string() }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db.execute(
        sql`SELECT po.*, sp.name as plan_name FROM payment_orders po
            LEFT JOIN subscription_plans sp ON po.plan_code = sp.code
            WHERE po.order_no = ${input.orderNo} AND po.user_id = ${ctx.user.id}`
      ) as any[];
      if (!order) throw new Error("订单不存在");
      return order;
    }),

  // 我的订单列表
  myOrders: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const orgId = ctx.user.orgId;
      const items = await ctx.db.execute(
        sql`SELECT po.*, sp.name as plan_name FROM payment_orders po
            LEFT JOIN subscription_plans sp ON po.plan_code = sp.code
            WHERE po.org_id = ${orgId}
            ORDER BY po.created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}`
      ) as any[];
      const [{ total }] = await ctx.db.execute(
        sql`SELECT COUNT(*) as total FROM payment_orders WHERE org_id = ${orgId}`
      ) as any[];
      return { items, total: Number(total), page: input.page, pageSize: input.pageSize };
    }),

  // 沙箱模拟支付成功（仅开发/测试环境）
  sandboxPay: protectedProcedure
    .input(z.object({ orderNo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!IS_SANDBOX) throw new Error("仅沙箱环境可用");

      const [order] = await ctx.db.execute(
        sql`SELECT * FROM payment_orders WHERE order_no = ${input.orderNo} AND user_id = ${ctx.user.id}`
      ) as any[];
      if (!order) throw new Error("订单不存在");
      if (order.status === "paid") return { success: true, message: "已支付" };

      // 标记支付成功
      await ctx.db.execute(sql`
        UPDATE payment_orders SET status = 'paid', paid_at = NOW(), out_trade_no = ${`sandbox_${Date.now()}`}
        WHERE order_no = ${input.orderNo}
      `);

      // 激活订阅
      const months = order.billing_cycle === "yearly" ? 12 : 1;
      const expireAt = new Date();
      expireAt.setMonth(expireAt.getMonth() + months);

      await ctx.db.execute(sql`
        INSERT INTO org_subscriptions (org_id, plan_id, status, billing_cycle, current_period_start, current_period_end, updated_at)
        SELECT ${order.org_id}, id, 'active', ${order.billing_cycle}, NOW(), ${expireAt}, NOW()
        FROM subscription_plans WHERE code = ${order.plan_code}
        ON DUPLICATE KEY UPDATE
          plan_id = VALUES(plan_id), status = 'active',
          billing_cycle = VALUES(billing_cycle),
          current_period_start = NOW(), current_period_end = VALUES(current_period_end),
          updated_at = NOW()
      `);

      // 写入账单记录
      await ctx.db.execute(sql`
        INSERT INTO billing_records (org_id, type, description, amount, status, created_at)
        VALUES (${order.org_id}, 'subscription', ${`沙箱支付：订单 ${input.orderNo}`}, ${order.amount}, 'paid', NOW())
      `);

      return { success: true, message: "沙箱支付成功，订阅已激活" };
    }),

  // 管理员：所有订单
  adminOrders: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(20),
      status: z.string().optional(),
      channel: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      const where = [
        input.status ? `po.status = '${input.status}'` : null,
        input.channel ? `po.channel = '${input.channel}'` : null,
      ].filter(Boolean).join(" AND ");
      const whereClause = where ? `WHERE ${where}` : "";

      const items = await ctx.db.execute(
        sql.raw(`SELECT po.*, sp.name as plan_name, o.name as org_name, u.name as user_name
          FROM payment_orders po
          LEFT JOIN subscription_plans sp ON po.plan_code = sp.code
          LEFT JOIN organizations o ON po.org_id = o.id
          LEFT JOIN users u ON po.user_id = u.id
          ${whereClause}
          ORDER BY po.created_at DESC LIMIT ${input.pageSize} OFFSET ${offset}`)
      ) as any[];

      const [{ total }] = await ctx.db.execute(
        sql.raw(`SELECT COUNT(*) as total FROM payment_orders po ${whereClause}`)
      ) as any[];

      // 收入统计
      const [stats] = await ctx.db.execute(sql`
        SELECT
          SUM(CASE WHEN status='paid' THEN amount ELSE 0 END) as total_revenue,
          COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count
        FROM payment_orders
      `) as any[];

      return { items, total: Number(total), stats, page: input.page, pageSize: input.pageSize };
    }),
});

// ============================================================
// Express 回调处理函数（在 index.ts 中注册为 HTTP 路由）
// ============================================================
import type { Request, Response } from "express";
import { db } from "../lib/db";

export async function handleWechatNotify(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!verifyWechatNotify(body)) {
      return res.send("<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>");
    }
    if (body.result_code === "SUCCESS") {
      await processPaymentSuccess(body.out_trade_no, body.transaction_id, "wechat", body);
    }
    res.send("<xml><return_code><![CDATA[OK]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>");
  } catch (e) {
    console.error("[WechatNotify]", e);
    res.send("<xml><return_code><![CDATA[FAIL]]></return_code></xml>");
  }
}

export async function handleAlipayNotify(req: Request, res: Response) {
  try {
    const params = req.body;
    if (!verifyAlipayNotify(params)) {
      return res.send("fail");
    }
    if (params.trade_status === "TRADE_SUCCESS" || params.trade_status === "TRADE_FINISHED") {
      await processPaymentSuccess(params.out_trade_no, params.trade_no, "alipay", params);
    }
    res.send("success");
  } catch (e) {
    console.error("[AlipayNotify]", e);
    res.send("fail");
  }
}

async function processPaymentSuccess(orderNo: string, outTradeNo: string, channel: string, rawData: any) {
  const [order] = await db.execute(
    sql`SELECT * FROM payment_orders WHERE order_no = ${orderNo}`
  ) as any[];
  if (!order || order.status === "paid") return;

  await db.execute(sql`
    UPDATE payment_orders SET status = 'paid', paid_at = NOW(),
      out_trade_no = ${outTradeNo}, notify_data = ${JSON.stringify(rawData)}
    WHERE order_no = ${orderNo}
  `);

  const months = order.billing_cycle === "yearly" ? 12 : 1;
  const expireAt = new Date();
  expireAt.setMonth(expireAt.getMonth() + months);

  await db.execute(sql`
    INSERT INTO org_subscriptions (org_id, plan_id, status, billing_cycle, current_period_start, current_period_end, updated_at)
    SELECT ${order.org_id}, id, 'active', ${order.billing_cycle}, NOW(), ${expireAt}, NOW()
    FROM subscription_plans WHERE code = ${order.plan_code}
    ON DUPLICATE KEY UPDATE
      plan_id = VALUES(plan_id), status = 'active',
      billing_cycle = VALUES(billing_cycle),
      current_period_start = NOW(), current_period_end = VALUES(current_period_end),
      updated_at = NOW()
  `);

  await db.execute(sql`
    INSERT INTO billing_records (org_id, type, description, amount, status, created_at)
    VALUES (${order.org_id}, 'subscription', ${`${channel === "wechat" ? "微信" : "支付宝"}支付：${orderNo}`}, ${order.amount}, 'paid', NOW())
  `);

  console.log(`[Payment] 订单 ${orderNo} 支付成功，机构 ${order.org_id} 订阅已激活`);
}
