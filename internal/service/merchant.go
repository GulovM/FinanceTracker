package service

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"

)

// создание мерчант
func (s *Service) CreateMerchant(ctx context.Context, merchant *domain.CreateMerchant) error {
	err := s.merchants.CreateMerchant(ctx, merchant)

	if err != nil {
		return fmt.Errorf("s.merchants.CreateMerchant error: %w", err)
	}

	return nil
}

// получение мерчант
func (s *Service) GetMerchants(ctx context.Context, userID int) ([]*domain.Merchant, error) {
	merchants, err := s.merchants.GetMerchants(ctx, userID)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("no rows select")
		}
		return nil, fmt.Errorf("s.merchants.GetMerchants error: %w", err)
	}

	return merchants, nil
}

// редактирование мерчант
func (s *Service) UpdateMerchant(ctx context.Context, merchant *domain.UpdateMerchant) error {
	_, err := s.merchants.GetMerchantByID(ctx, merchant.ID, merchant.UserID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("a merchant with this ID does not exist")
		}
		return fmt.Errorf("s.merchants.GetMerchantByID error: %w", err)
	}

	err = s.merchants.UpdateMerchant(ctx, merchant)
	if err != nil {
		return fmt.Errorf("s.merchants.UpdateMerchant error: %w", err)
	}

	return nil
}

// удаление мерчант
func (s *Service) DeleteMerchant(ctx context.Context, merchantID, userID int) error {
	_, err := s.merchants.GetMerchantByID(ctx, merchantID, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("a merchant with this ID does not exist")
		}
		return fmt.Errorf("s.merchants.GetMerchantByID error: %w", err)
	}

	err = s.merchants.DeleteMerchant(ctx, merchantID, userID)
	if err != nil {
		return fmt.Errorf("s.merchants.DeleteMerchant error: %w", err)
	}

	return nil
}
