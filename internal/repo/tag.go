package repo

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

// создание tag
func (r *Repository) CreateTag(ctx context.Context, userID int, name string) error {
	query := `
		insert into tag (user_id, name)
		values ($1, $2);
	`

	_, err := r.postgres.Exec(ctx, query, userID, name)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

// получение tag
func (r *Repository) GetTags(ctx context.Context, userID int) ([]*domain.Tag, error) {
	query := `
		select 
			t.id,
			t.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			t.name tag_name,
			to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			t.is_deleted,
			t.deleted_at
		from tag t
		left join users u on t.user_id = u.id
		where t.user_id = $1 and t.is_deleted = false;
	`

	rows, err := r.postgres.Query(ctx, query, userID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var tags []*domain.Tag

	for rows.Next() {
		tag, err := pgx.RowToStructByName[dbTag](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		tags = append(tags, tag.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return tags, nil
}

// получение tag по id
func (r *Repository) GetTagByID(ctx context.Context, tagID, userID int) (*domain.Tag, error) {
	query := `
		select 
			t.id,
			t.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			t.name tag_name,
			to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			t.is_deleted,
			t.deleted_at
		from tag t
		left join users u on t.user_id = u.id
		where t.id = $1 and t.user_id = $2 and t.is_deleted = false;
	`

	row := r.postgres.QueryRow(ctx, query, tagID, userID)

	var tag dbTag

	err := row.Scan(&tag.ID, &tag.UserID, &tag.UserName, &tag.Name, &tag.CreatedAt,
		&tag.UpdatedAt, &tag.IsDeleted, &tag.DeletedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}

	return tag.ToEntity(), nil
}

// редактирование tag
func (r *Repository) UpdateTag(ctx context.Context, tag *domain.UpdateTag) error {
	query := `
		update tag set
		name = $1,
		updated_at = now()
		where id = $2 and user_id = $3;
	`

	_, err := r.postgres.Exec(ctx, query, tag.Name, tag.ID, tag.UserID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

// удаление tag
func (r *Repository) DeleteTag(ctx context.Context, tagID, userID int) error {
	query := `
		update tag set
		is_deleted = true,
		deleted_at = now()
		where id = $1 and user_id = $2;
	`

	_, err := r.postgres.Exec(ctx, query, tagID, userID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
