package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Transfer struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	UserName        string     `json:"user_name"`
	FromAccountID   int        `json:"from_account_id"`
	ToAccountID     int        `json:"to_account_id"`
	FromAccountName string     `json:"acc_from_name"`
	ToAccountName   string     `json:"acc_to_name"`
	Amount          float64    `json:"amount"`
	CreatedAt       time.Time  `json:"created_at"`
	Comment         *string    `json:"comment"`
}

type TransferFull struct {
	ID              int        `json:"id"`
	UserName        string     `json:"user_name"`
	FromAccountName string     `json:"acc_from_name"`
	ToAccountName   string     `json:"acc_to_name"`
	Amount          float64    `json:"amount"`
	CreatedAt       time.Time  `json:"created_at"`
	Comment         *string    `json:"comment"`
}

type CreateTransfer struct {
	UserID      int     `json:"user_id"`
	From_acc_ID int     `json:"from_account_id"`
	To_acc_ID   int     `json:"to_account_id"`
	Amount      float64 `json:"amount"`
	Comment     *string `json:"comment"`
}

type TransfersFilter struct {
	UserID        int        `json:"-"`
	AccountID     *int       `json:"account_id,omitempty"`
	FromAccountID *int       `json:"from_account_id,omitempty"`
	ToAccountID   *int       `json:"to_account_id,omitempty"`
	DateFrom      *time.Time `json:"date_from,omitempty"`
	DateTo        *time.Time `json:"date_to,omitempty"`
	MinAmount     *float64   `json:"min_amount,omitempty"`
	MaxAmount     *float64   `json:"max_amount,omitempty"`
	Limit         int        `json:"limit,omitempty"`
	Offset        int        `json:"offset,omitempty"`
}

type TransferRepository interface {
	CreateTransferTx(ctx context.Context, tx pgx.Tx, createTransfer *CreateTransfer) (*int, error)
	GetTransfers(ctx context.Context, f TransfersFilter) ([]*TransferFull, error)
	GetTranferByID(ctx context.Context, userID, id int) (*Transfer, error)
}
