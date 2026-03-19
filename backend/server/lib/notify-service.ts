/**
 * 通知服务
 * 支持：站内信（已有）、邮件（nodemailer）、短信（阿里云/腾讯云/mock）
 * 审核流转事件自动触发通知
 */
import nodemailer from "nodemailer";
import { db } from "./db";
import { sql } from "drizzle-orm";

// ============================================================
// 事件类型定义
// ============================================================
export type NotifyEvent =
  | "project.created"        // 新项目发布
  | "project.awarded"        // 项目中标
  | "project.bid_received"   // 收到新报价
  | "report.submitted"       // 报告提交审核
  | "report.approved"        // 报告审核通过
  | "report.rejected"        // 报告被驳回
  | "report.signed"          // 报告已签章
  | "review.internal"        // 内部复核完成
  | "review.peer"            // 同行评审完成
  | "review.chief"           // 主任审核完成
  | "seal.approved"          // 签章审核通过
  | "seal.rejected"          // 签章审核拒绝
  | "payment.success"        // 支付成功
  | "subscription.expiring"  // 订阅即将到期
  | "system.announcement";   // 系统公告

// 事件对应的通知模板
const EVENT_TEMPLATES: Record<NotifyEvent, { title: string; content: (data: any) => string; emailSubject?: string }> = {
  "project.created": {
    title: "新项目发布",
    content: (d) => `新项目「${d.projectTitle}」已发布，截止报价时间：${d.deadline}，请及时查看并提交报价。`,
    emailSubject: "【估价平台】新项目发布通知",
  },
  "project.awarded": {
    title: "恭喜中标",
    content: (d) => `您的机构已中标项目「${d.projectTitle}」，请及时安排评估师开展工作。`,
    emailSubject: "【估价平台】项目中标通知",
  },
  "project.bid_received": {
    title: "收到新报价",
    content: (d) => `项目「${d.projectTitle}」收到来自「${d.orgName}」的新报价，请登录查看。`,
    emailSubject: "【估价平台】收到新报价通知",
  },
  "report.submitted": {
    title: "报告已提交审核",
    content: (d) => `评估师「${d.authorName}」提交了报告「${d.reportTitle}」，请及时进行审核。`,
    emailSubject: "【估价平台】报告待审核通知",
  },
  "report.approved": {
    title: "报告审核通过",
    content: (d) => `您的报告「${d.reportTitle}」已通过审核${d.reviewerName ? `（审核人：${d.reviewerName}）` : ""}。`,
    emailSubject: "【估价平台】报告审核通过",
  },
  "report.rejected": {
    title: "报告被驳回",
    content: (d) => `您的报告「${d.reportTitle}」被驳回，原因：${d.reason || "请联系审核人了解详情"}。`,
    emailSubject: "【估价平台】报告审核未通过",
  },
  "report.signed": {
    title: "报告已完成签章",
    content: (d) => `报告「${d.reportTitle}」已完成电子签章，可下载已签章版本。`,
    emailSubject: "【估价平台】报告签章完成",
  },
  "review.internal": {
    title: "内部复核完成",
    content: (d) => `报告「${d.reportTitle}」内部复核已完成，结论：${d.conclusion}，请进行下一步审核。`,
    emailSubject: "【估价平台】内部复核完成",
  },
  "review.peer": {
    title: "同行评审完成",
    content: (d) => `报告「${d.reportTitle}」同行评审已完成，评分：${d.score}分，请主任进行最终审核。`,
    emailSubject: "【估价平台】同行评审完成",
  },
  "review.chief": {
    title: "主任审核完成",
    content: (d) => `报告「${d.reportTitle}」主任审核已完成，结论：${d.conclusion}。`,
    emailSubject: "【估价平台】主任审核完成",
  },
  "seal.approved": {
    title: "签章审核通过",
    content: (d) => `您上传的「${d.sealName}」已通过审核，可以开始使用。`,
    emailSubject: "【估价平台】签章审核通过",
  },
  "seal.rejected": {
    title: "签章审核未通过",
    content: (d) => `您上传的「${d.sealName}」审核未通过，原因：${d.reason}，请重新上传。`,
    emailSubject: "【估价平台】签章审核未通过",
  },
  "payment.success": {
    title: "支付成功",
    content: (d) => `订单 ${d.orderNo} 支付成功，已为您激活「${d.planName}」订阅，有效期至 ${d.expireDate}。`,
    emailSubject: "【估价平台】支付成功确认",
  },
  "subscription.expiring": {
    title: "订阅即将到期",
    content: (d) => `您的「${d.planName}」订阅将于 ${d.expireDate} 到期（还剩 ${d.daysLeft} 天），请及时续费。`,
    emailSubject: "【估价平台】订阅即将到期提醒",
  },
  "system.announcement": {
    title: "系统公告",
    content: (d) => d.content || "请查看最新系统公告。",
    emailSubject: "【估价平台】系统公告",
  },
};

