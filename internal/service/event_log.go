package service

import (
	"Project/internal/domain"
	"context"
	"fmt"
)

func (s *Service) LogEvent(ctx context.Context, event *domain.CreateEvent) {
	_ = s.eventLogger.CreateEvent(ctx, event)
}

func (s *Service) GetEvents(ctx context.Context, filter *domain.EventFilter) ([]*domain.UserEventLog, error) {
	if filter == nil {
		filter = &domain.EventFilter{}
	}
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 50
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	events, err := s.eventLogger.GetEvents(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("s.eventLogger.GetEvents error: %w", err)
	}
	return events, nil
}
