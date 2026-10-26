package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
)

// Регистрация
func (s *Service) RegisterUser(ctx context.Context, user *domain.UserRegister) error {
	if len(user.PasswordHash) < 6 {
		return errs.ErrInvalidPassword
	}

	_, err := s.users.GetUserByEmail(ctx, user.Email)
	switch {
	case err == nil:
		// email занят: активным или удалённым (удалённый восстанавливается через RestoreUser)
		return errs.ErrUserExist
	case !errors.Is(err, errs.ErrNotFound):
		return fmt.Errorf("s.users.GetUserByEmail error: %w", err)
	}

	hash, err := s.hasher.Hash(user.PasswordHash)
	if err != nil {
		return fmt.Errorf("s.hasher.Hash error: %w", err)
	}

	userReg := domain.UserRegister{
		FirstName:    user.FirstName,
		SecondName:   user.SecondName,
		Email:        user.Email,
		PasswordHash: hash,
	}

	user.PasswordHash = ""

	err = s.users.RegisterUser(ctx, &userReg)
	if err != nil {
		return fmt.Errorf("s.users.RegisterUser error: %w", err)
	}

	return nil
}

// Логин
func (s *Service) LoginUser(ctx context.Context, userLogin *domain.UserLogin) (*int, error) {
	user, err := s.users.GetUserByEmail(ctx, userLogin.Email)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrInvalidCredentials
		}
		return nil, fmt.Errorf("s.users.LoginUser: %w", err)
	}

	if user.IsDeleted {
		return nil, errs.ErrNotFound
	}

	if !s.hasher.Compare(user.PasswordHash, userLogin.Password) {
		return nil, errs.ErrInvalidCredentials
	}

	s.LogEvent(ctx, &domain.CreateEvent{
		UserID:    user.ID,
		EventType: domain.EventLogin,
	})

	return &user.ID, nil
}

// Получение данных пользователя по id
func (s *Service) GetUserByID(ctx context.Context, id int) (*domain.User, error) {
	userDB, err := s.users.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("s.users.GetUser error: %w", err)
	}
	return userDB, nil
}

// Обновление данных пользователя
func (s *Service) UpdateUser(ctx context.Context, user *domain.UserProfile) error {
	if len(user.PasswordHash) < 6 {
		return errs.ErrInvalidPassword
	}

	u, err := s.users.GetUserByID(ctx, user.ID)

	if err != nil {
		return fmt.Errorf("s.users.CheckUser %w", err)
	}

	if u.IsDeleted {
		return errs.ErrNotFound
	}

	hash, err := s.hasher.Hash(user.PasswordHash)
	if err != nil {
		return fmt.Errorf("s.hasher.Hash error: %w", err)
	}

	userUp := domain.UserProfile{
		ID:           user.ID,
		FirstName:    user.FirstName,
		SecondName:   user.SecondName,
		Email:        user.Email,
		PasswordHash: hash,
	}

	user.PasswordHash = ""

	err = s.users.UpdateUser(ctx, &userUp)
	if err != nil {
		return fmt.Errorf("s.users.UpdateUser error: %w", err)
	}
	return nil
}

func (s *Service) DeleteUser(ctx context.Context, id int) error {
	u, err := s.users.GetUserByID(ctx, id)

	if err != nil {
		return fmt.Errorf("s.users.CheckUser %w", err)
	}

	if u.IsDeleted {
		return errs.ErrNotFound
	}

	err = s.users.DeleteUser(ctx, id)
	if err != nil {
		return fmt.Errorf("s.users.DeleteUser error: %w", err)
	}
	return nil
}

func (s *Service) RestoreUser(ctx context.Context, user domain.UserLogin) error {
	u, err := s.users.GetUserByEmail(ctx, user.Email)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return errs.ErrInvalidCredentials
		}
		return fmt.Errorf("check user error: %w", err)
	}

	// без проверки пароля любой мог бы восстановить чужой удалённый аккаунт по email
	if !s.hasher.Compare(u.PasswordHash, user.Password) {
		return errs.ErrInvalidCredentials
	}

	err = s.users.RestoreUser(ctx, user)

	if err != nil {
		return fmt.Errorf("s.users.RestoreUser error: %w", err)
	}

	return nil
}
