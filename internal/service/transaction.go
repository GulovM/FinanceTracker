package service

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (s *Service) GetTransactions(ctx context.Context, userID int, filter *domain.TransactionsFilter) ([]*domain.Transactions, error) {
	if userID == 0 {
		return nil, errs.ErrUnauthorized
	}

	if filter == nil {
		filter = &domain.TransactionsFilter{}
	}

	filter.UserID = userID
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 50
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	transactions, err := s.transactions.GetTransactions(ctx, filter)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return []*domain.Transactions{}, nil
		}
		return nil, fmt.Errorf("s.transactions.GetTransactions error: %w", err)
	}

	return transactions, nil
}

func (s *Service) CreateTransaction(ctx context.Context, createTransaction *domain.CreateTransaction) error {
	if createTransaction == nil {
		return fmt.Errorf("transaction payload is required")
	}

	if createTransaction.Amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}

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

	acc, err := s.accounts.GetAccountByIDTx(ctx, tx, createTransaction.UserID, createTransaction.AccountID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByIDTx(ctx, tx, createTransaction.CategoryID, createTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if createTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *createTransaction.SubcategoryID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if createTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByIDTx(ctx, tx, *createTransaction.MerchantID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	createTransaction.Type = ctg.Type

	if createTransaction.Type == domain.TransactionTypeExpense && acc.Balance < createTransaction.Amount {
		return fmt.Errorf("insufficient balance")
	}

	if err = s.transactions.CreateTransactionTx(ctx, tx, createTransaction); err != nil {
		return fmt.Errorf("s.transactions.CreateTransaction error: %w", err)
	}

	updateAccount := domain.ChangeBalanceAccount{
		ID:      createTransaction.AccountID,
		UserID:  createTransaction.UserID,
		Balance: createTransaction.Amount,
	}

	switch createTransaction.Type {
	case domain.TransactionTypeIncome:
		err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeExpense:
		err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeTransfer:
		err = nil
	default:
		err = fmt.Errorf("unsupported transaction type: %s", createTransaction.Type)
	}

	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}

	return nil
}

func (s *Service) CreateTransactionTx(ctx context.Context, tx pgx.Tx, createTransaction *domain.CreateTransaction) error {
	if createTransaction == nil {
		return fmt.Errorf("transaction payload is required")
	}

	if createTransaction.Amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}

	acc, err := s.accounts.GetAccountByIDTx(ctx, tx, createTransaction.UserID, createTransaction.AccountID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByIDTx(ctx, tx, createTransaction.CategoryID, createTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if createTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *createTransaction.SubcategoryID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if createTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByIDTx(ctx, tx, *createTransaction.MerchantID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	createTransaction.Type = ctg.Type

	if createTransaction.Type == domain.TransactionTypeExpense && acc.Balance < createTransaction.Amount {
		return fmt.Errorf("insufficient balance")
	}

	if err = s.transactions.CreateTransactionTx(ctx, tx, createTransaction); err != nil {
		return fmt.Errorf("s.transactions.CreateTransaction error: %w", err)
	}

	updateAccount := domain.ChangeBalanceAccount{
		ID:      createTransaction.AccountID,
		UserID:  createTransaction.UserID,
		Balance: createTransaction.Amount,
	}

	switch createTransaction.Type {
	case domain.TransactionTypeIncome:
		err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeExpense:
		err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeTransfer:
		err = nil
	default:
		err = fmt.Errorf("unsupported transaction type: %s", createTransaction.Type)
	}

	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}

	return nil
}

func (s *Service) UpdateTransaction(ctx context.Context, updateTransaction *domain.UpdateTransaction) error {
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

	trn, err := s.transactions.GetTransactionByID(ctx, updateTransaction.UserID, updateTransaction.ID)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("transaction whith this ID not found: %w", err)
		}
		return fmt.Errorf("s.transactions.GetTransactionByID error: %w", err)
	}

	if _, err = s.accounts.GetAccountByIDTx(ctx, tx, updateTransaction.UserID, updateTransaction.AccountID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByIDTx(ctx, tx, updateTransaction.CategoryID, updateTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *updateTransaction.SubcategoryID, updateTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("subcategory with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
	}

	updateTransaction.Type = ctg.Type

	updateAccount := domain.ChangeBalanceAccount{
		ID:      trn.AccountID,
		UserID:  trn.UserID,
		Balance: trn.Amount,
	}
	switch trn.Type {
	case domain.TransactionTypeIncome:
		if trn.CategoryID != 13 {
			err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
		} else {
			err = fmt.Errorf("can not update transfer")
		}
	case domain.TransactionTypeExpense:
		if trn.CategoryID != 13 {
			err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
		} else {
			err = fmt.Errorf("can not update transfer")
		}
	default:
		err = fmt.Errorf("unsupported transaction type: %s", trn.Type)
	}

	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}

	err = s.transactions.UpdateTransaction(ctx, updateTransaction)
	if err != nil {
		return fmt.Errorf("s.transactions.UpdateTransaction error: %w", err)
	}

	updateAccount = domain.ChangeBalanceAccount{
		ID:      updateTransaction.ID,
		UserID:  updateTransaction.UserID,
		Balance: updateTransaction.Amount,
	}
	switch updateTransaction.Type {
	case domain.TransactionTypeIncome:
		err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeExpense:
		err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
	default:
		err = fmt.Errorf("unsupported transaction type: %s", updateTransaction.Type)
	}
	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}
	return nil
}

func (s *Service) DeleteTransaction(ctx context.Context, id, userID int) error {
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

	trn, err := s.transactions.GetTransactionByID(ctx, userID, id)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("transaction whith this ID not found: %w", err)
		}
		return fmt.Errorf("s.transactions.GetTransactionByID error: %w", err)
	}

	err = s.transactions.DeleteTransaction(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("s.transactions.DeleteTransaction error: %w", err)
	}

	updateAccount := domain.ChangeBalanceAccount{
		ID:      trn.AccountID,
		UserID:  trn.UserID,
		Balance: trn.Amount,
	}
	switch trn.Type {
	case domain.TransactionTypeIncome:
		err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
	case domain.TransactionTypeExpense:
		err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
	default:
		err = fmt.Errorf("unsupported transaction type: %s", trn.Type)
	}

	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}
	return nil
}
