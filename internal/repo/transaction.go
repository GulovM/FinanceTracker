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

func (r *Repository) GetTransactions(ctx context.Context, f *domain.TransactionsFilter) ([]*domain.Transactions, error) {
	base := `
		select 
			t.id,
			t.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			t.account_id,
			a.name account_name,
			t.category_id,
			c.name category_name,
			t.subcategory_id,
			s.name subcategory_name,
			t.merchant_id,
			m.name merchant_name,
			COALESCE(array_agg(g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS tags,
			t.type transaction_type,
			t.amount,
			t.recipient,
			t.comment,
			to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			t.recurring_id,
			t.transfer_id,
			t.is_deleted,
			t.deleted_at
		from transactions t
		left join users u on t.user_id = u.id
		left join account a on t.account_id = a.id
		left join category c on t.category_id = c.id
		left join subcategory s on t.subcategory_id = s.id
		left join merchant m  on t.merchant_id = m.id
		left join transaction_tag tt ON tt.transaction_id = t.id
		left join tag g ON g.id = tt.tag_id
	`

	where := []string{"t.user_id = $1", "t.is_deleted = false"}
	args := []interface{}{f.UserID}
	argIdx := 2

	if f.AccountID != nil {
		where = append(where, fmt.Sprintf("t.account_id = $%d", argIdx))
		args = append(args, *f.AccountID)
		argIdx++
	}

	if f.CategoryID != nil {
		where = append(where, fmt.Sprintf("t.category_id = $%d", argIdx))
		args = append(args, *f.CategoryID)
		argIdx++
	}

	if f.MerchantID != nil {
		where = append(where, fmt.Sprintf("t.merchant_id = $%d", argIdx))
		args = append(args, *f.MerchantID)
		argIdx++
	}

	if f.Type != nil {
		where = append(where, fmt.Sprintf("t.type = $%d", argIdx))
		args = append(args, *f.Type)
		argIdx++
	}

	if f.DateFrom != nil {
		where = append(where, fmt.Sprintf("t.created_at >= $%d", argIdx))
		args = append(args, *f.DateFrom)
		argIdx++
	}

	if f.DateTo != nil {
		where = append(where, fmt.Sprintf("t.created_at < $%d", argIdx))
		args = append(args, *f.DateTo)
		argIdx++
	}

	if f.MinAmount != nil {
		where = append(where, fmt.Sprintf("t.amount >= $%d", argIdx))
		args = append(args, *f.MinAmount)
		argIdx++
	}

	if f.MaxAmount != nil {
		where = append(where, fmt.Sprintf("t.amount <= $%d", argIdx))
		args = append(args, *f.MaxAmount)
		argIdx++
	}

	query := base + `
	WHERE ` + strings.Join(where, " AND ") + `
	group by t.id, u.second_name, u.first_name, a.name,
			c.name, m.name, s.name
	ORDER BY created_at DESC
	LIMIT $` + fmt.Sprint(argIdx) + `
	OFFSET $` + fmt.Sprint(argIdx+1)

	args = append(args, f.Limit, f.Offset)

	rows, err := r.postgres.Query(ctx, query, args...)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("r.postgres.Query error: %w", err)
	}
	defer rows.Close()

	var transactions []*domain.Transactions

	for rows.Next() {
		transaction, err := pgx.RowToStructByName[dbTransaction](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		transactions = append(transactions, transaction.ToEntity())
	}
	return transactions, nil
}

