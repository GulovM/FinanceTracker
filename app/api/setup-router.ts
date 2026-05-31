import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories, accounts, transactions, goals, recurring } from "@db/schema";
import { eq, and } from "drizzle-orm";

const defaultExpenseCategories = [
  { name: "Продукты", color: "#F97316", icon: "shopping-cart" },
  { name: "Транспорт", color: "#0E7490", icon: "bus" },
  { name: "Жильё", color: "#8B5CF6", icon: "home" },
  { name: "Развлечения", color: "#F43F5E", icon: "film" },
  { name: "Здоровье", color: "#22C55E", icon: "heart-pulse" },
  { name: "Одежда", color: "#EC4899", icon: "shirt" },
  { name: "Связь", color: "#3B82F6", icon: "smartphone" },
  { name: "Образование", color: "#F59E0B", icon: "graduation-cap" },
  { name: "Подарки", color: "#EF4444", icon: "gift" },
  { name: "Прочее", color: "#78716C", icon: "more-horizontal" },
];

const defaultIncomeCategories = [
  { name: "Зарплата", color: "#22C55E", icon: "briefcase" },
  { name: "Подработка", color: "#0E7490", icon: "hammer" },
  { name: "Инвестиции", color: "#8B5CF6", icon: "trending-up" },
  { name: "Подарки", color: "#F97316", icon: "gift" },
  { name: "Прочее", color: "#78716C", icon: "more-horizontal" },
];

const sampleAccounts = [
  { name: "Наличные", type: "cash" as const, balance: "15000.00", color: "#0E7490", icon: "banknote" },
  { name: "Сбербанк", type: "debit" as const, balance: "125000.00", color: "#22C55E", icon: "credit-card" },
  { name: "Тинькофф", type: "debit" as const, balance: "45000.00", color: "#F97316", icon: "credit-card" },
  { name: "Накопления", type: "savings" as const, balance: "200000.00", color: "#8B5CF6", icon: "piggy-bank" },
];

const sampleTransactions = [
  { type: "expense" as const, amount: "3240.50", description: "Продукты в Перекрестке", date: "2026-05-28", categoryIdx: 0, accountIdx: 1 },
  { type: "expense" as const, amount: "1200.00", description: "Метро", date: "2026-05-27", categoryIdx: 1, accountIdx: 1 },
  { type: "income" as const, amount: "150000.00", description: "Зарплата за май", date: "2026-05-25", categoryIdx: 0, accountIdx: 1 },
  { type: "expense" as const, amount: "8500.00", description: "Аренда квартиры", date: "2026-05-24", categoryIdx: 2, accountIdx: 1 },
  { type: "expense" as const, amount: "2100.00", description: "Кино и кафе", date: "2026-05-23", categoryIdx: 3, accountIdx: 2 },
  { type: "expense" as const, amount: "4500.00", description: "Продукты на неделю", date: "2026-05-22", categoryIdx: 0, accountIdx: 0 },
  { type: "expense" as const, amount: "890.00", description: "Аптека", date: "2026-05-21", categoryIdx: 4, accountIdx: 0 },
  { type: "expense" as const, amount: "3500.00", description: "Новая куртка", date: "2026-05-20", categoryIdx: 5, accountIdx: 2 },
  { type: "expense" as const, amount: "599.00", description: "Мобильный интернет", date: "2026-05-19", categoryIdx: 6, accountIdx: 1 },
  { type: "expense" as const, amount: "15000.00", description: "Курсы английского", date: "2026-05-18", categoryIdx: 7, accountIdx: 1 },
  { type: "expense" as const, amount: "2500.00", description: "Подарок маме", date: "2026-05-17", categoryIdx: 8, accountIdx: 0 },
  { type: "transfer" as const, amount: "20000.00", description: "Перевод на накопления", date: "2026-05-16", categoryIdx: -1, accountIdx: 1 },
  { type: "expense" as const, amount: "1800.00", description: "Такси", date: "2026-05-15", categoryIdx: 1, accountIdx: 2 },
  { type: "expense" as const, amount: "4200.00", description: "Ужин в ресторане", date: "2026-05-14", categoryIdx: 3, accountIdx: 2 },
  { type: "income" as const, amount: "25000.00", description: "Фриланс проект", date: "2026-05-12", categoryIdx: 1, accountIdx: 1 },
  { type: "expense" as const, amount: "5600.00", description: "Коммунальные услуги", date: "2026-05-10", categoryIdx: 2, accountIdx: 1 },
  { type: "expense" as const, amount: "780.00", description: "Кофе и круассан", date: "2026-05-09", categoryIdx: 0, accountIdx: 0 },
  { type: "expense" as const, amount: "12990.00", description: "Новые кроссовки", date: "2026-05-08", categoryIdx: 5, accountIdx: 2 },
  { type: "expense" as const, amount: "2300.00", description: "Продукты в Ленте", date: "2026-05-07", categoryIdx: 0, accountIdx: 0 },
  { type: "expense" as const, amount: "450.00", description: "Паркинг", date: "2026-05-06", categoryIdx: 1, accountIdx: 1 },
  { type: "income" as const, amount: "5000.00", description: "Кэшбэк", date: "2026-05-05", categoryIdx: 4, accountIdx: 1 },
  { type: "expense" as const, amount: "3200.00", description: "Стрижка и уход", date: "2026-05-04", categoryIdx: 4, accountIdx: 0 },
  { type: "expense" as const, amount: "8700.00", description: "Билеты в театр", date: "2026-05-03", categoryIdx: 3, accountIdx: 2 },
  { type: "expense" as const, amount: "1560.00", description: "Книги", date: "2026-05-02", categoryIdx: 7, accountIdx: 1 },
  { type: "expense" as const, amount: "45000.00", description: "Аренда квартиры", date: "2026-04-25", categoryIdx: 2, accountIdx: 1 },
  { type: "income" as const, amount: "150000.00", description: "Зарплата за апрель", date: "2026-04-24", categoryIdx: 0, accountIdx: 1 },
  { type: "expense" as const, amount: "18500.00", description: "Продукты за месяц", date: "2026-04-20", categoryIdx: 0, accountIdx: 0 },
  { type: "expense" as const, amount: "5800.00", description: "Транспорт", date: "2026-04-15", categoryIdx: 1, accountIdx: 1 },
  { type: "expense" as const, amount: "12000.00", description: "Развлечения", date: "2026-04-10", categoryIdx: 3, accountIdx: 2 },
  { type: "expense" as const, amount: "5200.00", description: "Коммунальные услуги", date: "2026-04-05", categoryIdx: 2, accountIdx: 1 },
];

