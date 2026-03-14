/**
 * sales.ts — 营销推广工具路由
 * 覆盖：个人客户 / 评估公司 / 银行机构 / 投资机构
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../lib/trpc";
import { db } from "../lib/db";
import {
  users,
  organizations,
  projects,
  reports,
  cases,
  cities,
  autoValuations,
} from "../lib/schema";
import { eq, desc, count, sql, and, gte, lte, like } from "drizzle-orm";

// ─────────────────────────────────────────────
// 内存缓存（简单实现，生产可换 Redis）
// ─────────────────────────────────────────────
const campaignStore: Map<string, any> = new Map();
const leadStore: Map<string, any[]> = new Map();
const inviteStore: Map<string, any> = new Map();
let campaignIdSeq = 1;
let leadIdSeq = 1;
let inviteIdSeq = 1;

function genCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ─────────────────────────────────────────────
// 公共工具函数
// ─────────────────────────────────────────────
async function getOrgStats(orgId: number) {
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.assignedOrgId, orgId));
  const [reportCount] = await db
    .select({ count: count() })
    .from(reports)
    .where(eq(reports.status, "approved"));
  return {
    totalProjects: Number(projectCount?.count ?? 0),
    totalReports: Number(reportCount?.count ?? 0),
  };
}

// ─────────────────────────────────────────────
// 营销路由
// ─────────────────────────────────────────────
export const salesRouter = router({

  // ══════════════════════════════════════════
  // 公共接口
  // ══════════════════════════════════════════

  /** 通过邀请码获取邀请人信息（公开） */
  getInviteInfo: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const invite = inviteStore.get(input.code);
      if (!invite) return null;
      const [inviter] = await db
        .select({ id: users.id, displayName: users.displayName, role: users.role, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, invite.userId))
        .limit(1);
      return inviter ? { ...invite, inviterName: inviter.displayName, inviterRole: inviter.role, inviterAvatar: inviter.avatar } : null;
    }),

  /** 记录营销线索点击（公开） */
  trackLead: publicProcedure
    .input(z.object({
      campaignId: z.string(),
      source: z.string().optional(),
      visitorId: z.string().optional(),
      action: z.enum(["view", "click", "register", "order"]).default("view"),
    }))
    .mutation(async ({ input }) => {
      const leads = leadStore.get(input.campaignId) ?? [];
      const lead = {
        id: leadIdSeq++,
        ...input,
        createdAt: new Date().toISOString(),
      };
      leads.push(lead);
      leadStore.set(input.campaignId, leads);
      return { success: true, leadId: lead.id };
    }),

  // ══════════════════════════════════════════
  // 个人客户 (Customer) 营销工具
  // ══════════════════════════════════════════

  /** 生成/获取个人邀请码 */
  customer_getInviteCode: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      // 查找已有邀请码
      for (const [code, inv] of inviteStore.entries()) {
        if (inv.userId === userId && inv.type === "customer_referral") {
          return { code, inviteUrl: `https://gujia.app/invite/${code}`, ...inv };
        }
      }
      // 生成新邀请码
      const code = genCode("CUS");
      const invite = {
        userId,
        type: "customer_referral",
        reward: "每成功邀请1人注册并下单，获得50元优惠券",
        createdAt: new Date().toISOString(),
        usedCount: 0,
        pendingReward: 0,
        totalReward: 0,
      };
      inviteStore.set(code, invite);
      return { code, inviteUrl: `https://gujia.app/invite/${code}`, ...invite };
    }),

  /** 获取邀请统计数据 */
  customer_getInviteStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      let totalInvited = 0;
      let totalReward = 0;
      const records: any[] = [];
      for (const [code, inv] of inviteStore.entries()) {
        if (inv.userId === userId) {
          const leads = leadStore.get(code) ?? [];
          totalInvited += leads.filter((l) => l.action === "register").length;
          totalReward += inv.totalReward ?? 0;
          records.push({ code, leads: leads.length, ...inv });
        }
      }
      return { totalInvited, totalReward, pendingReward: Math.floor(totalInvited * 30), records };
    }),

  /** 生成房产估值分享卡片数据 */
  customer_getShareCard: protectedProcedure
    .input(z.object({ valuationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [valuation] = await db
        .select()
        .from(autoValuations)
        .where(and(eq(autoValuations.id, input.valuationId), eq(autoValuations.userId, ctx.user.id)))
        .limit(1);
      if (!valuation) throw new Error("估价记录不存在");
      // 脱敏处理：隐藏精确地址
      const addressMasked = valuation.address
        ? valuation.address.replace(/(\d+号)/, "**号").replace(/(\d+室)/, "**室")
        : "某房产";
      return {
        title: "我的房产估值报告",
        addressMasked,
        area: valuation.area,
        propertyType: valuation.propertyType,
        valuationResult: valuation.valuationResult,
        valuationMin: valuation.valuationMin,
        valuationMax: valuation.valuationMax,
        confidence: valuation.confidence,
        createdAt: valuation.createdAt,
        shareText: `我刚在 gujia.app 查询了我的房产估值，参考价约 ${Math.round(Number(valuation.valuationResult) / 10000)} 万元，快来看看你的房产值多少钱！`,
        qrUrl: `https://gujia.app/invite/share-valuation`,
      };
    }),

  /** 获取拼团评估活动列表 */
  customer_getGroupBuying: protectedProcedure
    .query(async () => {
      // 模拟拼团活动数据
      return [
        {
          id: 1,
          title: "北京朝阳区住宅批量评估团购",
          originalPrice: 1200,
          groupPrice: 680,
          minPeople: 5,
          currentPeople: 3,
          deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: "open",
          cityName: "北京",
          propertyType: "住宅",
        },
        {
          id: 2,
          title: "上海浦东新区商业用房评估团购",
          originalPrice: 2500,
          groupPrice: 1500,
          minPeople: 3,
          currentPeople: 2,
          deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
          status: "open",
          cityName: "上海",
          propertyType: "商业",
        },
        {
          id: 3,
          title: "深圳南山区住宅评估团购（已成团）",
          originalPrice: 1000,
          groupPrice: 600,
          minPeople: 4,
          currentPeople: 6,
          deadline: new Date(Date.now() - 86400000).toISOString(),
          status: "closed",
          cityName: "深圳",
          propertyType: "住宅",
        },
      ];
    }),

  /** 参与/发起拼团 */
  customer_joinGroupBuying: protectedProcedure
    .input(z.object({ groupId: z.number(), propertyAddress: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        message: "已成功加入拼团，等待其他用户参与后将为您安排评估服务",
        groupId: input.groupId,
        userId: ctx.user.id,
      };
    }),

  // ══════════════════════════════════════════
  // 评估公司 (Appraiser) 营销工具
  // ══════════════════════════════════════════

  /** 获取评估公司微官网数据 */
  appraiser_getMicrosite: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const [userInfo] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      let orgInfo = null;
      if (userInfo?.orgId) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, userInfo.orgId))
          .limit(1);
        orgInfo = org;
      }
      const stats = orgInfo ? await getOrgStats(orgInfo.id) : { totalProjects: 0, totalReports: 0 };
      return {
        org: orgInfo,
        user: { id: userInfo?.id, displayName: userInfo?.displayName, avatar: userInfo?.avatar },
        stats: {
          ...stats,
          establishedYears: 8,
          certifications: ["CMA认证", "CNAS认证", "AAA级信用企业"],
          serviceAreas: ["住宅评估", "商业地产评估", "工业厂房评估", "司法评估"],
        },
        micrositeUrl: `https://gujia.app/firm/${orgInfo?.id ?? userId}`,
        qrCode: `https://gujia.app/qr/firm/${orgInfo?.id ?? userId}`,
      };
    }),

  /** 获取营销海报模板列表 */
  appraiser_getPosterTemplates: protectedProcedure
    .query(async () => {
      return [
        {
          id: 1,
          name: "市场行情周报",
          category: "市场分析",
          description: "每周房产市场行情分析，适合发布到公众号/朋友圈",
          thumbnail: "/templates/weekly-market.png",
          variables: ["city", "weekRange", "avgPrice", "priceChange"],
        },
        {
          id: 2,
          name: "政策解读快报",
          category: "政策资讯",
          description: "最新房产政策解读，提升专业形象",
          thumbnail: "/templates/policy-brief.png",
          variables: ["policyTitle", "keyPoints", "impact"],
        },
        {
          id: 3,
          name: "服务介绍海报",
          category: "品牌推广",
          description: "展示公司资质和服务项目，适合线下物料",
          thumbnail: "/templates/service-intro.png",
          variables: ["companyName", "certifications", "services", "phone"],
        },
        {
          id: 4,
          name: "成功案例展示",
          category: "案例背书",
          description: "展示典型评估案例，增强客户信任",
          thumbnail: "/templates/case-showcase.png",
          variables: ["caseName", "propertyType", "area", "result"],
        },
        {
          id: 5,
          name: "节日营销海报",
          category: "节日活动",
          description: "节假日营销活动海报，带优惠信息",
          thumbnail: "/templates/holiday-promo.png",
          variables: ["holiday", "discount", "deadline", "phone"],
        },
        {
          id: 6,
          name: "招募合作伙伴",
          category: "渠道拓展",
          description: "招募中介、律所等合作渠道",
          thumbnail: "/templates/partner-recruit.png",
          variables: ["commissionRate", "requirements", "contactInfo"],
        },
      ];
    }),

  /** 生成营销海报内容 */
  appraiser_generatePoster: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      variables: z.record(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const campaignId = genCode("POSTER");
      const campaign = {
        id: campaignId,
        userId: ctx.user.id,
        type: "poster",
        templateId: input.templateId,
        variables: input.variables,
        createdAt: new Date().toISOString(),
        views: 0,
        clicks: 0,
        leads: 0,
      };
      campaignStore.set(campaignId, campaign);
      return {
        success: true,
        campaignId,
        shareUrl: `https://gujia.app/poster/${campaignId}`,
        posterData: { ...input.variables, campaignId },
      };
    }),

  /** 获取营销活动列表（评估公司） */
  appraiser_getCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      const campaigns: any[] = [];
      for (const [id, c] of campaignStore.entries()) {
        if (c.userId === ctx.user.id) {
          const leads = leadStore.get(id) ?? [];
          campaigns.push({
            ...c,
            views: leads.filter((l) => l.action === "view").length,
            clicks: leads.filter((l) => l.action === "click").length,
            leads: leads.filter((l) => l.action === "register").length,
          });
        }
      }
      // 补充模拟数据
      if (campaigns.length === 0) {
        return [
          { id: "POSTER-DEMO1", type: "poster", name: "市场行情周报 #1", views: 342, clicks: 87, leads: 12, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), status: "active" },
          { id: "POSTER-DEMO2", type: "poster", name: "服务介绍海报", views: 218, clicks: 45, leads: 8, createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), status: "active" },
          { id: "COUPON-DEMO1", type: "coupon", name: "免费初估体验券", views: 156, clicks: 92, leads: 31, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), status: "active" },
        ];
      }
      return campaigns;
    }),

  /** 获取营销线索列表（评估公司） */
  appraiser_getLeads: protectedProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      // 模拟线索数据
      const mockLeads = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        source: ["朋友圈海报", "公众号文章", "邀请链接", "搜索引擎"][i % 4],
        action: ["view", "click", "register", "order"][i % 4],
        visitorId: `visitor-${i + 1}`,
        phone: i % 3 === 0 ? `138****${String(1000 + i).slice(-4)}` : null,
        propertyType: ["住宅", "商业", "工业"][i % 3],
        cityName: ["北京", "上海", "深圳", "广州"][i % 4],
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        status: ["new", "contacted", "converted"][i % 3],
      }));
      const total = mockLeads.length;
      const start = (input.page - 1) * input.pageSize;
      return { items: mockLeads.slice(start, start + input.pageSize), total };
    }),

  /** 发放优惠券 */
  appraiser_issueCoupon: protectedProcedure
    .input(z.object({
      type: z.enum(["free_estimate", "discount", "vip"]),
      discount: z.number().optional(),
      quantity: z.number().default(100),
      expireDays: z.number().default(30),
      targetAudience: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const couponCode = genCode("CPN");
      const campaign = {
        id: couponCode,
        userId: ctx.user.id,
        type: "coupon",
        ...input,
        createdAt: new Date().toISOString(),
        usedCount: 0,
        expireAt: new Date(Date.now() + input.expireDays * 86400000).toISOString(),
      };
      campaignStore.set(couponCode, campaign);
      return {
        success: true,
        couponCode,
        shareUrl: `https://gujia.app/coupon/${couponCode}`,
        qrUrl: `https://gujia.app/qr/coupon/${couponCode}`,
      };
    }),

  // ══════════════════════════════════════════
  // 银行机构 (Bank) 营销工具
  // ══════════════════════════════════════════

  /** 获取房贷计算器配置（银行定制） */
  bank_getLoanCalculatorConfig: protectedProcedure
    .query(async ({ ctx }) => {
      const [userInfo] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      let orgInfo = null;
      if (userInfo?.orgId) {
        const [org] = await db.select().from(organizations).where(eq(organizations.id, userInfo.orgId)).limit(1);
        orgInfo = org;
      }
      return {
        bankName: orgInfo?.name ?? "银行机构",
        bankLogo: orgInfo?.logo ?? null,
        products: [
          { name: "首套房贷", rate: 3.95, minDown: 20, maxYears: 30, description: "首套住房商业贷款" },
          { name: "二套房贷", rate: 4.25, minDown: 30, maxYears: 30, description: "二套住房商业贷款" },
          { name: "公积金贷款", rate: 2.85, minDown: 20, maxYears: 30, description: "住房公积金贷款" },
          { name: "商业经营贷", rate: 4.55, minDown: 40, maxYears: 20, description: "商业用房抵押贷款" },
        ],
        embedCode: `<iframe src="https://gujia.app/widget/loan-calc?bank=${orgInfo?.id ?? ctx.user.id}" width="400" height="600" frameborder="0"></iframe>`,
        widgetUrl: `https://gujia.app/widget/loan-calc?bank=${orgInfo?.id ?? ctx.user.id}`,
      };
    }),

  /** 生成区域市场报告 */
  bank_generateMarketReport: protectedProcedure
    .input(z.object({
      cityId: z.number(),
      reportType: z.enum(["monthly", "quarterly", "annual"]),
      propertyTypes: z.array(z.string()).default(["住宅"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [city] = await db.select().from(cities).where(eq(cities.id, input.cityId)).limit(1);
      // 获取该城市案例数据做统计
      const casesData = await db
        .select({
          avgPrice: sql<number>`AVG(${cases.unitPrice})`,
          maxPrice: sql<number>`MAX(${cases.unitPrice})`,
          minPrice: sql<number>`MIN(${cases.unitPrice})`,
          totalCount: count(),
        })
        .from(cases)
        .where(eq(cases.cityId, input.cityId));

      const [userInfo] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      let orgInfo = null;
      if (userInfo?.orgId) {
        const [org] = await db.select().from(organizations).where(eq(organizations.id, userInfo.orgId)).limit(1);
        orgInfo = org;
      }

      const reportId = genCode("RPT");
      const report = {
        id: reportId,
        userId: ctx.user.id,
        cityName: city?.name ?? "未知城市",
        reportType: input.reportType,
        propertyTypes: input.propertyTypes,
        bankName: orgInfo?.name ?? "银行机构",
        stats: casesData[0],
        generatedAt: new Date().toISOString(),
        downloadUrl: `https://gujia.app/reports/market/${reportId}`,
      };
      campaignStore.set(reportId, { type: "market_report", ...report });
      return report;
    }),

  /** 获取联名营销活动 */
  bank_getCoMarketingCampaigns: protectedProcedure
    .query(async () => {
      return [
        {
          id: 1,
          title: "查房价·享利率优惠",
          description: "用户通过银行专属链接完成房产估值，可享受房贷利率优惠 5BP",
          type: "rate_discount",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          participants: 128,
          conversions: 23,
          status: "active",
        },
        {
          id: 2,
          title: "新客户房贷绿色通道",
          description: "通过 gujia.app 提交评估报告的客户，享受贷款审批绿色通道",
          type: "fast_approval",
          startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          participants: 67,
          conversions: 18,
          status: "active",
        },
      ];
    }),

  /** 创建联名营销活动 */
  bank_createCoMarketing: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      type: z.string(),
      benefit: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      targetCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const campaignId = genCode("BANK");
      const campaign = { id: campaignId, userId: ctx.user.id, ...input, createdAt: new Date().toISOString(), participants: 0, conversions: 0, status: "active" };
      campaignStore.set(campaignId, campaign);
      return { success: true, campaignId, shareUrl: `https://gujia.app/campaign/${campaignId}` };
    }),

  /** 获取银行营销数据看板 */
  bank_getDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalLeads: 312,
        convertedLeads: 87,
        conversionRate: 27.9,
        totalLoanAmount: 45600000,
        avgLoanAmount: 524138,
        monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - (5 - i) * 30 * 86400000).toISOString().slice(0, 7),
          leads: 30 + Math.floor(Math.random() * 30),
          conversions: 8 + Math.floor(Math.random() * 10),
          loanAmount: (500 + Math.floor(Math.random() * 300)) * 10000,
        })),
        topSources: [
          { source: "估值分享链接", count: 145, rate: 46.5 },
          { source: "联名活动", count: 98, rate: 31.4 },
          { source: "计算器插件", count: 69, rate: 22.1 },
        ],
      };
    }),

  // ══════════════════════════════════════════
  // 投资机构 (Investor) 营销工具
  // ══════════════════════════════════════════

  /** 生成资产推介册 */
  investor_generatePitchbook: protectedProcedure
    .input(z.object({
      title: z.string(),
      assetType: z.enum(["npl", "real_estate", "portfolio", "single"]),
      assets: z.array(z.object({
        name: z.string(),
        address: z.string().optional(),
        area: z.number().optional(),
        estimatedValue: z.number().optional(),
        propertyType: z.string().optional(),
        description: z.string().optional(),
      })),
      targetAudience: z.string().optional(),
      contactInfo: z.object({
        name: z.string(),
        phone: z.string(),
        email: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const pitchbookId = genCode("PB");
      const pitchbook = {
        id: pitchbookId,
        userId: ctx.user.id,
        ...input,
        createdAt: new Date().toISOString(),
        views: 0,
        inquiries: 0,
        shareUrl: `https://gujia.app/pitchbook/${pitchbookId}`,
        downloadUrl: `https://gujia.app/pitchbook/${pitchbookId}/download`,
      };
      campaignStore.set(pitchbookId, { type: "pitchbook", ...pitchbook });
      return pitchbook;
    }),

  /** 获取资产推介册列表 */
  investor_getPitchbooks: protectedProcedure
    .query(async ({ ctx }) => {
      const pitchbooks: any[] = [];
      for (const [id, c] of campaignStore.entries()) {
        if (c.userId === ctx.user.id && c.type === "pitchbook") {
          pitchbooks.push(c);
        }
      }
      if (pitchbooks.length === 0) {
        return [
          { id: "PB-DEMO1", title: "北京朝阳区不良资产包 2026Q1", assetType: "npl", assets: [{ name: "朝阳区商业楼", estimatedValue: 12000000 }], views: 45, inquiries: 8, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), status: "active" },
          { id: "PB-DEMO2", title: "上海浦东住宅组合包", assetType: "portfolio", assets: [{ name: "浦东住宅A", estimatedValue: 8500000 }, { name: "浦东住宅B", estimatedValue: 7200000 }], views: 32, inquiries: 5, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), status: "active" },
        ];
      }
      return pitchbooks;
    }),

  /** 生成投资洞察简报 */
  investor_generateInsightNewsletter: protectedProcedure
    .input(z.object({
      cityIds: z.array(z.number()),
      period: z.enum(["weekly", "monthly", "quarterly"]),
      focusAreas: z.array(z.string()).default(["价格趋势", "成交量", "政策影响"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // 获取城市数据
      const cityList = await db
        .select({ id: cities.id, name: cities.name })
        .from(cities)
        .where(sql`${cities.id} IN ${input.cityIds.length > 0 ? input.cityIds : [1]}`);

      // 获取各城市案例统计
      const cityStats = await Promise.all(
        cityList.map(async (city) => {
          const [stat] = await db
            .select({
              avgPrice: sql<number>`AVG(${cases.unitPrice})`,
              count: count(),
            })
            .from(cases)
            .where(eq(cases.cityId, city.id));
          return { city: city.name, avgPrice: Math.round(Number(stat?.avgPrice ?? 0)), count: Number(stat?.count ?? 0) };
        })
      );

      const newsletterId = genCode("NL");
      const newsletter = {
        id: newsletterId,
        userId: ctx.user.id,
        period: input.period,
        focusAreas: input.focusAreas,
        cityStats,
        generatedAt: new Date().toISOString(),
        shareUrl: `https://gujia.app/newsletter/${newsletterId}`,
        highlights: [
          `本${input.period === "weekly" ? "周" : input.period === "monthly" ? "月" : "季度"}重点城市均价数据已更新`,
          `共覆盖 ${cityList.length} 个城市，${cityStats.reduce((s, c) => s + c.count, 0)} 条成交案例`,
          "市场整体呈现稳中有升态势，一线城市核心区域需求旺盛",
        ],
      };
      campaignStore.set(newsletterId, { type: "newsletter", ...newsletter });
      return newsletter;
    }),

  /** 生成项目合作邀请码 */
  investor_createProjectInvite: protectedProcedure
    .input(z.object({
      projectTitle: z.string(),
      projectType: z.enum(["co_invest", "disposal", "service"]),
      description: z.string(),
      targetAmount: z.number().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const code = genCode("INV");
      const invite = {
        userId: ctx.user.id,
        type: "investor_project",
        ...input,
        createdAt: new Date().toISOString(),
        usedCount: 0,
        maxUses: 50,
      };
      inviteStore.set(code, invite);
      return {
        success: true,
        code,
        inviteUrl: `https://gujia.app/project-invite/${code}`,
        qrUrl: `https://gujia.app/qr/project-invite/${code}`,
      };
    }),

  /** 获取投资机构营销数据看板 */
  investor_getDashboard: protectedProcedure
    .query(async () => {
      return {
        totalPitchbooks: 12,
        totalViews: 1847,
        totalInquiries: 134,
        inquiryRate: 7.3,
        totalNewsletters: 8,
        newsletterSubscribers: 256,
        assetTypes: [
          { type: "不良资产", count: 5, totalValue: 68000000 },
          { type: "住宅组合", count: 4, totalValue: 42000000 },
          { type: "商业地产", count: 3, totalValue: 35000000 },
        ],
        monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - (5 - i) * 30 * 86400000).toISOString().slice(0, 7),
          views: 150 + Math.floor(Math.random() * 100),
          inquiries: 15 + Math.floor(Math.random() * 15),
          deals: Math.floor(Math.random() * 3),
        })),
      };
    }),

  // ══════════════════════════════════════════
  // 通用营销统计（管理员/各角色）
  // ══════════════════════════════════════════

  /** 获取我的营销概览 */
  getMyOverview: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      let totalCampaigns = 0;
      let totalViews = 0;
      let totalLeads = 0;
      for (const [id, c] of campaignStore.entries()) {
        if (c.userId === userId) {
          totalCampaigns++;
          const leads = leadStore.get(id) ?? [];
          totalViews += leads.filter((l) => l.action === "view").length;
          totalLeads += leads.filter((l) => l.action === "register").length;
        }
      }
      return {
        totalCampaigns,
        totalViews,
        totalLeads,
        conversionRate: totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0",
        role: ctx.user.role,
      };
    }),

  /** 获取城市市场行情（供海报/报告使用） */
  getMarketData: protectedProcedure
    .input(z.object({ cityId: z.number().optional() }))
    .query(async ({ input }) => {
      const cityList = await db
        .select({ id: cities.id, name: cities.name, province: cities.province })
        .from(cities)
        .where(eq(cities.isActive, true))
        .limit(20);

      if (input.cityId) {
        const [stat] = await db
          .select({
            avgPrice: sql<number>`ROUND(AVG(${cases.unitPrice}), 0)`,
            maxPrice: sql<number>`MAX(${cases.unitPrice})`,
            minPrice: sql<number>`MIN(${cases.unitPrice})`,
            totalCount: count(),
          })
          .from(cases)
          .where(eq(cases.cityId, input.cityId));
        const [city] = cityList.filter((c) => c.id === input.cityId);
        return {
          cities: cityList,
          currentCity: city,
          stats: {
            avgPrice: Math.round(Number(stat?.avgPrice ?? 0)),
            maxPrice: Math.round(Number(stat?.maxPrice ?? 0)),
            minPrice: Math.round(Number(stat?.minPrice ?? 0)),
            totalCases: Number(stat?.totalCount ?? 0),
          },
        };
      }
      return { cities: cityList, currentCity: null, stats: null };
    }),

  // ══════════════════════════════════════════
  // 多平台分享功能
  // ══════════════════════════════════════════

  /** 记录分享行为（渠道追踪） */
  share_trackShare: protectedProcedure
    .input(z.object({
      platform: z.enum(["wechat", "moments", "weibo", "qq", "qqzone", "douyin", "xiaohongshu", "link", "sms", "email"]),
      contentType: z.enum(["invite", "valuation", "poster", "report", "pitchbook", "coupon", "group"]),
      contentId: z.string().optional(),
      shareUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const shareId = genCode("SHR");
      const record = {
        id: shareId,
        userId: ctx.user.id,
        ...input,
        sharedAt: new Date().toISOString(),
        clickCount: 0,
        convertCount: 0,
      };
      // 以 userId_platform 为 key 累计统计
      const statsKey = `share_stats_${ctx.user.id}`;
      const existing = campaignStore.get(statsKey) ?? { total: 0, platforms: {} };
      existing.total = (existing.total ?? 0) + 1;
      existing.platforms[input.platform] = (existing.platforms[input.platform] ?? 0) + 1;
      existing.records = [record, ...(existing.records ?? []).slice(0, 49)]; // 保留最近50条
      campaignStore.set(statsKey, existing);
      return { success: true, shareId, trackedUrl: `${input.shareUrl}?ref=${shareId}&ch=${input.platform}` };
    }),

  /** 获取分享统计数据 */
  share_getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const statsKey = `share_stats_${ctx.user.id}`;
      const stats = campaignStore.get(statsKey) ?? { total: 0, platforms: {}, records: [] };
      const platformLabels: Record<string, string> = {
        wechat: "微信好友", moments: "微信朋友圈", weibo: "微博",
        qq: "QQ好友", qqzone: "QQ空间", douyin: "抖音",
        xiaohongshu: "小红书", link: "复制链接", sms: "短信", email: "邮件",
      };
      const platformStats = Object.entries(stats.platforms as Record<string, number>)
        .map(([platform, count]) => ({
          platform,
          label: platformLabels[platform] ?? platform,
          count,
          rate: stats.total > 0 ? Number(((count / stats.total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.count - a.count);
      return {
        totalShares: stats.total,
        totalClicks: Math.floor(stats.total * 3.2),
        totalConverts: Math.floor(stats.total * 0.8),
        conversionRate: stats.total > 0 ? Number((0.8 / 3.2 * 100).toFixed(1)) : 0,
        platformStats,
        recentRecords: (stats.records ?? []).slice(0, 10),
      };
    }),

  /** 生成平台专属分享文案 */
  share_generateCopy: protectedProcedure
    .input(z.object({
      platform: z.enum(["wechat", "moments", "weibo", "qq", "qqzone", "douyin", "xiaohongshu", "link", "sms", "email"]),
      contentType: z.enum(["invite", "valuation", "poster", "report", "pitchbook", "coupon", "group"]),
      data: z.record(z.any()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { platform, contentType, data } = input;
      const copyMap: Record<string, Record<string, { title: string; text: string; hashtags?: string[] }>> = {
        wechat: {
          invite: { title: "推荐你用这个房产估值神器", text: `我在 gujia.app 查了房产估值，数据很准！用我的邀请码注册还有优惠，快来试试 👉` },
          valuation: { title: "我的房产估值出来了", text: `刚用 gujia.app 查了我的房产，参考价约 ${data?.price ?? "XXX"} 万，感觉还挺准的，你也来查查 👉` },
          coupon: { title: "房产评估优惠券", text: `分享一张房产评估优惠券给你，限时免费初估，快来领取 👉` },
          group: { title: "一起拼团做房产评估", text: `发现一个拼团做房产评估的活动，多人参与价格更低，一起来 👉` },
          poster: { title: "专业房产评估服务", text: `推荐一家专业的房产评估公司，资质齐全，价格透明 👉` },
          report: { title: "区域房产市场报告", text: `最新区域房产市场分析报告出炉，看看你关注的区域行情如何 👉` },
          pitchbook: { title: "资产推介", text: `有优质资产项目，欢迎洽谈合作 👉` },
        },
        moments: {
          invite: { title: "好物分享", text: `最近在用 gujia.app 查房产估值，数据挺准的，推荐给大家！用我的邀请码注册还有优惠 🏠✨` },
          valuation: { title: "我家房子值多少钱？", text: `用 gujia.app 查了一下，参考价约 ${data?.price ?? "XXX"} 万 🏡 感觉还挺准的，你也来查查自己的房子值多少钱？` },
          coupon: { title: "限时福利", text: `房产评估限时优惠，免费初估机会来了！有需要的朋友快来领取 🎁` },
          group: { title: "拼团省钱", text: `发现一个拼团做房产评估的活动，多人参与折扣更大 💰 有需要的朋友一起来！` },
          poster: { title: "专业评估", text: `推荐这家房产评估公司，专业靠谱，有需要的朋友可以联系 📋` },
          report: { title: "房市动态", text: `最新房产市场报告，看看你所在城市的行情走势 📊` },
          pitchbook: { title: "投资机会", text: `有优质资产项目机会，感兴趣的朋友可以了解一下 💼` },
        },
        weibo: {
          invite: { title: "房产估值神器", text: `推荐一个房产估值工具 gujia.app，数据准确，操作简单！用我的邀请码注册还有优惠 👉`, hashtags: ["房产估值", "买房卖房", "房价查询"] },
          valuation: { title: "我的房产估值", text: `刚用 gujia.app 查了我的房产估值，参考价约 ${data?.price ?? "XXX"} 万，感觉很准！有需要的朋友来试试 👉`, hashtags: ["房产估值", "房价", "买房"] },
          coupon: { title: "房产评估优惠", text: `分享一张房产评估优惠券，限时免费初估！有需要的朋友快来领取 🎁`, hashtags: ["优惠券", "房产评估", "免费"] },
          group: { title: "拼团评估", text: `发现一个拼团做房产评估的活动，价格超划算！一起来 👉`, hashtags: ["拼团", "房产评估", "省钱"] },
          poster: { title: "专业评估服务", text: `推荐专业房产评估服务，资质齐全，欢迎咨询 👉`, hashtags: ["房产评估", "专业服务"] },
          report: { title: "市场报告", text: `最新区域房产市场分析报告，数据详实 📊`, hashtags: ["房产市场", "市场分析", "房价走势"] },
          pitchbook: { title: "资产推介", text: `优质资产项目推介，欢迎洽谈合作 💼`, hashtags: ["资产投资", "不良资产", "投资机会"] },
        },
        qq: {
          invite: { title: "推荐房产估值工具", text: `推荐你用 gujia.app 查房产估值，数据准确！用我的邀请码注册还有优惠 👉` },
          valuation: { title: "我的房产估值结果", text: `刚查了我的房产估值，参考价约 ${data?.price ?? "XXX"} 万，你也来查查 👉` },
          coupon: { title: "房产评估优惠券", text: `给你一张房产评估优惠券，限时免费初估 👉` },
          group: { title: "拼团房产评估", text: `一起拼团做房产评估，多人参与价格更低 👉` },
          poster: { title: "专业评估服务", text: `推荐专业房产评估服务 👉` },
          report: { title: "房产市场报告", text: `最新房产市场报告，了解行情走势 👉` },
          pitchbook: { title: "资产推介", text: `优质资产项目，欢迎了解 👉` },
        },
        qqzone: {
          invite: { title: "发现一个好用的房产估值工具！", text: `最近在用 gujia.app 查房产估值，数据很准，推荐给大家！用我的邀请码注册还有优惠 🏠` },
          valuation: { title: "我的房产估值出炉了", text: `用 gujia.app 查了我的房产，参考价约 ${data?.price ?? "XXX"} 万，感觉很靠谱！你也来查查你的房子值多少钱 🏡` },
          coupon: { title: "房产评估限时优惠", text: `分享一张房产评估优惠券，限时免费初估，有需要的朋友快来领取 🎁` },
          group: { title: "拼团做房产评估", text: `发现一个拼团做房产评估的活动，多人参与折扣更大，一起来省钱 💰` },
          poster: { title: "专业房产评估服务推荐", text: `推荐这家专业的房产评估公司，资质齐全，服务专业 📋` },
          report: { title: "最新房产市场报告", text: `最新区域房产市场分析报告来了，看看你关注区域的行情走势 📊` },
          pitchbook: { title: "优质资产投资机会", text: `有优质资产项目机会，感兴趣的朋友可以了解一下 💼` },
        },
        douyin: {
          invite: { title: "房产估值神器来了", text: `@朋友 快来用 gujia.app 查你的房产估值！数据超准，用我的邀请码注册还有优惠 🏠`, hashtags: ["房产估值", "买房必看", "房价查询", "干货"] },
          valuation: { title: "我的房子值多少钱？", text: `用 gujia.app 查了一下，我的房子参考价约 ${data?.price ?? "XXX"} 万！你也来查查 🏡`, hashtags: ["房产估值", "房价", "买房卖房", "生活"] },
          coupon: { title: "免费房产评估机会", text: `限时免费房产评估优惠券来了！有需要的朋友快来领取 🎁`, hashtags: ["免费", "优惠", "房产评估"] },
          group: { title: "拼团省钱做评估", text: `多人拼团做房产评估，折扣超大！一起来省钱 💰`, hashtags: ["拼团", "省钱", "房产"] },
          poster: { title: "专业评估找这家", text: `专业房产评估服务，资质齐全，欢迎咨询 📋`, hashtags: ["房产评估", "专业服务", "推荐"] },
          report: { title: "最新房市行情", text: `最新区域房产市场报告，数据详实 📊`, hashtags: ["房产市场", "行情分析", "干货"] },
          pitchbook: { title: "资产投资机会", text: `优质资产项目推介，欢迎洽谈 💼`, hashtags: ["投资", "资产", "机会"] },
        },
        xiaohongshu: {
          invite: { title: "种草一个房产估值神器", text: `最近发现一个超好用的房产估值工具 gujia.app ✨\n\n数据准确，操作简单，输入地址就能查到参考价格 🏠\n\n用我的邀请码注册还有优惠哦～`, hashtags: ["房产估值", "买房攻略", "好物推荐", "房价查询", "干货分享"] },
          valuation: { title: "我的房产估值结果来了", text: `用 gujia.app 查了一下我的房子 🏡\n\n参考价约 ${data?.price ?? "XXX"} 万，感觉还挺准的！\n\n有需要查房产估值的朋友可以来试试～`, hashtags: ["房产估值", "房价", "买房卖房", "真实体验"] },
          coupon: { title: "房产评估优惠福利", text: `分享一张房产评估优惠券 🎁\n\n限时免费初估，有需要的姐妹快来领取！`, hashtags: ["优惠券", "免费", "房产评估", "福利"] },
          group: { title: "拼团做房产评估", text: `发现一个超划算的拼团活动 💰\n\n多人一起做房产评估，折扣更大！\n\n有需要的朋友一起来～`, hashtags: ["拼团", "省钱攻略", "房产", "好物"] },
          poster: { title: "专业房产评估推荐", text: `推荐一家专业的房产评估公司 📋\n\n资质齐全，服务专业，价格透明\n\n有需要的朋友可以了解一下～`, hashtags: ["房产评估", "专业推荐", "靠谱"] },
          report: { title: "最新房产市场报告", text: `最新区域房产市场分析报告来了 📊\n\n数据详实，看看你关注区域的行情走势～`, hashtags: ["房产市场", "行情分析", "干货", "数据"] },
          pitchbook: { title: "资产投资机会分享", text: `有优质资产投资机会想分享给大家 💼\n\n感兴趣的朋友可以了解一下～`, hashtags: ["投资", "资产", "机会", "理财"] },
        },
        sms: {
          invite: { title: "", text: `我在用gujia.app查房产估值，数据很准！用我的邀请码注册有优惠，点击链接：` },
          valuation: { title: "", text: `我的房产估值结果：参考价约${data?.price ?? "XXX"}万，来gujia.app查你的房产：` },
          coupon: { title: "", text: `给你一张房产评估优惠券，限时免费初估，点击领取：` },
          group: { title: "", text: `一起拼团做房产评估，多人参与价格更低，点击参与：` },
          poster: { title: "", text: `推荐专业房产评估服务，点击了解：` },
          report: { title: "", text: `最新房产市场报告，点击查看：` },
          pitchbook: { title: "", text: `优质资产项目推介，点击了解：` },
        },
        email: {
          invite: { title: "推荐：gujia.app 房产估值工具", text: `您好，\n\n我最近在使用 gujia.app 进行房产估值查询，数据准确，操作便捷，特此推荐给您。\n\n使用我的邀请码注册还可以享受优惠，链接如下：` },
          valuation: { title: "我的房产估值报告", text: `您好，\n\n我刚刚通过 gujia.app 完成了房产估值查询，参考价约 ${data?.price ?? "XXX"} 万元，特此分享给您。\n\n详情请点击：` },
          coupon: { title: "房产评估优惠券", text: `您好，\n\n特此分享一张房产评估优惠券，限时免费初估，请点击领取：` },
          group: { title: "拼团房产评估活动邀请", text: `您好，\n\n诚邀您参与拼团房产评估活动，多人参与可享受更大折扣，请点击了解：` },
          poster: { title: "专业房产评估服务推荐", text: `您好，\n\n特此推荐一家专业的房产评估公司，资质齐全，服务专业，请点击了解：` },
          report: { title: "区域房产市场分析报告", text: `您好，\n\n最新区域房产市场分析报告已出炉，请点击查看：` },
          pitchbook: { title: "资产项目推介", text: `您好，\n\n特此向您推介一个优质资产项目，请点击了解详情：` },
        },
        link: {
          invite: { title: "邀请链接", text: `我在用 gujia.app 查房产估值，用我的邀请码注册有优惠：` },
          valuation: { title: "估值分享链接", text: `我的房产估值结果，参考价约 ${data?.price ?? "XXX"} 万：` },
          coupon: { title: "优惠券链接", text: `房产评估优惠券，限时免费初估：` },
          group: { title: "拼团链接", text: `拼团房产评估，多人参与更优惠：` },
          poster: { title: "评估服务链接", text: `专业房产评估服务：` },
          report: { title: "市场报告链接", text: `区域房产市场报告：` },
          pitchbook: { title: "推介册链接", text: `资产项目推介：` },
        },
      };
      const copy = copyMap[platform]?.[contentType] ?? { title: "分享", text: "点击查看：" };
      return copy;
    }),

  /** 获取分享排行榜（激励机制） */
  share_getLeaderboard: protectedProcedure
    .query(async ({ ctx }) => {
      // 模拟排行榜数据
      const leaderboard = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        userId: `user_${i + 1}`,
        nickname: `用户${String.fromCharCode(65 + i)}***`,
        totalShares: 100 - i * 8,
        totalConverts: 20 - i * 1,
        reward: (20 - i) * 50,
        isCurrentUser: i === 3, // 假设当前用户排第4
      }));
      return { leaderboard, currentUserRank: 4, currentUserReward: 850 };
    }),
});
