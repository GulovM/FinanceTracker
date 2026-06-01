package handler

import (
	"Project/internal/domain"
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type transactionService interface {
	GetTransactions(ctx context.Context, userID int, filter *domain.TransactionsFilter) ([]*domain.Transactions, error)
	CreateTransaction(ctx context.Context, createTransaction *domain.CreateTransaction) (int, error)
	UpdateTransaction(ctx context.Context, updateTransaction *domain.UpdateTransaction) error
	DeleteTransaction(ctx context.Context, id, userID int) error
}

func (h *Handler) GetTransactions(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	q := c.Request.URL.Query()
	filter := &domain.TransactionsFilter{}

	// account_id
	if v := q.Get("account_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.AccountID = &id
		}
	}

	// category_id
	if v := q.Get("category_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.CategoryID = &id
		}
	}

	// merchant_id
	if v := q.Get("merchant_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil && id > 0 {
			filter.MerchantID = &id
		}
	}

	// type
	if v := q.Get("type"); v != "" {
		t := v
		filter.Type = &t
	}

	// даты, допустим формата YYYY-MM-DD
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

	transactions, err := h.transactions.GetTransactions(c.Request.Context(), userID, filter)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": transactions})
}

func (h *Handler) CreateTransaction(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	var in struct {
		AccountID     int     `json:"account_id"`
		CategoryID    int     `json:"category_id"`
		SubcategoryID *int    `json:"subcategory_id"`
		MerchantID    *int    `json:"merchant_id"`
		Amount        float64 `json:"amount"`
		Recipient     *string `json:"recipient"`
		Comment       *string `json:"comment"`
		RecurringID   *int    `json:"recurring_id"`
		TransferID    *int    `json:"transfer_id"`
		TagIDs        []int   `json:"tag_ids"`
	}

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	transactionCreate := domain.CreateTransaction{
		UserID:        userID,
		AccountID:     in.AccountID,
		CategoryID:    in.CategoryID,
		SubcategoryID: in.SubcategoryID,
		MerchantID:    in.MerchantID,
		Amount:        in.Amount,
		Recipient:     in.Recipient,
		Comment:       in.Comment,
		RecurringID:   in.RecurringID,
		TransferID:    in.TransferID,
		TagIDs:        in.TagIDs,
	}

	txID, err := h.transactions.CreateTransaction(c.Request.Context(), &transactionCreate)
	if err != nil {
		fmt.Println("h.transactions.CreateTransaction error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": txID})
}

func (h *Handler) UpdateTransaction(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(400, gin.H{
			"error": "invalid id",
		})
		return
	}

	var in struct {
		AccountID     int     `json:"account_id"`
		CategoryID    int     `json:"category_id"`
		SubcategoryID *int    `json:"subcategory_id"`
		MerchantID    *int    `json:"merchant_id"`
		Amount        float64 `json:"amount"`
		Recipient     *string `json:"recipient"`
		Comment       *string `json:"comment"`
		RecurringID   *int    `json:"recurring_id"`
		TransferID    *int    `json:"transfer_id"`
		TagIDs        []int   `json:"tag_ids"`
	}
	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateTransaction := domain.UpdateTransaction{
		ID:            id,
		UserID:        userID,
		AccountID:     in.AccountID,
		CategoryID:    in.CategoryID,
		SubcategoryID: in.SubcategoryID,
		MerchantID:    in.MerchantID,
		Tags:          in.TagIDs,
		Amount:        in.Amount,
		Recipient:     in.Recipient,
		Comment:       in.Comment,
		RecurringID:   in.RecurringID,
		TransferID:    in.TransferID,
	}

	err = h.transactions.UpdateTransaction(c.Request.Context(), &updateTransaction)
	if err != nil {
		fmt.Println("h.transactions.UpdateTransaction error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

func (h *Handler) DeleteTransaction(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(400, gin.H{
			"error": "invalid id",
		})
		return
	}

	err = h.transactions.DeleteTransaction(c.Request.Context(), id, userID)
	if err != nil {
		fmt.Println("h.transactions.DeleteTransaction error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}
