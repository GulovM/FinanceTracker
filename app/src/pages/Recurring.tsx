import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecurringList,
  getAccounts,
  getCategories,
  getSubcategories,
  getMerchants,
  getTags,
  createRecurring,
  updateRecurring,
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
  Pencil,
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
  yearly: "Ежегодно",
};

const weekDayLabels: Record<string, string> = {
  "1": "Понедельник",
  "2": "Вторник",
  "3": "Среда",
  "4": "Четверг",
  "5": "Пятница",
  "6": "Суббота",
  "7": "Воскресенье",
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
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    amount: "",
    accountId: "",
    categoryId: "",
    subcategoryId: "",
    merchantId: "",
    tagIds: [] as number[],
    frequency: "monthly" as string,
    interval: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dayOfMonth: "",
    dayOfWeek: "",
    recipient: "",
    description: "",
  });
  const [editItem, setEditItem] = useState({
    id: 0,
    name: "",
    type: "expense" as "income" | "expense",
    amount: "",
    accountId: "",
    categoryId: "",
    subcategoryId: "",
    merchantId: "",
    tagIds: [] as number[],
    frequency: "monthly" as string,
    interval: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dayOfMonth: "",
    dayOfWeek: "",
    recipient: "",
    description: "",
  });

  const selectedCategoryId = Number(newItem.categoryId || 0);
  const selectedEditCategoryId = Number(editItem.categoryId || 0);

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: () => getSubcategories(selectedCategoryId),
    enabled: selectedCategoryId > 0,
  });

  const { data: editSubcategories = [] } = useQuery({
    queryKey: ['subcategories', selectedEditCategoryId],
    queryFn: () => getSubcategories(selectedEditCategoryId),
    enabled: isEditOpen && selectedEditCategoryId > 0,
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: getMerchants,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

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

  const updateMut = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: typeof editItem }) =>
      updateRecurring(id, {
        name: draft.name,
        type: draft.type,
        amount: Number(draft.amount),
        accountId: Number(draft.accountId),
        categoryId: Number(draft.categoryId),
        frequency: draft.frequency,
        startDate: draft.startDate,
        endDate: draft.endDate || undefined,
        interval: draft.interval ? Number(draft.interval) : 1,
        dayOfMonth: draft.frequency === "monthly" && draft.dayOfMonth ? Number(draft.dayOfMonth) : undefined,
        dayOfWeek: draft.frequency === "weekly" && draft.dayOfWeek ? Number(draft.dayOfWeek) : undefined,
        subcategoryId: draft.subcategoryId ? Number(draft.subcategoryId) : undefined,
        merchantId: draft.merchantId ? Number(draft.merchantId) : undefined,
        tagIds: draft.tagIds,
        recipient: draft.type === "expense" ? (draft.recipient || undefined) : undefined,
        description: draft.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      setIsEditOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const resetForm = () => {
    setNewItem({
      name: "", type: "expense", amount: "", accountId: "", categoryId: "",
      subcategoryId: "", merchantId: "", tagIds: [],
      frequency: "monthly", interval: "1", startDate: new Date().toISOString().split("T")[0],
      endDate: "", dayOfMonth: "", dayOfWeek: "", recipient: "", description: "",
    });
  };

  const canCreate =
    !!newItem.name &&
    !!newItem.amount &&
    !!newItem.accountId &&
    !!newItem.categoryId;
  const canUpdate =
    !!editItem.id &&
    !!editItem.name &&
    !!editItem.amount &&
    !!editItem.accountId &&
    !!editItem.categoryId &&
    !!editItem.startDate;

  const handleCreate = () => {
    if (!canCreate) return;
    createMut.mutate({
      name: newItem.name,
      type: newItem.type,
      amount: Number(newItem.amount),
      accountId: Number(newItem.accountId),
      categoryId: newItem.categoryId ? Number(newItem.categoryId) : undefined,
      subcategoryId: newItem.subcategoryId ? Number(newItem.subcategoryId) : undefined,
      merchantId: newItem.merchantId ? Number(newItem.merchantId) : undefined,
      tagIds: newItem.tagIds,
      frequency: newItem.frequency,
      startDate: newItem.startDate,
      endDate: newItem.endDate || undefined,
      interval: newItem.interval ? Number(newItem.interval) : 1,
      dayOfMonth: newItem.frequency === "monthly" && newItem.dayOfMonth ? Number(newItem.dayOfMonth) : undefined,
      dayOfWeek: newItem.frequency === "weekly" && newItem.dayOfWeek ? Number(newItem.dayOfWeek) : undefined,
      recipient: newItem.type === "expense" ? (newItem.recipient || undefined) : undefined,
      description: newItem.description || undefined,
    });
  };

  const openEdit = (item: (typeof items)[number]) => {
    setEditItem({
      id: item.id,
      name: item.name,
      type: item.type,
      amount: String(item.amount),
      accountId: String(item.accountId),
      categoryId: String(item.categoryId),
      subcategoryId: item.subcategoryId ? String(item.subcategoryId) : "",
      merchantId: item.merchantId ? String(item.merchantId) : "",
      tagIds: item.tagIds,
      frequency: item.frequency,
      interval: String(item.interval || 1),
      startDate: item.startDate || new Date().toISOString().split("T")[0],
      endDate: item.endDate || "",
      dayOfMonth: item.dayOfMonth ? String(item.dayOfMonth) : "",
      dayOfWeek: item.dayOfWeek ? String(item.dayOfWeek) : "",
      recipient: item.recipient || "",
      description: item.name,
    });
    setIsEditOpen(true);
  };

  const formatRunDate = (value: string) => {
    if (!value) return "Не рассчитано";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value.replace(" ", "T")));
  };

  const formatDaysLeft = (days?: number) => {
    if (days === undefined) return "неизвестно";
    if (days === 0) return "сегодня";
    if (days === 1) return "через 1 день";
    return `через ${days} дней`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
                {item.interval > 1 ? `, каждые ${item.interval}` : ""}
                {item.dayOfMonth ? `, ${item.dayOfMonth}-го числа` : ""}
                {item.dayOfWeek ? `, ${weekDayLabels[String(item.dayOfWeek)]}` : ""}
                {" · "}
                {item.accountName || accounts.find((a) => a.id === item.accountId)?.name || "Счёт"}
                {item.categoryName ? ` · ${item.categoryName}` : ""}
                {item.merchantName ? ` · ${item.merchantName}` : ""}
                {item.subcategoryName ? ` · ${item.subcategoryName}` : ""}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Следующий запуск: {formatRunDate(item.nextRunAt)} · {formatDaysLeft(item.daysUntilNextRun)}
                {item.endDate ? ` · до ${formatRunDate(item.endDate)}` : ""}
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
                onClick={() => openEdit(item)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                title="Изменить"
              >
                <Pencil className="w-4 h-4" />
              </button>
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
                  min={0}
                  step="0.01"
                  value={newItem.amount}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  placeholder="0"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">TJS</span>
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
              <Select value={newItem.categoryId} onValueChange={(v) => setNewItem({ ...newItem, categoryId: v, subcategoryId: "", merchantId: "" })}>
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

            {newItem.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Подкатегория</Label>
                <Select
                  value={newItem.subcategoryId || "none"}
                  onValueChange={(v) => setNewItem({ ...newItem, subcategoryId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без подкатегории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без подкатегории</SelectItem>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={String(subcat.id)}>{subcat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newItem.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Мерчант</Label>
                <Select
                  value={newItem.merchantId || "none"}
                  onValueChange={(v) => setNewItem({ ...newItem, merchantId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без мерчанта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без мерчанта</SelectItem>
                    {merchants
                      .filter((merchant) => merchant.categoryId === Number(newItem.categoryId))
                      .map((merchant) => (
                        <SelectItem key={merchant.id} value={String(merchant.id)}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Теги</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = newItem.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setNewItem({
                          ...newItem,
                          tagIds: active
                            ? newItem.tagIds.filter((id) => id !== tag.id)
                            : [...newItem.tagIds, tag.id],
                        })}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                          active
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                            : "border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Интервал</Label>
              <Input
                type="number"
                min={1}
                value={newItem.interval}
                onChange={(e) => setNewItem({ ...newItem, interval: e.target.value })}
                placeholder="1"
                className="h-11 rounded-xl"
              />
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

            {newItem.frequency === "weekly" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">День недели</Label>
                <Select
                  value={newItem.dayOfWeek || "none"}
                  onValueChange={(v) => setNewItem({ ...newItem, dayOfWeek: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="По дате начала" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">По дате начала</SelectItem>
                    {Object.entries(weekDayLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Дата окончания</Label>
              <Input
                type="date"
                value={newItem.endDate}
                onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            {newItem.type === "expense" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Получатель</Label>
                <Input
                  value={newItem.recipient}
                  onChange={(e) => setNewItem({ ...newItem, recipient: e.target.value })}
                  placeholder="Кому переводится..."
                  className="h-11 rounded-xl"
                />
              </div>
            )}

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
                disabled={!canCreate || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Редактировать автоплатёж</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
              <Input
                value={editItem.name}
                onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex rounded-xl border border-[var(--border-medium)] overflow-hidden">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEditItem({ ...editItem, type: t, categoryId: "", subcategoryId: "", merchantId: "" })}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    editItem.type === t
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
                  min={0}
                  step="0.01"
                  value={editItem.amount}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setEditItem({ ...editItem, amount: e.target.value })}
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">TJS</span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Счёт</Label>
              <Select value={editItem.accountId} onValueChange={(v) => setEditItem({ ...editItem, accountId: v })}>
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
              <Select value={editItem.categoryId} onValueChange={(v) => setEditItem({ ...editItem, categoryId: v, subcategoryId: "", merchantId: "" })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === editItem.type)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {editItem.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Подкатегория</Label>
                <Select
                  value={editItem.subcategoryId || "none"}
                  onValueChange={(v) => setEditItem({ ...editItem, subcategoryId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без подкатегории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без подкатегории</SelectItem>
                    {editSubcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={String(subcat.id)}>{subcat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editItem.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Мерчант</Label>
                <Select
                  value={editItem.merchantId || "none"}
                  onValueChange={(v) => setEditItem({ ...editItem, merchantId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без мерчанта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без мерчанта</SelectItem>
                    {merchants
                      .filter((merchant) => merchant.categoryId === Number(editItem.categoryId))
                      .map((merchant) => (
                        <SelectItem key={merchant.id} value={String(merchant.id)}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Теги</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = editItem.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setEditItem({
                          ...editItem,
                          tagIds: active
                            ? editItem.tagIds.filter((id) => id !== tag.id)
                            : [...editItem.tagIds, tag.id],
                        })}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                          active
                            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                            : "border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Частота</Label>
                <Select value={editItem.frequency} onValueChange={(v) => setEditItem({ ...editItem, frequency: v })}>
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
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Интервал</Label>
                <Input
                  type="number"
                  min={1}
                  value={editItem.interval}
                  onChange={(e) => setEditItem({ ...editItem, interval: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {editItem.frequency === "monthly" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">День месяца</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={editItem.dayOfMonth}
                  onChange={(e) => setEditItem({ ...editItem, dayOfMonth: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            {editItem.frequency === "weekly" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">День недели</Label>
                <Select
                  value={editItem.dayOfWeek || "none"}
                  onValueChange={(v) => setEditItem({ ...editItem, dayOfWeek: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="По дате начала" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">По дате начала</SelectItem>
                    {Object.entries(weekDayLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Дата начала</Label>
                <Input
                  type="date"
                  value={editItem.startDate}
                  onChange={(e) => setEditItem({ ...editItem, startDate: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Дата окончания</Label>
                <Input
                  type="date"
                  value={editItem.endDate}
                  onChange={(e) => setEditItem({ ...editItem, endDate: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {editItem.type === "expense" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Получатель</Label>
                <Input
                  value={editItem.recipient}
                  onChange={(e) => setEditItem({ ...editItem, recipient: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Описание</Label>
              <Input
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 h-11 rounded-xl border-[var(--border-medium)]"
              >
                Отмена
              </Button>
              <Button
                onClick={() => updateMut.mutate({ id: editItem.id, draft: editItem })}
                disabled={!canUpdate || updateMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {updateMut.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
