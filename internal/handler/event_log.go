package handler

import (
	"Project/internal/domain"
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type eventLogService interface {
	GetEvents(ctx context.Context, filter *domain.EventFilter) ([]*domain.UserEventLog, error)
}

func (h *Handler) GetUserEvents(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthotized"})
		return
	}

	q := c.Request.URL.Query()
	filter := &domain.EventFilter{UserID: userID}

	if v := q.Get("event_type"); v != "" {
		filter.EventType = &v
	}

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

	result, err := h.eventLog.GetEvents(c.Request.Context(), filter)
	if err != nil {
		writeError(c, err)
		return
	}

	c.JSON(http.StatusOK, result)
}