const sampleGoals = [
  { name: "Новый ноутбук", targetAmount: "150000.00", currentAmount: "85000.00", targetDate: "2026-09-01", color: "#0E7490", icon: "laptop" },
  { name: "Отпуск в Таиланде", targetAmount: "300000.00", currentAmount: "120000.00", targetDate: "2026-12-15", color: "#F97316", icon: "plane" },
  { name: "Ремонт квартиры", targetAmount: "500000.00", currentAmount: "200000.00", targetDate: "2027-03-01", color: "#8B5CF6", icon: "paintbrush" },
];

const sampleRecurring = [
  { name: "Аренда квартиры", type: "expense" as const, amount: "45000.00", frequency: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 25, description: "Ежемесячная аренда" },
  { name: "Зарплата", type: "income" as const, amount: "150000.00", frequency: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 25, description: "Ежемесячная зарплата" },
  { name: "Интернет", type: "expense" as const, amount: "599.00", frequency: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 15, description: "Домашний интернет" },
  { name: "Спортзал", type: "expense" as const, amount: "2990.00", frequency: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 1, description: "Абонемент в спортзал" },
  { name: "Подписка Netflix", type: "expense" as const, amount: "499.00", frequency: "monthly" as const, startDate: "2026-01-01", dayOfMonth: 10, description: "Стриминговый сервис" },
];

export const setupRouter = createRouter({
  init: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Check if user already has data
    const existingCategories = await db.select().from(categories).where(eq(categories.userId, userId));
    if (existingCategories.length > 0) {
      return { success: true, message: "Already initialized" };
    }

    // Create user categories (copies of global ones)
    const expenseCatIds: number[] = [];
    for (const cat of defaultExpenseCategories) {
      const result = await db.insert(categories).values({
        userId,
        name: cat.name,
        type: "expense",
        color: cat.color,
        icon: cat.icon,
      });
      expenseCatIds.push(Number(result[0].insertId));
    }

    const incomeCatIds: number[] = [];
    for (const cat of defaultIncomeCategories) {
      const result = await db.insert(categories).values({
        userId,
        name: cat.name,
        type: "income",
        color: cat.color,
        icon: cat.icon,
      });
      incomeCatIds.push(Number(result[0].insertId));
    }

    // Create sample accounts
    const accountIds: number[] = [];
    for (const acc of sampleAccounts) {
      const result = await db.insert(accounts).values({
        userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        color: acc.color,
        icon: acc.icon,
      });
      accountIds.push(Number(result[0].insertId));
    }

    // Create sample transactions
    for (const tx of sampleTransactions) {
      const categoryId = tx.type === "income"
        ? incomeCatIds[tx.categoryIdx]
        : tx.type === "expense"
        ? expenseCatIds[tx.categoryIdx]
        : null;

      const accountId = accountIds[tx.accountIdx];
      let recipientAccountId = null;

      if (tx.type === "transfer" && tx.description.includes("накопления")) {
        recipientAccountId = accountIds[3]; // savings account
      }

      await db.insert(transactions).values({
        userId,
        accountId,
        categoryId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: new Date(tx.date),
        recipientAccountId,
      });
    }

    // Update account balances based on transactions
    for (let i = 0; i < accountIds.length; i++) {
      const accTxs = await db.select().from(transactions)
        .where(and(eq(transactions.accountId, accountIds[i]), eq(transactions.userId, userId)));

      let balance = Number(sampleAccounts[i].balance);

      for (const tx of accTxs) {
        if (tx.type === "income") {
          balance += Number(tx.amount);
        } else if (tx.type === "expense") {
          balance -= Number(tx.amount);
        } else if (tx.type === "transfer") {
          balance -= Number(tx.amount);
        }
      }

      // Also add incoming transfers
      const incomingTransfers = await db.select().from(transactions)
        .where(and(eq(transactions.recipientAccountId, accountIds[i]), eq(transactions.userId, userId)));

      for (const tx of incomingTransfers) {
        balance += Number(tx.amount);
      }

      await db.update(accounts).set({ balance: String(balance) }).where(eq(accounts.id, accountIds[i]));
    }

    // Create sample goals
    for (const goal of sampleGoals) {
      await db.insert(goals).values({
        userId,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: new Date(goal.targetDate),
        color: goal.color,
        icon: goal.icon,
      });
    }

    // Create sample recurring
    for (const rec of sampleRecurring) {
      await db.insert(recurring).values({
        userId,
        name: rec.name,
        type: rec.type,
        amount: rec.amount,
        accountId: accountIds[1], // Sberbank
        frequency: rec.frequency,
        startDate: new Date(rec.startDate),
        dayOfMonth: rec.dayOfMonth,
        description: rec.description,
      });
    }

    return { success: true, message: "Initialized with sample data" };
  }),
});
