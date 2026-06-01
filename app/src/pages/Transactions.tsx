import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  getAccounts,
  getCategories,
  getSubcategories,
  getMerchants,
  getTags,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransfers,
} from "@/lib/api";
import TransactionRow from "@/components/shared/TransactionRow";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
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
import { motion, AnimatePresence } from "framer-motion";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const limit = 20;
  const offset = (page - 1) * limit;

  const [newTx, setNewTx] = useState({
    type: "expense" as "income" | "expense" | "transfer",
    amount: "",
    accountId: "",
    categoryId: "",
    subcategoryId: "",
    merchantId: "",
    tagIds: [] as number[],
    description: "",
    recipient: "",
    date: new Date().toISOString().split("T")[0],
    recipientAccountId: "",
  });
  const [editTx, setEditTx] = useState({
    id: 0,
    type: "expense" as "income" | "expense",
    amount: "",
    accountId: "",
    categoryId: "",
    subcategoryId: "",
    merchantId: "",
    tagIds: [] as number[],
    description: "",
    recipient: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, page],
    queryFn: () => getTransactions({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit,
      offset,
    }),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers', page],
    queryFn: () => getTransfers({ limit: 10, offset: 0 }),
    enabled: typeFilter === 'all' || typeFilter === 'transfer',
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', typeFilter],
    queryFn: () => getCategories(
      typeFilter === 'income' ? 'income'
      : typeFilter === 'expense' ? 'expense'
      : undefined
    ),
  });

  const selectedCategoryId = Number(newTx.categoryId || 0);
  const selectedEditCategoryId = Number(editTx.categoryId || 0);

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: () => getSubcategories(selectedCategoryId),
    enabled: newTx.type !== 'transfer' && selectedCategoryId > 0,
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
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: {
      id: number
      input: {
        amount: number
        accountId: number
        categoryId: number
        subcategoryId?: number
        merchantId?: number
        tagIds?: number[]
        description?: string
        recipient?: string
      }
    }) => updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsEditOpen(false);
    },
  });

  const resetForm = () => {
    setNewTx({
      type: "expense",
      amount: "",
      accountId: "",
      categoryId: "",
      subcategoryId: "",
      merchantId: "",
      tagIds: [],
      description: "",
      recipient: "",
      date: new Date().toISOString().split("T")[0],
      recipientAccountId: "",
    });
  };

  const selectedNewAccount = accounts.find((a) => String(a.id) === newTx.accountId);
  const newAmountOverBalance =
    newTx.type === "expense" &&
    !!selectedNewAccount &&
    !!newTx.amount &&
    Number(newTx.amount) > selectedNewAccount.balance;

  const selectedEditAccount = accounts.find((a) => String(a.id) === editTx.accountId);
  const editAmountOverBalance =
    editTx.type === "expense" &&
    !!selectedEditAccount &&
    !!editTx.amount &&
    Number(editTx.amount) > selectedEditAccount.balance;

  const canCreate =
    !!newTx.amount &&
    !!newTx.accountId &&
    !newAmountOverBalance &&
    (newTx.type === "transfer" ? !!newTx.recipientAccountId : !!newTx.categoryId);

  const handleCreate = () => {
    if (!canCreate) return;
    createMut.mutate({
      type: newTx.type,
      amount: Number(newTx.amount),
      accountId: Number(newTx.accountId),
      categoryId: newTx.categoryId ? Number(newTx.categoryId) : undefined,
      subcategoryId: newTx.subcategoryId ? Number(newTx.subcategoryId) : undefined,
      merchantId: newTx.merchantId ? Number(newTx.merchantId) : undefined,
      tagIds: newTx.tagIds,
      description: newTx.description || undefined,
      recipient: newTx.type === "expense" ? (newTx.recipient || undefined) : undefined,
      recipientAccountId: newTx.type === "transfer" && newTx.recipientAccountId
        ? Number(newTx.recipientAccountId)
        : undefined,
    });
  };

  const openEdit = (tx: NonNullable<typeof data>["items"][number]) => {
    setEditTx({
      id: tx.id,
      type: tx.type === "income" ? "income" : "expense",
      amount: String(tx.amount),
      accountId: String(tx.accountId),
      categoryId: String(tx.categoryId || ""),
      subcategoryId: tx.subcategoryId ? String(tx.subcategoryId) : "",
      merchantId: tx.merchantId ? String(tx.merchantId) : "",
      tagIds: tags.filter((tag) => tx.tags.includes(tag.name)).map((tag) => tag.id),
      description: tx.description || "",
      recipient: tx.recipient || "",
    });
    setIsEditOpen(true);
  };

  const canUpdate =
    !!editTx.id &&
    !!editTx.amount &&
    !!editTx.accountId &&
    !!editTx.categoryId &&
    !editAmountOverBalance;

  const handleUpdate = () => {
    if (!canUpdate) return;
    updateMut.mutate({
      id: editTx.id,
      input: {
        amount: Number(editTx.amount),
        accountId: Number(editTx.accountId),
        categoryId: Number(editTx.categoryId),
        subcategoryId: editTx.subcategoryId ? Number(editTx.subcategoryId) : undefined,
        merchantId: editTx.merchantId ? Number(editTx.merchantId) : undefined,
        tagIds: editTx.tagIds,
        description: editTx.description || undefined,
        recipient: editTx.type === "expense" ? (editTx.recipient || undefined) : undefined,
      },
    });
  };

  // Client-side search filter
  const items = data?.items ?? [];
  const filteredItems = search
    ? items.filter(tx =>
        (tx.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (tx.categoryName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const hasMore = data?.hasMore ?? false;
  const showPagination = page > 1 || hasMore;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[var(--border-light)] p-4 mb-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Поиск по описанию..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border-medium)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] bg-transparent"
            />
          </div>

          <div className="flex rounded-lg border border-[var(--border-medium)] overflow-x-auto flex-shrink-0">
            {(["all", "expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-3 sm:px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === t
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                {t === "all" ? "Все" : t === "expense" ? "Расходы" : t === "income" ? "Доходы" : "Переводы"}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-xl h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-[var(--border-light)] shadow-[0_1px_3px_rgba(28,25,23,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[var(--bg-hover)] animate-pulse-slow border-b border-[var(--border-light)]" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <AnimatePresence>
            {filteredItems.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TransactionRow
                  type={tx.type}
                  amount={tx.amount}
                  description={tx.merchantName || tx.subcategoryName || tx.description}
                  date={tx.date}
                  accountName={accounts.find((a) => a.id === tx.accountId)?.name}
                  accountColor={accounts.find((a) => a.id === tx.accountId)?.color}
                  categoryName={tx.categoryName}
                  categoryColor={tx.categoryColor}
                  action={tx.type !== "transfer" ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(tx);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                        title="Изменить"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (confirm("Удалить эту транзакцию?")) {
                            deleteMut.mutate(tx.id);
                          }
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--accent-tertiary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-tertiary)] transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-16 text-center">
            <SlidersHorizontal className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Пока ничего нет</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Добавьте первую транзакцию</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-end mt-4 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--text-muted)] px-2">Стр. {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {(typeFilter === "all" || typeFilter === "transfer") && transfers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[var(--border-light)] shadow-[0_1px_3px_rgba(28,25,23,0.04)] overflow-hidden mt-6">
          <div className="px-5 py-3 border-b border-[var(--border-light)]">
            <p className="text-sm font-medium text-[var(--text-primary)]">Последние переводы</p>
          </div>
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center gap-4 py-3.5 px-5 border-b border-[var(--border-light)] last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {transfer.fromAccountName} → {transfer.toAccountName}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {transfer.comment || "Без описания"} · {transfer.date}
                </p>
              </div>
              <span className="text-sm font-mono font-medium text-[var(--text-secondary)]">
                {formatCurrency(transfer.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[90dvh] flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="font-heading text-xl">Новая транзакция</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {/* Type Toggle */}
            <div className="flex rounded-xl border border-[var(--border-medium)] overflow-hidden">
              {(["expense", "income", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTx({ ...newTx, type: t })}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    newTx.type === t
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {t === "expense" ? "Расход" : t === "income" ? "Доход" : "Перевод"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Сумма</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={newTx.amount}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  placeholder="0"
                  className={`h-11 rounded-xl pr-12 ${newAmountOverBalance ? "border-red-400 focus-visible:ring-red-400/20" : ""}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">TJS</span>
              </div>
              {newAmountOverBalance && (
                <p className="text-xs text-red-500 mt-1.5">
                  Сумма превышает баланс счёта ({formatCurrency(selectedNewAccount!.balance)})
                </p>
              )}
            </div>

            {/* Account */}
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">
                {newTx.type === "transfer" ? "Счёт отправителя" : "Счёт"}
              </Label>
              <Select
                value={newTx.accountId}
                onValueChange={(v) => setNewTx({ ...newTx, accountId: v })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{acc.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{formatCurrency(acc.balance)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Account for transfers */}
            {newTx.type === "transfer" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Счёт получателя</Label>
                <Select
                  value={newTx.recipientAccountId}
                  onValueChange={(v) => setNewTx({ ...newTx, recipientAccountId: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc) => String(acc.id) !== newTx.accountId)
                      .map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category */}
            {newTx.type !== "transfer" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Категория</Label>
                <Select
                  value={newTx.categoryId}
                  onValueChange={(v) => setNewTx({ ...newTx, categoryId: v, subcategoryId: "", merchantId: "" })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => c.type === newTx.type)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newTx.type !== "transfer" && newTx.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Подкатегория</Label>
                <Select
                  value={newTx.subcategoryId || "none"}
                  onValueChange={(v) => setNewTx({ ...newTx, subcategoryId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без подкатегории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без подкатегории</SelectItem>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={String(subcat.id)}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newTx.type !== "transfer" && newTx.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Мерчант</Label>
                <Select
                  value={newTx.merchantId || "none"}
                  onValueChange={(v) => setNewTx({ ...newTx, merchantId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без мерчанта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без мерчанта</SelectItem>
                    {merchants
                      .filter((merchant) => merchant.categoryId === Number(newTx.categoryId))
                      .map((merchant) => (
                        <SelectItem key={merchant.id} value={String(merchant.id)}>
                          {merchant.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newTx.type !== "transfer" && tags.length > 0 && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Теги</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = newTx.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setNewTx({
                          ...newTx,
                          tagIds: active
                            ? newTx.tagIds.filter((id) => id !== tag.id)
                            : [...newTx.tagIds, tag.id],
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

            {/* Recipient — expense only */}
            {newTx.type === "expense" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Получатель</Label>
                <Input
                  value={newTx.recipient}
                  onChange={(e) => setNewTx({ ...newTx, recipient: e.target.value })}
                  placeholder="Кому переводится..."
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Описание</Label>
              <Input
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                placeholder="Описание транзакции..."
                className="h-11 rounded-xl"
              />
            </div>

            {/* Actions */}
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
                disabled={!canCreate || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Редактировать транзакцию</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="flex rounded-xl border border-[var(--border-medium)] overflow-hidden">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEditTx({ ...editTx, type: t, categoryId: "", subcategoryId: "", merchantId: "" })}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    editTx.type === t
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
                  value={editTx.amount}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setEditTx({ ...editTx, amount: e.target.value })}
                  className={`h-11 rounded-xl pr-14 ${editAmountOverBalance ? "border-red-400 focus-visible:ring-red-400/20" : ""}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">TJS</span>
              </div>
              {editAmountOverBalance && (
                <p className="text-xs text-red-500 mt-1.5">
                  Сумма превышает баланс счёта ({formatCurrency(selectedEditAccount!.balance)})
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Счёт</Label>
              <Select value={editTx.accountId} onValueChange={(v) => setEditTx({ ...editTx, accountId: v })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{acc.name}</span>
                        <span className="text-[var(--text-muted)] font-mono text-xs">{formatCurrency(acc.balance)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Категория</Label>
              <Select
                value={editTx.categoryId}
                onValueChange={(v) => setEditTx({ ...editTx, categoryId: v, subcategoryId: "", merchantId: "" })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === editTx.type)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {editTx.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Подкатегория</Label>
                <Select
                  value={editTx.subcategoryId || "none"}
                  onValueChange={(v) => setEditTx({ ...editTx, subcategoryId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без подкатегории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без подкатегории</SelectItem>
                    {editSubcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={String(subcat.id)}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editTx.categoryId && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Мерчант</Label>
                <Select
                  value={editTx.merchantId || "none"}
                  onValueChange={(v) => setEditTx({ ...editTx, merchantId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Без мерчанта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без мерчанта</SelectItem>
                    {merchants
                      .filter((merchant) => merchant.categoryId === Number(editTx.categoryId))
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
                    const active = editTx.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setEditTx({
                          ...editTx,
                          tagIds: active
                            ? editTx.tagIds.filter((id) => id !== tag.id)
                            : [...editTx.tagIds, tag.id],
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

            {editTx.type === "expense" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Получатель</Label>
                <Input
                  value={editTx.recipient}
                  onChange={(e) => setEditTx({ ...editTx, recipient: e.target.value })}
                  placeholder="Кому переводится..."
                  className="h-11 rounded-xl"
                />
              </div>
            )}

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Описание</Label>
              <Input
                value={editTx.description}
                onChange={(e) => setEditTx({ ...editTx, description: e.target.value })}
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
                onClick={handleUpdate}
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
