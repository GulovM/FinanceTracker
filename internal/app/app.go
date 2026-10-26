package app

import (
	"Project/internal/auth"
	pgxdb "Project/internal/db/pgx"
	"Project/internal/handler"
	"Project/internal/logger"
	"Project/internal/repo"
	"Project/internal/service"
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func Run() {
	log := logger.Init()

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Error().Msg("JWT_SECRET не установлен")
		return
	}

	conn, err := pgxdb.NewPostgresPgxConf()
	if err != nil {
		log.Fatal().Err(err).Msg("ошибка в инициализации соединения с postgres")
	}
	defer conn.Close()

	migrateCtx, cancelMigrate := context.WithTimeout(context.Background(), time.Minute)
	err = pgxdb.Migrate(migrateCtx, conn)
	cancelMigrate()
	if err != nil {
		log.Error().Err(err).Msg("ошибка применения миграций")
		return
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

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv.StartRecurringWorker(ctx)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	httpSrv := &http.Server{
		Addr:              ":" + port,
		Handler:           handle.InitRoutes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	serveErr := make(chan error, 1)
	go func() {
		log.Info().Msgf("Запуск http сервера на порту :%s", port)
		serveErr <- httpSrv.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		if !errors.Is(err, http.ErrServerClosed) {
			log.Error().Err(err).Msg("ошибка http сервера")
		}
	case <-ctx.Done():
		log.Info().Msg("Получен сигнал завершения, останавливаю сервер")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := httpSrv.Shutdown(shutdownCtx); err != nil {
			log.Error().Err(err).Msg("ошибка при остановке http сервера")
		}
	}
}
