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
});

export type AppRouter = typeof appRouter;
