package handler

import (
	"Project/internal/domain"
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type budgetService interface {
	CreateBudget(ctx context.Context, budget *domain.CreateBudget) error
	GetBudgets(ctx context.Context, userID int) ([]*domain.Budget, error)
	GetBudgetByID(ctx context.Context, userID, id int) (*domain.Budget, error)
	UpdateBudget(ctx context.Context, budget *domain.UpdateBudget) error
	DeleteBudget(ctx context.Context, userID, id int) error
	AddBudgetCategories(ctx context.Context, userID, budgetID int, categoryIDs []int) error
	RemoveBudgetCategory(ctx context.Context, userID, budgetID, categoryID int) error
	GetBudgetSummary(ctx context.Context, userID, id int) (*domain.BudgetSummary, error)
}

func (h *Handler) GetBudgets(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	result, err := h.budgets.GetBudgets(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) CreateBudget(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	var in struct {
		Name        string      `json:"name"`
		PeriodType  string      `json:"period_type"`
		PeriodStart domain.Date `json:"period_start"`
		PeriodEnd   domain.Date `json:"period_end"`
		AmountLimit float64     `json:"amount_limit"`
	}

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	budget := domain.CreateBudget{
		UserID:      userID,
		Name:        in.Name,
		PeriodType:  in.PeriodType,
		PeriodStart: in.PeriodStart.Time,
		PeriodEnd:   in.PeriodEnd.Time,
		AmountLimit: in.AmountLimit,
	}

	err = h.budgets.CreateBudget(c.Request.Context(), &budget)
	if err != nil {
		fmt.Println("h.budgets.CreateBudget error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

func (h *Handler) GetBudgetByID(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result, err := h.budgets.GetBudgetByID(c.Request.Context(), userID, id)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) UpdateBudget(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var in struct {
		Name        string      `json:"name"`
		PeriodType  string      `json:"period_type"`
		PeriodStart domain.Date `json:"period_start"`
		PeriodEnd   domain.Date `json:"period_end"`
		AmountLimit float64     `json:"amount_limit"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	budget := domain.UpdateBudget{
		ID:          id,
		UserID:      userID,
		Name:        in.Name,
		PeriodType:  in.PeriodType,
		PeriodStart: in.PeriodStart.Time,
		PeriodEnd:   in.PeriodEnd.Time,
		AmountLimit: in.AmountLimit,
	}

	err = h.budgets.UpdateBudget(c.Request.Context(), &budget)
	if err != nil {
		fmt.Println("h.budgets.UpdateBudget error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) DeleteBudget(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = h.budgets.DeleteBudget(c.Request.Context(), userID, id)
	if err != nil {
		fmt.Println("h.budgets.DeleteBudget error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) AddBudgetCategories(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	budgetID, err := strconv.Atoi(idStr)
	if err != nil || budgetID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var in struct {
		CategoryIDs []int `json:"category_ids"`
	}
	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = h.budgets.AddBudgetCategories(c.Request.Context(), userID, budgetID, in.CategoryIDs)
	if err != nil {
		fmt.Println("h.budgets.AddBudgetCategories error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) RemoveBudgetCategory(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	budgetIDStr := c.Param("id")
	budgetID, err := strconv.Atoi(budgetIDStr)
	if err != nil || budgetID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget id"})
		return
	}

	catIDStr := c.Param("category_id")
	categoryID, err := strconv.Atoi(catIDStr)
	if err != nil || categoryID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	err = h.budgets.RemoveBudgetCategory(c.Request.Context(), userID, budgetID, categoryID)
	if err != nil {
		fmt.Println("h.budgets.RemoveBudgetCategory error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) GetBudgetSummary(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result, err := h.budgets.GetBudgetSummary(c.Request.Context(), userID, id)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}
