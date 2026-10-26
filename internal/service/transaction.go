package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
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

func (s *Service) CreateTransaction(ctx context.Context, createTransaction *domain.CreateTransaction) (txID int, err error) {
	if createTransaction == nil {
		return 0, fmt.Errorf("%w: transaction payload is required", errs.ErrInvalidInput)
	}

	if createTransaction.Amount <= 0 {
		return 0, fmt.Errorf("%w: amount must be greater than zero", errs.ErrInvalidInput)
	}

	tx, err := s.tx.BeginTx(ctx)
	if err != nil {
		return 0, err
	}
	defer finishTx(ctx, tx, &err)

	acc, err := s.accounts.GetAccountByIDTx(ctx, tx, createTransaction.UserID, createTransaction.AccountID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return 0, fmt.Errorf("account with this ID not found: %w", err)
		}
		return 0, fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByIDTx(ctx, tx, createTransaction.CategoryID, createTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return 0, fmt.Errorf("category with this ID not found: %w", err)
		}
		return 0, fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if createTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *createTransaction.SubcategoryID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return 0, fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return 0, fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if createTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByIDTx(ctx, tx, *createTransaction.MerchantID, createTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return 0, fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return 0, fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	createTransaction.Type = ctg.Type

	if createTransaction.Type == domain.TransactionTypeExpense && acc.Balance < createTransaction.Amount {
		return 0, errs.ErrInsufficientFunds
	}

	if txID, err = s.transactions.CreateTransactionTx(ctx, tx, createTransaction); err != nil {
		return 0, fmt.Errorf("s.transactions.CreateTransaction error: %w", err)
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
		return 0, fmt.Errorf("update balance error: %w", err)
	}

	return txID, nil
}

func (s *Service) CreateTransactionTx(ctx context.Context, tx pgx.Tx, createTransaction *domain.CreateTransaction) error {
	if createTransaction == nil {
		return fmt.Errorf("%w: transaction payload is required", errs.ErrInvalidInput)
	}

	if createTransaction.Amount <= 0 {
		return fmt.Errorf("%w: amount must be greater than zero", errs.ErrInvalidInput)
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
		return errs.ErrInsufficientFunds
	}

	if _, err = s.transactions.CreateTransactionTx(ctx, tx, createTransaction); err != nil {
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

func (s *Service) UpdateTransaction(ctx context.Context, updateTransaction *domain.UpdateTransaction) (err error) {
	if updateTransaction == nil {
		return fmt.Errorf("%w: transaction payload is required", errs.ErrInvalidInput)
	}

	if updateTransaction.Amount <= 0 {
		return fmt.Errorf("%w: amount must be greater than zero", errs.ErrInvalidInput)
	}

	tx, err := s.tx.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer finishTx(ctx, tx, &err)

	trn, err := s.transactions.GetTransactionByIDTx(ctx, tx, updateTransaction.UserID, updateTransaction.ID)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("transaction with this ID not found: %w", err)
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

	if ctg.Type == domain.TransactionTypeTransfer || trn.Type == domain.TransactionTypeTransfer || trn.TransferID != nil {
		return fmt.Errorf("%w: can not update transfer", errs.ErrInvalidInput)
	}

	if updateTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *updateTransaction.SubcategoryID, updateTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if updateTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByIDTx(ctx, tx, *updateTransaction.MerchantID, updateTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	updateTransaction.Type = ctg.Type

	updateAccount := domain.ChangeBalanceAccount{
		ID:      trn.AccountID,
		UserID:  trn.UserID,
		Balance: trn.Amount,
	}
	switch trn.Type {
	case domain.TransactionTypeIncome:
		if trn.CategoryID != domain.TransferCategoryID {
			err = s.accounts.WithdrowAccountTx(ctx, tx, &updateAccount)
		} else {
			err = fmt.Errorf("%w: can not update transfer", errs.ErrInvalidInput)
		}
	case domain.TransactionTypeExpense:
		if trn.CategoryID != domain.TransferCategoryID {
			err = s.accounts.TopupAccountTx(ctx, tx, &updateAccount)
		} else {
			err = fmt.Errorf("%w: can not update transfer", errs.ErrInvalidInput)
		}
	default:
		err = fmt.Errorf("unsupported transaction type: %s", trn.Type)
	}

	if err != nil {
		return fmt.Errorf("update balance error: %w", err)
	}

	acc, err := s.accounts.GetAccountByIDTx(ctx, tx, updateTransaction.UserID, updateTransaction.AccountID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}
	if updateTransaction.Type == domain.TransactionTypeExpense && acc.Balance < updateTransaction.Amount {
		return errs.ErrInsufficientFunds
	}

	err = s.transactions.UpdateTransactionTx(ctx, tx, updateTransaction)
	if err != nil {
		return fmt.Errorf("s.transactions.UpdateTransaction error: %w", err)
	}

	updateAccount = domain.ChangeBalanceAccount{
		ID:      updateTransaction.AccountID,
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

func (s *Service) DeleteTransaction(ctx context.Context, id, userID int) (err error) {
	tx, err := s.tx.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer finishTx(ctx, tx, &err)

	trn, err := s.transactions.GetTransactionByIDTx(ctx, tx, userID, id)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("transaction with this ID not found: %w", err)
		}
		return fmt.Errorf("s.transactions.GetTransactionByID error: %w", err)
	}

	if trn.Type == domain.TransactionTypeTransfer || trn.TransferID != nil {
		return fmt.Errorf("%w: can not delete transfer transaction", errs.ErrInvalidInput)
	}

	err = s.transactions.DeleteTransactionTx(ctx, tx, id, userID)
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
