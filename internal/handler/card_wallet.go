package handler

import (
	"Project/internal/domain"
	"context"

	"github.com/gin-gonic/gin"
)

type cardWalletService interface {
	GetCardTypes(ctx context.Context) ([]*domain.CardTypes, error)
	GetWalletTypes(ctx context.Context) ([]*domain.WalletTypes, error)
}

func (h *Handler) GetCardTypes(c *gin.Context) {
	result, err := h.cards.GetCardTypes(c.Request.Context())

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

func (h *Handler) GetWalletTypes(c *gin.Context) {
	result, err := h.cards.GetWalletTypes(c.Request.Context())

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}
