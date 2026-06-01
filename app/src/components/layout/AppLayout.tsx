import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import { getGreeting } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Обзор",
  "/transactions": "Транзакции",
  "/accounts": "Счета",
  "/analytics": "Аналитика",
  "/budgets": "Бюджеты",
  "/goals": "Цели",
  "/recurring": "Автоплатежи",
  "/settings": "Настройки",
  "/help": "Помощь",
};

export default function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || "FinTrack";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-primary)] border-b border-[var(--border-light)] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h1
                key={location.pathname}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="font-heading text-lg sm:text-xl font-semibold text-[var(--text-primary)]"
              >
                {title}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-[var(--text-muted)] mr-1">
              {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </span>
            {/* Bell without red dot — no notification system yet */}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
              <Bell className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
