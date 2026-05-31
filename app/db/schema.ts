import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  boolean,
  date,
  int,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export const accounts = mysqlTable("accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).default("RUB").notNull(),
  color: varchar("color", { length: 7 }).default("#0E7490").notNull(),
  icon: varchar("icon", { length: 50 }).default("wallet").notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  parentId: bigint("parentId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }),
  type: varchar("type", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  date: date("date").notNull(),
  recipientAccountId: bigint("recipientAccountId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactionTags = mysqlTable("transactionTags", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 30 }).notNull(),
  color: varchar("color", { length: 7 }).default("#78716C").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactionTagLinks = mysqlTable("transactionTagLinks", {
  transactionId: bigint("transactionId", { mode: "number", unsigned: true }).notNull(),
  tagId: bigint("tagId", { mode: "number", unsigned: true }).notNull(),
});

export const budgets = mysqlTable("budgets", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  totalLimit: decimal("totalLimit", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const budgetCategories = mysqlTable("budgetCategories", {
  id: serial("id").primaryKey(),
  budgetId: bigint("budgetId", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }).notNull(),
  limit: decimal("limit", { precision: 15, scale: 2 }).notNull(),
});

export const goals = mysqlTable("goals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0").notNull(),
  targetDate: date("targetDate"),
  color: varchar("color", { length: 7 }).default("#0E7490").notNull(),
  icon: varchar("icon", { length: 50 }).default("target").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recurring = mysqlTable("recurring", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }),
  frequency: varchar("frequency", { length: 20 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  dayOfMonth: int("dayOfMonth"),
  description: varchar("description", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionTag = typeof transactionTags.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Recurring = typeof recurring.$inferSelect;
