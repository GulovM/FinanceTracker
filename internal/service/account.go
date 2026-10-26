package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
)

// создание кошелька
func (s *Service) CreateAccount(ctx context.Context, account *domain.CreateAccount) error {
	err := s.accounts.CreateAccount(ctx, account)
	if err != nil {
		return fmt.Errorf("s.accounts.CreateAccount error: %w", err)
	}
	return nil
}

// редактирование кошелька
func (s *Service) UpdateAccount(ctx context.Context, updateAccount *domain.UpdateAccount) error {
	_, err := s.accounts.GetAccountByID(ctx, updateAccount.UserID, updateAccount.ID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.accounts.GetAccountByID error: %w", err)
	}

	err = s.accounts.UpdateAccount(ctx, updateAccount)
	if err != nil {
		return fmt.Errorf("s.accounts.UpdateAccount error: %w", err)
	}
	return nil
}

// пополнение кошелька
func (s *Service) TopupAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error {
	_, err := s.accounts.GetAccountByID(ctx, updateAccount.UserID, updateAccount.ID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.accounts.GetAccountByID error: %w", err)
	}

	err = s.accounts.TopupAccount(ctx, updateAccount)
	if err != nil {
		return fmt.Errorf("s.accounts.TopupAccount error: %w", err)
	}
	return nil
}

// withdrow
func (s *Service) WithdrowAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error {
	acc, err := s.accounts.GetAccountByID(ctx, updateAccount.UserID, updateAccount.ID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.accounts.GetAccountByID error: %w", err)
	}

	if acc.Balance < updateAccount.Balance {
		return errs.ErrInsufficientFunds
	}
	err = s.accounts.WithdrowAccount(ctx, updateAccount)
	if err != nil {
		return fmt.Errorf("s.accounts.WithdrowAccount error: %w", err)
	}
	return nil
}

// получение всех кошельков
func (s *Service) GetAccounts(ctx context.Context, userID int) ([]*domain.Account, error) {
	accountsDB, err := s.accounts.GetAccounts(ctx, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("accounts not found")
		}
		return nil, fmt.Errorf("s.accounts.GetAccounts error: %w", err)
	}
	return accountsDB, nil
}

// получение кошелька по id
func (s *Service) GetAccountByID(ctx context.Context, userID, id int) (*domain.Account, error) {
	accountDB, err := s.accounts.GetAccountByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("account %w", errs.ErrNotFound)
		}
		return nil, fmt.Errorf("s.accounts.GetAccountByID: %w", err)
	}
	return accountDB, nil
}

// soft удаление кошелька
func (s *Service) DeleteAccount(ctx context.Context, userID, id int) error {
	_, err := s.accounts.GetAccountByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.accounts.GetAccountByID error: %w", err)
	}

	err = s.accounts.DeleteAccount(ctx, userID, id)
	if err != nil {
		return fmt.Errorf("s.accounts.DeleteAccount: %w", err)
	}
	return nil
}
