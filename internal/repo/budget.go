package repo

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateBudget(ctx context.Context, budget *domain.CreateBudget) (int, error) {
	query := `
	insert into budget(user_id, name, period_type, period_start, period_end, amount_limit)
	values ($1, $2, $3, $4, $5, $6)
	returning id;
	`

	var id int
	err := r.postgres.QueryRow(ctx, query,
		budget.UserID, budget.Name, budget.PeriodType,
		budget.PeriodStart, budget.PeriodEnd, budget.AmountLimit,
	).Scan(&id)
	if err != nil {
		return 0, exec_err(err)
	}
	return id, nil
}

func (r *Repository) GetBudgets(ctx context.Context, userID int) ([]*domain.Budget, error) {
	query := `
	select
		b.id,
		b.user_id,
		b.name,
		b.period_type::text,
		to_char(b.period_start, 'YYYY-MM-DD') period_start,
		to_char(b.period_end,   'YYYY-MM-DD') period_end,
		b.amount_limit,
		COALESCE(array_agg(bc.category_id) filter (where bc.id is not null), '{}') category_ids,
		to_char(b.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		to_char(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
		b.is_deleted,
		b.deleted_at
	from budget b
	left join budget_category bc on bc.budget_id = b.id
	where b.user_id = $1 and b.is_deleted = false
	group by b.id
	order by b.id desc;
	`

	rows, err := r.postgres.Query(ctx, query, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	defer rows.Close()

	var budgets []*domain.Budget
	for rows.Next() {
		b, err := pgx.RowToStructByName[dbBudget](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		budgets = append(budgets, b.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return budgets, nil
}

func (r *Repository) GetBudgetByID(ctx context.Context, userID, id int) (*domain.Budget, error) {
	query := `
	select
		b.id,
		b.user_id,
		b.name,
		b.period_type::text,
		to_char(b.period_start, 'YYYY-MM-DD') period_start,
		to_char(b.period_end,   'YYYY-MM-DD') period_end,
		b.amount_limit,
		COALESCE(array_agg(bc.category_id) filter (where bc.id is not null), '{}') category_ids,
		to_char(b.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		to_char(b.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
		b.is_deleted,
		b.deleted_at
	from budget b
	left join budget_category bc on bc.budget_id = b.id
	where b.id = $1 and b.user_id = $2 and b.is_deleted = false
	group by b.id;
	`

	rows, err := r.postgres.Query(ctx, query, id, userID)
	if err != nil {
		return nil, scan_err(err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, errs.ErrNotFound
	}

	b, err := pgx.RowToStructByName[dbBudget](rows)
	if err != nil {
		return nil, scan_err(err)
	}
	return b.ToEntity(), nil
}

func (r *Repository) UpdateBudget(ctx context.Context, budget *domain.UpdateBudget) error {
	query := `
	update budget set
		name = $1,
		period_type = $2,
		period_start = $3,
		period_end = $4,
		amount_limit = $5,
		updated_at = now()
	where id = $6 and user_id = $7 and is_deleted = false;
	`

	_, err := r.postgres.Exec(ctx, query,
		budget.Name, budget.PeriodType, budget.PeriodStart,
		budget.PeriodEnd, budget.AmountLimit, budget.ID, budget.UserID,
	)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) DeleteBudget(ctx context.Context, userID, id int) error {
	query := `
	update budget set is_deleted = true, deleted_at = now()
	where id = $1 and user_id = $2 and is_deleted = false;
	`

	_, err := r.postgres.Exec(ctx, query, id, userID)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) AddBudgetCategories(ctx context.Context, budgetID int, categoryIDs []int) error {
	if len(categoryIDs) == 0 {
		return nil
	}

	placeholders := make([]string, len(categoryIDs))
	args := []interface{}{budgetID}
	for i, catID := range categoryIDs {
		placeholders[i] = fmt.Sprintf("($1, $%d)", i+2)
		args = append(args, catID)
	}

	query := `insert into budget_category(budget_id, category_id) values ` +
		strings.Join(placeholders, ", ") +
		` on conflict do nothing;`

	_, err := r.postgres.Exec(ctx, query, args...)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) RemoveBudgetCategory(ctx context.Context, budgetID, categoryID int) error {
	query := `delete from budget_category where budget_id = $1 and category_id = $2;`

	_, err := r.postgres.Exec(ctx, query, budgetID, categoryID)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) GetBudgetSummary(ctx context.Context, userID, id int) (*domain.BudgetSummary, error) {
	query := `
	select
		b.amount_limit,
		COALESCE(sum(t.amount), 0) as total_spent
	from budget b
	left join budget_category bc on bc.budget_id = b.id
	left join transactions t
		on t.category_id = bc.category_id
		and t.type = 'Расход'
		and t.created_at::date >= b.period_start
		and t.created_at::date <= b.period_end
		and t.user_id = b.user_id
		and t.is_deleted = false
	where b.id = $1 and b.user_id = $2 and b.is_deleted = false
	group by b.amount_limit;
	`

	var amountLimit, totalSpent float64
	err := r.postgres.QueryRow(ctx, query, id, userID).Scan(&amountLimit, &totalSpent)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	remaining := amountLimit - totalSpent
	var percent float64
	if amountLimit > 0 {
		percent = (totalSpent / amountLimit) * 100
	}

	return &domain.BudgetSummary{
		AmountLimit: amountLimit,
		TotalSpent:  totalSpent,
		Remaining:   remaining,
		Percent:     percent,
	}, nil
}
