package repo

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// создание мерчант
func (r *Repository) CreateMerchant(ctx context.Context, merchant *domain.CreateMerchant) error {
	query := `
		insert into merchant (user_id, name, category_id)
		values ($1, $2, $3);
	`

	_, err := r.postgres.Exec(ctx, query, merchant.UserID, merchant.Name, merchant.CategoryID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

// получение мерчант
func (r *Repository) GetMerchants(ctx context.Context, userID int) ([]*domain.Merchant, error) {
	query := `
		select 
			m.id,
			m.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			m.name merchant_name,
			c.name category_name,
			to_char(m.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(m.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			m.category_id,
			m.is_deleted,
			m.deleted_at
		from merchant m
		left join users u on m.user_id = u.id
		left join category c on m.category_id = c.id
		where m.user_id = $1 and m.is_deleted = false
		order by created_at desc;
	`

	rows, err := r.postgres.Query(ctx, query, userID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var merchants []*domain.Merchant

	for rows.Next() {
		merchant, err := pgx.RowToStructByName[dbMerchant](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		merchants = append(merchants, merchant.ToEntity())
	}
	return merchants, nil
}

// получение мерчант по id
func (r *Repository) getMerchantByID(ctx context.Context, runner RowGetter, merchantID, userID int) (*domain.Merchant, error) {
	query := `
		select 
			m.id,
			m.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			m.name merchant_name,
			c.name category_name,
			to_char(m.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(m.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			m.category_id,
			m.is_deleted,
			m.deleted_at
		from merchant m
		left join users u on m.user_id = u.id
		left join category c on m.category_id = c.id
		where m.id = $1 and m.user_id = $2 and m.is_deleted = false;
	`

	row := runner.QueryRow(ctx, query, merchantID, userID)

	var merchant dbMerchant

	err := row.Scan(&merchant.ID, &merchant.UserID, &merchant.UserName, &merchant.Name, &merchant.CategoryName, &merchant.CreatedAt,
		&merchant.UpdatedAt, &merchant.CategoryID, &merchant.IsDeleted, &merchant.DeletedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return merchant.ToEntity(), nil
}

func (r *Repository) GetMerchantByID(ctx context.Context, merchantID, userID int) (*domain.Merchant, error) {
	return r.getMerchantByID(ctx, r.postgres, merchantID, userID)
}

func (r *Repository) GetMerchantByIDTx(ctx context.Context, tx pgx.Tx, merchantID, userID int) (*domain.Merchant, error) {
	return r.getMerchantByID(ctx, tx, merchantID, userID)
}

// редактирование мерчант
func (r *Repository) UpdateMerchant(ctx context.Context, merchant *domain.UpdateMerchant) error {
	query := `
		update merchant set
		name = $1,
		category_id = $2, 
		updated_at = now()
		where id = $3 and user_id = $4;
	`

	_, err := r.postgres.Exec(ctx, query, merchant.Name, merchant.CategoryID, merchant.ID, merchant.UserID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

// удаление мерчант
func (r *Repository) DeleteMerchant(ctx context.Context, merchantID, userID int) error {
	query := `
		update merchant set
		is_deleted = true,
		deleted_at = now()
		where id = $1 and user_id = $2;
	`

	_, err := r.postgres.Exec(ctx, query, merchantID, userID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
