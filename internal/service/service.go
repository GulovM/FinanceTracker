package service

import (
	"Project/internal/auth"
	"Project/internal/domain"
	"context"

	"github.com/jackc/pgx/v5"
)

type txBeginner interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
}

type Service struct {
	users        domain.UserRepository
	accounts     domain.AccountRepository
	cards        domain.CardTypeRepository
	categories   domain.CategoryRepository
	merchants    domain.MerchantRepository
	tags         domain.TagRepository
	transactions domain.TransactionRepository
	transfers    domain.TransferRepository
	recTx        domain.RecurringRepository
	budgets      domain.BudgetRepository
	goals        domain.GoalRepository
	eventLogger  domain.EventLogRepository
	tx           txBeginner
	hasher       auth.PasswordHasher
}

type Deps struct {
	Users        domain.UserRepository
	Accounts     domain.AccountRepository
	Cards        domain.CardTypeRepository
	Categories   domain.CategoryRepository
	Merchants    domain.MerchantRepository
	Tags         domain.TagRepository
	Transactions domain.TransactionRepository
	Transfers    domain.TransferRepository
	RecTx        domain.RecurringRepository
	Budgets      domain.BudgetRepository
	Goals        domain.GoalRepository
	EventLogger  domain.EventLogRepository
	Tx           txBeginner
	Hasher       auth.PasswordHasher
}

func NewService(deps Deps) *Service {
	return &Service{
		users:        deps.Users,
		accounts:     deps.Accounts,
		cards:        deps.Cards,
		categories:   deps.Categories,
		merchants:    deps.Merchants,
		tags:         deps.Tags,
		transactions: deps.Transactions,
		transfers:    deps.Transfers,
		recTx:        deps.RecTx,
		budgets:      deps.Budgets,
		goals:        deps.Goals,
		eventLogger:  deps.EventLogger,
		tx:           deps.Tx,
		hasher:       deps.Hasher,
	}
}
