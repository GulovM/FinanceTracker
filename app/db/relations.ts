import { relations } from "drizzle-orm";
import { users, accounts, categories, transactions, transactionTags, budgets, budgetCategories, goals, recurring } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  categories: many(categories),
  budgets: many(budgets),
  goals: many(goals),
  recurring: many(recurring),
  tags: many(transactionTags),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  user: one(users, { fields: [transactionTags.userId], references: [users.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, { fields: [budgetCategories.budgetId], references: [budgets.id] }),
  category: one(categories, { fields: [budgetCategories.categoryId], references: [categories.id] }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
}));

export const recurringRelations = relations(recurring, ({ one }) => ({
  user: one(users, { fields: [recurring.userId], references: [users.id] }),
  account: one(accounts, { fields: [recurring.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [recurring.categoryId], references: [categories.id] }),
}));
