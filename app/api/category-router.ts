import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories } from "@db/schema";
import { eq, and, isNull, or } from "drizzle-orm";

export const categoryRouter = createRouter({
  list: authedQuery
    .input(z.object({ type: z.enum(["income", "expense"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const conditions = [
        or(eq(categories.userId, userId), isNull(categories.userId)),
      ];
      if (input?.type) {
        conditions.push(eq(categories.type, input.type));
      }
      return db.select().from(categories).where(and(...conditions));
    }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(1).max(50),
      type: z.enum(["income", "expense"]),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
      parentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(categories).values({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        color: input.color || "#78716C",
        icon: input.icon || "more-horizontal",
        parentId: input.parentId || null,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(50).optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(categories)
        .set(data)
        .where(and(eq(categories.id, id), eq(categories.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(categories)
        .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.user.id)));
      return { success: true };
    }),
});
