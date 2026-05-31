package repo

import (
	"Project/internal/domain"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) GetCardTypes(ctx context.Context) ([]*domain.CardTypes, error) {
	query := `
	select * from card_type;
	`

	rows, err := r.postgres.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var cardTypes []*domain.CardTypes
	for rows.Next() {
		cardType, err := pgx.RowToStructByName[dbCardType](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		cardTypes = append(cardTypes, cardType.ToEntity())
	}

	return cardTypes, nil
}

func (r *Repository) GetWalletTypes(ctx context.Context) ([]*domain.WalletTypes, error) {
	query := `
	select * from wallet_type;
	`

	rows, err := r.postgres.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var walletTypes []*domain.WalletTypes
	for rows.Next() {
		walletType, err := pgx.RowToStructByName[dbWalletType](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		walletTypes = append(walletTypes, walletType.ToEntity())
	}

	return walletTypes, nil
}
