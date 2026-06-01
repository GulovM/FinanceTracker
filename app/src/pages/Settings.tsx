import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getMerchants,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  updateMe,
  deleteMe,
  getUserEvents,
} from "@/lib/api";
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
  Pencil,
  History,
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenseCategories = [] } = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => getCategories('expense'),
  });

  const { data: incomeCategories = [] } = useQuery({
    queryKey: ['categories', 'income'],
    queryFn: () => getCategories('income'),
  });

  const allCategories = [...expenseCategories, ...incomeCategories];
  const [selectedSubcategoryCategory, setSelectedSubcategoryCategory] = useState("");
  const activeSubcategoryCategory = Number(selectedSubcategoryCategory || allCategories[0]?.id || 0);

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', activeSubcategoryCategory],
    queryFn: () => getSubcategories(activeSubcategoryCategory),
    enabled: activeSubcategoryCategory > 0,
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: getMerchants,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => getUserEvents({ limit: 30 }),
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

  const updateCategoryMut = useMutation({
    mutationFn: ({ id, name, type }: { id: number; name: string; type: "income" | "expense" }) =>
      updateCategory(id, { name, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const createSubcategoryMut = useMutation({
    mutationFn: createSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
  });

  const deleteSubcategoryMut = useMutation({
    mutationFn: deleteSubcategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
  });

  const updateSubcategoryMut = useMutation({
    mutationFn: ({ id, categoryId, name }: { id: number; categoryId: number; name: string }) =>
      updateSubcategory(id, { categoryId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    },
  });

  const createMerchantMut = useMutation({
    mutationFn: createMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });

  const deleteMerchantMut = useMutation({
    mutationFn: deleteMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });

  const updateMerchantMut = useMutation({
    mutationFn: ({ id, name, categoryId }: { id: number; name: string; categoryId: number }) =>
      updateMerchant(id, { name, categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });

  const createTagMut = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const deleteTagMut = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateTagMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateTag(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const updateProfileMut = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const deleteProfileMut = useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      logout();
    },
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#0E7490",
    icon: "more-horizontal",
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newMerchant, setNewMerchant] = useState({ name: "", categoryId: "" });
  const [newTagName, setNewTagName] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    secondName: "",
    email: "",
    password: "",
  });

  const profileForm = {
    firstName: profile.firstName || user?.firstName || "",
    secondName: profile.secondName || user?.secondName || "",
    email: profile.email || user?.email || "",
    password: profile.password,
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="bg-white border border-[var(--border-light)] rounded-xl p-1 h-auto flex w-max min-w-full sm:w-auto">
            <TabsTrigger value="profile" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-1.5" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
              <Tag className="w-4 h-4 mr-1.5" />
              Категории
            </TabsTrigger>
            <TabsTrigger value="directories" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
              <Tag className="w-4 h-4 mr-1.5" />
              Справочники
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-1.5" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
              <History className="w-4 h-4 mr-1.5" />
              События
            </TabsTrigger>
          </TabsList>
        </div>

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
                <Input
                  value={profileForm.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Фамилия</Label>
                <Input
                  value={profileForm.secondName}
                  onChange={(e) => setProfile({ ...profile, secondName: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Email</Label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-[var(--text-muted)] mb-1.5 block">Пароль</Label>
                <Input
                  type="password"
                  value={profile.password}
                  onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                  placeholder="Новый пароль"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border-light)] flex gap-3">
              <Button
                onClick={() => updateProfileMut.mutate(profileForm)}
                disabled={!profileForm.firstName || !profileForm.email || !profileForm.password || updateProfileMut.isPending}
                className="h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
              >
                {updateProfileMut.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Удалить профиль?")) {
                    deleteProfileMut.mutate();
                  }
                }}
                disabled={deleteProfileMut.isPending}
                className="h-11 rounded-xl"
              >
                Удалить профиль
              </Button>
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
                      <>
                        <button
                          onClick={() => {
                            const name = prompt("Новое название категории", cat.name);
                            if (name) updateCategoryMut.mutate({ id: cat.id, name, type: cat.type });
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
                      </>
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
                      <>
                        <button
                          onClick={() => {
                            const name = prompt("Новое название категории", cat.name);
                            if (name) updateCategoryMut.mutate({ id: cat.id, name, type: cat.type });
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
                      </>
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

        <TabsContent value="directories">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                Подкатегории
              </h3>
              <div className="grid grid-cols-[1fr_auto] gap-3 mb-4">
                <select
                  value={String(activeSubcategoryCategory || "")}
                  onChange={(e) => setSelectedSubcategoryCategory(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                >
                  {allCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <Input
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Название"
                  className="h-11 rounded-xl"
                />
              </div>
              <Button
                onClick={() => {
                  if (!newSubcategoryName || !activeSubcategoryCategory) return;
                  createSubcategoryMut.mutate({ categoryId: activeSubcategoryCategory, name: newSubcategoryName });
                  setNewSubcategoryName("");
                }}
                disabled={!newSubcategoryName || !activeSubcategoryCategory || createSubcategoryMut.isPending}
                className="w-full h-10 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white mb-4"
              >
                Добавить подкатегорию
              </Button>
              <div className="space-y-2">
                {subcategories.map((subcat) => (
                  <div key={subcat.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)] group">
                    <span className="text-sm text-[var(--text-primary)] flex-1">{subcat.name}</span>
                    <button
                      onClick={() => {
                        const name = prompt("Новое название подкатегории", subcat.name);
                        if (name) {
                          updateSubcategoryMut.mutate({
                            id: subcat.id,
                            categoryId: subcat.categoryId || activeSubcategoryCategory,
                            name,
                          });
                        }
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить подкатегорию "${subcat.name}"?`)) {
                          deleteSubcategoryMut.mutate(subcat.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-tertiary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-tertiary)] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                Мерчанты
              </h3>
              <div className="grid grid-cols-[1fr_1fr] gap-3 mb-3">
                <Input
                  value={newMerchant.name}
                  onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                  placeholder="Название мерчанта"
                  className="h-11 rounded-xl"
                />
                <select
                  value={newMerchant.categoryId}
                  onChange={(e) => setNewMerchant({ ...newMerchant, categoryId: e.target.value })}
                  className="h-11 px-3 rounded-xl border border-[var(--border-medium)] text-sm bg-white"
                >
                  <option value="">Категория</option>
                  {allCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  if (!newMerchant.name || !newMerchant.categoryId) return;
                  createMerchantMut.mutate({ name: newMerchant.name, categoryId: Number(newMerchant.categoryId) });
                  setNewMerchant({ name: "", categoryId: "" });
                }}
                disabled={!newMerchant.name || !newMerchant.categoryId || createMerchantMut.isPending}
                className="w-full h-10 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white mb-4"
              >
                Добавить мерчанта
              </Button>
              <div className="space-y-2">
                {merchants.map((merchant) => (
                  <div key={merchant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)] group">
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-primary)]">{merchant.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{merchant.categoryName || allCategories.find((c) => c.id === merchant.categoryId)?.name || "Категория"}</p>
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt("Новое название мерчанта", merchant.name);
                        if (name) {
                          updateMerchantMut.mutate({ id: merchant.id, name, categoryId: merchant.categoryId });
                        }
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить мерчанта "${merchant.name}"?`)) {
                          deleteMerchantMut.mutate(merchant.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-tertiary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-tertiary)] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
              <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
                Теги
              </h3>
              <div className="flex gap-3 mb-4">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Новый тег"
                  className="h-11 rounded-xl"
                />
                <Button
                  onClick={() => {
                    if (!newTagName) return;
                    createTagMut.mutate(newTagName);
                    setNewTagName("");
                  }}
                  disabled={!newTagName || createTagMut.isPending}
                  className="h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
                >
                  Добавить
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-light)]">
                    <span className="text-sm text-[var(--text-primary)]">{tag.name}</span>
                    <button
                      onClick={() => {
                        const name = prompt("Новое название тега", tag.name);
                        if (name) updateTagMut.mutate({ id: tag.id, name });
                      }}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTagMut.mutate(tag.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent-tertiary)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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

        <TabsContent value="events">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
          >
            <h3 className="font-heading text-lg font-medium text-[var(--text-primary)] mb-4">
              Журнал событий
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="p-3 rounded-xl border border-[var(--border-light)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{event.eventType}</p>
                    <p className="text-xs text-[var(--text-muted)]">{event.date}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                    {JSON.stringify(event.payload)}
                  </p>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Событий пока нет</p>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
