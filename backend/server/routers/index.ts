import { router } from "../lib/trpc";
import { authRouter } from "./auth";
import { dashboardRouter } from "./dashboard";
import { projectsRouter, bidsRouter } from "./projects";
import { reportsRouter } from "./reports";
import { notificationsRouter, messagesRouter } from "./notifications";
import { directoryRouter } from "./directory";
import { valuationRouter } from "./valuation";
import { orgRouter, openclawRouter, logsRouter, adminUsersRouter } from "./org";

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
});

export type AppRouter = typeof appRouter;
