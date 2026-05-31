import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { transactions, accounts, categories } from "@db/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

export const transactionRouter = createRouter({
  list: authedQuery
    .input(z.object({
      accountId: z.number().optional(),
      categoryId: z.number().optional(),
      type: z.enum(["income", "expense", "transfer"]).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const conditions = [eq(transactions.userId, userId)];

      if (input?.accountId) {
        conditions.push(eq(transactions.accountId, input.accountId));
      }
      if (input?.categoryId) {
        conditions.push(eq(transactions.categoryId, input.categoryId));
      }
      if (input?.type) {
        conditions.push(eq(transactions.type, input.type));
      }
      if (input?.from) {
        conditions.push(sql`${transactions.date} >= ${input.from}`);
      }
      if (input?.to) {
        conditions.push(sql`${transactions.date} <= ${input.to}`);
      }
      if (input?.search) {
        conditions.push(like(transactions.description, `%${input.search}%`));
      }

      const offset = ((input?.page || 1) - 1) * (input?.limit || 20);

      const items = await db.select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        date: transactions.date,
        recipientAccountId: transactions.recipientAccountId,
        createdAt: transactions.createdAt,
      }).from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.date))
        .limit(input?.limit || 20)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions));

      return {
        items,
        total: countResult[0]?.count || 0,
        page: input?.page || 1,
        limit: input?.limit || 20,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)));
      return result[0] || null;
    }),

  create: authedQuery
    .input(z.object({
      accountId: z.number(),
      type: z.enum(["income", "expense", "transfer"]),
      amount: z.number().positive(),
      categoryId: z.number().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      recipientAccountId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const amount = input.amount;
      const dateStr = input.date || new Date().toISOString().split("T")[0];

      // Create transaction
      const result = await db.insert(transactions).values({
        userId: ctx.user.id,
        accountId: input.accountId,
        categoryId: input.categoryId || null,
        type: input.type,
        amount: String(amount),
        description: input.description || null,
        date: new Date(dateStr),
        recipientAccountId: input.recipientAccountId || null,
      });

      // Update account balance
      const account = await db.select().from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)));

      if (account[0]) {
        const currentBalance = Number(account[0].balance);
        let newBalance = currentBalance;

        if (input.type === "income") {
          newBalance = currentBalance + amount;
        } else if (input.type === "expense") {
          newBalance = currentBalance - amount;
        } else if (input.type === "transfer") {
          newBalance = currentBalance - amount;
          // Update recipient account
          if (input.recipientAccountId) {
            const recipient = await db.select().from(accounts)
              .where(and(eq(accounts.id, input.recipientAccountId), eq(accounts.userId, ctx.user.id)));
            if (recipient[0]) {
              await db.update(accounts)
                .set({ balance: String(Number(recipient[0].balance) + amount) })
                .where(eq(accounts.id, input.recipientAccountId));
            }
          }
        }

        await db.update(accounts)
          .set({ balance: String(newBalance) })
          .where(eq(accounts.id, input.accountId));
      }

      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      accountId: z.number().optional(),
      type: z.enum(["income", "expense", "transfer"]).optional(),
      amount: z.number().positive().optional(),
      categoryId: z.number().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const existing = await db.select().from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, ctx.user.id)));

      if (!existing[0]) return { success: false };

      const updateData: Record<string, unknown> = {};
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.amount !== undefined) updateData.amount = String(data.amount);
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = new Date(data.date);

      await db.update(transactions).set(updateData)
        .where(and(eq(transactions.id, id), eq(transactions.userId, ctx.user.id)));

      // If amount changed, recalculate balance
      if (data.amount !== undefined && data.amount !== Number(existing[0].amount)) {
        const oldAmount = Number(existing[0].amount);
        const newAmount = data.amount;
        const account = await db.select().from(accounts)
          .where(and(eq(accounts.id, existing[0].accountId), eq(accounts.userId, ctx.user.id)));

        if (account[0]) {
          const currentBalance = Number(account[0].balance);
          let adjustment = 0;

          if (existing[0].type === "income") {
            adjustment = -oldAmount + newAmount;
          } else if (existing[0].type === "expense") {
            adjustment = oldAmount - newAmount;
          }

          await db.update(accounts)
            .set({ balance: String(currentBalance + adjustment) })
            .where(eq(accounts.id, existing[0].accountId));
        }
      }

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db.select().from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)));

      if (!existing[0]) return { success: false };

      // Reverse balance change
      const account = await db.select().from(accounts)
        .where(and(eq(accounts.id, existing[0].accountId), eq(accounts.userId, ctx.user.id)));

      if (account[0]) {
        const currentBalance = Number(account[0].balance);
        const amount = Number(existing[0].amount);
        let newBalance = currentBalance;

        if (existing[0].type === "income") {
          newBalance = currentBalance - amount;
        } else if (existing[0].type === "expense") {
          newBalance = currentBalance + amount;
        } else if (existing[0].type === "transfer" && existing[0].recipientAccountId) {
          newBalance = currentBalance + amount;
          const recipient = await db.select().from(accounts)
            .where(and(eq(accounts.id, existing[0].recipientAccountId), eq(accounts.userId, ctx.user.id)));
          if (recipient[0]) {
            await db.update(accounts)
              .set({ balance: String(Number(recipient[0].balance) - amount) })
              .where(eq(accounts.id, existing[0].recipientAccountId));
          }
        }

        await db.update(accounts)
          .set({ balance: String(newBalance) })
          .where(eq(accounts.id, existing[0].accountId));
      }

      await db.delete(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)));

      return { success: true };
    }),

  summary: authedQuery
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const conditions = [eq(transactions.userId, userId)];

      if (input?.from) conditions.push(sql`${transactions.date} >= ${input.from}`);
      if (input?.to) conditions.push(sql`${transactions.date} <= ${input.to}`);

      const incomeResult = await db.select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      }).from(transactions)
        .where(and(...conditions, eq(transactions.type, "income")));

      const expenseResult = await db.select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      }).from(transactions)
        .where(and(...conditions, eq(transactions.type, "expense")));

      const income = Number(incomeResult[0]?.total || 0);
      const expenses = Number(expenseResult[0]?.total || 0);

      return {
        income,
        expenses,
        balance: income - expenses,
      };
    }),

  byCategory: authedQuery
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      type: z.enum(["income", "expense"]).default("expense"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const conditions = [
        eq(transactions.userId, userId),
        eq(transactions.type, input?.type || "expense"),
      ];

      if (input?.from) conditions.push(sql`${transactions.date} >= ${input.from}`);
      if (input?.to) conditions.push(sql`${transactions.date} <= ${input.to}`);

      const result = await db.select({
        categoryId: transactions.categoryId,
        name: categories.name,
        amount: sql<string>`SUM(${transactions.amount})`,
        color: categories.color,
      })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(and(...conditions))
        .groupBy(transactions.categoryId)
        .orderBy(sql`SUM(${transactions.amount}) DESC`);

      return result.map(r => ({
        categoryId: r.categoryId,
        name: r.name || "Без категории",
        amount: Number(r.amount),
        color: r.color || "#78716C",
      }));
    }),

  monthlyTrend: authedQuery
    .input(z.object({ months: z.number().min(1).max(24).default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const months = input?.months || 6;

      const results = await db.select({
        month: sql<string>`DATE_FORMAT(${transactions.date}, '%Y-%m')`,
        income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
        expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          sql`${transactions.date} >= DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)`,
        ))
        .groupBy(sql`DATE_FORMAT(${transactions.date}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${transactions.date}, '%Y-%m')`);

      return results.map(r => ({
        month: r.month,
        income: Number(r.income),
        expenses: Number(r.expenses),
      }));
    }),
});
