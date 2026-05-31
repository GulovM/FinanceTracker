package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Account struct {
	ID             int        `json:"id"`
	UserName       string     `json:"user_name"`
	Name           string     `json:"name"`
	AccountType    string     `json:"account_type"`
	Balance        float64    `json:"balance"`
	WalletTypeName *string    `json:"wallet_type_name"`
	CardTypeName   *string    `json:"card_type_name"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
}

type CreateAccount struct {
	UserID       int     `json:"user_id"`
	Name         string  `json:"name"`
	AccountType  string  `json:"account_type"`
	Balance      float64 `json:"balance"`
	WalletTypeID *int8   `json:"wallet_type_id"`
	CardTypeID   *int8   `json:"card_type_id"`
}

type UpdateAccount struct {
	ID           int     `json:"id"`
	UserID       int     `json:"user_id"`
	Name         string  `json:"name"`
	AccountType  string  `json:"account_type"`
	Balance      float64 `json:"balance"`
	WalletTypeID *int8   `json:"wallet_type_id"`
	CardTypeID   *int8   `json:"card_type_id"`
}

type ChangeBalanceAccount struct {
	ID      int     `json:"id"`
	UserID  int     `json:"user_id"`
	Balance float64 `json:"balance"`
}

type AccountRepository interface {
	CreateAccount(ctx context.Context, account *CreateAccount) error
	UpdateAccount(ctx context.Context, updateAccount *UpdateAccount) error
	TopupAccount(ctx context.Context, updateAccount *ChangeBalanceAccount) error
	TopupAccountTx(ctx context.Context, tx pgx.Tx, updateAccount *ChangeBalanceAccount) error
	WithdrowAccount(ctx context.Context, updateAccount *ChangeBalanceAccount) error
	WithdrowAccountTx(ctx context.Context, tx pgx.Tx, updateAccount *ChangeBalanceAccount) error
	GetAccounts(ctx context.Context, userID int) ([]*Account, error)
	GetAccountByID(ctx context.Context, userID, id int) (*Account, error)
	GetAccountByIDTx(ctx context.Context, tx pgx.Tx, userID, id int) (*Account, error)
	DeleteAccount(ctx context.Context, userID, id int) error
}
