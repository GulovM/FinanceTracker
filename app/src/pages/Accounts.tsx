import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAccounts,
  createAccount,
  updateAccount,
  topupAccount,
  withdrawAccount,
  deleteAccount,
  getCardTypes,
  getWalletTypes,
} from "@/lib/api";
import AccountCard from "@/components/shared/AccountCard";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Banknote,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const accountTypes = [
  { id: "cash", label: "Наличные", icon: Banknote },
  { id: "wallet", label: "Кошелёк", icon: Wallet },
  { id: "debit", label: "Дебетовая карта", icon: CreditCard },
  { id: "credit", label: "Кредитная карта", icon: CreditCard },
  { id: "savings", label: "Сбережения", icon: PiggyBank },
  { id: "investment", label: "Инвестиции", icon: TrendingUp },
];

const colorPalette = [
  "#0E7490", "#22C55E", "#F97316", "#8B5CF6",
  "#F43F5E", "#EC4899", "#3B82F6", "#F59E0B",
];

export default function Accounts() {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: cardTypes = [] } = useQuery({
    queryKey: ['card-types'],
    queryFn: getCardTypes,
  });

  const { data: walletTypes = [] } = useQuery({
    queryKey: ['wallet-types'],
    queryFn: getWalletTypes,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [operationAmount, setOperationAmount] = useState("");
  const [accountDraft, setAccountDraft] = useState({
    name: "",
    type: "debit",
    balance: "",
    cardTypeId: "",
    walletTypeId: "",
  });

  const createMut = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsAddOpen(false);
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setSelectedAccount(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, draft }: { id: number; draft: typeof accountDraft }) =>
      updateAccount(id, {
        name: draft.name,
        type: draft.type,
        balance: Number(draft.balance || 0),
        cardTypeId: draft.cardTypeId ? Number(draft.cardTypeId) : undefined,
        walletTypeId: draft.walletTypeId ? Number(draft.walletTypeId) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const topupMut = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => topupAccount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOperationAmount("");
    },
  });

  const withdrawMut = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => withdrawAccount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOperationAmount("");
    },
  });

  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "debit" as string,
    balance: "",
    color: "#0E7490",
    icon: "wallet",
    cardTypeId: "",
    walletTypeId: "",
  });

  const resetForm = () => {
    setNewAccount({ name: "", type: "debit", balance: "", color: "#0E7490", icon: "wallet", cardTypeId: "", walletTypeId: "" });
  };

  const handleCreate = () => {
    if (!newAccount.name) return;
    createMut.mutate({
      name: newAccount.name,
      type: newAccount.type,
      balance: newAccount.balance ? Number(newAccount.balance) : 0,
      color: newAccount.color,
      icon: newAccount.icon,
      cardTypeId: newAccount.cardTypeId ? Number(newAccount.cardTypeId) : undefined,
      walletTypeId: newAccount.walletTypeId ? Number(newAccount.walletTypeId) : undefined,
    });
  };

  const selectedAcc = accounts.find((a) => a.id === selectedAccount);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {accounts.map((account, i) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AccountCard
              name={account.name}
              type={account.type}
              balance={account.balance}
              color={account.color}
              icon={account.icon}
              onClick={() => {
                setAccountDraft({
                  name: account.name,
                  type: account.type,
                  balance: String(account.balance),
                  cardTypeId: "",
                  walletTypeId: "",
                });
                setOperationAmount("");
                setSelectedAccount(account.id);
              }}
            />
          </motion.div>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: accounts.length * 0.05 }}
          onClick={() => setIsAddOpen(true)}
          className="h-[150px] rounded-2xl border-2 border-dashed border-[var(--border-medium)] flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors bg-transparent"
        >
          <Plus className="w-10 h-10" />
          <span className="text-xs font-medium">Новый счёт</span>
        </motion.button>
      </div>

      {/* Add Account Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-xl">Новый счёт</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
              <Input
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Например: Alif"
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип</Label>
              <div className="grid grid-cols-3 gap-2">
                {accountTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setNewAccount({ ...newAccount, type: t.id, cardTypeId: "", walletTypeId: "" })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                      newAccount.type === t.id
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]"
                        : "border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium text-center leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(newAccount.type === "debit" || newAccount.type === "credit") && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип карты</Label>
                <select
                  value={newAccount.cardTypeId}
                  onChange={(e) => setNewAccount({ ...newAccount, cardTypeId: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                >
                  <option value="">Не указан</option>
                  {cardTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            )}

            {newAccount.type === "wallet" && (
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип кошелька</Label>
                <select
                  value={newAccount.walletTypeId}
                  onChange={(e) => setNewAccount({ ...newAccount, walletTypeId: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                >
                  <option value="">Не указан</option>
                  {walletTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Начальный баланс</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newAccount.balance}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  placeholder="0"
                  className="h-11 rounded-xl pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">TJS</span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Цвет</Label>
              <div className="flex gap-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewAccount({ ...newAccount, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newAccount.color === c ? "ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110" : ""
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
                disabled={!newAccount.name || createMut.isPending}
                className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {createMut.isPending ? "Создание..." : "Создать счёт"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Detail Side Panel */}
      {selectedAccount && selectedAcc && (
        <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
          <DialogContent showCloseButton={false} className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="font-heading text-xl">{selectedAcc.name}</DialogTitle>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${selectedAcc.color}15` }}
              >
                <Wallet className="w-7 h-7" style={{ color: selectedAcc.color }} />
              </div>
              <p className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(selectedAcc.balance)}
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
                  <Input
                    value={accountDraft.name}
                    onChange={(e) => setAccountDraft({ ...accountDraft, name: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип</Label>
                  <select
                    value={accountDraft.type}
                    onChange={(e) => setAccountDraft({ ...accountDraft, type: e.target.value, cardTypeId: "", walletTypeId: "" })}
                    className="w-full h-10 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                {(accountDraft.type === "debit" || accountDraft.type === "credit") && (
                  <div>
                    <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип карты</Label>
                    <select
                      value={accountDraft.cardTypeId}
                      onChange={(e) => setAccountDraft({ ...accountDraft, cardTypeId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                    >
                      <option value="">Не указан</option>
                      {cardTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {accountDraft.type === "wallet" && (
                  <div>
                    <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Тип кошелька</Label>
                    <select
                      value={accountDraft.walletTypeId}
                      onChange={(e) => setAccountDraft({ ...accountDraft, walletTypeId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                    >
                      <option value="">Не указан</option>
                      {walletTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Баланс</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={accountDraft.balance}
                    onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                    onChange={(e) => setAccountDraft({ ...accountDraft, balance: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Button
                  onClick={() => updateMut.mutate({ id: selectedAcc.id, draft: accountDraft })}
                  disabled={!accountDraft.name || updateMut.isPending}
                  className="w-full h-10 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
                >
                  {updateMut.isPending ? "Сохранение..." : "Сохранить счёт"}
                </Button>
              </div>

              <div className="pt-4 border-t border-[var(--border-light)] space-y-3">
                <Label className="text-xs text-[var(--text-muted)] block">Пополнение или списание</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={operationAmount}
                  onKeyDown={(e) => { if (e.key === '-') e.preventDefault() }}
                  onChange={(e) => setOperationAmount(e.target.value)}
                  placeholder="Сумма"
                  className="h-10 rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => topupMut.mutate({ id: selectedAcc.id, amount: Number(operationAmount) })}
                    disabled={!operationAmount || topupMut.isPending}
                    className="h-10 rounded-xl bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)] text-white"
                  >
                    Пополнить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => withdrawMut.mutate({ id: selectedAcc.id, amount: Number(operationAmount) })}
                    disabled={!operationAmount || withdrawMut.isPending}
                    className="h-10 rounded-xl border-[var(--border-medium)]"
                  >
                    Списать
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Удалить этот счёт?")) {
                      deleteMut.mutate(selectedAcc.id);
                    }
                  }}
                  className="flex-1 h-10 rounded-xl"
                >
                  Удалить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
