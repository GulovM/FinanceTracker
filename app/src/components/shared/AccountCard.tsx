import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";

interface AccountCardProps {
  name: string;
  type: string;
  balance: number | string;
  color: string;
  icon: string;
  onClick?: () => void;
}

const typeLabels: Record<string, string> = {
  cash: "Наличные",
  wallet: "Кошелёк",
  debit: "Дебетовая карта",
  credit: "Кредитная карта",
  savings: "Сбережения",
  investment: "Инвестиции",
};

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;

export default function AccountCard({ name, type, balance, color, icon, onClick }: AccountCardProps) {
  const numBalance = typeof balance === 'string' ? Number(balance) : balance;
  const IconComponent = iconMap[icon] ?? LucideIcons.Wallet;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="relative w-[260px] h-[150px] rounded-2xl p-5 overflow-hidden cursor-pointer flex-shrink-0 shadow-[0_1px_3px_rgba(28,25,23,0.04)] hover:shadow-[0_4px_12px_rgba(28,25,23,0.06)] transition-shadow"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`,
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -bottom-6 -right-6 w-[120px] h-[120px] rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between">
        <IconComponent className="w-5 h-5 text-white/80" />
        <button className="p-1 rounded-md hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Content */}
      <div className="relative mt-4">
        <p className="text-white font-semibold text-base">{name}</p>
        <p className="text-white/60 text-[11px] mt-0.5">{typeLabels[type] || type}</p>
      </div>

      {/* Balance */}
      <div className="relative mt-auto pt-4">
        <p className="text-white font-mono text-lg font-semibold tracking-tight">
          {formatCurrency(numBalance)}
        </p>
        <p className="text-white/60 text-[11px]">Текущий баланс</p>
      </div>
    </motion.div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
