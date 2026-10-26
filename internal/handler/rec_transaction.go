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

type recTransactionService interface {
	GetRecTransactions(ctx context.Context, userID int) ([]*domain.RecTransaction, error)
	GetRecTransactionByID(ctx context.Context, userID, id int) (*domain.RecTransactionFull, error)
	GetRecTransactionsList(ctx context.Context, userID int) ([]*domain.RecTransactionFull, error)
	CreateRecTransaction(ctx context.Context, recTransaction *domain.CreateRecTransaction) error
	UpdateRecTransaction(ctx context.Context, recTransaction *domain.UpdateRecTransaction) error
	UpdateRecurringStatus(ctx context.Context, userID, id int, status string) error
}

func (h *Handler) GetRecTransactions(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	rec_trs, err := h.recTx.GetRecTransactions(c, userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": rec_trs})
}

func (h *Handler) GetRecTransactionsList(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	items, err := h.recTx.GetRecTransactionsList(c, userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) GetRecTransactionByID(c *gin.Context) {
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

	rec_tr, err := h.recTx.GetRecTransactionByID(c, userID, id)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"result": rec_tr})
}

func (h *Handler) CreateRecTransaction(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	var in struct {
		AccountID     int          `json:"account_id"`
		CategoryID    int          `json:"category_id"`
		SubcategoryID *int         `json:"subcategory_id"`
		MerchantID    *int         `json:"merchant_id"`
		Type          string       `json:"type"`
		Amount        float64      `json:"amount"`
		Recipient     *string      `json:"recipient"`
		Comment       *string      `json:"comment"`
		PeriodType    string       `json:"period_type"`
		Interval      int          `json:"interval"`
		DayOfMonth    *int         `json:"day_of_month"`
		DayOfWeek     *int         `json:"day_of_week"`
		StartDate     domain.Date  `json:"start_date"`
		EndDate       *domain.Date `json:"end_date"`
		Timezone      string       `json:"timezone"`
		TagIDs        []int        `json:"tag_ids"`
	}

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	endDate := toTimePtr(in.EndDate)
	rec_tr := domain.CreateRecTransaction{
		UserID:        userID,
		AccountID:     in.AccountID,
		CategoryID:    in.CategoryID,
		SubcategoryID: in.SubcategoryID,
		MerchantID:    in.MerchantID,
		Amount:        in.Amount,
		Recipient:     in.Recipient,
		Comment:       in.Comment,
		PeriodType:    in.PeriodType,
		Interval:      in.Interval,
		DayOfMonth:    in.DayOfMonth,
		DayOfWeek:     in.DayOfWeek,
		StartDate:     in.StartDate.Time,
		EndDate:       endDate,
		Timezone:      in.Timezone,
		TagIDs:        in.TagIDs,
	}

	err = h.recTx.CreateRecTransaction(c, &rec_tr)
	if err != nil {
		fmt.Println("h.recTx.CreateRecTransaction error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

func (h *Handler) UpdateRecTransaction(c *gin.Context) {
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
		AccountID     int          `json:"account_id"`
		CategoryID    int          `json:"category_id"`
		SubcategoryID *int         `json:"subcategory_id"`
		MerchantID    *int         `json:"merchant_id"`
		Type          string       `json:"type"`
		Amount        float64      `json:"amount"`
		Recipient     *string      `json:"recipient"`
		Comment       *string      `json:"comment"`
		PeriodType    string       `json:"period_type"`
		Interval      int          `json:"interval"`
		DayOfMonth    *int         `json:"day_of_month"`
		DayOfWeek     *int         `json:"day_of_week"`
		StartDate     domain.Date  `json:"start_date"`
		EndDate       *domain.Date `json:"end_date"`
		TagIDs        []int        `json:"tag_ids"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	endDate := toTimePtr(in.EndDate)
	rec_tr := domain.UpdateRecTransaction{
		ID:            id,
		UserID:        userID,
		AccountID:     in.AccountID,
		CategoryID:    in.CategoryID,
		SubcategoryID: in.SubcategoryID,
		MerchantID:    in.MerchantID,
		Amount:        in.Amount,
		Recipient:     in.Recipient,
		Comment:       in.Comment,
		PeriodType:    in.PeriodType,
		Interval:      in.Interval,
		DayOfMonth:    in.DayOfMonth,
		DayOfWeek:     in.DayOfWeek,
		StartDate:     in.StartDate.Time,
		EndDate:       endDate,
		TagIDs:        in.TagIDs,
	}

	err = h.recTx.UpdateRecTransaction(c, &rec_tr)
	if err != nil {
		fmt.Println("h.recTx.UpdateRecTransaction error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) StopRecTransaction(c *gin.Context) {
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

	err = h.recTx.UpdateRecurringStatus(c, userID, id, domain.StatusTypeStop)

	if err != nil {
		fmt.Println("h.recTx.UpdateRecurringStatus error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

func toTimePtr(d *domain.Date) *time.Time {
	if d == nil || d.IsZero() {
		return nil
	}
	t := d.Time
	return &t
}

func (h *Handler) ActivateRecTransaction(c *gin.Context) {
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

	err = h.recTx.UpdateRecurringStatus(c, userID, id, domain.StatusTypeActive)

	if err != nil {
		fmt.Println("h.recTx.UpdateRecurringStatus error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

func (h *Handler) CancelRecTransaction(c *gin.Context) {
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

	err = h.recTx.UpdateRecurringStatus(c, userID, id, domain.StatusTypeCancel)

	if err != nil {
		fmt.Println("h.recTx.UpdateRecurringStatus error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success"})
}
