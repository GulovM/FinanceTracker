import { getDb } from "../api/queries/connection";
import { users, accounts, categories, transactions, budgets, budgetCategories, goals, recurring } from "./schema";
import { sql } from "drizzle-orm";

const db = getDb();

const expenseCategories = [
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

const incomeCategories = [
  { name: "Зарплата", color: "#22C55E", icon: "briefcase" },
  { name: "Подработка", color: "#0E7490", icon: "hammer" },
  { name: "Инвестиции", color: "#8B5CF6", icon: "trending-up" },
  { name: "Подарки", color: "#F97316", icon: "gift" },
  { name: "Прочее", color: "#78716C", icon: "more-horizontal" },
];

const sampleAccounts = [
  { name: "Наличные", type: "cash", balance: "15000.00", color: "#0E7490", icon: "banknote" },
  { name: "Сбербанк", type: "debit", balance: "125000.00", color: "#22C55E", icon: "credit-card" },
  { name: "Тинькофф", type: "debit", balance: "45000.00", color: "#F97316", icon: "credit-card" },
  { name: "Накопления", type: "savings", balance: "200000.00", color: "#8B5CF6", icon: "piggy-bank" },
];

const sampleTransactions = [
  { type: "expense", amount: "3240.50", description: "Продукты в Перекрестке", date: "2026-05-28", categoryIdx: 0 },
  { type: "expense", amount: "1200.00", description: "Метро", date: "2026-05-27", categoryIdx: 1 },
  { type: "income", amount: "150000.00", description: "Зарплата за май", date: "2026-05-25", categoryIdx: 0 },
  { type: "expense", amount: "8500.00", description: "Аренда квартиры", date: "2026-05-24", categoryIdx: 2 },
  { type: "expense", amount: "2100.00", description: "Кино и кафе", date: "2026-05-23", categoryIdx: 3 },
  { type: "expense", amount: "4500.00", description: "Продукты на неделю", date: "2026-05-22", categoryIdx: 0 },
  { type: "expense", amount: "890.00", description: "Аптека", date: "2026-05-21", categoryIdx: 4 },
  { type: "expense", amount: "3500.00", description: "Новая куртка", date: "2026-05-20", categoryIdx: 5 },
  { type: "expense", amount: "599.00", description: "Мобильный интернет", date: "2026-05-19", categoryIdx: 6 },
  { type: "expense", amount: "15000.00", description: "Курсы английского", date: "2026-05-18", categoryIdx: 7 },
  { type: "expense", amount: "2500.00", description: "Подарок маме", date: "2026-05-17", categoryIdx: 8 },
  { type: "transfer", amount: "20000.00", description: "Перевод на накопления", date: "2026-05-16", categoryIdx: -1 },
  { type: "expense", amount: "1800.00", description: "Такси", date: "2026-05-15", categoryIdx: 1 },
  { type: "expense", amount: "4200.00", description: "Ужин в ресторане", date: "2026-05-14", categoryIdx: 3 },
  { type: "income", amount: "25000.00", description: "Фриланс проект", date: "2026-05-12", categoryIdx: 1 },
  { type: "expense", amount: "5600.00", description: "Коммунальные услуги", date: "2026-05-10", categoryIdx: 2 },
  { type: "expense", amount: "780.00", description: "Кофе и круассан", date: "2026-05-09", categoryIdx: 0 },
  { type: "expense", amount: "12990.00", description: "Новые кроссовки", date: "2026-05-08", categoryIdx: 5 },
  { type: "expense", amount: "2300.00", description: "Продукты в Ленте", date: "2026-05-07", categoryIdx: 0 },
  { type: "expense", amount: "450.00", description: "Паркинг", date: "2026-05-06", categoryIdx: 1 },
  { type: "income", amount: "5000.00", description: "Кэшбэк", date: "2026-05-05", categoryIdx: 4 },
  { type: "expense", amount: "3200.00", description: "Стрижка и уход", date: "2026-05-04", categoryIdx: 4 },
  { type: "expense", amount: "8700.00", description: "Билеты в театр", date: "2026-05-03", categoryIdx: 3 },
  { type: "expense", amount: "1560.00", description: "Книги", date: "2026-05-02", categoryIdx: 7 },
  { type: "expense", amount: "45000.00", description: "Аренда квартиры", date: "2026-04-25", categoryIdx: 2 },
  { type: "income", amount: "150000.00", description: "Зарплата за апрель", date: "2026-04-24", categoryIdx: 0 },
  { type: "expense", amount: "18500.00", description: "Продукты за месяц", date: "2026-04-20", categoryIdx: 0 },
  { type: "expense", amount: "5800.00", description: "Транспорт", date: "2026-04-15", categoryIdx: 1 },
  { type: "expense", amount: "12000.00", description: "Развлечения", date: "2026-04-10", categoryIdx: 3 },
  { type: "expense", amount: "5200.00", description: "Коммунальные услуги", date: "2026-04-05", categoryIdx: 2 },
];

const sampleGoals = [
  { name: "Новый ноутбук", targetAmount: "150000.00", currentAmount: "85000.00", targetDate: "2026-09-01", color: "#0E7490", icon: "laptop" },
  { name: "Отпуск в Таиланде", targetAmount: "300000.00", currentAmount: "120000.00", targetDate: "2026-12-15", color: "#F97316", icon: "plane" },
  { name: "Ремонт квартиры", targetAmount: "500000.00", currentAmount: "200000.00", targetDate: "2027-03-01", color: "#8B5CF6", icon: "paintbrush" },
];

const sampleRecurring = [
  { name: "Аренда квартиры", type: "expense", amount: "45000.00", frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 25, description: "Ежемесячная аренда" },
  { name: "Зарплата", type: "income", amount: "150000.00", frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 25, description: "Ежемесячная зарплата" },
  { name: "Интернет", type: "expense", amount: "599.00", frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 15, description: "Домашний интернет" },
  { name: "Спортзал", type: "expense", amount: "2990.00", frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 1, description: "Абонемент в спортзал" },
  { name: "Подписка Netflix", type: "expense", amount: "499.00", frequency: "monthly", startDate: "2026-01-01", dayOfMonth: 10, description: "Стриминговый сервис" },
];

async function seed() {
  console.log("Starting seed...");

  // We'll need a user to seed data for. Since we can't create an OAuth user,
  // the seed data will be inserted when a user first logs in via the API.
  // For now, let's just seed the global categories.

  console.log("Seeding global expense categories...");
  for (const cat of expenseCategories) {
    await db.insert(categories).values({
      name: cat.name,
      type: "expense",
      color: cat.color,
      icon: cat.icon,
      userId: null,
    }).onDuplicateKeyUpdate({ set: { name: sql`name` } });
  }

  console.log("Seeding global income categories...");
  for (const cat of incomeCategories) {
    await db.insert(categories).values({
      name: cat.name,
      type: "income",
      color: cat.color,
      icon: cat.icon,
      userId: null,
    }).onDuplicateKeyUpdate({ set: { name: sql`name` } });
  }

  console.log("Seed complete!");
  console.log("Note: Sample accounts, transactions, goals, and recurring data will be created when a user first logs in.");
}

seed().catch(console.error);
