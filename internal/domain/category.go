package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Category struct {
	ID        int        `json:"id"`
	UserID    *int       `json:"user_id"`
	UserName  *string    `json:"user_name,omitempty"`
	Name      string     `json:"name"`
	Type      string     `json:"type"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	IsDeleted bool       `json:"is_deleted"`
	DeletedAt *time.Time `json:"deleted_at"`
}

type Subcategory struct {
	ID           int        `json:"id"`
	CategoryID   int        `json:"category_id"`
	CategoryName *string    `json:"category_name,omitempty"`
	Name         string     `json:"subcategory_name"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    *time.Time `json:"updated_at"`
	UserID       *int       `json:"user_id"`
	UserName     *string    `json:"user_name,omitempty"`
	IsDeleted    bool       `json:"is_deleted"`
	DeletedAt    *time.Time `json:"deleted_at"`
}

type CreateMyCategory struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
}

type CreateMySubcategory struct {
	UserID     int    `json:"user_id"`
	CategoryID int    `json:"category_id"`
	Name       string `json:"name"`
}

type UpdateMyCategory struct {
	ID     int    `json:"id"`
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
}

type UpdateMySubcategory struct {
	ID         int    `json:"id"`
	UserID     int    `json:"user_id"`
	CategoryID int    `json:"category_id"`
	Name       string `json:"name"`
}

type CategoryRepository interface {
	GetCategories(ctx context.Context, userID int) ([]*Category, error)
	GetSubcategories(ctx context.Context, id, userID int) ([]*Subcategory, error)
	GetCategoryByID(ctx context.Context, categoryID, userID int) (*Category, error)
	GetCategoryByIDTx(ctx context.Context, tx pgx.Tx, categoryID, userID int) (*Category, error)
	GetSubcategoryByID(ctx context.Context, subcategoryID, userID int) (*Subcategory, error)
	GetSubcategoryByIDTx(ctx context.Context, tx pgx.Tx, subcategoryID, userID int) (*Subcategory, error)
	CreateMyCategory(ctx context.Context, createCategory *CreateMyCategory) error
	CreateMySubcategory(ctx context.Context, createSubcategory *CreateMySubcategory) error
	UpdateMyCategory(ctx context.Context, updateCategory *UpdateMyCategory) error
	UpdateMySubcategory(ctx context.Context, updateSubcategory *UpdateMySubcategory) error
	DeleteMyCategory(ctx context.Context, id, userID int) error
	DeleteMySubcategory(ctx context.Context, id, userID int) error
}
