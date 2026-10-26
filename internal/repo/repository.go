package repo

import (
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	postgres *pgxpool.Pool
}

func NewRepository(postgres *pgxpool.Pool) *Repository {
	return &Repository{
		postgres: postgres,
	}
}

func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.postgres.Begin(ctx)
}

// exec_err оборачивает ошибку выполнения запроса. Ошибки, вызванные данными клиента
// (нарушение FK, уникальности, check или неверное значение enum), превращаются
// в доменные, чтобы handler вернул 4xx вместо 500.
func exec_err(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23503": // foreign_key_violation
			return fmt.Errorf("%w: referenced record does not exist", errs.ErrInvalidInput)
		case "23505": // unique_violation
			return fmt.Errorf("%w: %w", errs.ErrUserExist, err)
		case "23514", "22P02": // check_violation, invalid_text_representation
			return fmt.Errorf("%w: invalid value", errs.ErrInvalidInput)
		}
	}
	return fmt.Errorf("exec error: %w", err)
}

func scan_err(err error) error {
	return fmt.Errorf("scan error: %w", err)
}

type RowGetter interface {
	QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row
	Exec(ctx context.Context, sql string, args ...interface{}) (pgconn.CommandTag, error)
}
