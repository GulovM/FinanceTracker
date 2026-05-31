package errs

import "errors"

var (
	ErrUserExist          = errors.New("user with same data exist")
	ErrIntSrv             = errors.New("internal server error")
	ErrNotFound           = errors.New("not found")
	ErrExpOrInvToken      = errors.New("invalid or expired token")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidPassword    = errors.New("the password does not meet the requirements")
	ErrUnauthorized       = errors.New("unauthorized user")
)
