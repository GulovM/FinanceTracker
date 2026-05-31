package service

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Service) GetRecTransactions(ctx context.Context, userID int) ([]*domain.RecTransaction, error) {
	rec_transactions, err := s.recTx.GetRecTransactions(ctx, userID)

	if err != nil {
		return nil, fmt.Errorf("s.recTx.GetRecTransactions error: %w", err)
	}

	return rec_transactions, nil
}

func (s *Service) GetRecTransactionsList(ctx context.Context, userID int) ([]*domain.RecTransactionFull, error) {
	items, err := s.recTx.GetRecTransactionsList(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("s.recTx.GetRecTransactionsList error: %w", err)
	}
	return items, nil
}

func (s *Service) GetRecTransactionByID(ctx context.Context, userID, id int) (*domain.RecTransactionFull, error) {
	rec_transaction, err := s.recTx.GetRecTransactionByID(ctx, userID, id)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, fmt.Errorf("recurring transaction not found")
		}
		return nil, fmt.Errorf("s.recTx.GetRecTransactionByID error: %w", err)
	}

	return rec_transaction, nil
}

func (s *Service) CreateRecTransaction(ctx context.Context, recTransaction *domain.CreateRecTransaction) error {
	if recTransaction == nil {
		return fmt.Errorf("transaction payload is required")
	}

	if recTransaction.Amount <= 0 {
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

	if _, err = s.accounts.GetAccountByIDTx(ctx, tx, recTransaction.UserID, recTransaction.AccountID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByIDTx(ctx, tx, recTransaction.CategoryID, recTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if recTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByIDTx(ctx, tx, *recTransaction.SubcategoryID, recTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if recTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByIDTx(ctx, tx, *recTransaction.MerchantID, recTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	recTransaction.Type = ctg.Type

	loc, err := time.LoadLocation(recTransaction.Timezone)
	if err != nil {
		return fmt.Errorf("invalid timezone: %w", err)
	}

	start := time.Date(
		recTransaction.StartDate.Year(),
		recTransaction.StartDate.Month(),
		recTransaction.StartDate.Day(),
		9, 0, 0, 0,
		loc,
	)

	nextRunAt := alignFirstRun(start, recTransaction.PeriodType, recTransaction.DayOfMonth, recTransaction.DayOfWeek, recTransaction.EndDate, loc)
	if nextRunAt.IsZero() {
		return fmt.Errorf("cannot compute next_run_at from start date")
	}

	now := time.Now().In(loc)
	for !nextRunAt.After(now) {
		nextRunAt = computeNextRun(nextRunAt, recTransaction.PeriodType, recTransaction.Interval, recTransaction.DayOfMonth, recTransaction.DayOfWeek, recTransaction.EndDate, loc)
		if nextRunAt.IsZero() {
			return fmt.Errorf("cannot compute next_run_at")
		}
	}

	recTransaction.NextRunAt = nextRunAt

	recID, err := s.recTx.CreateRecTransaction(ctx, tx, recTransaction)
	if err != nil || recID == 0 {
		return fmt.Errorf("s.recTx.CreateRecTransaction error: %w", err)
	}

	return nil
}

func (s *Service) UpdateRecTransaction(ctx context.Context, recTransaction *domain.UpdateRecTransaction) error {
	_, err := s.GetRecTransactionByID(ctx, recTransaction.UserID, recTransaction.ID)
	if err != nil {
		return fmt.Errorf("s.GetRecTransactionByID error: %w", err)
	}

	if _, err = s.accounts.GetAccountByID(ctx, recTransaction.UserID, recTransaction.AccountID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("account with this ID not found: %w", err)
		}
		return fmt.Errorf("s.accounts.GetAccountByIDTx error: %w", err)
	}

	var ctg *domain.Category
	if ctg, err = s.categories.GetCategoryByID(ctx, recTransaction.CategoryID, recTransaction.UserID); err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category with this ID not found: %w", err)
		}
		return fmt.Errorf("s.categories.GetCategoryByIDTx error: %w", err)
	}

	if recTransaction.SubcategoryID != nil {
		if _, err = s.categories.GetSubcategoryByID(ctx, *recTransaction.SubcategoryID, recTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("subcategory with this ID not found: %w", err)
			}
			return fmt.Errorf("s.categories.GetSubcategoryByIDTx error: %w", err)
		}
	}

	if recTransaction.MerchantID != nil {
		if _, err = s.merchants.GetMerchantByID(ctx, *recTransaction.MerchantID, recTransaction.UserID); err != nil {
			if errors.Is(err, errs.ErrNotFound) {
				return fmt.Errorf("merchant with this ID not found: %w", err)
			}
			return fmt.Errorf("s.merchants.GetMerchantByIDTx error: %w", err)
		}
	}

	recTransaction.Type = ctg.Type
	err = s.recTx.UpdateRecTransaction(ctx, recTransaction)
	if err != nil {
		return fmt.Errorf("s.recTx.UpdateRecTransaction error: %w", err)
	}
	return nil
}

func (s *Service) UpdateRecurringStatus(ctx context.Context, userID, id int, status string) error {
	_, err := s.GetRecTransactionByID(ctx, userID, id)
	if err != nil {
		return fmt.Errorf("s.GetRecTransactionByID error: %w", err)
	}

	err = s.recTx.UpdateRecurringStatus(ctx, userID, id, status)
	if err != nil {
		return fmt.Errorf("s.recTx.UpdateRecurringStatus error: %w", err)
	}
	return nil
}

func alignFirstRun(
	start time.Time,
	periodType string,
	dayOfMonth *int,
	dayOfWeek *int,
	endDate *time.Time,
	loc *time.Location,
) time.Time {
	next := start.In(loc)

	switch periodType {
	case domain.PeriodTypeEveryWeek:
		if dayOfWeek != nil {
			target := toWeekday(*dayOfWeek)
			if target != -1 {
				offset := (int(target) - int(next.Weekday()) + 7) % 7
				next = next.AddDate(0, 0, offset)
			}
		}
	case domain.PeriodTypeEveryMonth:
		day := next.Day()
		if dayOfMonth != nil && *dayOfMonth >= 1 && *dayOfMonth <= 31 {
			day = *dayOfMonth
		}

		lastDay := lastDayOfMonth(next.Year(), next.Month(), loc)
		if day > lastDay {
			day = lastDay
		}

		next = time.Date(
			next.Year(),
			next.Month(),
			day,
			next.Hour(),
			next.Minute(),
			next.Second(),
			next.Nanosecond(),
			loc,
		)
	}

	if endDate != nil {
		end := time.Date(
			endDate.Year(),
			endDate.Month(),
			endDate.Day(),
			next.Hour(),
			next.Minute(),
			next.Second(),
			next.Nanosecond(),
			loc,
		)
		if next.After(end) {
			return time.Time{}
		}
	}

	return next
}

func computeNextRun(
	current time.Time,
	periodType string,
	interval int,
	dayOfMonth *int,
	dayOfWeek *int,
	endDate *time.Time,
	loc *time.Location,
) time.Time {
	if interval <= 0 {
		interval = 1
	}

	current = current.In(loc)
	next := current

	switch periodType {
	case domain.PeriodTypeEveryDay:
		next = next.AddDate(0, 0, interval)

	case domain.PeriodTypeEveryWeek:
		next = next.AddDate(0, 0, 7*interval)

		if dayOfWeek != nil {
			target := toWeekday(*dayOfWeek)
			if target != -1 {
				for i := 0; i < 7; i++ {
					if next.Weekday() == target {
						break
					}
					next = next.AddDate(0, 0, 1)
				}
			}
		}

	case domain.PeriodTypeEveryMonth:
		day := current.Day()
		if dayOfMonth != nil && *dayOfMonth >= 1 && *dayOfMonth <= 31 {
			day = *dayOfMonth
		}

		year, month, _ := current.Date()
		month = month + time.Month(interval)

		for month > 12 {
			month -= 12
			year++
		}
		for month < 1 {
			month += 12
			year--
		}

		lastDay := lastDayOfMonth(year, month, loc)
		if day > lastDay {
			day = lastDay
		}

		next = time.Date(
			year,
			month,
			day,
			current.Hour(),
			current.Minute(),
			current.Second(),
			current.Nanosecond(),
			loc,
		)

	case domain.PeriodTypeEveryYear:
		next = next.AddDate(interval, 0, 0)

	default:
		return time.Time{}
	}

	if endDate != nil {
		end := time.Date(
			endDate.Year(),
			endDate.Month(),
			endDate.Day(),
			next.Hour(),
			next.Minute(),
			next.Second(),
			next.Nanosecond(),
			loc,
		)
		if next.After(end) {
			return time.Time{}
		}
	}

	return next
}

// dayOfWeek: 1–7, где 1 = Понедельник, ..., 7 = Воскресенье
func toWeekday(d int) time.Weekday {
	if d < 1 || d > 7 {
		return -1
	}
	if d == 7 {
		return time.Sunday
	}
	return time.Weekday(d) // 1..6 → Понедельник..Суббота
}

func lastDayOfMonth(year int, month time.Month, loc *time.Location) int {
	// День "0" следующего месяца - это последний день текущего
	t := time.Date(year, month+1, 0, 0, 0, 0, 0, loc)
	return t.Day()
}

func (s *Service) StartRecurringWorker(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := s.ProcessDueRecurringTransactions(ctx); err != nil {
					log.Printf("process recurring error: %v", err)
				}
			}
		}
	}()
}

