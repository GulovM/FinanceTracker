import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { recurring } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const recurringRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(recurring)
      .where(eq(recurring.userId, ctx.user.id))
      .orderBy(recurring.createdAt);
  }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(["income", "expense"]),
      amount: z.number().positive(),
      accountId: z.number(),
      categoryId: z.number().optional(),
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
      startDate: z.string(),
      endDate: z.string().optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(recurring).values({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        amount: String(input.amount),
        accountId: input.accountId,
        categoryId: input.categoryId || null,
        frequency: input.frequency,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        dayOfMonth: input.dayOfMonth || null,
        description: input.description || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      type: z.enum(["income", "expense"]).optional(),
      amount: z.number().positive().optional(),
      accountId: z.number().optional(),
      categoryId: z.number().optional(),
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.amount !== undefined) updateData.amount = String(data.amount);
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth;
      if (data.description !== undefined) updateData.description = data.description;

      await db.update(recurring)
        .set(updateData)
        .where(and(eq(recurring.id, id), eq(recurring.userId, ctx.user.id)));
      return { success: true };
    }),

  toggle: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const item = await db.select().from(recurring)
        .where(and(eq(recurring.id, input.id), eq(recurring.userId, ctx.user.id)));

      if (!item[0]) return { success: false };

      await db.update(recurring)
        .set({ isActive: !item[0].isActive })
        .where(eq(recurring.id, input.id));

      return { success: true, isActive: !item[0].isActive };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(recurring)
        .where(and(eq(recurring.id, input.id), eq(recurring.userId, ctx.user.id)));
      return { success: true };
    }),
});
