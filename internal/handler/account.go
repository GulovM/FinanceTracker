package handler

import (
	"Project/internal/domain"
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type accountService interface {
	CreateAccount(ctx context.Context, account *domain.CreateAccount) error
	UpdateAccount(ctx context.Context, updateAccount *domain.UpdateAccount) error
	TopupAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error
	WithdrowAccount(ctx context.Context, updateAccount *domain.ChangeBalanceAccount) error
	GetAccounts(ctx context.Context, userID int) ([]*domain.Account, error)
	GetAccountByID(ctx context.Context, userID, id int) (*domain.Account, error)
	DeleteAccount(ctx context.Context, userID, id int) error
}

// создание кошелька
func (h *Handler) CreateAccount(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}
	var in domain.CreateAccount

	err := c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	accountCreate := domain.CreateAccount{
		UserID:       userID,
		Name:         in.Name,
		AccountType:  in.AccountType,
		Balance:      in.Balance,
		WalletTypeID: in.WalletTypeID,
		CardTypeID:   in.CardTypeID,
	}

	err = h.accounts.CreateAccount(c.Request.Context(), &accountCreate)
	if err != nil {
		fmt.Println("h.accounts.CreateAccount error:", err)
		writeError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "succes"})
}

// редактирование кошелька
func (h *Handler) UpdateAccount(c *gin.Context) {
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

	in := struct {
		Name         string  `json:"name"`
		AccountType  string  `json:"account_type"`
		Balance      float64 `json:"balance"`
		WalletTypeID *int8   `json:"wallet_type_id"`
		CardTypeID   *int8   `json:"card_type_id"`
	}{}
	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateAccount := domain.UpdateAccount{
		ID:           id,
		UserID:       userID,
		Name:         in.Name,
		AccountType:  in.AccountType,
		Balance:      in.Balance,
		WalletTypeID: in.WalletTypeID,
		CardTypeID:   in.CardTypeID,
	}
	err = h.accounts.UpdateAccount(c.Request.Context(), &updateAccount)
	if err != nil {
		fmt.Println("h.accounts.UpdateAccount error: %w", err)
		writeError(c, err)
		return
	}

	c.JSON(200, gin.H{"message": "succes"})
}

// пополнение кошелька
func (h *Handler) TopupAccount(c *gin.Context) {
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

	in := struct {
		Balance float64 `json:"balance"`
	}{}
	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateAccount := domain.ChangeBalanceAccount{
		ID:      id,
		UserID:  userID,
		Balance: in.Balance,
	}
	err = h.accounts.TopupAccount(c.Request.Context(), &updateAccount)
	if err != nil {
		fmt.Println("h.accounts.TopupAccount error: %w", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}

// withdrow
func (h *Handler) WithdrowAccount(c *gin.Context) {
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

	in := struct {
		Balance float64 `json:"balance"`
	}{}
	err = c.BindJSON(&in)
	if err != nil {
		fmt.Println("bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updateAccount := domain.ChangeBalanceAccount{
		ID:      id,
		UserID:  userID,
		Balance: in.Balance,
	}

	err = h.accounts.WithdrowAccount(c.Request.Context(), &updateAccount)
	if err != nil {
		fmt.Println("h.accounts.WithdrowAccount: %w", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}

// получение кошельков
func (h *Handler) GetAccounts(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}
	result, err := h.accounts.GetAccounts(c.Request.Context(), userID)

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// получение кошелька по id
func (h *Handler) GetAccountByID(c *gin.Context) {
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
	result, err := h.accounts.GetAccountByID(c.Request.Context(), userID, id)

	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(200, result)
}

// soft удаление кошелька
func (h *Handler) DeleteAccount(c *gin.Context) {
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

	err = h.accounts.DeleteAccount(c.Request.Context(), userID, id)
	if err != nil {
		fmt.Println("h.accounts.DeleteAccount error:", err)
		writeError(c, err)
		return
	}
	c.JSON(200, gin.H{"message": "succes"})
}
