package domain

import (
	"context"
	"time"
)

type Budget struct {
	ID          int        `json:"id"`
	UserID      int        `json:"user_id"`
	Name        string     `json:"name"`
	PeriodType  string     `json:"period_type"`
	PeriodStart time.Time  `json:"period_start"`
	PeriodEnd   time.Time  `json:"period_end"`
	AmountLimit float64    `json:"amount_limit"`
	CategoryIDs []int      `json:"category_ids"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
	IsDeleted   bool       `json:"is_deleted"`
	DeletedAt   *time.Time `json:"deleted_at"`
}

type CreateBudget struct {
	UserID      int       `json:"user_id"`
	Name        string    `json:"name"`
	PeriodType  string    `json:"period_type"`
	PeriodStart time.Time `json:"period_start"`
	PeriodEnd   time.Time `json:"period_end"`
	AmountLimit float64   `json:"amount_limit"`
}

type UpdateBudget struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Name        string    `json:"name"`
	PeriodType  string    `json:"period_type"`
	PeriodStart time.Time `json:"period_start"`
	PeriodEnd   time.Time `json:"period_end"`
	AmountLimit float64   `json:"amount_limit"`
}

type BudgetSummary struct {
	AmountLimit float64 `json:"amount_limit"`
	TotalSpent  float64 `json:"total_spent"`
	Remaining   float64 `json:"remaining"`
	Percent     float64 `json:"percent"`
}

const (
	BudgetPeriodWeekly  = "Еженедельный"
	BudgetPeriodMonthly = "Ежемесячный"
	BudgetPeriodCustom  = "Кастомный"
)

type BudgetRepository interface {
	CreateBudget(ctx context.Context, budget *CreateBudget) (int, error)
	GetBudgets(ctx context.Context, userID int) ([]*Budget, error)
	GetBudgetByID(ctx context.Context, userID, id int) (*Budget, error)
	UpdateBudget(ctx context.Context, budget *UpdateBudget) error
	DeleteBudget(ctx context.Context, userID, id int) error
	AddBudgetCategories(ctx context.Context, budgetID int, categoryIDs []int) error
	RemoveBudgetCategory(ctx context.Context, budgetID, categoryID int) error
	GetBudgetSummary(ctx context.Context, userID, id int) (*BudgetSummary, error)
}
