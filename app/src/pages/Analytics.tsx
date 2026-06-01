import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions, getAutoColor } from "@/lib/api";
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = ["#0E7490", "#F97316", "#F43F5E", "#8B5CF6", "#10B981", "#78716C", "#EC4899", "#3B82F6"];

export default function Analytics() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month");

  const periods = [
    { id: "week" as const, label: "Неделя" },
    { id: "month" as const, label: "Месяц" },
    { id: "quarter" as const, label: "Квартал" },
    { id: "year" as const, label: "Год" },
  ];

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let fromDate: string;
  const toDate = localDate(tomorrow);

  switch (period) {
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      fromDate = localDate(d);
      break;
    }
    case "month":
      fromDate = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case "quarter":
      fromDate = localDate(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1));
      break;
    case "year":
      fromDate = `${now.getFullYear()}-01-01`;
      break;
  }

  const twelveMonthsAgo = localDate(new Date(now.getFullYear() - 1, now.getMonth(), 1));

  const { data: periodTxData } = useQuery({
    queryKey: ['transactions', 'analytics', fromDate, toDate],
    queryFn: () => getTransactions({ dateFrom: fromDate, dateTo: toDate, limit: 1000, offset: 0 }),
  });

  const { data: trendTxData } = useQuery({
    queryKey: ['transactions', 'trend-12', twelveMonthsAgo],
    queryFn: () => getTransactions({ dateFrom: twelveMonthsAgo, dateTo: toDate, limit: 2000, offset: 0 }),
  });

  // Compute category aggregations
  const { categoryData, incomeData, summary } = useMemo(() => {
    const txs = periodTxData?.items ?? [];

    const expenseCats: Record<string, { name: string; amount: number; color: string; id: number }> = {};
    const incomeCats: Record<string, { name: string; amount: number; color: string; id: number }> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const t of txs) {
      const key = String(t.categoryId);
      if (t.type === 'expense') {
        totalExpenses += t.amount;
        if (!expenseCats[key]) {
          expenseCats[key] = {
            name: t.categoryName ?? 'Прочее',
            amount: 0,
            color: t.categoryColor ?? getAutoColor(t.categoryId),
            id: t.categoryId,
          };
        }
        expenseCats[key].amount += t.amount;
      } else if (t.type === 'income') {
        totalIncome += t.amount;
        if (!incomeCats[key]) {
          incomeCats[key] = {
            name: t.categoryName ?? 'Прочее',
            amount: 0,
            color: t.categoryColor ?? getAutoColor(t.categoryId),
            id: t.categoryId,
          };
        }
        incomeCats[key].amount += t.amount;
      }
    }

    const categoryData = Object.values(expenseCats).sort((a, b) => b.amount - a.amount);
    const incomeData = Object.values(incomeCats).sort((a, b) => b.amount - a.amount);
    const summary = {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
    };

    return { categoryData, incomeData, summary };
  }, [periodTxData]);

  // Monthly trend
  const monthlyData = useMemo(() => {
    const txs = trendTxData?.items ?? [];
    const map: Record<string, { income: number; expenses: number }> = {};
    for (const t of txs) {
      const month = t.date.substring(0, 7);
      if (!map[month]) map[month] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[month].income += t.amount;
      if (t.type === 'expense') map[month].expenses += t.amount;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));
  }, [trendTxData]);

  const pieData = categoryData.slice(0, 8).map((cat, i) => ({
    name: cat.name,
    value: cat.amount,
    color: cat.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  const topCategory = categoryData[0];

  const dailyAvg = summary.expenses && period !== "week"
    ? summary.expenses / (period === "month" ? 30 : period === "quarter" ? 90 : 365)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="flex justify-center">
        <div className="flex w-full sm:w-auto rounded-xl border border-[var(--border-medium)] overflow-hidden bg-white">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                period === p.id
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Средний расход в день
          </p>
          <p className="text-2xl font-mono font-semibold text-[var(--text-primary)]">
            {formatCurrency(dailyAvg)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Крупнейшая категория
          </p>
          <p className="text-lg font-medium text-[var(--text-primary)]">
            {topCategory?.name || "Н/Д"}
          </p>
          {topCategory && summary.expenses > 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              {Math.round((topCategory.amount / summary.expenses) * 100)}% от расходов
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Экономия
          </p>
          <p
            className="text-2xl font-mono font-semibold"
            style={{
              color: summary.balance >= 0 ? "var(--success)" : "var(--accent-tertiary)",
            }}
          >
            {summary.balance >= 0 ? "+" : ""}
            {formatCurrency(summary.balance)}
          </p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Structure */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
          <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
            Структура расходов
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="w-full sm:w-[200px] h-[180px] sm:h-[200px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
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
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text-secondary)] truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-mono text-[var(--text-muted)] flex-shrink-0 ml-2">
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
            Динамика по месяцам
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData.map((m) => ({
                  month: `${getMonthName(Number(m.month.split("-")[1]))}`,
                  Доходы: m.income,
                  Расходы: m.expenses,
                }))}
              >
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
                <Line
                  type="monotone"
                  dataKey="Доходы"
                  stroke="var(--accent-secondary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="Расходы"
                  stroke="var(--accent-tertiary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
          <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
            Топ категорий расходов
          </h3>
          <div className="space-y-3">
            {categoryData.slice(0, 8).map((cat, i) => {
              const maxAmount = categoryData[0]?.amount || 1;
              const width = (cat.amount / maxAmount) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--text-secondary)]">{cat.name}</span>
                    <span className="text-sm font-mono text-[var(--text-primary)]">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
          <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
            Структура доходов
          </h3>
          <div className="space-y-3">
            {incomeData.slice(0, 8).map((cat, i) => {
              const maxAmount = incomeData[0]?.amount || 1;
              const width = (cat.amount / maxAmount) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[var(--text-secondary)]">{cat.name}</span>
                    <span className="text-sm font-mono text-[var(--success)]">
                      +{formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {incomeData.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">Нет данных о доходах</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
