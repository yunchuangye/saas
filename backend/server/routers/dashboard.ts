import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { projects, reports, users, bids, cases, autoValuations, organizations } from "../lib/schema";
import { eq, and, gte, count, desc, sql, between } from "drizzle-orm";
import { redis } from "../lib/db";

export const dashboardRouter = router({
  // 统计数据（根据角色返回不同数据）
  stats: protectedProcedure.query(async ({ ctx }) => {
    const cacheKey = `dashboard:stats:${ctx.user.id}`;
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }

    const role = ctx.user.role;
    let stats: any = {};

    if (role === "admin") {
      const [totalUsers] = await ctx.db.select({ count: count() }).from(users);
      const [totalProjects] = await ctx.db.select({ count: count() }).from(projects);
      const [totalReports] = await ctx.db.select({ count: count() }).from(reports);
      const [pendingReports] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "reviewing"));
      const [totalCases] = await ctx.db.select({ count: count() }).from(cases);
      const [activeProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "active"));
      const [completedProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "completed"));

      // 评估公司和银行机构数量
      const [appraiserOrgs] = await ctx.db
        .select({ count: count() })
        .from(organizations)
        .where(eq(organizations.type, "appraiser"));
      const [bankOrgs] = await ctx.db
        .select({ count: count() })
        .from(organizations)
        .where(eq(organizations.type, "bank"));

      // 本月项目数量
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [monthlyProjects] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(gte(projects.createdAt, monthStart));

      stats = {
        totalUsers: totalUsers.count,
        activeUsers: totalUsers.count,
        totalProjects: totalProjects.count,
        activeProjects: activeProj.count,
        completedProjects: completedProj.count,
        totalReports: totalReports.count,
        pendingReports: pendingReports.count,
        totalCases: totalCases.count,
        appraiserOrgs: appraiserOrgs.count,
        bankOrgs: bankOrgs.count,
        monthlyProjects: monthlyProjects.count,
      };
    } else if (role === "appraiser") {
      const orgId = ctx.user.orgId;
      const [allProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(orgId ? eq(projects.assignedOrgId, orgId) : sql`1=1`);
      const [activeProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(
          sql`status IN ('active','surveying','reporting','reviewing')`,
          orgId ? eq(projects.assignedOrgId, orgId) : sql`1=1`
        ));
      const [completedProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(eq(projects.status, "completed"), orgId ? eq(projects.assignedOrgId, orgId) : sql`1=1`));
      const [biddingProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.status, "bidding"));
      const [myReports] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.authorId, ctx.user.id));
      const [pendingReview] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "reviewing"));

      stats = {
        totalProjects: allProj.count,
        activeProjects: activeProj.count,
        completedProjects: completedProj.count,
        biddingProjects: biddingProj.count,
        myReports: myReports.count,
        pendingReview: pendingReview.count,
        totalEarnings: 0,
      };
    } else if (role === "bank" || role === "investor") {
      const orgId = ctx.user.orgId;
      const [myProjects] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(orgId ? eq(projects.clientOrgId, orgId) : eq(projects.clientId, ctx.user.id));
      const [activeProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(
          sql`status IN ('active','surveying','reporting','reviewing')`,
          orgId ? eq(projects.clientOrgId, orgId) : eq(projects.clientId, ctx.user.id)
        ));
      const [completedProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(
          eq(projects.status, "completed"),
          orgId ? eq(projects.clientOrgId, orgId) : eq(projects.clientId, ctx.user.id)
        ));
      const [pendingRep] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "reviewing"));
      const [completedRep] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "approved"));

      stats = {
        totalProjects: myProjects.count,
        activeProjects: activeProj.count,
        completedProjects: completedProj.count,
        pendingReports: pendingRep.count,
        completedReports: completedRep.count,
        totalValuation: 0,
        avgValuation: 0,
      };
    } else {
      // customer
      const [myProjects] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.clientId, ctx.user.id));
      const [activeProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(
          sql`status IN ('bidding','awarded','active','surveying','reporting','reviewing')`,
          eq(projects.clientId, ctx.user.id)
        ));
      const [completedProj] = await ctx.db
        .select({ count: count() })
        .from(projects)
        .where(and(eq(projects.status, "completed"), eq(projects.clientId, ctx.user.id)));
      const [completedRep] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "approved"));

      stats = {
        totalApplications: myProjects.count,
        activeApplications: activeProj.count,
        completedApplications: completedProj.count,
        completedReports: completedRep.count,
        pendingReports: 0,
      };
    }

    await redis.setex(cacheKey, 300, JSON.stringify(stats)).catch(() => {});
    return stats;
  }),

  // 活动图表数据（真实数据）
  activityChart: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      const data = [];
      const now = new Date();
      const role = ctx.user.role;
      const orgId = ctx.user.orgId;

      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayStart = new Date(dateStr + "T00:00:00.000Z");
        const dayEnd = new Date(dateStr + "T23:59:59.999Z");

        try {
          // 当天项目数
          let projConditions: any[] = [between(projects.createdAt, dayStart, dayEnd)];
          if (role === "appraiser" && orgId) projConditions.push(eq(projects.assignedOrgId, orgId));
          else if ((role === "bank" || role === "investor") && orgId) projConditions.push(eq(projects.clientOrgId, orgId));
          else if (role === "customer") projConditions.push(eq(projects.clientId, ctx.user.id));

          const [projCount] = await ctx.db
            .select({ count: count() })
            .from(projects)
            .where(and(...projConditions));

          // 当天报告数
          const [repCount] = await ctx.db
            .select({ count: count() })
            .from(reports)
            .where(between(reports.createdAt, dayStart, dayEnd));

          data.push({
            date: dateStr,
            count: projCount.count,
            projects: projCount.count,
            reports: repCount.count,
            valuations: 0,
          });
        } catch {
          data.push({ date: dateStr, count: 0, projects: 0, reports: 0, valuations: 0 });
        }
      }
      return data;
    }),

  // 最近项目
  recentProjects: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input, ctx }) => {
      const role = ctx.user.role;
      const orgId = ctx.user.orgId;

      // 根据角色过滤项目
      let whereCondition: any = undefined;
      if (role === "appraiser" && orgId) {
        whereCondition = eq(projects.assignedOrgId, orgId);
      } else if ((role === "bank" || role === "investor") && orgId) {
        whereCondition = eq(projects.clientOrgId, orgId);
      } else if (role === "customer") {
        whereCondition = eq(projects.clientId, ctx.user.id);
      }

      const results = await ctx.db
        .select()
        .from(projects)
        .where(whereCondition)
        .orderBy(desc(projects.createdAt))
        .limit(input.limit);

      return results;
    }),
});
