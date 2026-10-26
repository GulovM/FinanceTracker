package domain

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type RecTransaction struct {
	ID         int        `json:"id"`
	UserName   string     `json:"user_name,omitempty"`
	PeriodType string     `json:"period_type"`
	Interval   int        `json:"interval"`
	DayOfMonth *int8      `json:"day_of_month"`
	DayOfWeek  *int8      `json:"day_of_week"`
	StartDate  time.Time  `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
	NextRunAt  time.Time  `json:"next_run_at"`
	Status     string     `json:"status"`
}

type RecTransactionFull struct {
	ID              int        `json:"id"`
	UserID          int        `json:"user_id"`
	UserName        *string    `json:"user_name,omitempty"`
	AccountID       int        `json:"account_id"`
	AccountName     *string    `json:"account_name,omitempty"`
	CategoryID      int        `json:"category_id"`
	CategoryName    *string    `json:"categoty_name,omitempty"`
	SubcategoryID   *int       `json:"subcategory_id"`
	SubcategoryName *string    `json:"subcategory_name,omitempty"`
	MerchantID      *int       `json:"merchant_id"`
	MerchantName    *string    `json:"merchant_name,omitempty"`
	TagIDs          []int      `json:"tag_ids"`
	Tags            []string   `json:"tags"`
	Type            string     `json:"rec_transac_type"`
	Amount          float64    `json:"amount"`
	Recipient       *string    `json:"recipient"`
	Comment         *string    `json:"comment"`
	PeriodType      string     `json:"period_type"`
	Interval        int        `json:"interval"`
	DayOfMonth      *int8      `json:"day_of_month"`
	DayOfWeek       *int8      `json:"day_of_week"`
	StartDate       time.Time  `json:"start_date"`
	EndDate         *time.Time `json:"end_date"`
	NextRunAt       time.Time  `json:"next_run_at"`
	Timezone        string     `json:"timezone"`
	Status          string     `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       *time.Time `json:"updated_at"`
}

type CreateRecTransaction struct {
	UserID        int        `json:"user_id"`
	AccountID     int        `json:"account_id"`
	CategoryID    int        `json:"category_id"`
	SubcategoryID *int       `json:"subcategory_id"`
	MerchantID    *int       `json:"merchant_id"`
	Type          string     `json:"type"`
	Amount        float64    `json:"amount"`
	Recipient     *string    `json:"recipient"`
	Comment       *string    `json:"comment"`
	PeriodType    string     `json:"period_type"`
	Interval      int        `json:"interval"`
	DayOfMonth    *int       `json:"day_of_month"`
	DayOfWeek     *int       `json:"day_of_week"`
	StartDate     time.Time  `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	NextRunAt     time.Time  `json:"next_run_at"`
	Timezone      string     `json:"timezone"`
	TagIDs        []int      `json:"tag_ids"`
}

type UpdateRecTransaction struct {
	ID            int        `json:"id"`
	UserID        int        `json:"user_id"`
	AccountID     int        `json:"account_id"`
	CategoryID    int        `json:"category_id"`
	SubcategoryID *int       `json:"subcategory_id"`
	MerchantID    *int       `json:"merchant_id"`
	Type          string     `json:"type"`
	Amount        float64    `json:"amount"`
	Recipient     *string    `json:"recipient"`
	Comment       *string    `json:"comment"`
	PeriodType    string     `json:"period_type"`
	Interval      int        `json:"interval"`
	DayOfMonth    *int       `json:"day_of_month"`
	DayOfWeek     *int       `json:"day_of_week"`
	StartDate     time.Time  `json:"start_date"`
	EndDate       *time.Time `json:"end_date"`
	NextRunAt     time.Time  `json:"next_run_at"`
	TagIDs        []int      `json:"tag_ids"`
}

const (
	CategoryTypeIncome   = "Доход"
	CategoryTypeExpense  = "Расход"
	CategoryTypeTransfer = "Перевод"
	PeriodTypeEveryDay   = "Ежедневно"
	PeriodTypeEveryWeek  = "Еженедельно"
	PeriodTypeEveryMonth = "Ежемесячно"
	PeriodTypeEveryYear  = "Ежегодно"
	StatusTypeActive     = "Активен"
	StatusTypeStop       = "Остановлен"
	StatusTypeCancel     = "Отменен"
)

type RecurringRepository interface {
	GetRecTransactions(ctx context.Context, userID int) ([]*RecTransaction, error)
	GetRecTransactionByID(ctx context.Context, userID, id int) (*RecTransactionFull, error)
	GetRecTransactionsList(ctx context.Context, userID int) ([]*RecTransactionFull, error)
	GetDueRecurring(ctx context.Context) ([]*RecTransactionFull, error)
	// LockDueRecurringTx блокирует расписание и сообщает, что оно всё ещё активно и подошёл срок.
	LockDueRecurringTx(ctx context.Context, tx pgx.Tx, id int) (bool, error)
	CreateRecTransaction(ctx context.Context, tx pgx.Tx, recTransaction *CreateRecTransaction) (int, error)
	UpdateRecTransaction(ctx context.Context, recTransaction *UpdateRecTransaction) error
	UpdateRecurringStatus(ctx context.Context, userID, id int, status string) error
	UpdateRecurringStatusTx(ctx context.Context, tx pgx.Tx, userID, id int, status string) error
	UpdateRecurringNextRun(ctx context.Context, tx pgx.Tx, id int, next time.Time) error
}
