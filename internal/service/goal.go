package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
)

func (s *Service) CreateGoal(ctx context.Context, goal *domain.CreateGoal) error {
	if goal.TargetAmount <= 0 {
		return fmt.Errorf("%w: target amount must be greater than zero", errs.ErrInvalidInput)
	}

	_, err := s.goals.CreateGoal(ctx, goal)
	if err != nil {
		return fmt.Errorf("s.goals.CreateGoal error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    goal.UserID,
		EventType: domain.EventCreateGoal,
	})

	return nil
}

func (s *Service) GetGoals(ctx context.Context, userID int) ([]*domain.SavingGoal, error) {
	goals, err := s.goals.GetGoals(ctx, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return []*domain.SavingGoal{}, nil
		}
		return nil, fmt.Errorf("s.goals.GetGoals error: %w", err)
	}
	return goals, nil
}

func (s *Service) GetGoalByID(ctx context.Context, userID, id int) (*domain.SavingGoal, error) {
	goal, err := s.goals.GetGoalByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("s.goals.GetGoalByID error: %w", err)
	}
	return goal, nil
}

func (s *Service) UpdateGoal(ctx context.Context, goal *domain.UpdateGoal) error {
	if _, err := s.goals.GetGoalByID(ctx, goal.UserID, goal.ID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.goals.GetGoalByID error: %w", err)
	}

	if goal.TargetAmount <= 0 {
		return fmt.Errorf("%w: target amount must be greater than zero", errs.ErrInvalidInput)
	}

	if err := s.goals.UpdateGoal(ctx, goal); err != nil {
		return fmt.Errorf("s.goals.UpdateGoal error: %w", err)
	}
	return nil
}

func (s *Service) UpdateGoalStatus(ctx context.Context, userID, id int, status string) error {
	if _, err := s.goals.GetGoalByID(ctx, userID, id); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.goals.GetGoalByID error: %w", err)
	}

	switch status {
	case domain.GoalStatusActive, domain.GoalStatusAchieved, domain.GoalStatusCancelled:
	default:
		return fmt.Errorf("%w: invalid status %q", errs.ErrInvalidInput, status)
	}

	if err := s.goals.UpdateGoalStatus(ctx, userID, id, status); err != nil {
		return fmt.Errorf("s.goals.UpdateGoalStatus error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    userID,
		EventType: domain.EventUpdateGoalStatus,
	})

	return nil
}

func (s *Service) GetContributions(ctx context.Context, userID, goalID int) ([]*domain.GoalContribution, error) {
	if _, err := s.goals.GetGoalByID(ctx, userID, goalID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("s.goals.GetGoalByID error: %w", err)
	}

	contributions, err := s.goals.GetContributions(ctx, goalID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return []*domain.GoalContribution{}, nil
		}
		return nil, fmt.Errorf("s.goals.GetContributions error: %w", err)
	}
	return contributions, nil
}

func (s *Service) AddContribution(ctx context.Context, userID int, contribution *domain.CreateContribution) error {
	if contribution.Amount <= 0 {
		return fmt.Errorf("%w: amount must be greater than zero", errs.ErrInvalidInput)
	}

	if _, err := s.goals.GetGoalByID(ctx, userID, contribution.GoalID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrNotFound
		}
		return fmt.Errorf("s.goals.GetGoalByID error: %w", err)
	}

	_, err := s.goals.AddContribution(ctx, contribution)
	if err != nil {
		return fmt.Errorf("s.goals.AddContribution error: %w", err)
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    userID,
		EventType: domain.EventCreateContribution,
	})

	return nil
}

func (s *Service) DeleteContribution(ctx context.Context, id int) error {
	if err := s.goals.DeleteContribution(ctx, id); err != nil {
		return fmt.Errorf("s.goals.DeleteContribution error: %w", err)
	}
	return nil
}
