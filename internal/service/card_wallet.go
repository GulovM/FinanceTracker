package service

import (
	"Project/internal/domain"
	"context"
	"fmt"
)

func (s *Service) GetCardTypes(ctx context.Context) ([]*domain.CardTypes, error) {
	result, err := s.cards.GetCardTypes(ctx)
	if err != nil {
		return nil, fmt.Errorf("s.cards.GetCardTypes error: %w", err)
	}
	return result, nil
}

func (s *Service) GetWalletTypes(ctx context.Context) ([]*domain.WalletTypes, error) {
	result, err := s.cards.GetWalletTypes(ctx)
	if err != nil {
		return nil, fmt.Errorf("s.cards.GetWalletTypes error: %w", err)
	}
	return result, nil
}
