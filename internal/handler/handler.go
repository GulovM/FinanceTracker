package handler

import (
	"Project/internal/auth"
	"Project/internal/errs"
	"Project/internal/logger"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	users        userService
	accounts     accountService
	cards        cardWalletService
	categories   categoryService
	merchants    merchantService
	tags         tagService
	transactions transactionService
	transfers    transferService
	recTx        recTransactionService
	budgets      budgetService
	goals        goalService
	eventLog     eventLogService
	jwtManager   *auth.JWTManager
}

type Deps struct {
	Users        userService
	Accounts     accountService
	Cards        cardWalletService
	Categories   categoryService
	Merchants    merchantService
	Tags         tagService
	Transactions transactionService
	Transfers    transferService
	RecTx        recTransactionService
	Budgets      budgetService
	Goals        goalService
	EventLog     eventLogService
	JWTManager   *auth.JWTManager
}

func NewHandler(deps Deps) *Handler {
	return &Handler{
		users:        deps.Users,
		accounts:     deps.Accounts,
		cards:        deps.Cards,
		categories:   deps.Categories,
		merchants:    deps.Merchants,
		tags:         deps.Tags,
		transactions: deps.Transactions,
		transfers:    deps.Transfers,
		recTx:        deps.RecTx,
		budgets:      deps.Budgets,
		goals:        deps.Goals,
		eventLog:     deps.EventLog,
		jwtManager:   deps.JWTManager,
	}
}

func (h *Handler) InitRoutes() *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())

	// по умолчанию разрешаем любой origin, для продакшена задаётся CORS_ALLOWED_ORIGIN
	allowedOrigin := os.Getenv("CORS_ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// публичные роуты
	user := router.Group("/users")
	{
		user.POST("/auth/register", h.RegisterUser)
		user.POST("/auth/login", h.LoginUser)
		user.PATCH("/auth/restore", h.RestoreUser)
	}

	// защищенные роуты
	authGroup := router.Group("/")
	authGroup.Use(AuthMiddleware(h.jwtManager))
	{
		protectedUsers := authGroup.Group("/users")
		{
			protectedUsers.GET("/:id/get", h.GetUser)
			protectedUsers.PATCH("/:id/update", h.UpdateUser)
			protectedUsers.DELETE("/:id/delete", h.DeleteUser)
		}

		authGroup.GET("/card", h.GetCardTypes)
		authGroup.GET("/wallet", h.GetWalletTypes)

		protectedAccounts := authGroup.Group("/accounts")
		{
			protectedAccounts.POST("/", h.CreateAccount)
			protectedAccounts.PATCH("/:id/update", h.UpdateAccount)
			protectedAccounts.PATCH("/:id/topup", h.TopupAccount)
			protectedAccounts.PATCH("/:id/withdrow", h.WithdrowAccount)
			protectedAccounts.GET("", h.GetAccounts)
			protectedAccounts.GET("/:id", h.GetAccountByID)
			protectedAccounts.DELETE("/:id", h.DeleteAccount)
		}

		protectedCategories := authGroup.Group("/category")
		{
			protectedCategories.GET("/categories", h.GetAllCategories)
			protectedCategories.POST("/add-category", h.CreateMyCategory)
			protectedCategories.PATCH("/:id/update-category", h.UpdateMyCategory)
			protectedCategories.DELETE("/:id/delete-category", h.DeleteMyCategory)
			protectedCategories.GET("/:id/subcategories", h.GetAllSubcategories)
			protectedCategories.POST("/add-subcategory", h.CreateMySubcategory)
			protectedCategories.PATCH("/:id/update-subcategory", h.UpdateMySubcategory)
			protectedCategories.DELETE("/:id/delete-subcategory", h.DeleteMySubcategory)
		}

		protectedMerchants := authGroup.Group("/merchant")
		{
			protectedMerchants.GET("", h.GetMerchants)
			protectedMerchants.POST("", h.CreateMerchant)
			protectedMerchants.PATCH("/:id", h.UpdateMerchant)
			protectedMerchants.DELETE("/:id", h.DeleteMerchant)
		}

		protectedTags := authGroup.Group("/tag")
		{
			protectedTags.GET("", h.GetTags)
			protectedTags.POST("", h.CreateTag)
			protectedTags.PATCH("/:id", h.UpdateTag)
			protectedTags.DELETE("/:id", h.DeleteTag)
		}

		protectedTransactions := authGroup.Group("/transactions")
		{
			protectedTransactions.GET("", h.GetTransactions)
			protectedTransactions.POST("", h.CreateTransaction)
			protectedTransactions.PATCH("/:id", h.UpdateTransaction)
			protectedTransactions.DELETE("/:id", h.DeleteTransaction)
		}

		protectedTransfers := authGroup.Group("/tranfers")
		{
			protectedTransfers.POST("", h.CreateTransfer)
			protectedTransfers.GET("", h.GetTranfers)
			protectedTransfers.GET("/:id", h.GetTranferByID)
		}

		protectedRT := authGroup.Group("/recurring-transactions")
		{
			protectedRT.GET("", h.GetRecTransactions)
			protectedRT.GET("/list", h.GetRecTransactionsList)
			protectedRT.GET("/:id", h.GetRecTransactionByID)
			protectedRT.POST("", h.CreateRecTransaction)
			protectedRT.PATCH("/:id", h.UpdateRecTransaction)
			protectedRT.PATCH("/:id/pause", h.StopRecTransaction)
			protectedRT.PATCH("/:id/resume", h.ActivateRecTransaction)
			protectedRT.DELETE("/:id/", h.CancelRecTransaction)
		}

		protectedBudgets := authGroup.Group("/budgets")
		{
			protectedBudgets.GET("", h.GetBudgets)
			protectedBudgets.POST("", h.CreateBudget)
			protectedBudgets.GET("/:id", h.GetBudgetByID)
			protectedBudgets.PATCH("/:id", h.UpdateBudget)
			protectedBudgets.DELETE("/:id", h.DeleteBudget)
			protectedBudgets.POST("/:id/categories", h.AddBudgetCategories)
			protectedBudgets.DELETE("/:id/categories/:category_id", h.RemoveBudgetCategory)
			protectedBudgets.GET("/:id/summary", h.GetBudgetSummary)
		}

		protectedGoals := authGroup.Group("/goals")
		{
			protectedGoals.GET("", h.GetGoals)
			protectedGoals.POST("", h.CreateGoal)
			protectedGoals.GET("/:id", h.GetGoalByID)
			protectedGoals.PATCH("/:id", h.UpdateGoal)
			protectedGoals.PATCH("/:id/status", h.UpdateGoalStatus)
			protectedGoals.GET("/:id/contributions", h.GetContributions)
			protectedGoals.POST("/:id/contributions", h.AddContribution)
		}

		authGroup.DELETE("/goal-contributions/:id", h.DeleteContribution)

		authGroup.GET("/user-events", h.GetUserEvents)
	}
	return router
}

