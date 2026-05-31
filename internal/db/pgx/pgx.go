package pgx

import (
	"context"
	"fmt"
	"os"

	"Project/internal/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresPgxConf() (*pgxpool.Pool, error) {
	ctx := context.Background()

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("postgres://%s:%s@%v/%s", user, pass, host, name)
	conn, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Log.Error().Err(err).Msg("postgres connection error")
		return nil, err
	}
	return conn, nil
}
