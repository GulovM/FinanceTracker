import { formatCurrency } from "@/lib/utils";

interface BudgetProgressProps {
  name: string;
  spent: number;
  limit: number;
  color?: string;
}

export default function BudgetProgress({ name, spent, limit }: BudgetProgressProps) {
  const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const isOverBudget = spent > limit;

  const barColor =
    percentage <= 60
      ? "var(--success)"
      : percentage <= 85
      ? "var(--warning)"
      : "var(--accent-tertiary)";

  return (
    <div className="bg-white rounded-xl border border-[var(--border-light)] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
        <span className="text-xs text-[var(--text-muted)]">
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium" style={{ color: barColor }}>
          {percentage}%
        </span>
        {isOverBudget && (
          <span className="text-xs text-[var(--accent-tertiary)]">
            Превышен на {formatCurrency(spent - limit)}
          </span>
        )}
      </div>
    </div>
  );
}
