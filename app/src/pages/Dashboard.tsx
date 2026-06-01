import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getAccounts,
  getTransactions,
  getGoals,
  getRecurringList,
  getBudgets,
  getBudgetSummary,
  getAutoColor,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import MetricCard from "@/components/shared/MetricCard";
import TransactionRow from "@/components/shared/TransactionRow";
import AccountCard from "@/components/shared/AccountCard";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Repeat,
  Trophy,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = ["#0E7490", "#F97316", "#F43F5E", "#8B5CF6", "#10B981", "#78716C"];

export default function Dashboard() {
  const navigate = useNavigate();

  const { currentYear, currentMonth, currentDay, monthStart, sixMonthsAgo, today } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      currentDay: now.getDate(),
      monthStart: localDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      sixMonthsAgo: localDate(new Date(now.getFullYear(), now.getMonth() - 5, 1)),
      today: localDate(tomorrow),
    };
  }, []);

  const { data: accounts = [], isLoading: accLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: monthTxData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', 'month', monthStart],
    queryFn: () => getTransactions({ dateFrom: monthStart, dateTo: today, limit: 500, offset: 0 }),
  });

  const { data: trendTxData } = useQuery({
    queryKey: ['transactions', 'trend', sixMonthsAgo],
    queryFn: () => getTransactions({ dateFrom: sixMonthsAgo, dateTo: today, limit: 1000, offset: 0 }),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const { data: recurring = [] } = useQuery({
    queryKey: ['recurring'],
    queryFn: getRecurringList,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  // Find current month budget
  const currentBudget = useMemo(() => {
    return budgets.find(b => {
      if (!b.periodStart) return false;
      const d = new Date(b.periodStart);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }) ?? null;
  }, [budgets, currentYear, currentMonth]);

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary', currentBudget?.id],
    queryFn: () => currentBudget ? getBudgetSummary(currentBudget.id) : null,
    enabled: !!currentBudget,
  });

  const isLoading = accLoading || txLoading;

  // Aggregate data
  const { totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, expensesByCategory } = useMemo(() => {
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const txs = monthTxData?.items ?? [];
    const monthlyIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const recentTransactions = [...txs].sort((a, b) => b.id - a.id).slice(0, 6);

    // Group expenses by category
    const catMap: Record<string, { name: string; amount: number; color: string }> = {};
    for (const t of txs) {
      if (t.type !== 'expense') continue;
      const key = String(t.categoryId);
      if (!catMap[key]) {
        catMap[key] = {
          name: t.categoryName ?? 'Прочее',
          amount: 0,
          color: t.categoryColor ?? getAutoColor(t.categoryId),
        };
      }
      catMap[key].amount += t.amount;
    }
    const expensesByCategory = Object.values(catMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return { totalBalance, monthlyIncome, monthlyExpenses, recentTransactions, expensesByCategory };
  }, [accounts, monthTxData]);

  // Monthly trend for bar chart
  const monthlyData = useMemo(() => {
    const txs = trendTxData?.items ?? [];
    const map: Record<string, { income: number; expenses: number }> = {};
    for (const t of txs) {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!map[month]) map[month] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[month].income += t.amount;
      if (t.type === 'expense') map[month].expenses += t.amount;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [trendTxData]);

  const budgetRemaining = budgetSummary?.remaining ?? 0;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 sm:h-32 bg-[var(--bg-hover)] rounded-2xl animate-pulse-slow" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 sm:h-64 bg-[var(--bg-hover)] rounded-2xl animate-pulse-slow" />
          ))}
        </div>
      </div>
    );
  }

  const donutData = expensesByCategory.slice(0, 5).map((cat, i) => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = monthlyData.map((m) => ({
    month: m.month.split("-")[1] + "." + m.month.split("-")[0].slice(2),
    Доходы: m.income,
    Расходы: m.expenses,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden p-8 bg-white border border-[var(--border-light)] shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/hero-dashboard.jpg)" }}
        />
        <div className="absolute inset-0 bg-[var(--bg-primary)]/70" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="font-heading text-2xl font-semibold text-[var(--text-primary)]">
              {formatDate(new Date())}
            </p>
            <p className="text-[var(--text-secondary)] mt-1">
              Вот что происходит с вашими финансами
            </p>
          </div>
          <Sparkles className="w-10 h-10 text-[var(--accent-primary)]/30" />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <MetricCard
          label="Общий баланс"
          value={totalBalance}
          icon={Wallet}
          color="var(--text-primary)"
        />
        <MetricCard
          label="Доходы (мес)"
          value={monthlyIncome}
          icon={TrendingUp}
          color="var(--accent-secondary)"
        />
        <MetricCard
          label="Расходы (мес)"
          value={monthlyExpenses}
          icon={TrendingDown}
          color="var(--accent-tertiary)"
        />
        <MetricCard
          label="Остаток бюджета"
          value={budgetRemaining}
          icon={PiggyBank}
          color="var(--accent-primary)"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Expenses by Category */}
          <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
              Расходы по категориям
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="w-full sm:w-[200px] h-[180px] sm:h-[200px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "white",
                        border: "1px solid var(--border-light)",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {donutData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-[var(--text-secondary)] truncate">{item.name}</span>
                    <span className="text-xs font-mono text-[var(--text-muted)] ml-auto flex-shrink-0">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
              Динамика доходов и расходов
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: "white",
                      border: "1px solid var(--border-light)",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="Доходы" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} opacity={0.8} />
                  <Bar dataKey="Расходы" fill="var(--accent-tertiary)" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-[var(--border-light)] shadow-[0_1px_3px_rgba(28,25,23,0.04)] relative">
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)]">
                Последние транзакции
              </h3>
              <button
                onClick={() => navigate("/transactions")}
                className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
              >
                Смотреть все <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-3">
              {recentTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  type={tx.type}
                  amount={tx.amount}
                  description={tx.description}
                  date={tx.date}
                  categoryName={tx.categoryName}
                  categoryColor={tx.categoryColor}
                  categoryIcon={tx.categoryIcon}
                  accountName={tx.accountName}
                  accountColor={tx.accountColor}
                />
              ))}
              {recentTransactions.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Пока нет транзакций</p>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/transactions")}
              className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(14,116,144,0.3)] hover:bg-[var(--accent-primary-hover)] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Upcoming Recurring */}
          <div className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
              Ближайшие автоплатежи
            </h3>
            <div className="space-y-3">
              {recurring.filter(r => r.isActive).slice(0, 4).map((rec) => {
                const isOverdue = rec.dayOfMonth ? rec.dayOfMonth < currentDay : false;
                return (
                  <div
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isOverdue ? "border-l-2 border-[var(--accent-tertiary)] bg-[var(--accent-tertiary)]/5" : "bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${rec.type === "expense" ? "var(--accent-tertiary)" : "var(--accent-secondary)"}15` }}
                    >
                      {isOverdue ? (
                        <AlertCircle className="w-4 h-4 text-[var(--accent-tertiary)]" />
                      ) : (
                        <Repeat className="w-4 h-4 text-[var(--accent-primary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{rec.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {rec.dayOfMonth ? `${rec.dayOfMonth}-го числа` : rec.frequency}
                      </p>
                    </div>
                    <span
                      className="text-sm font-mono font-medium flex-shrink-0"
                      style={{
                        color: rec.type === "expense" ? "var(--accent-tertiary)" : "var(--accent-secondary)",
                      }}
                    >
                      {rec.type === "expense" ? "−" : "+"}
                      {formatCurrency(rec.amount)}
                    </span>
                  </div>
                );
              })}
              {recurring.filter(r => r.isActive).length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Нет автоплатежей</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-medium text-[var(--text-primary)]">Мои счета</h3>
          <button
            onClick={() => navigate("/accounts")}
            className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            Управлять <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              name={account.name}
              type={account.type}
              balance={account.balance}
              color={account.color}
              icon={account.icon}
              onClick={() => navigate("/accounts")}
            />
          ))}
          {accounts.length === 0 && (
            <div className="py-8 text-center w-full">
              <p className="text-sm text-[var(--text-muted)]">Нет счетов</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals Preview */}
      {goals.filter(g => g.isActive).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)]">Цели накопления</h3>
            <button
              onClick={() => navigate("/goals")}
              className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
            >
              Все цели <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {goals.filter(g => g.isActive).slice(0, 3).map((goal) => {
              const progress = goal.targetAmount > 0
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                : 0;
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}15` }}
                    >
                      <Trophy className="w-5 h-5" style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{goal.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{progress}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
