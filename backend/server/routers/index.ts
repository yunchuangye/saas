import { router } from "../lib/trpc";
import { authRouter } from "./auth";
import { dashboardRouter } from "./dashboard";
import { projectsRouter, bidsRouter } from "./projects";
import { reportsRouter } from "./reports";
import { notificationsRouter, messagesRouter } from "./notifications";
import { directoryRouter } from "./directory";
import { valuationRouter } from "./valuation";
import { orgRouter, openclawRouter, logsRouter, adminUsersRouter } from "./org";
import { teamRouter } from "./team";
import { autoValuationRouter, guestValuationRouter } from './auto-valuation';
import { pdfReportRouter } from './pdf-report';
import { propertySearchRouter } from './property-search';
import { crawlRouter } from './crawl';
import { salesRouter } from './sales';
import { szfdcRouter } from './szfdc';
import { aiFeaturesRouter } from './ai-features';
import { newsRouter } from './news';
import { crawlTemplatesRouter } from './crawl-templates';
import { settingsRouter } from './settings';
import { threeLevelReviewRouter } from './three-level-review';
import { workSheetsRouter } from './work-sheets';
import { valuationAlertsRouter } from './valuation-alerts';
import { billingRouter } from './billing';
import { sealsRouter } from './seals';
import { paymentRouter } from './payment';
import { notifyEnhancedRouter } from './notify-enhanced';
import { brandingRouter } from './branding';
import { exportsRouter } from './exports';
import { brokerRouter } from './broker';
import { platformAdminRouter } from './platform-admin';
import { shardDirectoryRouter } from './shard-directory';
import { valuationProxyRouter } from './valuation-proxy';

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  projects: projectsRouter,
  bids: bidsRouter,
  reports: reportsRouter,
  notifications: notificationsRouter,
  messages: messagesRouter,
  directory: directoryRouter,
  valuation: valuationRouter,
  org: orgRouter,
  openclaw: openclawRouter,
  logs: logsRouter,
  adminUsers: adminUsersRouter,
  team: teamRouter,
  autoValuation: autoValuationRouter,
  guestValuation: guestValuationRouter,
  pdfReport: pdfReportRouter,
  propertySearch: propertySearchRouter,
  crawl: crawlRouter,
  sales: salesRouter,
  szfdc: szfdcRouter,
  aiFeatures: aiFeaturesRouter,
  news: newsRouter,
  crawlTemplates: crawlTemplatesRouter,
  settings: settingsRouter,
  threeLevelReview: threeLevelReviewRouter,
  workSheets: workSheetsRouter,
  valuationAlerts: valuationAlertsRouter,
  billing: billingRouter,
  seals: sealsRouter,
  // 新增：四大商业化模块
  payment: paymentRouter,
  notifyEnhanced: notifyEnhancedRouter,
  branding: brandingRouter,
  exports: exportsRouter,
  // 经纪机构（中介）模块
  broker: brokerRouter,
  // 平台超管（独立于SaaS租户）
  platformAdmin: platformAdminRouter,
  // 分库分表：楼盘/楼栋/案例（按 city_id 分片）
  shardDirectory: shardDirectoryRouter,
  // Python 估价微服务代理（GeoHash + ML 回归）
  valuationProxy: valuationProxyRouter,
});

export type AppRouter = typeof appRouter;