// ============================================================
// 邮件发送
// ============================================================
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_SMTP_PASS,
    },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return true; // mock 模式
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "估价平台"}" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
    return true;
  } catch (e) {
    console.error("[Email Error]", e);
    return false;
  }
}

function buildEmailHtml(title: string, content: string, actionUrl?: string, actionText?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.header{background:#2563eb;color:#fff;padding:24px 32px}
.header h1{margin:0;font-size:20px;font-weight:600}
.body{padding:32px}
.content{color:#374151;font-size:15px;line-height:1.6;margin-bottom:24px}
.btn{display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500}
.footer{background:#f9fafb;padding:16px 32px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb}
</style></head>
<body>
<div class="container">
  <div class="header"><h1>${title}</h1></div>
  <div class="body">
    <p class="content">${content}</p>
    ${actionUrl ? `<a href="${actionUrl}" class="btn">${actionText || "查看详情"}</a>` : ""}
  </div>
  <div class="footer">此邮件由估价平台系统自动发送，请勿直接回复。</div>
</div>
</body>
</html>`;
}

// ============================================================
// 短信发送（阿里云/腾讯云/mock）
// ============================================================
async function sendSms(phone: string, content: string, provider?: string): Promise<boolean> {
  const p = provider || process.env.SMS_PROVIDER || "mock";
  if (p === "mock") {
    console.log(`[SMS Mock] To: ${phone} | Content: ${content}`);
    return true;
  }
  if (p === "aliyun") {
    try {
      const resp = await fetch("https://dysmsapi.aliyuncs.com/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          Action: "SendSms",
          PhoneNumbers: phone,
          SignName: process.env.SMS_SIGN || "估价平台",
          TemplateCode: process.env.SMS_TEMPLATE_CODE || "",
          TemplateParam: JSON.stringify({ content: content.substring(0, 50) }),
        }),
      });
      const data = await resp.json() as any;
      return data.Code === "OK";
    } catch (e) {
      console.error("[SMS Error]", e);
      return false;
    }
  }
  return false;
}

// ============================================================
// 核心：发送通知（站内信 + 邮件 + 短信）
// ============================================================
export interface NotifyOptions {
  userId: number;
  event: NotifyEvent;
  data: Record<string, any>;
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
  forceEmail?: boolean;
  forceSms?: boolean;
}

export async function sendNotification(opts: NotifyOptions): Promise<void> {
  const template = EVENT_TEMPLATES[opts.event];
  if (!template) return;

  const title = template.title;
  const content = template.content(opts.data);

  // 1. 站内信
  try {
    await db.execute(sql`
      INSERT INTO notifications (user_id, title, content, type, is_read, related_id, related_type, trigger_event, extra_data)
      VALUES (${opts.userId}, ${title}, ${content}, ${opts.event.split(".")[0]}, 0,
        ${opts.relatedId || null}, ${opts.relatedType || null},
        ${opts.event}, ${JSON.stringify(opts.data)})
    `);
  } catch (e) {
    console.error("[Notify InApp Error]", e);
  }

  // 2. 查询用户偏好和联系方式
  let userInfo: any = null;
  let prefs: any = null;
  try {
    const [u] = await db.execute(sql`SELECT id, email, phone FROM users WHERE id = ${opts.userId}`) as any[];
    userInfo = u;
    const [p] = await db.execute(sql`SELECT * FROM notification_preferences WHERE user_id = ${opts.userId}`) as any[];
    prefs = p;
  } catch (e) {
    console.error("[Notify Prefs Error]", e);
  }

  const emailEnabled = opts.forceEmail || prefs?.email_enabled !== false;
  const smsEnabled = opts.forceSms || prefs?.sms_enabled === true;

  // 3. 邮件
  if (emailEnabled && userInfo?.email && template.emailSubject) {
    const html = buildEmailHtml(title, content, opts.actionUrl);
    const success = await sendEmail(userInfo.email, template.emailSubject, html);
    await db.execute(sql`
      INSERT INTO notification_sends (user_id, channel, to_address, subject, content, status, sent_at)
      VALUES (${opts.userId}, 'email', ${userInfo.email}, ${template.emailSubject}, ${content},
        ${success ? "sent" : "failed"}, NOW())
    `).catch(() => {});
  }

  // 4. 短信
  if (smsEnabled && userInfo?.phone) {
    const smsContent = `${title}：${content.substring(0, 60)}`;
    const success = await sendSms(userInfo.phone, smsContent);
    await db.execute(sql`
      INSERT INTO notification_sends (user_id, channel, to_address, content, status, sent_at)
      VALUES (${opts.userId}, 'sms', ${userInfo.phone}, ${smsContent},
        ${success ? "sent" : "failed"}, NOW())
    `).catch(() => {});
  }
}

// ============================================================
// 批量通知（如通知所有评估师有新项目）
// ============================================================
export async function sendBatchNotification(opts: {
  userIds: number[];
  event: NotifyEvent;
  data: Record<string, any>;
  relatedId?: number;
  relatedType?: string;
}): Promise<void> {
  for (const userId of opts.userIds) {
    await sendNotification({ ...opts, userId }).catch(console.error);
  }
}

// ============================================================
// 审核流转自动通知触发器
// ============================================================
export async function notifyReportSubmitted(reportId: number, authorId: number, reviewerIds: number[], reportTitle: string) {
  // 通知作者
  await sendNotification({ userId: authorId, event: "report.submitted", data: { reportTitle }, relatedId: reportId, relatedType: "report" });
  // 通知审核人
  for (const rid of reviewerIds) {
    await sendNotification({ userId: rid, event: "report.submitted", data: { reportTitle, authorName: "评估师" }, relatedId: reportId, relatedType: "report" });
  }
}

export async function notifyReportApproved(reportId: number, authorId: number, reviewerName: string, reportTitle: string) {
  await sendNotification({ userId: authorId, event: "report.approved", data: { reportTitle, reviewerName }, relatedId: reportId, relatedType: "report" });
}

export async function notifyReportRejected(reportId: number, authorId: number, reason: string, reportTitle: string) {
  await sendNotification({ userId: authorId, event: "report.rejected", data: { reportTitle, reason }, relatedId: reportId, relatedType: "report" });
}

export async function notifyProjectAwarded(projectId: number, winnerOrgUserIds: number[], projectTitle: string) {
  for (const uid of winnerOrgUserIds) {
    await sendNotification({ userId: uid, event: "project.awarded", data: { projectTitle }, relatedId: projectId, relatedType: "project" });
  }
}

export async function notifyPaymentSuccess(userId: number, orderNo: string, planName: string, expireDate: string) {
  await sendNotification({ userId, event: "payment.success", data: { orderNo, planName, expireDate } });
}
