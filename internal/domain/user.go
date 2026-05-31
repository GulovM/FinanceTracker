package domain

import (
	"context"
	"time"
)

type User struct {
	ID           int        `json:"id"`
	FirstName    string     `json:"first_name"`
	SecondName   string     `json:"second_name"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"password_hash"`
	CreatedAt    time.Time  `json:"created_at"`
	IsDeleted    bool       `json:"is_deleted"`
	DeletedAt    *time.Time `json:"deleted_at"`
}

type UserProfile struct {
	ID           int    `json:"id"`
	FirstName    string `json:"first_name"`
	SecondName   string `json:"second_name"`
	Email        string `json:"email"`
	PasswordHash string `json:"password_hash"`
}

type UserRegister struct {
	FirstName    string `json:"first_name"`
	SecondName   string `json:"second_name"`
	Email        string `json:"email"`
	PasswordHash string `json:"password_hash"`
}

type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password_hash"`
}

type UserRepository interface {
	RegisterUser(ctx context.Context, user *UserRegister) error
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id int) (*User, error)
	UpdateUser(ctx context.Context, user *UserProfile) error
	DeleteUser(ctx context.Context, id int) error
	RestoreUser(ctx context.Context, user UserLogin) error
}
