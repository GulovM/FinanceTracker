package service

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"

)

func (s *Service) CreateTransfer(ctx context.Context, createTransfer *domain.CreateTransfer) error {
	tx, err := s.tx.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		} else {
			_ = tx.Commit(ctx)
		}
	}()

	acc, err := s.accounts.GetAccountByIDTx(ctx, tx, createTransfer.UserID, createTransfer.From_acc_ID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account from not found")
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	if acc.Balance < createTransfer.Amount {
		return fmt.Errorf("negative balance will be")
	}

	_, err = s.accounts.GetAccountByIDTx(ctx, tx, createTransfer.UserID, createTransfer.To_acc_ID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account to not found")
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	wthdrAcc := domain.ChangeBalanceAccount{
		ID:      createTransfer.From_acc_ID,
		UserID:  createTransfer.UserID,
		Balance: createTransfer.Amount,
	}
	err = s.accounts.WithdrowAccountTx(ctx, tx, &wthdrAcc)
	if err != nil {
		return fmt.Errorf("s.accounts.WithdrowAccountTx error: %w", err)
	}

	topupAcc := domain.ChangeBalanceAccount{
		ID:      createTransfer.To_acc_ID,
		UserID:  createTransfer.UserID,
		Balance: createTransfer.Amount,
	}
	err = s.accounts.TopupAccountTx(ctx, tx, &topupAcc)
	if err != nil {
		return fmt.Errorf("s.accounts.TopupAccountTx error: %w", err)
	}

	id, err := s.transfers.CreateTransferTx(ctx, tx, createTransfer)

	if err != nil {
		return fmt.Errorf("s.transfers.CreateTransfer error: %w", err)
	}

	createTransactionW := domain.CreateTransaction{
		UserID:     createTransfer.UserID,
		AccountID:  createTransfer.From_acc_ID,
		CategoryID: 13,
		Type:       "Перевод",
		Amount:     createTransfer.Amount,
		TransferID: id,
	}
	err = s.transactions.CreateTransactionTx(ctx, tx, &createTransactionW)
	if err != nil {
		return fmt.Errorf("s.transactions.CreateTransaction error: %w", err)
	}

	createTransactionT := domain.CreateTransaction{
		UserID:     createTransfer.UserID,
		AccountID:  createTransfer.To_acc_ID,
		CategoryID: 13,
		Type:       "Перевод",
		Amount:     createTransfer.Amount,
		TransferID: id,
	}
	err = s.transactions.CreateTransactionTx(ctx, tx, &createTransactionT)
	if err != nil {
		return fmt.Errorf("s.transactions.CreateTransaction error: %w", err)
	}

	return nil
}

func (s *Service) GetTransfers(ctx context.Context, filter domain.TransfersFilter) ([]*domain.TransferFull, error) {

	transfers, err := s.transfers.GetTransfers(ctx, filter)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("no rows selected")
		}
		return nil, fmt.Errorf("s.transfers.GetTransfers error: %w", err)
	}

	return transfers, err
}

func (s *Service) GetTranferByID(ctx context.Context, userID, id int) (*domain.Transfer, error) {

	transfer, err := s.transfers.GetTranferByID(ctx, userID, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("no transfer with this id founded")
		}
		return nil, fmt.Errorf("s.transfers.GetTranferByID error: %w", err)
	}

	return transfer, nil
}