// publicMessage отдаёт клиенту текст ошибки начиная с sentinel,
// отбрасывая внутреннюю цепочку обёрток вида "s.merchants.CreateMerchant error: ...".
func publicMessage(err, sentinel error) string {
	msg := err.Error()
	if i := strings.Index(msg, sentinel.Error()); i >= 0 {
		return msg[i:]
	}
	return msg
}

func writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, errs.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"error": errs.ErrInvalidCredentials.Error()})
	case errors.Is(err, errs.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": errs.ErrNotFound.Error()})
	case errors.Is(err, errs.ErrUserExist):
		c.JSON(http.StatusConflict, gin.H{"error": errs.ErrUserExist.Error()})
	case errors.Is(err, errs.ErrInvalidPassword):
		c.JSON(http.StatusBadRequest, gin.H{"error": errs.ErrInvalidPassword.Error()})
	case errors.Is(err, errs.ErrUnauthorized):
		c.JSON(http.StatusUnauthorized, gin.H{"error": errs.ErrUnauthorized.Error()})
	case errors.Is(err, errs.ErrInvalidInput):
		c.JSON(http.StatusBadRequest, gin.H{"error": publicMessage(err, errs.ErrInvalidInput)})
	case errors.Is(err, errs.ErrInsufficientFunds):
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": errs.ErrInsufficientFunds.Error()})
	case errors.Is(err, errs.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": publicMessage(err, errs.ErrForbidden)})
	default:
		logger.Log.Error().Err(err).Msg("internal error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": errs.ErrIntSrv.Error()})
	}
}
