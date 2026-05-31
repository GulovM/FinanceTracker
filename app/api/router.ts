import { authRouter } from "./auth-router";
import { accountRouter } from "./account-router";
import { categoryRouter } from "./category-router";
import { transactionRouter } from "./transaction-router";
import { budgetRouter } from "./budget-router";
import { goalRouter } from "./goal-router";
import { recurringRouter } from "./recurring-router";
import { dashboardRouter } from "./dashboard-router";
import { setupRouter } from "./setup-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  account: accountRouter,
  category: categoryRouter,
  transaction: transactionRouter,
  budget: budgetRouter,
  goal: goalRouter,
  recurring: recurringRouter,
  dashboard: dashboardRouter,
  setup: setupRouter,
});

export type AppRouter = typeof appRouter;
