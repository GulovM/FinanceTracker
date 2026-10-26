package handler

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type merchantService interface {
	CreateMerchant(ctx context.Context, merchant *domain.CreateMerchant) error
	GetMerchants(ctx context.Context, userID int) ([]*domain.Merchant, error)
	UpdateMerchant(ctx context.Context, merchant *domain.UpdateMerchant) error
	DeleteMerchant(ctx context.Context, merchantID, userID int) error
}

// создание мерчант
func (h *Handler) CreateMerchant(c *gin.Context) {
	val, ok := c.Get("user_id")
	if !ok {
		fmt.Println("\nGet user_id error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}
	userID, ok := val.(int)
	if !ok {
		fmt.Println("\nuser_id convert to int error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	var in struct {
		Name       string `json:"name"`
		CategoryID int    `json:"category_id"`
	}
	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	createMerchant := domain.CreateMerchant{
		UserID:     userID,
		Name:       in.Name,
		CategoryID: in.CategoryID,
	}

	err = h.merchants.CreateMerchant(c.Request.Context(), &createMerchant)
	if err != nil {
		fmt.Println("h.merchants.CreateMerchant error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

// получение мерчант
func (h *Handler) GetMerchants(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	result, err := h.merchants.GetMerchants(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// редактирование мерчант
func (h *Handler) UpdateMerchant(c *gin.Context) {
	idStr := c.Param("id")
	merchantID, err := strconv.Atoi(idStr)
	if err != nil || merchantID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(400, gin.H{
			"error": "invalid id",
		})
		return
	}

	val, ok := c.Get("user_id")
	if !ok {
		fmt.Println("\nGet user_id error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}
	userID, ok := val.(int)
	if !ok {
		fmt.Println("\nuser_id convert to int error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	var in struct {
		Name       string `json:"name"`
		CategoryID int    `json:"category_id"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateMerchant := domain.UpdateMerchant{
		ID:         merchantID,
		UserID:     userID,
		Name:       in.Name,
		CategoryID: in.CategoryID,
	}

	err = h.merchants.UpdateMerchant(c.Request.Context(), &updateMerchant)

	if err != nil {
		fmt.Println("h.merchants.UpdateMerchant error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

func (h *Handler) DeleteMerchant(c *gin.Context) {
	idStr := c.Param("id")
	merchantID, err := strconv.Atoi(idStr)
	if err != nil || merchantID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(400, gin.H{
			"error": "invalid id",
		})
		return
	}

	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	err = h.merchants.DeleteMerchant(c.Request.Context(), merchantID, userID)
	if err != nil {
		fmt.Println("h.merchants.DeleteMerchant error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}
