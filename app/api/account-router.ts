import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { accounts } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const accountRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.user.id)));
      return result[0] || null;
    }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(["cash", "debit", "credit", "savings", "investment"]),
      balance: z.number().optional(),
      currency: z.string().max(3).optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(accounts).values({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        balance: String(input.balance || 0),
        currency: input.currency || "RUB",
        color: input.color || "#0E7490",
        icon: input.icon || "wallet",
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      type: z.enum(["cash", "debit", "credit", "savings", "investment"]).optional(),
      balance: z.number().optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
      isArchived: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.balance !== undefined) updateData.balance = String(data.balance);
      if (data.color !== undefined) updateData.color = data.color;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

      await db.update(accounts)
        .set(updateData)
        .where(and(eq(accounts.id, id), eq(accounts.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.user.id)));
      return { success: true };
    }),
});
