import { formatCurrency, formatDateShort } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface TransactionRowProps {
  type: string;
  amount: number | string;
  description?: string | null;
  date: string | Date;
  categoryName?: string | null;
  categoryColor?: string | null;
  categoryIcon?: string | null;
  subcategoryName?: string | null;
  merchantName?: string | null;
  recipient?: string | null;
  tags?: string[];
  accountName?: string | null;
  accountColor?: string | null;
  onClick?: () => void;
  action?: ReactNode;
}

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;

export default function TransactionRow({
  type,
  amount,
  description,
  date,
  categoryName,
  categoryColor,
  categoryIcon,
  subcategoryName,
  merchantName,
  recipient,
  tags = [],
  accountName,
  accountColor,
  onClick,
  action,
}: TransactionRowProps) {
  const numAmount = typeof amount === 'string' ? Number(amount) : amount;
  const iconName = categoryIcon || "circle";
  const IconComponent = iconMap[iconName] ?? LucideIcons.Circle;
  const color = categoryColor || "#78716C";

  const amountColor =
    type === "income"
      ? "var(--accent-secondary)"
      : type === "expense"
      ? "var(--text-primary)"
      : "var(--text-secondary)";

  const prefix = type === "income" ? "+" : type === "expense" ? "−" : "";
  const details = [
    merchantName ? `Мерчант: ${merchantName}` : null,
    subcategoryName ? `Подкатегория: ${subcategoryName}` : null,
    recipient ? `Получатель: ${recipient}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 py-3.5 px-5 border-b border-[var(--border-light)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
    >
      {/* Category Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}12` }}
      >
        <IconComponent className="w-4 h-4" style={{ color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {description || "Без описания"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[var(--text-muted)]">{categoryName || "Без категории"}</span>
          <span className="text-[var(--border-light)]">·</span>
          <span className="text-xs text-[var(--text-muted)]">{formatDateShort(date)}</span>
        </div>
        {(details.length > 0 || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {details.map((detail) => (
              <span key={detail} className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">
                {detail}
              </span>
            ))}
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md bg-[var(--bg-hover)] text-[10px] font-medium text-[var(--text-secondary)]"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[11px] text-[var(--text-muted)]">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="text-right">
        <span className="text-sm font-mono font-medium" style={{ color: amountColor }}>
          {prefix}{formatCurrency(Math.abs(numAmount))}
        </span>
      </div>

      {/* Account Badge */}
      {accountName && (
        <span
          className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0"
          style={{
            backgroundColor: `${accountColor || "#78716C"}10`,
            color: accountColor || "#78716C",
          }}
        >
          {accountName}
        </span>
      )}

      {action}
    </div>
  );
}
