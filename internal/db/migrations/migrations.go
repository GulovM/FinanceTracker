// Package migrations встраивает SQL-миграции (формат goose) в бинарник,
// чтобы схема БД применялась при старте приложения.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
