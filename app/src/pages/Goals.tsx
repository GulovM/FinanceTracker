import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGoals, createGoal, deleteGoal, contributeToGoal } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Trophy,
  Target,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const colorPalette = [
  "#0E7490", "#22C55E", "#F97316", "#8B5CF6",
  "#F43F5E", "#EC4899", "#3B82F6", "#F59E0B",
];

export default function Goals() {
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });

  const [currentTime] = useState(() => Date.now());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const createMut = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const contributeMut = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => contributeToGoal(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsContributeOpen(false);
      setContributeAmount("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    color: "#0E7490",
    icon: "target",
    currentAmount: "",
  });
  const [contributeAmount, setContributeAmount] = useState("");

  const resetForm = () => {
    setNewGoal({ name: "", targetAmount: "", targetDate: "", color: "#0E7490", icon: "target", currentAmount: "" });
  };

  const handleCreate = () => {
    if (!newGoal.name || !newGoal.targetAmount) return;
    createMut.mutate({
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      targetDate: newGoal.targetDate || undefined,
      color: newGoal.color,
      icon: newGoal.icon,
      currentAmount: newGoal.currentAmount ? Number(newGoal.currentAmount) : undefined,
    });
  };

  const handleContribute = () => {
    if (!selectedGoal || !contributeAmount) return;
    contributeMut.mutate({ id: selectedGoal, amount: Number(contributeAmount) });
  };

  const activeGoals = goals.filter((g) => g.isActive);

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {activeGoals.map((goal, i) => {
          const progress = goal.targetAmount > 0
            ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
            : 0;
          const daysLeft = goal.targetDate
            ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - currentTime) / (1000 * 60 * 60 * 24)))
            : null;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)] hover:shadow-[0_4px_12px_rgba(28,25,23,0.06)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${goal.color}15` }}
                  >
                    <Trophy className="w-5 h-5" style={{ color: goal.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{goal.name}</p>
                    {daysLeft !== null && (
                      <p className="text-[11px] text-[var(--text-muted)]">Осталось {daysLeft} дней</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setSelectedGoal(goal.id); setIsContributeOpen(true); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--accent-primary)]"
                    title="Пополнить"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Удалить эту цель?")) {
                        deleteMut.mutate(goal.id);
                      }
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-sm font-mono text-[var(--text-muted)]">
                    {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">{progress}% выполнено</span>
                {progress >= 100 && (
                  <span className="text-xs font-medium text-[var(--success)]">Цель достигнута!</span>
                )}
              </div>
            </motion.div>
          );
        })}

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: activeGoals.length * 0.05 }}
          onClick={() => setIsAddOpen(true)}
          className="h-[200px] rounded-2xl border-2 border-dashed border-[var(--border-medium)] flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors bg-transparent"
        >
          <Plus className="w-10 h-10" />
          <span className="text-xs font-medium">Новая цель</span>
        </motion.button>
      </div>

      {activeGoals.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Target className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">Пока нет целей</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Создайте первую цель накопления</p>
        </motion.div>
      )}

      {/* Add Goal Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Новая цель</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
              <Input
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="Например: Новый ноутбук"
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Целевая сумма</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="100000"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Целевая дата</Label>
              <Input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Начальный взнос</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  placeholder="0"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Цвет</Label>
              <div className="flex gap-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewGoal({ ...newGoal, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newGoal.color === c ? "ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setIsAddOpen(false); resetForm(); }}
                className="flex-1 h-11 rounded-xl border-[var(--border-medium)]"
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newGoal.name || !newGoal.targetAmount || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Создание..." : "Создать цель"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribute Modal */}
      <Dialog open={isContributeOpen} onOpenChange={setIsContributeOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Пополнить цель</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Сумма</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="5000"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsContributeOpen(false)}
                className="flex-1 h-11 rounded-xl border-[var(--border-medium)]"
              >
                Отмена
              </Button>
              <Button
                onClick={handleContribute}
                disabled={!contributeAmount || contributeMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {contributeMut.isPending ? "..." : "Пополнить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
