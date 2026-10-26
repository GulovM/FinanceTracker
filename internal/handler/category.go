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

type categoryService interface {
	GetAllCategories(ctx context.Context, userID int) ([]*domain.Category, error)
	GetAllSubcategories(ctx context.Context, categoryID, userID int) ([]*domain.Subcategory, error)
	CreateMyCategory(ctx context.Context, createCategory *domain.CreateMyCategory) error
	CreateMySubcategory(ctx context.Context, createSubcategory *domain.CreateMySubcategory) error
	UpdateMyCategory(ctx context.Context, updateCategory *domain.UpdateMyCategory) error
	UpdateMySubcategory(ctx context.Context, updateSubcategory *domain.UpdateMySubcategory) error
	DeleteMyCategory(ctx context.Context, id, userID int) error
	DeleteMySubcategory(ctx context.Context, id, userID int) error
}

// получение всех категорий
func (h *Handler) GetAllCategories(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	result, err := h.categories.GetAllCategories(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// получение подкатегорий
func (h *Handler) GetAllSubcategories(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	cardTypeID, err := strconv.Atoi(idStr)
	if err != nil || cardTypeID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(400, gin.H{
			"error": "invalid id",
		})
		return
	}
	result, err := h.categories.GetAllSubcategories(c.Request.Context(), cardTypeID, userID)

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// создание категории
func (h *Handler) CreateMyCategory(c *gin.Context) {
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
		Type string `json:"type"`
	}
	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	createCategory := domain.CreateMyCategory{
		UserID: userID,
		Name:   in.Name,
		Type:   in.Type,
	}

	err = h.categories.CreateMyCategory(c.Request.Context(), &createCategory)
	if err != nil {
		fmt.Println("h.categories.CreateMyCategory error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

// создание подкатегории
func (h *Handler) CreateMySubcategory(c *gin.Context) {
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
		CategoryID int    `json:"category_id"`
		Name       string `json:"name"`
	}
	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	createSubcategory := domain.CreateMySubcategory{
		UserID:     userID,
		CategoryID: in.CategoryID,
		Name:       in.Name,
	}

	err = h.categories.CreateMySubcategory(c.Request.Context(), &createSubcategory)
	if err != nil {
		fmt.Println("h.categories.CreateMySubcategory error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

// Редактирование категории
func (h *Handler) UpdateMyCategory(c *gin.Context) {
	idStr := c.Param("id")
	categoryID, err := strconv.Atoi(idStr)
	if err != nil || categoryID == 0 {
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
		Name string `json:"name"`
		Type string `json:"type"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateCategory := domain.UpdateMyCategory{
		ID:     categoryID,
		UserID: userID,
		Name:   in.Name,
		Type:   in.Type,
	}

	err = h.categories.UpdateMyCategory(c.Request.Context(), &updateCategory)

	if err != nil {
		fmt.Println("h.categories.UpdateMyCategory error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

// Редактирование подкатегории
func (h *Handler) UpdateMySubcategory(c *gin.Context) {
	idStr := c.Param("id")
	subcategoryID, err := strconv.Atoi(idStr)
	if err != nil || subcategoryID == 0 {
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
		CategoryID int    `json:"category_id"`
		Name       string `json:"name"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateSubcategory := domain.UpdateMySubcategory{
		ID:         subcategoryID,
		UserID:     userID,
		CategoryID: in.CategoryID,
		Name:       in.Name,
	}

	err = h.categories.UpdateMySubcategory(c.Request.Context(), &updateSubcategory)

	if err != nil {
		fmt.Println("h.categories.UpdateMySubcategory error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

// soft удаление категории
func (h *Handler) DeleteMyCategory(c *gin.Context) {
	idStr := c.Param("id")
	categoryID, err := strconv.Atoi(idStr)
	if err != nil || categoryID == 0 {
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

	err = h.categories.DeleteMyCategory(c.Request.Context(), categoryID, userID)
	if err != nil {
		fmt.Println("h.categories.DeleteMyCategory error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}

// soft удаление подкатегории
func (h *Handler) DeleteMySubcategory(c *gin.Context) {
	idStr := c.Param("id")
	subcategoryID, err := strconv.Atoi(idStr)
	if err != nil || subcategoryID == 0 {
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

	err = h.categories.DeleteMySubcategory(c.Request.Context(), subcategoryID, userID)
	if err != nil {
		fmt.Println("h.categories.DeleteMySubcategory error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}
