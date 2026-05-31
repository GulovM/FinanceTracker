package repo

import (
	"context"
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

func exec_err(err error) error {
	return fmt.Errorf("exec error: %w", err)
}

func scan_err(err error) error {
	return fmt.Errorf("scan error: %w", err)
}

type RowGetter interface {
	QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row
	Exec(ctx context.Context, sql string, args ...interface{}) (pgconn.CommandTag, error)
}
