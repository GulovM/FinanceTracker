package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Transactions struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	UserName        *string    `json:"user_name,omitempty"`
	AccountID       int        `json:"account_id"`
	AccountName     *string    `json:"account_name,omitempty"`
	CategoryID      int        `json:"category_id"`
	CategoryName    *string    `json:"category_name,omitempty"`
	SubcategoryID   *int       `json:"subcategory_id"`
	SubcategoryName *string    `json:"subcategory_name,omitempty"`
	MerchantID      *int       `json:"merchant_id"`
	MerchantName    *string    `json:"merchant_name,omitempty"`
	Tags            []string   `json:"tags"`
	Type            string     `json:"type"`
	Amount          float64    `json:"amount"`
	Recipient       *string    `json:"recipient"`
	Comment         *string    `json:"comment"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
	RecurringID     *int       `json:"recurring_id"`
	TransferID      *int       `json:"transfer_id"`
	IsDeleted       bool       `json:"is_deleted"`
	DeletedAt       *time.Time `json:"deleted_at"`
}

type CreateTransaction struct {
	UserID        int     `json:"user_id"`
	AccountID     int     `json:"account_id"`
	CategoryID    int     `json:"category_id"`
	SubcategoryID *int    `json:"subcategory_id"`
	MerchantID    *int    `json:"merchant_id"`
	Type          string  `json:"type"`
	Amount        float64 `json:"amount"`
	Recipient     *string `json:"recipient"`
	Comment       *string `json:"comment"`
	RecurringID   *int    `json:"recurring_id"`
	TransferID    *int    `json:"transfer_id"`
	TagIDs        []int   `json:"tag_ids"`
}

type UpdateTransaction struct {
	ID            int     `json:"id"`
	UserID        int     `json:"user_id"`
	AccountID     int     `json:"account_id"`
	CategoryID    int     `json:"category_id"`
	SubcategoryID *int    `json:"subcategory_id"`
	MerchantID    *int    `json:"merchant_id"`
	Tags          []int   `json:"tags"`
	Type          string  `json:"type"`
	Amount        float64 `json:"amount"`
	Recipient     *string `json:"recipient"`
	Comment       *string `json:"comment"`
	RecurringID   *int    `json:"recurring_id"`
	TransferID    *int    `json:"transfer_id"`
}

type TransactionsFilter struct {
	UserID     int        `json:"-"`
	AccountID  *int       `json:"account_id,omitempty"`
	CategoryID *int       `json:"category_id,omitempty"`
	MerchantID *int       `json:"merchant_id,omitempty"`
	Type       *string    `json:"type,omitempty"`
	DateFrom   *time.Time `json:"date_from,omitempty"`
	DateTo     *time.Time `json:"date_to,omitempty"`
	MinAmount  *float64   `json:"min_amount,omitempty"`
	MaxAmount  *float64   `json:"max_amount,omitempty"`
	TagIDs     []int      `json:"tag_ids,omitempty"`
	Limit      int        `json:"limit,omitempty"`
	Offset     int        `json:"offset,omitempty"`
}

const (
	TransactionTypeIncome   = "Доход"
	TransactionTypeExpense  = "Расход"
	TransactionTypeTransfer = "Перевод"
)

// TransferCategoryID — идентификатор системной категории «Перевод»,
// в которую попадают транзакции, созданные переводом между счетами.
const TransferCategoryID = 13

type TransactionRepository interface {
	GetTransactions(ctx context.Context, filter *TransactionsFilter) ([]*Transactions, error)
	GetTransactionByID(ctx context.Context, userID, id int) (*Transactions, error)
	GetTransactionByIDTx(ctx context.Context, tx pgx.Tx, userID, id int) (*Transactions, error)
	CreateTransaction(ctx context.Context, createTransaction *CreateTransaction) (int, error)
	CreateTransactionTx(ctx context.Context, tx pgx.Tx, createTransaction *CreateTransaction) (int, error)
	UpdateTransaction(ctx context.Context, updateTransaction *UpdateTransaction) error
	UpdateTransactionTx(ctx context.Context, tx pgx.Tx, updateTransaction *UpdateTransaction) error
	DeleteTransaction(ctx context.Context, id, userID int) error
	DeleteTransactionTx(ctx context.Context, tx pgx.Tx, id, userID int) error
}
