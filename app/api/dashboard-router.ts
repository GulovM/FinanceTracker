import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { accounts, transactions, categories, recurring, goals } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dashboardRouter = createRouter({
  overview: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`;

    // Get all accounts with balances
    const userAccounts = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)));

    const totalBalance = userAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    // Monthly income
    const incomeResult = await db.select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    }).from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "income"),
        sql`${transactions.date} >= ${monthStart}`,
        sql`${transactions.date} <= ${monthEnd}`,
      ));

    const monthlyIncome = Number(incomeResult[0]?.total || 0);

    // Monthly expenses
    const expenseResult = await db.select({
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    }).from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        sql`${transactions.date} >= ${monthStart}`,
        sql`${transactions.date} <= ${monthEnd}`,
      ));

    const monthlyExpenses = Number(expenseResult[0]?.total || 0);

    // Recent transactions (last 10)
    const recentTransactions = await db.select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      accountName: accounts.name,
      accountColor: accounts.color,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(10);

    // Upcoming recurring (next 5 active)
    const upcomingRecurring = await db.select()
      .from(recurring)
      .where(and(eq(recurring.userId, userId), eq(recurring.isActive, true)))
      .orderBy(recurring.dayOfMonth)
      .limit(5);

    // Expenses by category (current month)
    const expensesByCategory = await db.select({
      categoryId: transactions.categoryId,
      name: categories.name,
      amount: sql<string>`SUM(${transactions.amount})`,
      color: categories.color,
    })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        sql`${transactions.date} >= ${monthStart}`,
        sql`${transactions.date} <= ${monthEnd}`,
      ))
      .groupBy(transactions.categoryId)
      .orderBy(sql`SUM(${transactions.amount}) DESC`);

    // Goals
    const userGoals = await db.select().from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
      .limit(3);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      budgetRemaining: monthlyIncome - monthlyExpenses,
      accounts: userAccounts,
      recentTransactions,
      upcomingRecurring,
      expensesByCategory: expensesByCategory.map(e => ({
        categoryId: e.categoryId,
        name: e.name || "Без категории",
        amount: Number(e.amount),
        color: e.color || "#78716C",
      })),
      goals: userGoals,
    };
  }),
});
