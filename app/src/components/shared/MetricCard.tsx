import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  trend?: number;
  prefix?: string;
}

export default function MetricCard({ label, value, icon: Icon, color, trend, prefix = "₽" }: MetricCardProps) {
  const displayColor = color || "var(--text-primary)";
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-[var(--border-light)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.04)] hover:shadow-[0_4px_12px_rgba(28,25,23,0.06)] transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${displayColor}12` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: displayColor }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-medium" style={{ color: displayColor }}>
          {prefix}
        </span>
        <span className="text-2xl font-semibold font-mono tracking-tight" style={{ color: displayColor }}>
          {new Intl.NumberFormat('ru-RU').format(Math.abs(value))}
        </span>
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)]"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">к прошлому месяцу</span>
        </div>
      )}
    </motion.div>
  );
}
