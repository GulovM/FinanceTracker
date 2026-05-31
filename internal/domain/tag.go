package domain

import (
	"context"
	"time"
)

type Tag struct {
	ID        int        `json:"id"`
	UserID    int        `json:"user_id"`
	UserName  *string    `json:"user_name,omitempty"`
	Name      string     `json:"tag_name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	IsDeleted bool       `json:"is_deleted"`
	DeletedAt *time.Time `json:"deleted_at"`
}

type UpdateTag struct {
	ID     int    `json:"id"`
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
}

type TagRepository interface {
	CreateTag(ctx context.Context, userID int, name string) error
	GetTags(ctx context.Context, userID int) ([]*Tag, error)
	GetTagByID(ctx context.Context, tagID, userID int) (*Tag, error)
	UpdateTag(ctx context.Context, tag *UpdateTag) error
	DeleteTag(ctx context.Context, tagID, userID int) error
}
