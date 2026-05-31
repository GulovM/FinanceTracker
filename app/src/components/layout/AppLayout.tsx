import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import { getGreeting } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Search, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        {/* Top Bar */}
        <header className="h-14 flex items-center justify-between px-8 bg-[var(--bg-primary)] border-b border-[var(--border-light)] sticky top-0 z-30">
          <div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={location.pathname}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="font-heading text-xl font-semibold text-[var(--text-primary)]"
              >
                {title}
              </motion.h1>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)] mr-2">
              {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </span>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent-tertiary)] rounded-full" />
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
