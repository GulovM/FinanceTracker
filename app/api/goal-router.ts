import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { goals } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const goalRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(goals)
      .where(eq(goals.userId, ctx.user.id))
      .orderBy(goals.createdAt);
  }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(100),
      targetAmount: z.number().positive(),
      targetDate: z.string().optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
      currentAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(goals).values({
        userId: ctx.user.id,
        name: input.name,
        targetAmount: String(input.targetAmount),
        currentAmount: String(input.currentAmount || 0),
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        color: input.color || "#0E7490",
        icon: input.icon || "target",
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      targetAmount: z.number().positive().optional(),
      targetDate: z.string().optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
      currentAmount: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.targetAmount !== undefined) updateData.targetAmount = String(data.targetAmount);
      if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.currentAmount !== undefined) updateData.currentAmount = String(data.currentAmount);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await db.update(goals)
        .set(updateData)
        .where(and(eq(goals.id, id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),

  contribute: authedQuery
    .input(z.object({ id: z.number(), amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const goal = await db.select().from(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));

      if (!goal[0]) return { success: false };

      const newAmount = Number(goal[0].currentAmount) + input.amount;
      await db.update(goals)
        .set({ currentAmount: String(newAmount) })
        .where(eq(goals.id, input.id));

      return { success: true, currentAmount: newAmount };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, ctx.user.id)));
      return { success: true };
    }),
});
