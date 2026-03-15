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
import { autoValuationRouter } from './auto-valuation';
import { pdfReportRouter } from './pdf-report';
import { propertySearchRouter } from './property-search';
import { crawlRouter } from './crawl';
import { salesRouter } from './sales';
import { szfdcRouter } from './szfdc';
import { aiFeaturesRouter } from './ai-features';

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
  pdfReport: pdfReportRouter,
  propertySearch: propertySearchRouter,
  crawl: crawlRouter,
  sales: salesRouter,
  szfdc: szfdcRouter,
  aiFeatures: aiFeaturesRouter,
});

export type AppRouter = typeof appRouter;