func (s *Service) ProcessDueRecurringTransactions(ctx context.Context) error {
	recs, err := s.recTx.GetDueRecurring(ctx)
	if err != nil {
		return fmt.Errorf("s.recTx.GetDueRecurring error: %w", err)
	}

	for _, rtr := range recs {
		tx, err := s.tx.BeginTx(ctx)
		if err != nil {
			log.Printf("begin tx for recurring_id=%d error: %v", rtr.ID, err)
			continue
		}

		// обработка каждого платежа по отдельности
		if err := s.processOneRecurring(ctx, tx, rtr); err != nil {
			_ = tx.Rollback(ctx)
			log.Printf("process recurring_id=%d error: %v", rtr.ID, err)
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("commit recurring_id=%d error: %v", rtr.ID, err)
			continue
		}
	}

	return nil
}

func (s *Service) processOneRecurring(ctx context.Context, tx pgx.Tx, rtr *domain.RecTransactionFull) error {
	// 1. Создаём транзакцию
	tr := domain.CreateTransaction{
		UserID:        rtr.UserID,
		AccountID:     rtr.AccountID,
		CategoryID:    rtr.CategoryID,
		SubcategoryID: rtr.SubcategoryID,
		MerchantID:    rtr.MerchantID,
		Type:          rtr.Type,
		Amount:        rtr.Amount,
		Recipient:     rtr.Recipient,
		Comment:       rtr.Comment,
		RecurringID:   &rtr.ID,
		TagIDs:        rtr.TagIDs,
	}

	if err := s.CreateTransactionTx(ctx, tx, &tr); err != nil {
		return fmt.Errorf("create transaction: %w", err)
	}

	// 2. Готовим dayOfMonth/dayOfWeek
	var dayOfMonth *int
	if rtr.DayOfMonth != nil {
		dm := int(*rtr.DayOfMonth)
		dayOfMonth = &dm
	}

	var dayOfWeek *int
	if rtr.DayOfWeek != nil {
		dw := int(*rtr.DayOfWeek)
		dayOfWeek = &dw
	}

	// 3. Локация
	loc, err := time.LoadLocation(rtr.Timezone)
	if err != nil {
		return fmt.Errorf("invalid timezone %q: %w", rtr.Timezone, err)
	}

	// 4. Вычисляем следующий запуск
	next := computeNextRun(
		rtr.NextRunAt,
		rtr.PeriodType,
		rtr.Interval,
		dayOfMonth,
		dayOfWeek,
		rtr.EndDate,
		loc,
	)

	if next.IsZero() {
		// Если запусков больше не будет, то завершаем расписание
		if err := s.recTx.UpdateRecurringStatusTx(ctx, tx, rtr.UserID, rtr.ID, domain.StatusTypeStop); err != nil {
			return fmt.Errorf("update recurring status: %w", err)
		}
		return nil
	}

	// 5. Обновляем next_run_at
	if err := s.recTx.UpdateRecurringNextRun(ctx, tx, rtr.ID, next); err != nil {
		return fmt.Errorf("update next_run_at: %w", err)
	}

	return nil
}
