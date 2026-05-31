package domain

import (
	"context"
	"encoding/json"
	"time"
)

type UserEventLog struct {
	ID        int             `json:"id"`
	UserID    int             `json:"user_id"`
	EventType string          `json:"event_type"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt time.Time       `json:"created_at"`
	IPAddress *string         `json:"ip_address"`
	UserAgent *string         `json:"user_agent"`
}

type CreateEvent struct {
	UserID    int             `json:"user_id"`
	EventType string          `json:"event_type"`
	Payload   json.RawMessage `json:"payload"`
	IPAddress *string         `json:"ip_address"`
	UserAgent *string         `json:"user_agent"`
}

type EventFilter struct {
	UserID    int        `json:"-"`
	EventType *string    `json:"event_type"`
	DateFrom  *time.Time `json:"date_from"`
	DateTo    *time.Time `json:"date_to"`
	Limit     int        `json:"limit"`
	Offset    int        `json:"offset"`
}

const (
	EventLogin              = "login"
	EventCreateTransaction  = "create_transaction"
	EventDeleteTransaction  = "delete_transaction"
	EventCreateTransfer     = "create_transfer"
	EventCreateBudget       = "create_budget"
	EventUpdateBudget       = "update_budget"
	EventDeleteBudget       = "delete_budget"
	EventCreateGoal         = "create_goal"
	EventUpdateGoalStatus   = "update_goal_status"
	EventCreateContribution = "create_contribution"
)

type EventLogRepository interface {
	CreateEvent(ctx context.Context, event *CreateEvent) error
	GetEvents(ctx context.Context, f *EventFilter) ([]*UserEventLog, error)
}
