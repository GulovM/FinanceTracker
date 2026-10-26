package pgx

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"time"

	"Project/internal/db/migrations"
	"Project/internal/logger"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// Migrate применяет все ещё не применённые миграции из migrations.FS.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	// goose работает с database/sql, поэтому оборачиваем существующий пул
	db := stdlib.OpenDBFromPool(pool)
	defer func() { _ = db.Close() }()

	provider, err := goose.NewProvider(goose.DialectPostgres, db, migrations.FS)
	if err != nil {
		return fmt.Errorf("init migrations provider: %w", err)
	}

	if _, err := provider.Up(ctx); err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}
	return nil
}

func NewPostgresPgxConf() (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = os.Getenv("DB_USER")
	}
	pass := os.Getenv("POSTGRES_PASSWORD")
	if pass == "" {
		pass = os.Getenv("DB_PASSWORD")
	}
	host := os.Getenv("DB_HOST")
	name := os.Getenv("POSTGRES_DB")
	if name == "" {
		name = os.Getenv("DB_NAME")
	}

	// url.URL экранирует спецсимволы в пароле, которые ломали строку формата "%s:%s@%v/%s"
	dsn := (&url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, pass),
		Host:   host,
		Path:   "/" + name,
	}).String()

	conn, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Log.Error().Err(err).Msg("postgres connection error")
		return nil, err
	}

	// pgxpool.New не подключается сразу, поэтому проверяем доступность БД на старте
	if err := conn.Ping(ctx); err != nil {
		conn.Close()
		logger.Log.Error().Err(err).Msg("postgres ping error")
		return nil, err
	}
	return conn, nil
}
