package domain

import (
	"context"
	"time"
)

type SavingGoal struct {
	ID            int        `json:"id"`
	UserID        int        `json:"user_id"`
	Name          string     `json:"name"`
	TargetAmount  float64    `json:"target_amount"`
	CurrentAmount float64    `json:"current_amount"`
	TargetDate    *time.Time `json:"target_date"`
	Status        string     `json:"status"`
	Priority      *int       `json:"priority"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

type GoalContribution struct {
	ID            int       `json:"id"`
	GoalID        int       `json:"goal_id"`
	TransactionID *int      `json:"transaction_id"`
	Amount        float64   `json:"amount"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateGoal struct {
	UserID       int        `json:"user_id"`
	Name         string     `json:"name"`
	TargetAmount float64    `json:"target_amount"`
	TargetDate   *time.Time `json:"target_date"`
	Priority     *int       `json:"priority"`
}

type UpdateGoal struct {
	ID           int        `json:"id"`
	UserID       int        `json:"user_id"`
	Name         string     `json:"name"`
	TargetAmount float64    `json:"target_amount"`
	TargetDate   *time.Time `json:"target_date"`
	Priority     *int       `json:"priority"`
}

type CreateContribution struct {
	GoalID        int     `json:"goal_id"`
	TransactionID *int    `json:"transaction_id"`
	Amount        float64 `json:"amount"`
}

const (
	GoalStatusActive    = "Активный"
	GoalStatusAchieved  = "Достигнут"
	GoalStatusCancelled = "Отменен"
)

type GoalRepository interface {
	CreateGoal(ctx context.Context, goal *CreateGoal) (int, error)
	GetGoals(ctx context.Context, userID int) ([]*SavingGoal, error)
	GetGoalByID(ctx context.Context, userID, id int) (*SavingGoal, error)
	UpdateGoal(ctx context.Context, goal *UpdateGoal) error
	UpdateGoalStatus(ctx context.Context, userID, id int, status string) error
	GetContributions(ctx context.Context, goalID int) ([]*GoalContribution, error)
	AddContribution(ctx context.Context, contribution *CreateContribution) (int, error)
	DeleteContribution(ctx context.Context, id int) error
}
