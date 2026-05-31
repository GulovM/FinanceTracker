import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringList,
  getAccounts,
  getCategories,
  createRecurring,
  toggleRecurring,
  deleteRecurring,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Repeat,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

const frequencyLabels: Record<string, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  yearly: "Ежегодно",
};

export default function Recurring() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: getRecurringList,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  const [isAddOpen, setIsAddOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleRecurring(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const [newItem, setNewItem] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    amount: "",
    accountId: "",
    categoryId: "",
    frequency: "monthly" as string,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dayOfMonth: "",
    description: "",
  });

  const resetForm = () => {
    setNewItem({
      name: "", type: "expense", amount: "", accountId: "", categoryId: "",
      frequency: "monthly", startDate: new Date().toISOString().split("T")[0],
      endDate: "", dayOfMonth: "", description: "",
    });
  };

  const handleCreate = () => {
    if (!newItem.name || !newItem.amount || !newItem.accountId) return;
    createMut.mutate({
      name: newItem.name,
      type: newItem.type,
      amount: Number(newItem.amount),
      accountId: Number(newItem.accountId),
      categoryId: newItem.categoryId ? Number(newItem.categoryId) : undefined,
      frequency: newItem.frequency,
      startDate: newItem.startDate,
      endDate: newItem.endDate || undefined,
      dayOfMonth: newItem.dayOfMonth ? Number(newItem.dayOfMonth) : undefined,
      description: newItem.description || undefined,
    });
  };

  return (
    <div className="p-8">
      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex items-center gap-4"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                item.isActive ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
              }`}
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {frequencyLabels[item.frequency] || item.frequency}
                {item.dayOfMonth ? `, ${item.dayOfMonth}-го числа` : ""}
                {" · "}
                {accounts.find((a) => a.id === item.accountId)?.name || "Счёт"}
              </p>
            </div>

            <span
              className="text-sm font-mono font-medium flex-shrink-0"
              style={{
                color: item.type === "expense" ? "var(--accent-tertiary)" : "var(--accent-secondary)",
              }}
            >
              {item.type === "expense" ? "−" : "+"}
              {formatCurrency(item.amount)}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleMut.mutate({ id: item.id, isActive: item.isActive })}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                title={item.isActive ? "Поставить на паузу" : "Возобновить"}
              >
                {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  if (confirm("Удалить этот автоплатёж?")) {
                    deleteMut.mutate(item.id);
                  }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Repeat className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">Пока нет автоплатежей</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Создайте первый регулярный платёж</p>
        </motion.div>
      )}

      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(14,116,144,0.35)] hover:bg-[var(--accent-primary-hover)] transition-colors z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Новый автоплатёж</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Например: Аренда"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex rounded-xl border border-[var(--border-medium)] overflow-hidden">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewItem({ ...newItem, type: t })}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    newItem.type === t
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {t === "expense" ? "Расход" : "Доход"}
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Сумма</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  placeholder="0"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Счёт</Label>
              <Select value={newItem.accountId} onValueChange={(v) => setNewItem({ ...newItem, accountId: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Категория</Label>
              <Select value={newItem.categoryId} onValueChange={(v) => setNewItem({ ...newItem, categoryId: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === newItem.type)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Частота</Label>
              <Select value={newItem.frequency} onValueChange={(v) => setNewItem({ ...newItem, frequency: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(frequencyLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newItem.frequency === "monthly" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">День месяца</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={newItem.dayOfMonth}
                  onChange={(e) => setNewItem({ ...newItem, dayOfMonth: e.target.value })}
                  placeholder="1"
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Дата начала</Label>
              <Input
                type="date"
                value={newItem.startDate}
                onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Описание</Label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Опционально"
                className="h-11 rounded-xl"
              />
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
                disabled={!newItem.name || !newItem.amount || !newItem.accountId || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
