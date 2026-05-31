import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgets,
  getBudgetSummary,
  createBudget,
  getCategories,
  getTransactions,
} from "@/lib/api";
import BudgetProgress from "@/components/shared/BudgetProgress";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import {
  Plus,
  Target,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => getCategories('expense'),
  });

  // Find current period budget
  const currentBudget = useMemo(() => {
    return budgets.find(b => {
      if (!b.periodStart) return false;
      const d = new Date(b.periodStart + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    }) ?? null;
  }, [budgets, month, year]);

  const { data: budgetSummary } = useQuery({
    queryKey: ['budget-summary', currentBudget?.id],
    queryFn: () => currentBudget ? getBudgetSummary(currentBudget.id) : null,
    enabled: !!currentBudget,
  });

  // Fetch transactions for the period to compute per-category spending
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: periodTxData } = useQuery({
    queryKey: ['transactions', 'budget-period', periodStart, periodEnd],
    queryFn: () => getTransactions({ dateFrom: periodStart, dateTo: periodEnd, limit: 1000, offset: 0 }),
    enabled: !!currentBudget,
  });

  // Per-category spending from transactions
  const categorySpending = useMemo(() => {
    if (!currentBudget || !periodTxData) return [];
    const txs = periodTxData.items.filter(t => t.type === 'expense');
    const map: Record<number, number> = {};
    for (const t of txs) {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return currentBudget.categoryIds
      .map(cid => {
        const cat = categories.find(c => c.id === cid);
        return {
          id: cid,
          name: cat?.name ?? 'Категория',
          spent: map[cid] ?? 0,
          limit: budgetSummary ? budgetSummary.totalLimit / Math.max(1, currentBudget.categoryIds.length) : 0,
          color: cat?.color,
        };
      })
      .filter(c => c.spent > 0 || currentBudget.categoryIds.includes(c.id));
  }, [currentBudget, periodTxData, categories, budgetSummary]);

  const createMut = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsAddOpen(false);
      setNewBudget({ totalLimit: "", categoryLimits: [] });
    },
  });

  const [newBudget, setNewBudget] = useState({
    totalLimit: "",
    categoryLimits: [] as { categoryId: number; limit: string }[],
  });

  const handleCreate = () => {
    if (!newBudget.totalLimit) return;
    createMut.mutate({
      month,
      year,
      totalLimit: Number(newBudget.totalLimit),
      categories: newBudget.categoryLimits
        .filter((c) => c.limit && Number(c.limit) > 0)
        .map((c) => ({ categoryId: c.categoryId, limit: Number(c.limit) })),
    });
  };

  const addCategoryLimit = () => {
    const unusedCat = categories.find(
      (c) => !newBudget.categoryLimits.find((cl) => cl.categoryId === c.id)
    );
    if (unusedCat) {
      setNewBudget({
        ...newBudget,
        categoryLimits: [...newBudget.categoryLimits, { categoryId: unusedCat.id, limit: "" }],
      });
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2025, 2026, 2027];

  const budget = budgetSummary && currentBudget ? {
    totalLimit: budgetSummary.totalLimit,
    totalSpent: budgetSummary.totalSpent,
    remaining: budgetSummary.remaining,
    percentage: budgetSummary.percentage,
    categories: categorySpending,
  } : null;

  return (
    <div className="p-8 space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-10 px-4 rounded-xl border border-[var(--border-medium)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonthYear(m, year)}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-10 px-4 rounded-xl border border-[var(--border-medium)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {!budget ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[var(--border-light)] p-12 shadow-[0_1px_3px_rgba(28,25,23,0.04)] text-center"
        >
          <Target className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-lg font-medium text-[var(--text-secondary)] mb-2">
            Бюджет не создан
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Создайте бюджет на {formatMonthYear(month, year).toLowerCase()}, чтобы отслеживать расходы
          </p>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-xl h-11 px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать бюджет
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Overall Budget Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-8 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-medium text-[var(--text-primary)]">
                Бюджет на {formatMonthYear(month, year).toLowerCase()}
              </h3>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Лимит</p>
                <p className="text-lg font-mono font-semibold text-[var(--text-primary)]">
                  {formatCurrency(budget.totalLimit)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-hover)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={budget.percentage <= 60 ? "var(--success)" : budget.percentage <= 85 ? "var(--warning)" : "var(--accent-tertiary)"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(budget.percentage / 100) * 326.7} 326.7`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-mono font-semibold text-[var(--text-primary)]">
                    {budget.percentage}%
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Потрачено</span>
                  <span className="text-sm font-mono font-medium text-[var(--accent-tertiary)]">
                    {formatCurrency(budget.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Осталось</span>
                  <span className="text-sm font-mono font-medium text-[var(--accent-primary)]">
                    {formatCurrency(Math.max(0, budget.remaining))}
                  </span>
                </div>
                {budget.remaining < 0 && (
                  <p className="text-sm text-[var(--accent-tertiary)]">
                    Бюджет превышен на {formatCurrency(Math.abs(budget.remaining))}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Category Budgets */}
          {budget.categories.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)]">
                По категориям
              </h3>
              {budget.categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BudgetProgress
                    name={cat.name}
                    spent={cat.spent}
                    limit={budget.totalLimit}
                    color={cat.color ?? undefined}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Budget Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Новый бюджет</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Общий лимит</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={newBudget.totalLimit}
                  onChange={(e) => setNewBudget({ ...newBudget, totalLimit: e.target.value })}
                  placeholder="100000"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
            </div>

            {/* Category Limits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-[var(--text-muted)]">Лимиты по категориям</Label>
                <button
                  onClick={addCategoryLimit}
                  className="text-xs text-[var(--accent-primary)] hover:underline"
                >
                  + Добавить категорию
                </button>
              </div>
              <div className="space-y-2">
                {newBudget.categoryLimits.map((cl, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={cl.categoryId}
                      onChange={(e) => {
                        const updated = [...newBudget.categoryLimits];
                        updated[idx].categoryId = Number(e.target.value);
                        setNewBudget({ ...newBudget, categoryLimits: updated });
                      }}
                      className="flex-1 h-10 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="relative w-[120px]">
                      <Input
                        type="number"
                        value={cl.limit}
                        onChange={(e) => {
                          const updated = [...newBudget.categoryLimits];
                          updated[idx].limit = e.target.value;
                          setNewBudget({ ...newBudget, categoryLimits: updated });
                        }}
                        placeholder="Лимит"
                        className="h-10 rounded-xl pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">₽</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = newBudget.categoryLimits.filter((_, i) => i !== idx);
                        setNewBudget({ ...newBudget, categoryLimits: updated });
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 h-11 rounded-xl border-[var(--border-medium)]"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newBudget.totalLimit || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Создание..." : "Создать бюджет"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
