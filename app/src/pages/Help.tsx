import { motion } from "framer-motion";
import {
  BookOpen,
  MessageCircle,
  Mail,
} from "lucide-react";

export default function Help() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <BookOpen className="w-16 h-16 text-[var(--accent-primary)] mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-semibold text-[var(--text-primary)] mb-2">
          Центр помощи
        </h2>
        <p className="text-[var(--text-secondary)]">
          Ответы на часто задаваемые вопросы
        </p>
      </motion.div>

      <div className="space-y-4">
        {[
          {
            q: "Как добавить транзакцию?",
            a: "Перейдите в раздел 'Транзакции' и нажмите кнопку 'Добавить'. Заполните форму: тип (расход/доход/перевод), сумму, счёт, категорию и описание.",
          },
          {
            q: "Как создать бюджет?",
            a: "В разделе 'Бюджеты' выберите месяц и нажмите 'Создать бюджет'. Укажите общий лимит и при необходимости добавьте лимиты по категориям.",
          },
          {
            q: "Как настроить автоплатёж?",
            a: "В разделе 'Автоплатежи' нажмите '+' и заполните данные: название, сумму, счёт, частоту и день месяца.",
          },
          {
            q: "Как создать цель накопления?",
            a: "В разделе 'Цели' нажмите 'Новая цель'. Укажите название, целевую сумму, дату и цвет для визуального отличия.",
          },
          {
            q: "Можно ли редактировать категории?",
            a: "Да, в разделе 'Настройки' → 'Категории' вы можете добавлять свои категории расходов и доходов.",
          },
          {
            q: "Как работают переводы между счетами?",
            a: "При создании транзакции выберите тип 'Перевод', укажите счёт отправителя и счёт получателя. Сумма будет списана с одного счёта и зачислена на другой.",
          },
        ].map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[var(--border-light)] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{faq.q}</p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-[var(--accent-primary)]/5 rounded-2xl border border-[var(--accent-primary)]/20 p-6 text-center"
      >
        <MessageCircle className="w-10 h-10 text-[var(--accent-primary)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
          Не нашли ответ на свой вопрос?
        </p>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Свяжитесь с нами — мы всегда рады помочь
        </p>
        <a
          href="mailto:support@fintrack.app"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
        >
          <Mail className="w-4 h-4" />
          Написать в поддержку
        </a>
      </motion.div>
    </div>
  );
}
