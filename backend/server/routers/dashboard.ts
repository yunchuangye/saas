import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { projects, reports, users, bids, cases, autoValuations } from "../lib/schema";
import { eq, and, gte, count, desc, sql } from "drizzle-orm";
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

      stats = {
        totalUsers: totalUsers.count,
        // activeUsers 与 totalUsers 同义（注册即活跃）
        activeUsers: totalUsers.count,
        totalProjects: totalProjects.count,
        activeProjects: activeProj.count,
        completedProjects: 0,
        totalReports: totalReports.count,
        pendingReports: pendingReports.count,
        // 案例总数
        totalCases: totalCases.count,
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
        .where(and(eq(projects.status, "active"), orgId ? eq(projects.assignedOrgId, orgId) : sql`1=1`));
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

      stats = {
        // totalProjects 供 appraiser analytics 页面使用
        totalProjects: allProj.count,
        activeProjects: activeProj.count,
        completedProjects: completedProj.count,
        biddingProjects: biddingProj.count,
        myReports: myReports.count,
        pendingReview: 0,
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
          eq(projects.status, "active"),
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

      stats = {
        totalProjects: myProjects.count,
        activeProjects: activeProj.count,
        completedProjects: completedProj.count,
        pendingReports: pendingRep.count,
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
        .where(and(eq(projects.status, "active"), eq(projects.clientId, ctx.user.id)));
      const [completedRep] = await ctx.db
        .select({ count: count() })
        .from(reports)
        .where(eq(reports.status, "approved"));

      stats = {
        totalApplications: myProjects.count,
        activeApplications: activeProj.count,
        completedReports: completedRep.count,
        pendingReports: 0,
      };
    }

    await redis.setex(cacheKey, 300, JSON.stringify(stats)).catch(() => {});
    return stats;
  }),

  // 活动图表数据
  activityChart: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      // 返回模拟的图表数据
      const data = [];
      const now = new Date();
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split("T")[0],
          projects: Math.floor(Math.random() * 5),
          reports: Math.floor(Math.random() * 3),
          valuations: Math.floor(Math.random() * 2),
        });
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
