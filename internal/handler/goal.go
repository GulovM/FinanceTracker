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

type goalService interface {
	CreateGoal(ctx context.Context, goal *domain.CreateGoal) error
	GetGoals(ctx context.Context, userID int) ([]*domain.SavingGoal, error)
	GetGoalByID(ctx context.Context, userID, id int) (*domain.SavingGoal, error)
	UpdateGoal(ctx context.Context, goal *domain.UpdateGoal) error
	UpdateGoalStatus(ctx context.Context, userID, id int, status string) error
	GetContributions(ctx context.Context, userID, goalID int) ([]*domain.GoalContribution, error)
	AddContribution(ctx context.Context, userID int, contribution *domain.CreateContribution) error
	DeleteContribution(ctx context.Context, id int) error
}

func (h *Handler) GetGoals(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	result, err := h.goals.GetGoals(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) CreateGoal(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	var in struct {
		Name         string       `json:"name"`
		TargetAmount float64      `json:"target_amount"`
		TargetDate   *domain.Date `json:"target_date"`
		Priority     *int         `json:"priority"`
	}

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	var targetDate *time.Time
	if in.TargetDate != nil {
		t := in.TargetDate.Time
		targetDate = &t
	}

	goal := domain.CreateGoal{
		UserID:       userID,
		Name:         in.Name,
		TargetAmount: in.TargetAmount,
		TargetDate:   targetDate,
		Priority:     in.Priority,
	}

	err = h.goals.CreateGoal(c.Request.Context(), &goal)
	if err != nil {
		fmt.Println("h.goals.CreateGoal error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

func (h *Handler) GetGoalByID(c *gin.Context) {
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

	result, err := h.goals.GetGoalByID(c.Request.Context(), userID, id)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) UpdateGoal(c *gin.Context) {
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
		Name         string       `json:"name"`
		TargetAmount float64      `json:"target_amount"`
		TargetDate   *domain.Date `json:"target_date"`
		Priority     *int         `json:"priority"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	var targetDate *time.Time
	if in.TargetDate != nil {
		t := in.TargetDate.Time
		targetDate = &t
	}

	goal := domain.UpdateGoal{
		ID:           id,
		UserID:       userID,
		Name:         in.Name,
		TargetAmount: in.TargetAmount,
		TargetDate:   targetDate,
		Priority:     in.Priority,
	}

	err = h.goals.UpdateGoal(c.Request.Context(), &goal)
	if err != nil {
		fmt.Println("h.goals.UpdateGoal error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) UpdateGoalStatus(c *gin.Context) {
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
		Status string `json:"status"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = h.goals.UpdateGoalStatus(c.Request.Context(), userID, id, in.Status)
	if err != nil {
		fmt.Println("h.goals.UpdateGoalStatus error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}

func (h *Handler) GetContributions(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	goalID, err := strconv.Atoi(idStr)
	if err != nil || goalID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result, err := h.goals.GetContributions(c.Request.Context(), userID, goalID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) AddContribution(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	idStr := c.Param("id")
	goalID, err := strconv.Atoi(idStr)
	if err != nil || goalID == 0 {
		fmt.Println("convert error: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var in struct {
		TransactionID *int    `json:"transaction_id"`
		Amount        float64 `json:"amount"`
	}

	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	contribution := domain.CreateContribution{
		GoalID:        goalID,
		TransactionID: in.TransactionID,
		Amount:        in.Amount,
	}

	err = h.goals.AddContribution(c.Request.Context(), userID, &contribution)
	if err != nil {
		fmt.Println("h.goals.AddContribution error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

func (h *Handler) DeleteContribution(c *gin.Context) {
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

	err = h.goals.DeleteContribution(c.Request.Context(), id)
	if err != nil {
		fmt.Println("h.goals.DeleteContribution error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "succes"})
}
