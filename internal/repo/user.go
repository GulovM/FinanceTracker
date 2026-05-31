package repo

import (
	"Project/internal/errs"
	"Project/internal/domain"
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) RegisterUser(ctx context.Context, user *domain.UserRegister) error {
	query := `
	insert into users(first_name, second_name, email, password_hash)
	values ($1, $2, $3, $4);
	`

	_, err := r.postgres.Exec(ctx, query, user.FirstName, user.SecondName, user.Email, user.PasswordHash)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		select * from users where email=$1;
	`

	var userDB dbUsers

	row := r.postgres.QueryRow(ctx, query, email)
	err := row.Scan(&userDB.ID, &userDB.FirstName, &userDB.SecondName, &userDB.Email, &userDB.PasswordHash,
		&userDB.CreatedAt, &userDB.IsDeleted, &userDB.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return userDB.ToEntity(), nil
}

func (r *Repository) GetUserByID(ctx context.Context, id int) (*domain.User, error) {
	query := `
	select * from users where id = $1;
	`

	var userDB dbUsers

	row := r.postgres.QueryRow(ctx, query, id)

	err := row.Scan(&userDB.ID, &userDB.FirstName, &userDB.SecondName, &userDB.Email, &userDB.PasswordHash,
		&userDB.CreatedAt, &userDB.IsDeleted, &userDB.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return userDB.ToEntity(), nil
}

func (r *Repository) UpdateUser(ctx context.Context, user *domain.UserProfile) error {
	query := `
	update users set first_name = $1, 
	second_name = $2, 
	email = $3, 
	password_hash = $4
	where id = $5;
	`

	_, err := r.postgres.Exec(ctx, query, user.FirstName, user.SecondName, user.Email, user.PasswordHash, user.ID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) DeleteUser(ctx context.Context, id int) error {
	query := `
	update users set 
		is_deleted = true, 
		deleted_at = now()
		where id = $1;
	`

	_, err := r.postgres.Exec(ctx, query, id)
	if err != nil {
		return exec_err(err)
	}
	return nil
}

func (r *Repository) RestoreUser(ctx context.Context, user domain.UserLogin) error {
	query := `
	update users set is_deleted=false, deleted_at=null where email = $1;
	`

	_, err := r.postgres.Exec(ctx, query, user.Email)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
