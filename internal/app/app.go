package app

import (
	"Project/internal/auth"
	pgxdb "Project/internal/db/pgx"
	"Project/internal/handler"
	"Project/internal/logger"
	"Project/internal/repo"
	"Project/internal/service"
	"context"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func Run() {
	log := logger.Init()

	if err := godotenv.Load("D:\\Desktop\\Project\\internal\\config\\.env"); err != nil {
		log.Warn().Err(err).Msg("ошибка в загрузке .env, будут использоваться текущие настройки окружения")
	}

	conn, err := pgxdb.NewPostgresPgxConf()
	if err != nil {
		log.Fatal().Err(err).Msg("ошибка в инициализации соединения с postgres")
	}

	r := repo.NewRepository(conn)

	passwordHasher := auth.NewBcryptHasher(12)

	srv := service.NewService(service.Deps{
		Users:        r,
		Accounts:     r,
		Cards:        r,
		Categories:   r,
		Merchants:    r,
		Tags:         r,
		Transactions: r,
		Transfers:    r,
		RecTx:        r,
		Budgets:      r,
		Goals:        r,
		EventLogger:  r,
		Tx:           r,
		Hasher:       passwordHasher,
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Error().Msg("JWT_SECRET не установлен")
		return
	}

	jwtManager := auth.NewJWTManager(secret, 24*time.Hour)

	handle := handler.NewHandler(handler.Deps{
		Users:        srv,
		Accounts:     srv,
		Cards:        srv,
		Categories:   srv,
		Merchants:    srv,
		Tags:         srv,
		Transactions: srv,
		Transfers:    srv,
		RecTx:        srv,
		Budgets:      srv,
		Goals:        srv,
		EventLog:     srv,
		JWTManager:   jwtManager,
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	r2 := handle.InitRoutes()
	srv.StartRecurringWorker(ctx)
	log.Info().Msg("Запуск http сервера на порту :8080")
	if err := r2.Run(":8080"); err != nil {
		log.Err(err)
	}
}
