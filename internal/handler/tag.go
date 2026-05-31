package handler

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type tagService interface {
	CreateTag(ctx context.Context, userID int, name string) error
	GetTags(ctx context.Context, userID int) ([]*domain.Tag, error)
	UpdateTag(ctx context.Context, tag *domain.UpdateTag) error
	DeleteTag(ctx context.Context, tagID, userID int) error
}

// создание tag
func (h *Handler) CreateTag(c *gin.Context) {
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
		Name string `json:"name"`
	}
	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = h.tags.CreateTag(c.Request.Context(), userID, in.Name)
	if err != nil {
		fmt.Println("h.tags.CreateTag error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

// получение tag
func (h *Handler) GetTags(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	result, err := h.tags.GetTags(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// редактирование tag
func (h *Handler) UpdateTag(c *gin.Context) {
	idStr := c.Param("id")
	tagID, err := strconv.Atoi(idStr)
	if err != nil || tagID == 0 {
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

	updateTag := domain.UpdateTag{
		ID:     tagID,
		UserID: userID,
		Name:   in.Name,
	}

	err = h.tags.UpdateTag(c.Request.Context(), &updateTag)

	if err != nil {
		fmt.Println("h.tags.UpdateTag error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

func (h *Handler) DeleteTag(c *gin.Context) {
	idStr := c.Param("id")
	tagID, err := strconv.Atoi(idStr)
	if err != nil || tagID == 0 {
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

	err = h.tags.DeleteTag(c.Request.Context(), tagID, userID)
	if err != nil {
		fmt.Println("h.tags.DeleteTag error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}
