import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory, deleteCategory } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import {
  User,
  Tag,
  Bell,
  Plus,
  Trash2,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => getCategories('expense'),
  });

  const { data: incomeCategories = [] } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: () => getCategories('income'),
  });

  const createCategoryMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategoryMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#0E7490",
    icon: "more-horizontal",
  });
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleCreateCategory = () => {
    if (!newCategory.name) return;
    createCategoryMut.mutate({
      name: newCategory.name,
      type: newCategory.type,
      color: newCategory.color,
      icon: newCategory.icon,
    });
    setNewCategory({ name: "", type: "expense", color: "#0E7490", icon: "more-horizontal" });
    setShowAddCategory(false);
  };

  const colorPalette = ["#F97316", "#0E7490", "#8B5CF6", "#F43F5E", "#22C55E", "#EC4899", "#3B82F6", "#F59E0B", "#EF4444", "#78716C"];

  return (
    <div className="p-8 max-w-3xl">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white border border-[var(--border-light)] rounded-xl p-1 h-auto">
          <TabsTrigger value="profile" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
            <Tag className="w-4 h-4 mr-2" />
            Категории
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Уведомления
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-8 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
          >
            <div className="flex items-center gap-4 mb-6">
              <img
                src={user?.avatar || "/avatar-default.png"}
                alt=""
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-medium text-[var(--text-primary)]">{user?.name || "Пользователь"}</p>
                <p className="text-sm text-[var(--text-muted)]">{user?.email || ""}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Имя</Label>
                <Input value={user?.name || ""} readOnly className="h-11 rounded-xl bg-[var(--bg-hover)]" />
              </div>
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Email</Label>
                <Input value={user?.email || ""} readOnly className="h-11 rounded-xl bg-[var(--bg-hover)]" />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border-light)]">
              <p className="text-sm text-[var(--text-muted)] mb-4">
                Данные профиля синхронизируются с вашим аккаунтом авторизации.
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Expense Categories */}
            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                Категории расходов
              </h3>
              <div className="space-y-2">
                {expenseCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}12` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <span className="text-sm text-[var(--text-primary)] flex-1">{cat.name}</span>
                    {cat.userId && (
                      <button
                        onClick={() => {
                          if (confirm(`Удалить категорию "${cat.name}"?`)) {
                            deleteCategoryMut.mutate(cat.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-tertiary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-tertiary)] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Income Categories */}
            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                Категории доходов
              </h3>
              <div className="space-y-2">
                {incomeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${cat.color}12` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <span className="text-sm text-[var(--text-primary)] flex-1">{cat.name}</span>
                    {cat.userId && (
                      <button
                        onClick={() => {
                          if (confirm(`Удалить категорию "${cat.name}"?`)) {
                            deleteCategoryMut.mutate(cat.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-tertiary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-tertiary)] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Category */}
            {showAddCategory ? (
              <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
                <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                  Новая категория
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Название</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Например: Спорт"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex rounded-xl border border-[var(--border-medium)] overflow-hidden">
                    {(["expense", "income"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewCategory({ ...newCategory, type: t })}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                          newCategory.type === t
                            ? "bg-[var(--accent-primary)] text-white"
                            : "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        }`}
                      >
                        {t === "expense" ? "Расход" : "Доход"}
                      </button>
                    ))}
                  </div>
                  <div>
                    <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Цвет</Label>
                    <div className="flex gap-2 flex-wrap">
                      {colorPalette.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewCategory({ ...newCategory, color: c })}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            newCategory.color === c ? "ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCategory(false)}
                      className="flex-1 h-11 rounded-xl border-[var(--border-medium)]"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={!newCategory.name || createCategoryMut.isPending}
                      className="flex-1 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
                    >
                      {createCategoryMut.isPending ? "..." : "Добавить"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowAddCategory(true)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-dashed border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить категорию
              </Button>
            )}
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)] space-y-4"
          >
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
              Настройки уведомлений
            </h3>
            {[
              { label: "Бюджет превышен на 80%", desc: "Получать уведомление при достижении 80% бюджета" },
              { label: "Бюджет превышен на 100%", desc: "Получать уведомление при полном расходовании бюджета" },
              { label: "Приближение срока цели", desc: "Уведомлять за неделю до даты цели" },
              { label: "Еженедельная сводка", desc: "Получать отчёт каждую неделю" },
              { label: "Ежемесячная сводка", desc: "Получать отчёт в начале каждого месяца" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border-light)] last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                </div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
