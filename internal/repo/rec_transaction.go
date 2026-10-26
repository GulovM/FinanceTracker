package repo

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) GetRecTransactions(ctx context.Context, userID int) ([]*domain.RecTransaction, error) {
	query := `
		select 
			rt.id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			rt.period_type,
			rt.interval,
			rt.day_of_month,
			rt.day_of_week,
			rt.start_date,
			rt.end_date,
			rt.next_run_at,
			rt.status
		from recurring_transaction rt
		left join users u on rt.user_id = u.id
		where rt.user_id = $1
		order by rt.created_at desc;
	`

	rows, err := r.postgres.Query(ctx, query, userID)

	var rec_transactions []*domain.RecTransaction
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rec_transactions, nil
		}
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		tr, err := pgx.RowToStructByName[dbRecTransaction](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		rec_transactions = append(rec_transactions, tr.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return rec_transactions, nil
}

func (r *Repository) GetRecTransactionByID(ctx context.Context, userID, id int) (*domain.RecTransactionFull, error) {
	query := `
		select 
			rt.id,
			rt.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			rt.account_id,
			a.name account_name,
			rt.category_id,
			c.name category_name,
			rt.subcategory_id,
			s.name subcategory_name,
			rt.merchant_id,
			m.name merchant_name,
			COALESCE(array_agg(DISTINCT g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS tags,
			rt.type rec_transac_type,
			rt.amount,
			rt.recipient,
			rt.comment,
			rt.period_type,
			rt.interval,
			rt.day_of_month,
			rt.day_of_week,
			rt.start_date,
			rt.end_date,
			to_char(rt.next_run_at, 'YYYY-MM-DD HH24:MI:SS') next_run_at,
			rt.timezone,
			rt.status,
			to_char(rt.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(rt.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
		from recurring_transaction rt
		left join users u on rt.user_id = u.id
		left join account a on rt.account_id = a.id
		left join category c on rt.category_id = c.id
		left join subcategory s on rt.subcategory_id = s.id
		left join merchant m  on rt.merchant_id = m.id
		left join transactions t on t.recurring_id = rt.id
		left join transaction_tag tt ON tt.transaction_id = t.id
		left join tag g ON g.id = tt.tag_id
		where rt.user_id = $1 and rt.id = $2
		group by rt.id, u.second_name, u.first_name, a.name, c.name, s.name, m.name;
	`

	row := r.postgres.QueryRow(ctx, query, userID, id)

	var dbRecTransaction dbRecTransactionFull
	err := row.Scan(&dbRecTransaction.ID, &dbRecTransaction.UserID, &dbRecTransaction.UserName, &dbRecTransaction.AccountID,
		&dbRecTransaction.AccountName, &dbRecTransaction.CategoryID, &dbRecTransaction.CategoryName, &dbRecTransaction.SubcategoryID,
		&dbRecTransaction.SubcategoryName, &dbRecTransaction.MerchantID, &dbRecTransaction.MerchantName, &dbRecTransaction.Tags,
		&dbRecTransaction.Type, &dbRecTransaction.Amount, &dbRecTransaction.Recipient, &dbRecTransaction.Comment,
		&dbRecTransaction.PeriodType, &dbRecTransaction.Interval, &dbRecTransaction.DayOfMonth, &dbRecTransaction.DayOfWeek,
		&dbRecTransaction.StartDate, &dbRecTransaction.EndDate, &dbRecTransaction.NextRunAt, &dbRecTransaction.Timezone,
		&dbRecTransaction.Status, &dbRecTransaction.CreatedAt, &dbRecTransaction.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return dbRecTransaction.ToEntity(), nil
}

func (r *Repository) GetRecTransactionsList(ctx context.Context, userID int) ([]*domain.RecTransactionFull, error) {
	query := `
		select
			rt.id,
			rt.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			rt.account_id,
			a.name account_name,
			rt.category_id,
			c.name category_name,
			rt.subcategory_id,
			s.name subcategory_name,
			rt.merchant_id,
			m.name merchant_name,
			COALESCE(array_agg(DISTINCT g.id) FILTER (WHERE g.id IS NOT NULL), '{}') AS tag_ids,
			COALESCE(array_agg(DISTINCT g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS tags,
			rt.type rec_transac_type,
			rt.amount,
			rt.recipient,
			rt.comment,
			rt.period_type,
			rt.interval,
			rt.day_of_month,
			rt.day_of_week,
			rt.start_date,
			rt.end_date,
			to_char(rt.next_run_at, 'YYYY-MM-DD HH24:MI:SS') next_run_at,
			rt.timezone,
			rt.status,
			to_char(rt.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(rt.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
		from recurring_transaction rt
		left join users u on rt.user_id = u.id
		left join account a on rt.account_id = a.id
		left join category c on rt.category_id = c.id
		left join subcategory s on rt.subcategory_id = s.id
		left join merchant m on rt.merchant_id = m.id
		left join transactions t on t.recurring_id = rt.id
		left join transaction_tag tt ON tt.transaction_id = t.id
		left join tag g ON g.id = tt.tag_id
		where rt.user_id = $1
		group by rt.id, u.second_name, u.first_name, a.name, c.name, s.name, m.name
		order by rt.created_at desc;
	`

	rows, err := r.postgres.Query(ctx, query, userID)

	var rec_transactions []*domain.RecTransactionFull
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rec_transactions, nil
		}
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		tr, err := pgx.RowToStructByName[dbRecTransactionFull](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		rec_transactions = append(rec_transactions, tr.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return rec_transactions, nil
}

func (r *Repository) GetDueRecurring(ctx context.Context) ([]*domain.RecTransactionFull, error) {
	query := `
		select 
			rt.id,
			rt.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			rt.account_id,
			a.name account_name,
			rt.category_id,
			c.name category_name,
			rt.subcategory_id,
			s.name subcategory_name,
			rt.merchant_id,
			m.name merchant_name,
			COALESCE(array_agg(DISTINCT g.id) FILTER (WHERE g.id IS NOT NULL), '{}') AS tag_ids,
			COALESCE(array_agg(DISTINCT g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS tags,
			rt.type rec_transac_type,
			rt.amount,
			rt.recipient,
			rt.comment,
			rt.period_type,
			rt.interval,
			rt.day_of_month,
			rt.day_of_week,
			rt.start_date,
			rt.end_date,
			to_char(rt.next_run_at, 'YYYY-MM-DD HH24:MI:SS') next_run_at,
			rt.timezone,
			rt.status,
			to_char(rt.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(rt.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
		from recurring_transaction rt
		left join users u on rt.user_id = u.id
		left join account a on rt.account_id = a.id
		left join category c on rt.category_id = c.id
		left join subcategory s on rt.subcategory_id = s.id
		left join merchant m  on rt.merchant_id = m.id
		left join transactions t on t.recurring_id = rt.id
		left join transaction_tag tt ON tt.transaction_id = t.id
		left join tag g ON g.id = tt.tag_id
		where rt.status = 'Активен' and rt.next_run_at<=now()
		group by rt.id, u.second_name, u.first_name, a.name, c.name, s.name, m.name;
	`

	rows, err := r.postgres.Query(ctx, query)

	var rec_transactions []*domain.RecTransactionFull
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return rec_transactions, nil
		}
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		tr, err := pgx.RowToStructByName[dbRecTransactionFull](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		rec_transactions = append(rec_transactions, tr.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return rec_transactions, nil
}

func (r *Repository) LockDueRecurringTx(ctx context.Context, tx pgx.Tx, id int) (bool, error) {
	query := `
		select 1 from recurring_transaction
		where id = $1 and status = 'Активен' and next_run_at <= now()
		for update skip locked;
	`

	var one int
	if err := tx.QueryRow(ctx, query, id).Scan(&one); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, scan_err(err)
	}
	return true, nil
}

func (r *Repository) CreateRecTransaction(ctx context.Context, tx pgx.Tx, recTransaction *domain.CreateRecTransaction) (int, error) {
	query := `
		insert into recurring_transaction(user_id, account_id, category_id, subcategory_id, merchant_id, type,
		amount, recipient, comment, period_type, interval, day_of_month, day_of_week, start_date, end_date, next_run_at, timezone)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		returning id;
	`

	var txID int

	err := tx.QueryRow(ctx, query, recTransaction.UserID, recTransaction.AccountID, recTransaction.CategoryID,
		recTransaction.SubcategoryID, recTransaction.MerchantID, recTransaction.Type, recTransaction.Amount, recTransaction.Recipient,
		recTransaction.Comment, recTransaction.PeriodType, recTransaction.Interval, recTransaction.DayOfMonth,
		recTransaction.DayOfWeek, recTransaction.StartDate, recTransaction.EndDate, recTransaction.NextRunAt,
		recTransaction.Timezone).Scan(&txID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, scan_err(err)
	}

	return txID, nil
}

func (r *Repository) updateRecTransaction(ctx context.Context, runner RowGetter, recTransaction *domain.UpdateRecTransaction) error {
	query := `
	update recurring_transaction set
	account_id = $1,
	category_id = $2,
	subcategory_id = $3,
	merchant_id = $4, 
	type = $5, 
	amount = $6, 
	recipient = $7, 
	comment = $8, 
	period_type = $9, 
	interval = $10, 
	day_of_month = $11, 
	day_of_week = $12, 
	start_date = $13, 
	end_date = $14, 
	next_run_at = $15,
	updated_at = now()
	where user_id = $16 and id = $17;
	`

	_, err := runner.Exec(ctx, query, recTransaction.AccountID, recTransaction.CategoryID,
		recTransaction.SubcategoryID, recTransaction.MerchantID, recTransaction.Type, recTransaction.Amount, recTransaction.Recipient,
		recTransaction.Comment, recTransaction.PeriodType, recTransaction.Interval, recTransaction.DayOfMonth,
		recTransaction.DayOfWeek, recTransaction.StartDate, recTransaction.EndDate, recTransaction.NextRunAt,
		recTransaction.UserID, recTransaction.ID)

	if err != nil {
		return exec_err(err)
	}

	return nil

}

func (r *Repository) UpdateRecTransaction(ctx context.Context, recTransaction *domain.UpdateRecTransaction) error {
	return r.updateRecTransaction(ctx, r.postgres, recTransaction)
}

func (r *Repository) UpdateRecTransactionTx(ctx context.Context, tx pgx.Tx, recTransaction *domain.UpdateRecTransaction) error {
	return r.updateRecTransaction(ctx, tx, recTransaction)
}

func (r *Repository) updateRecurringStatus(ctx context.Context, runner RowGetter, userID, id int, status string) error {
	query := `
	update recurring_transaction 
	set status = $1,
	updated_at = now()
	where user_id = $2 and id = $3;
	`

	_, err := runner.Exec(ctx, query, status, userID, id)
	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) UpdateRecurringStatus(ctx context.Context, userID, id int, status string) error {
	return r.updateRecurringStatus(ctx, r.postgres, userID, id, status)
}

func (r *Repository) UpdateRecurringStatusTx(ctx context.Context, tx pgx.Tx, userID, id int, status string) error {
	return r.updateRecurringStatus(ctx, tx, userID, id, status)
}

func (r *Repository) UpdateRecurringNextRun(ctx context.Context, tx pgx.Tx, id int, next time.Time) error {
	query := `
	update recurring_transaction
	set next_run_at = $1,
	updated_at = now()
	where id = $2;
	`

	_, err := tx.Exec(ctx, query, next, id)
	if err != nil {
		return exec_err(err)
	}
	return nil
}
