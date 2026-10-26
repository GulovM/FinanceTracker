package repo

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateAccount(ctx context.Context, account *domain.CreateAccount) error {
	query := `
        insert into account (user_id, name, account_type, balance, wallet_type_id, card_type_id)
        values ($1, $2, $3, $4, $5, $6);
    `

	_, err := r.postgres.Exec(ctx, query, account.UserID, account.Name, account.AccountType,
		account.Balance, account.WalletTypeID, account.CardTypeID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) UpdateAccount(ctx context.Context, updateAccount *domain.UpdateAccount) error {
	query := `
        update account set
        name = $1,
        account_type = $2,
        balance = $3,
        wallet_type_id = $4,
        card_type_id = $5,
        updated_at = now()
        where user_id = $6 and id = $7 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, updateAccount.Name, updateAccount.AccountType, updateAccount.Balance,
		updateAccount.WalletTypeID, updateAccount.CardTypeID, updateAccount.UserID, updateAccount.ID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) TopupAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error {
	query := `
        update account set
        balance = balance + $1,
        updated_at = now()
        where user_id = $2 and id = $3 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, updateAccount.Balance, updateAccount.UserID, updateAccount.ID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) TopupAccountTx(ctx context.Context, tx pgx.Tx, updateAccount *domain.ChangeBalanceAccount) error {
	query := `
        update account set
        balance = balance + $1,
        updated_at = now()
        where user_id = $2 and id = $3 and is_deleted = false;
    `

	tag, err := tx.Exec(ctx, query, updateAccount.Balance, updateAccount.UserID, updateAccount.ID)

	if err != nil {
		return exec_err(err)
	}
	if tag.RowsAffected() == 0 {
		return errs.ErrNotFound
	}

	return nil
}

func (r *Repository) WithdrowAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error {
	query := `
        update account set
        balance = balance - $1,
        updated_at = now()
        where user_id = $2 and id = $3 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, updateAccount.Balance, updateAccount.UserID, updateAccount.ID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) WithdrowAccountTx(ctx context.Context, tx pgx.Tx, updateAccount *domain.ChangeBalanceAccount) error {
	query := `
        update account set
        balance = balance - $1,
        updated_at = now()
        where user_id = $2 and id = $3 and is_deleted = false;
    `

	tag, err := tx.Exec(ctx, query, updateAccount.Balance, updateAccount.UserID, updateAccount.ID)

	if err != nil {
		return exec_err(err)
	}
	if tag.RowsAffected() == 0 {
		return errs.ErrNotFound
	}

	return nil
}

func (r *Repository) GetAccounts(ctx context.Context, userID int) ([]*domain.Account, error) {
	query := `
		select 
			a.id,
			concat(concat(second_name, ' '), first_name) user_name,
			a.name,
			a.account_type,
			a.balance,
			wt."name" wallet_type_name,
			ct."name" card_type_name,
			to_char(a.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(a.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
		from account a
		left join users u on a.user_id = u.id
		left join wallet_type wt on a.wallet_type_id = wt.id 
		left join card_type ct on a.card_type_id = ct.id
		where a.user_id = $1 and a.is_deleted = false
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

	var Accounts []*domain.Account

	for rows.Next() {
		account, err := pgx.RowToStructByName[dbAccount](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		Accounts = append(Accounts, account.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}

	return Accounts, nil
}

func (r *Repository) fetchAccount(ctx context.Context, runner RowGetter, userID, id int, forUpdate bool) (*domain.Account, error) {
	query := `
    	select 
			a.id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			a.name,
			a.account_type,
			a.balance,
			wt."name",
			ct."name",
			to_char(a.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(a.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at
		from account a
		left join users u on a.user_id = u.id
		left join wallet_type wt on a.wallet_type_id = wt.id 
		left join card_type ct on a.card_type_id = ct.id
		where a.id = $1 and a.user_id = $2 and a.is_deleted = false
    `
	if forUpdate {
		// блокируем строку счёта до конца транзакции, чтобы проверка баланса не гонялась с другими списаниями
		query += " for update of a"
	}

	row := runner.QueryRow(ctx, query, id, userID)

	var accountDB dbAccount

	err := row.Scan(&accountDB.ID, &accountDB.UserName, &accountDB.Name, &accountDB.AccountType, &accountDB.Balance, &accountDB.WalletTypeName, &accountDB.CardTypeName,
		&accountDB.CreatedAt, &accountDB.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return accountDB.ToEntity(), nil
}

func (r *Repository) GetAccountByID(ctx context.Context, userID, id int) (*domain.Account, error) {
	return r.fetchAccount(ctx, r.postgres, userID, id, false)
}

func (r *Repository) GetAccountByIDTx(ctx context.Context, tx pgx.Tx, userID, id int) (*domain.Account, error) {
	return r.fetchAccount(ctx, tx, userID, id, true)
}

func (r *Repository) DeleteAccount(ctx context.Context, userID, id int) error {
	query := `
        update account set
        is_deleted = true,
        deleted_at = now()
        where user_id = $1 and id = $2 and is_deleted=false;
    `

	_, err := r.postgres.Exec(ctx, query, userID, id)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
