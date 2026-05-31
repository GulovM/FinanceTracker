package service

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"
)

func (s *Service) CreateBudget(ctx context.Context, budget *domain.CreateBudget) error {
	if budget.AmountLimit <= 0 {
		return fmt.Errorf("amount limit must be greater than zero")
	}
	if budget.PeriodEnd.Before(budget.PeriodStart) {
		return fmt.Errorf("period_end must be after period_start")
	}

	_, err := s.budgets.CreateBudget(ctx, budget)
	if err != nil {
		return fmt.Errorf("s.budgets.CreateBudget error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    budget.UserID,
		EventType: domain.EventCreateBudget,
	})

	return nil
}

func (s *Service) GetBudgets(ctx context.Context, userID int) ([]*domain.Budget, error) {
	budgets, err := s.budgets.GetBudgets(ctx, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return []*domain.Budget{}, nil
		}
		return nil, fmt.Errorf("s.budgets.GetBudgets error: %w", err)
	}
	return budgets, nil
}

func (s *Service) GetBudgetByID(ctx context.Context, userID, id int) (*domain.Budget, error) {
	budget, err := s.budgets.GetBudgetByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("s.budgets.GetBudgetByID error: %w", err)
	}
	return budget, nil
}

func (s *Service) UpdateBudget(ctx context.Context, budget *domain.UpdateBudget) error {
	if _, err := s.budgets.GetBudgetByID(ctx, budget.UserID, budget.ID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.budgets.GetBudgetByID error: %w", err)
	}

	if budget.AmountLimit <= 0 {
		return fmt.Errorf("amount limit must be greater than zero")
	}
	if budget.PeriodEnd.Before(budget.PeriodStart) {
		return fmt.Errorf("period_end must be after period_start")
	}

	if err := s.budgets.UpdateBudget(ctx, budget); err != nil {
		return fmt.Errorf("s.budgets.UpdateBudget error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    budget.UserID,
		EventType: domain.EventUpdateBudget,
	})

	return nil
}

func (s *Service) DeleteBudget(ctx context.Context, userID, id int) error {
	if _, err := s.budgets.GetBudgetByID(ctx, userID, id); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.budgets.GetBudgetByID error: %w", err)
	}

	if err := s.budgets.DeleteBudget(ctx, userID, id); err != nil {
		return fmt.Errorf("s.budgets.DeleteBudget error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    userID,
		EventType: domain.EventDeleteBudget,
	})

	return nil
}

func (s *Service) AddBudgetCategories(ctx context.Context, userID, budgetID int, categoryIDs []int) error {
	if _, err := s.budgets.GetBudgetByID(ctx, userID, budgetID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.budgets.GetBudgetByID error: %w", err)
	}

	if err := s.budgets.AddBudgetCategories(ctx, budgetID, categoryIDs); err != nil {
		return fmt.Errorf("s.budgets.AddBudgetCategories error: %w", err)
	}
	return nil
}

func (s *Service) RemoveBudgetCategory(ctx context.Context, userID, budgetID, categoryID int) error {
	if _, err := s.budgets.GetBudgetByID(ctx, userID, budgetID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.budgets.GetBudgetByID error: %w", err)
	}

	if err := s.budgets.RemoveBudgetCategory(ctx, budgetID, categoryID); err != nil {
		return fmt.Errorf("s.budgets.RemoveBudgetCategory error: %w", err)
	}
	return nil
}

func (s *Service) GetBudgetSummary(ctx context.Context, userID, id int) (*domain.BudgetSummary, error) {
	summary, err := s.budgets.GetBudgetSummary(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("s.budgets.GetBudgetSummary error: %w", err)
	}
	return summary, nil
}
