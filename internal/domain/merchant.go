package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Merchant struct {
	ID           int        `json:"id"`
	UserID       int        `json:"user_id"`
	UserName     *string    `json:"user_name,omitempty"`
	Name         string     `json:"merchant_name"`
	CategoryID   int        `json:"category_id"`
	CategoryName *string    `json:"category_name,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    *time.Time `json:"updated_at"`
	IsDeleted    bool       `json:"is_deleted"`
	DeletedAt    *time.Time `json:"deleted_at"`
}

type CreateMerchant struct {
	UserID     int    `json:"user_id"`
	Name       string `json:"name"`
	CategoryID int    `json:"category_id"`
}

type UpdateMerchant struct {
	ID         int    `json:"id"`
	UserID     int    `json:"user_id"`
	Name       string `json:"name"`
	CategoryID int    `json:"category_id"`
}

type MerchantRepository interface {
	CreateMerchant(ctx context.Context, merchant *CreateMerchant) error
	GetMerchants(ctx context.Context, userID int) ([]*Merchant, error)
	GetMerchantByID(ctx context.Context, merchantID, userID int) (*Merchant, error)
	GetMerchantByIDTx(ctx context.Context, tx pgx.Tx, merchantID, userID int) (*Merchant, error)
	UpdateMerchant(ctx context.Context, merchant *UpdateMerchant) error
	DeleteMerchant(ctx context.Context, merchantID, userID int) error
}
