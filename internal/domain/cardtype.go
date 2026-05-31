package domain

import "context"

type CardTypes struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type WalletTypes struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type CardTypeRepository interface {
	GetCardTypes(ctx context.Context) ([]*CardTypes, error)
	GetWalletTypes(ctx context.Context) ([]*WalletTypes, error)
}