func (r *Repository) GetTransactionByID(ctx context.Context, userID, id int) (*domain.Transactions, error) {
	query := `
	select 
		t.id,
		t.user_id,
		concat(concat(u.second_name, ' '), u.first_name) user_name,
		t.account_id,
		a.name account_name,
		t.category_id,
		c.name category_name,
		t.subcategory_id,
		s.name subcategory_name,
		t.merchant_id,
		m.name merchant_name,
		COALESCE(array_agg(g.name) FILTER (WHERE g.id IS NOT NULL), '{}') AS tags,
		t.type transaction_type,
		t.amount,
		t.recipient,
		t.comment,
		to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
		to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
		t.recurring_id,
		t.transfer_id,
		t.is_deleted,
		t.deleted_at
	from transactions t
	left join users u on t.user_id = u.id
	left join account a on t.account_id = a.id
	left join category c on t.category_id = c.id
	left join subcategory s on t.subcategory_id = s.id
	left join merchant m  on t.merchant_id = m.id
	left join transaction_tag tt ON tt.transaction_id = t.id
	left join tag g ON g.id = tt.tag_id
	WHERE t.user_id = $1 and t.id = $2 and t.is_deleted = false
	group by t.id, u.second_name, u.first_name, a.name,
		c.name, m.name, s.name
	ORDER BY created_at DESC;
	`

	row := r.postgres.QueryRow(ctx, query, userID, id)

	var transaction dbTransaction
	err := row.Scan(&transaction.ID, &transaction.UserID, &transaction.UserName, &transaction.AccountID, &transaction.AccountName, &transaction.CategoryID,
		&transaction.CategoryName, &transaction.SubcategoryID, &transaction.SubcategoryName, &transaction.MerchantID, &transaction.MerchantName, &transaction.Tags, &transaction.Type,
		&transaction.Amount, &transaction.Recipient, &transaction.Comment, &transaction.CreatedAt,
		&transaction.UpdatedAt, &transaction.RecurringID, &transaction.TransferID, &transaction.IsDeleted, &transaction.DeletedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return transaction.ToEntity(), nil
}

func (r *Repository) createTransaction(ctx context.Context, runner RowGetter, createTransaction *domain.CreateTransaction) (int, error) {
	Trquery := `
	insert into transactions (
		user_id, account_id, category_id, subcategory_id, merchant_id,
		type, amount, recipient, comment, recurring_id, transfer_id
	)
	values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
	returning id;
	`

	var txID int
	err := runner.QueryRow(ctx, Trquery,
		createTransaction.UserID,
		createTransaction.AccountID,
		createTransaction.CategoryID,
		createTransaction.SubcategoryID,
		createTransaction.MerchantID,
		createTransaction.Type,
		createTransaction.Amount,
		createTransaction.Recipient,
		createTransaction.Comment,
		createTransaction.RecurringID,
		createTransaction.TransferID,
	).Scan(&txID)
	if err != nil {
		return 0, exec_err(err)
	}

	insertTagQuery := `
	insert into transaction_tag (transaction_id, tag_id)
	values ($1, $2);
	`

	if len(createTransaction.TagIDs) > 0 {
		for _, tagID := range createTransaction.TagIDs {
			_, err = runner.Exec(ctx, insertTagQuery, txID, tagID)
			if err != nil {
				return 0, exec_err(err)
			}
		}
	}

	return txID, nil
}

func (r *Repository) CreateTransaction(ctx context.Context, createTransaction *domain.CreateTransaction) (int, error) {
	return r.createTransaction(ctx, r.postgres, createTransaction)
}

func (r *Repository) CreateTransactionTx(ctx context.Context, tx pgx.Tx, createTransaction *domain.CreateTransaction) (int, error) {
	return r.createTransaction(ctx, tx, createTransaction)
}

func (r *Repository) UpdateTransaction(ctx context.Context, updateTransaction *domain.UpdateTransaction) error {
	tx, err := r.postgres.Begin(ctx)
	if err != nil {
		return fmt.Errorf("tx begin error: %w", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			commitErr := tx.Commit(ctx)
			if commitErr != nil {
				err = fmt.Errorf("tx commit error: %w", commitErr)
			}
		}
	}()

	query1 := `
	update transactions set 
	account_id = $1,
	category_id = $2, 
	subcategory_id = $3,
	merchant_id = $4,
	type = $5,
	amount = $6,
	recipient = $7,
	comment = $8,
	recurring_id = $9,
	transfer_id = $10,
	updated_at = now()
	where id = $11 and user_id = $12;
	`

	_, err = tx.Exec(ctx, query1, updateTransaction.AccountID, updateTransaction.CategoryID, updateTransaction.SubcategoryID,
		updateTransaction.MerchantID, updateTransaction.Type, updateTransaction.Amount, updateTransaction.Recipient,
		updateTransaction.Comment, updateTransaction.RecurringID, updateTransaction.TransferID, updateTransaction.ID, updateTransaction.UserID)

	if err != nil {
		return exec_err(err)
	}

	_, err = tx.Exec(ctx, `delete from transaction_tag where transaction_id = $1`, updateTransaction.ID)
	if err != nil {
		return exec_err(err)
	}

	query2 := `
	INSERT INTO transaction_tag (transaction_id, tag_id) VALUES ($1, $2);
	`
	for _, tagID := range updateTransaction.Tags {
		_, err = tx.Exec(ctx, query2, updateTransaction.ID, tagID)
		if err != nil {
			return exec_err(err)
		}
	}

	return nil
}

func (r *Repository) DeleteTransaction(ctx context.Context, id, userID int) error {
	query := `
	update transactions set
	is_deleted = true,
	deleted_at = now()
	where id = $1 and user_id = $2;
	`

	_, err := r.postgres.Exec(ctx, query, id, userID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
