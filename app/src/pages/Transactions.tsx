import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  getAccounts,
  getCategories,
  createTransaction,
} from "@/lib/api";
import TransactionRow from "@/components/shared/TransactionRow";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
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
  const queryClient = useQueryClient();

  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, page],
    queryFn: () => getTransactions({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit,
      offset,
    }),
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

  const createMut = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const [newTx, setNewTx] = useState({
    type: "expense" as "income" | "expense" | "transfer",
    amount: "",
    accountId: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    recipientAccountId: "",
  });

  const resetForm = () => {
    setNewTx({
      type: "expense",
      amount: "",
      accountId: "",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      recipientAccountId: "",
    });
  };

  const handleCreate = () => {
    if (!newTx.amount || !newTx.accountId) return;
    createMut.mutate({
      type: newTx.type,
      amount: Number(newTx.amount),
      accountId: Number(newTx.accountId),
      categoryId: newTx.categoryId ? Number(newTx.categoryId) : undefined,
      description: newTx.description || undefined,
      recipientAccountId: newTx.type === "transfer" && newTx.recipientAccountId
        ? Number(newTx.recipientAccountId)
        : undefined,
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
    <div className="p-8">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[var(--border-light)] p-4 mb-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Поиск по описанию..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--border-medium)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] bg-transparent"
            />
          </div>

          <div className="flex rounded-lg border border-[var(--border-medium)] overflow-hidden">
            {(["all", "expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
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
                  description={tx.description}
                  date={tx.date}
                  accountName={accounts.find((a) => a.id === tx.accountId)?.name}
                  accountColor={accounts.find((a) => a.id === tx.accountId)?.color}
                  categoryName={tx.categoryName}
                  categoryColor={tx.categoryColor}
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

      {/* Add Transaction Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Новая транзакция</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
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
                  value={newTx.amount}
                  onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  placeholder="0"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">₽</span>
              </div>
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
                      {acc.name}
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
                  onValueChange={(v) => setNewTx({ ...newTx, categoryId: v })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => newTx.type === 'all' || c.type === newTx.type)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
                disabled={!newTx.amount || !newTx.accountId || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
