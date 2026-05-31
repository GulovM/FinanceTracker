package handler

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type transferService interface {
	CreateTransfer(ctx context.Context, createTransfer *domain.CreateTransfer) error
	GetTransfers(ctx context.Context, filter domain.TransfersFilter) ([]*domain.TransferFull, error)
	GetTranferByID(ctx context.Context, userID, id int) (*domain.Transfer, error)
}

func (h *Handler) CreateTransfer(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	var in *domain.CreateTransfer
	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	transferCreate := domain.CreateTransfer{
		UserID:      userID,
		From_acc_ID: in.From_acc_ID,
		To_acc_ID:   in.To_acc_ID,
		Amount:      in.Amount,
		Comment:     in.Comment,
	}

	err = h.transfers.CreateTransfer(c.Request.Context(), &transferCreate)
	if err != nil {
		fmt.Println("h.transfers.CreateTransfer error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "success"})
}

func (h *Handler) GetTranfers(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	q := c.Request.URL.Query()
	filter := &domain.TransfersFilter{}

	filter.UserID = userID
	// account_id
	if v := q.Get("account_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.AccountID = &id
		}
	}

	// from_account_id
	if v := q.Get("from_account_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.FromAccountID = &id
		}
	}

	// to_account_id
	if v := q.Get("to_account_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.ToAccountID = &id
		}
	}

	// даты
	layout := "02-01-2006"

	if v := q.Get("date_from"); v != "" {
		if t, err := time.Parse(layout, v); err == nil {
			filter.DateFrom = &t
		}
	}

	if v := q.Get("date_to"); v != "" {
		if t, err := time.Parse(layout, v); err == nil {
			filter.DateTo = &t
		}
	}

	// суммы
	if v := q.Get("min_amount"); v != "" {
		if a, err := strconv.ParseFloat(v, 64); err == nil {
			filter.MinAmount = &a
		}
	}

	if v := q.Get("max_amount"); v != "" {
		if a, err := strconv.ParseFloat(v, 64); err == nil {
			filter.MaxAmount = &a
		}
	}

	// пагинация
	if v := q.Get("limit"); v != "" {
		if l, err := strconv.Atoi(v); err == nil {
			filter.Limit = l
		}
	}
	if v := q.Get("offset"); v != "" {
		if o, err := strconv.Atoi(v); err == nil {
			filter.Offset = o
		}
	}

	tranfers, err := h.transfers.GetTransfers(c.Request.Context(), *filter)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"tranfers": tranfers})
}

func (h *Handler) GetTranferByID(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	IdStr := c.Param("id")
	id, err := strconv.Atoi(IdStr)
	if err != nil {
		fmt.Println("convert id to int error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	transfer, err := h.transfers.GetTranferByID(c.Request.Context(), userID, id)
	if err != nil {
		fmt.Println("h.transfers.GetTranferByID error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transfer": transfer})
}
