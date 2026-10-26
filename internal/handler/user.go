package handler

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type userService interface {
	RegisterUser(ctx context.Context, user *domain.UserRegister) error
	LoginUser(ctx context.Context, userLogin *domain.UserLogin) (*int, error)
	GetUserByID(ctx context.Context, id int) (*domain.User, error)
	UpdateUser(ctx context.Context, user *domain.UserProfile) error
	DeleteUser(ctx context.Context, id int) error
	RestoreUser(ctx context.Context, user domain.UserLogin) error
}

func (h *Handler) RegisterUser(c *gin.Context) {
	var request domain.UserRegister

	err := c.BindJSON(&request)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = h.users.RegisterUser(c.Request.Context(), &domain.UserRegister{
		FirstName:    request.FirstName,
		SecondName:   request.SecondName,
		Email:        request.Email,
		PasswordHash: request.PasswordHash,
	})
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(201, gin.H{"message": "success"})
}

func (h *Handler) LoginUser(c *gin.Context) {
	var request domain.UserLogin
	err := c.BindJSON(&request)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	id, err := h.users.LoginUser(c.Request.Context(), &request)
	if err != nil {
		writeError(c, err)
		return
	}

	token, err := h.jwtManager.Generate(*id)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}

func (h *Handler) GetUser(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}
	result, err := h.users.GetUserByID(c.Request.Context(), userID)

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	val, ok := c.Get("user_id")
	if !ok {
		fmt.Println("\nGet user_id error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	userID, ok := val.(int)
	if !ok {
		fmt.Println("\nuser_id conver to int error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	var in domain.UserRegister

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userUP := domain.UserProfile{
		ID:           userID,
		FirstName:    in.FirstName,
		SecondName:   in.SecondName,
		Email:        in.Email,
		PasswordHash: in.PasswordHash,
	}

	err = h.users.UpdateUser(c.Request.Context(), &userUP)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "success"})
}

func (h *Handler) DeleteUser(c *gin.Context) {
	val, ok := c.Get("user_id")
	if !ok {
		fmt.Println("\nGet user_id error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	userID, ok := val.(int)
	if !ok {
		fmt.Println("\nuser_id conver to int error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
		return
	}

	err := h.users.DeleteUser(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "success"})
}

func (h *Handler) RestoreUser(c *gin.Context) {
	var request domain.UserLogin
	err := c.BindJSON(&request)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	err = h.users.RestoreUser(c.Request.Context(), request)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "success"})
}
