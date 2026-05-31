package repo

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateTransferTx(ctx context.Context, tx pgx.Tx, createTransfer *domain.CreateTransfer) (*int, error) {
	query := `
	insert into transfers (user_id, from_account_id, to_account_id, amount, comment)
	values ($1, $2, $3, $4, $5)
	returning id;;
	`

	var txID int
	err := tx.QueryRow(ctx, query, createTransfer.UserID, createTransfer.From_acc_ID, createTransfer.To_acc_ID,
		createTransfer.Amount, createTransfer.Comment).Scan(&txID)

	if err != nil {
		return nil, exec_err(err)
	}
	return &txID, nil
}

func (r *Repository) GetTransfers(ctx context.Context, f domain.TransfersFilter) ([]*domain.TransferFull, error) {
	base := `
		SELECT
			t.id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			af.name acc_from_name,
			at.name acc_to_name,
			t.amount,
			to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			t.comment
		FROM transfers t
		left join users u on t.user_id = u.id
		left join account af on t.from_account_id = af.id
		left join account at on t.to_account_id = at.id
	`

	// базовое условие – всегда по user_id
	where := []string{"t.user_id = $1"}
	args := []interface{}{f.UserID}
	argIdx := 2

	// from_account_id = ?
	if f.FromAccountID != nil {
		where = append(where, fmt.Sprintf("t.from_account_id = $%d", argIdx))
		args = append(args, *f.FromAccountID)
		argIdx++
	}

	// to_account_id = ?
	if f.ToAccountID != nil {
		where = append(where, fmt.Sprintf("t.to_account_id = $%d", argIdx))
		args = append(args, *f.ToAccountID)
		argIdx++
	}

	// account_id = ? (либо как источник, либо как приёмник)
	if f.AccountID != nil {
		where = append(where, fmt.Sprintf("(t.from_account_id = $%d OR t.to_account_id = $%d)", argIdx, argIdx))
		args = append(args, *f.AccountID)
		argIdx++
	}

	// created_at >= date_from
	if f.DateFrom != nil {
		where = append(where, fmt.Sprintf("t.created_at >= $%d", argIdx))
		args = append(args, *f.DateFrom)
		argIdx++
	}

	// created_at < date_to
	if f.DateTo != nil {
		where = append(where, fmt.Sprintf("t.created_at < $%d", argIdx))
		args = append(args, *f.DateTo)
		argIdx++
	}

	// amount >= min_amount
	if f.MinAmount != nil {
		where = append(where, fmt.Sprintf("t.amount >= $%d", argIdx))
		args = append(args, *f.MinAmount)
		argIdx++
	}

	// amount <= max_amount
	if f.MaxAmount != nil {
		where = append(where, fmt.Sprintf("t.amount <= $%d", argIdx))
		args = append(args, *f.MaxAmount)
		argIdx++
	}

	// дефолты для пагинации
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 50
	}
	if f.Offset < 0 {
		f.Offset = 0
	}

	query := base + `
		WHERE ` + strings.Join(where, " AND ") + `
		ORDER BY t.created_at DESC
		LIMIT $` + strconv.Itoa(argIdx) + `
		OFFSET $` + strconv.Itoa(argIdx+1)

	args = append(args, f.Limit, f.Offset)

	rows, err := r.postgres.Query(ctx, query, args...)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	defer rows.Close()

	var transfers []*domain.TransferFull

	for rows.Next() {
		tr, err := pgx.RowToStructByName[dbTransferFull](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		transfers = append(transfers, tr.ToEntity())
	}

	return transfers, nil
}

func (r *Repository) GetTranferByID(ctx context.Context, userID, id int) (*domain.Transfer, error) {
	query := `
		select
			t.id,
			t.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			t.from_account_id,
			t.to_account_id,
			af.name acc_from_name,
			at.name acc_to_name,
			t.amount,
			to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			t.comment
		from transfers t
		left join users u on t.user_id = u.id
		left join account af on t.from_account_id = af.id
		left join account at on t.to_account_id = at.id
		where t.id = $1 and t.user_id = $2;
	`

	row := r.postgres.QueryRow(ctx, query, id, userID)

	var dbTransfer dbTransfer
	err := row.Scan(&dbTransfer.ID, &dbTransfer.UserID, &dbTransfer.UserName, &dbTransfer.FromAccountID, &dbTransfer.ToAccountID,
		&dbTransfer.FromAccountName, &dbTransfer.ToAccountName,
		&dbTransfer.Amount, &dbTransfer.CreatedAt, &dbTransfer.Comment)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return dbTransfer.ToEntity(), nil
}
