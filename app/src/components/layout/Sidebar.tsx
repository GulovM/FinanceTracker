import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Trophy,
  Repeat,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Wallet as WalletIcon,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Основное",
    items: [
      { id: "dashboard", label: "Обзор", icon: LayoutDashboard, path: "/" },
      { id: "transactions", label: "Транзакции", icon: ArrowLeftRight, path: "/transactions" },
      { id: "accounts", label: "Счета", icon: Wallet, path: "/accounts" },
      { id: "analytics", label: "Аналитика", icon: PieChart, path: "/analytics" },
    ],
  },
  {
    title: "Планирование",
    items: [
      { id: "budgets", label: "Бюджеты", icon: Target, path: "/budgets" },
      { id: "goals", label: "Цели", icon: Trophy, path: "/goals" },
      { id: "recurring", label: "Автоплатежи", icon: Repeat, path: "/recurring" },
    ],
  },
  {
    title: "Система",
    items: [
      { id: "settings", label: "Настройки", icon: Settings, path: "/settings" },
      { id: "help", label: "Помощь", icon: HelpCircle, path: "/help" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border-light)] flex flex-col transition-all duration-300 ease-in-out fixed left-0 top-0 z-40",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
          <WalletIcon className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="font-heading text-xl font-semibold text-[var(--accent-primary)] tracking-tight">
            FinTrack
          </span>
        )}
      </div>

      <div className="mx-4 border-b border-[var(--border-light)]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5 relative",
                    isActive
                      ? "bg-[var(--accent-primary)]/8 text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent-primary)] rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="px-3 pb-4">
        <div className="border-t border-[var(--border-light)] pt-3">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors",
              collapsed && "justify-center"
            )}
          >
            <img
              src={user?.avatar || "/avatar-default.png"}
              alt=""
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user?.name || "Пользователь"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {user?.email || ""}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[var(--border-light)] shadow-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
