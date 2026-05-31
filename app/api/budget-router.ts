import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { budgets, budgetCategories, transactions, categories } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const budgetRouter = createRouter({
  getCurrent: authedQuery
    .input(z.object({
      month: z.number().min(1).max(12).optional(),
      year: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const now = new Date();
      const month = input?.month || now.getMonth() + 1;
      const year = input?.year || now.getFullYear();

      const budgetResult = await db.select().from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)));

      const budget = budgetResult[0];

      if (!budget) {
        return null;
      }

      // Get budget categories with limits
      const bcResult = await db.select({
        id: budgetCategories.id,
        categoryId: budgetCategories.categoryId,
        limit: budgetCategories.limit,
        name: categories.name,
        color: categories.color,
      })
        .from(budgetCategories)
        .leftJoin(categories, eq(budgetCategories.categoryId, categories.id))
        .where(eq(budgetCategories.budgetId, budget.id));

      // Get actual spending for each category
      const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const toDate = `${year}-${String(month).padStart(2, "0")}-31`;

      const spending = await db.select({
        categoryId: transactions.categoryId,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, "expense"),
          sql`${transactions.date} >= ${fromDate}`,
          sql`${transactions.date} <= ${toDate}`,
        ))
        .groupBy(transactions.categoryId);

      const spendingMap = new Map<number, number>();
      for (const s of spending) {
        if (s.categoryId) {
          spendingMap.set(s.categoryId, Number(s.total));
        }
      }

      const totalSpent = Array.from(spendingMap.values()).reduce((a, b) => a + b, 0);
      const totalLimit = Number(budget.totalLimit);

      return {
        ...budget,
        totalSpent,
        remaining: totalLimit - totalSpent,
        percentage: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
        categories: bcResult.map(bc => ({
          ...bc,
          spent: spendingMap.get(bc.categoryId || 0) || 0,
          percentage: Number(bc.limit) > 0 ? Math.round(((spendingMap.get(bc.categoryId || 0) || 0) / Number(bc.limit)) * 100) : 0,
        })),
      };
    }),

  create: authedQuery
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
      totalLimit: z.number().positive(),
      categories: z.array(z.object({
        categoryId: z.number(),
        limit: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const result = await db.insert(budgets).values({
        userId: ctx.user.id,
        month: input.month,
        year: input.year,
        totalLimit: String(input.totalLimit),
      });

      const budgetId = Number(result[0].insertId);

      if (input.categories && input.categories.length > 0) {
        for (const cat of input.categories) {
          await db.insert(budgetCategories).values({
            budgetId,
            categoryId: cat.categoryId,
            limit: String(cat.limit),
          });
        }
      }

      return { id: budgetId };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      totalLimit: z.number().positive().optional(),
      categories: z.array(z.object({
        categoryId: z.number(),
        limit: z.number().positive(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      if (data.totalLimit !== undefined) {
        await db.update(budgets)
          .set({ totalLimit: String(data.totalLimit) })
          .where(and(eq(budgets.id, id), eq(budgets.userId, ctx.user.id)));
      }

      if (data.categories) {
        await db.delete(budgetCategories).where(eq(budgetCategories.budgetId, id));
        for (const cat of data.categories) {
          await db.insert(budgetCategories).values({
            budgetId: id,
            categoryId: cat.categoryId,
            limit: String(cat.limit),
          });
        }
      }

      return { success: true };
    }),
});
