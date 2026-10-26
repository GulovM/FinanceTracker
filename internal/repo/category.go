package repo

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) GetCategories(ctx context.Context, userID int) ([]*domain.Category, error) {
	query := `
        select 
			c.id,
			c.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			c.name,
			c.type,
			to_char(c.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(c.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			c.is_deleted,
			c.deleted_at
		from category c
		left join users u on c.user_id = u.id
        where (c.user_id = $1 or c.user_id isnull) and c.is_deleted = false
        order by id;
    `

	rows, err := r.postgres.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		category, err := pgx.RowToStructByName[dbCategory](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		categories = append(categories, category.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return categories, nil
}

func (r *Repository) GetSubcategories(ctx context.Context, id, userID int) ([]*domain.Subcategory, error) {
	query := `
        select 
			s.id,
			s.category_id,
			c.name category_name,
			s.name subcategory_name,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			to_char(s.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			s.user_id,
			s.is_deleted,
			s.deleted_at
		from subcategory s
		left join category c on s.category_id = c.id
		left join users u on s.user_id = u.id
        where s.category_id = $1 and (s.user_id isnull or s.user_id = $2);
    `

	rows, err := r.postgres.Query(ctx, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("query error: %w", err)
	}

	defer rows.Close()

	var subcategories []*domain.Subcategory
	for rows.Next() {
		subcategory, err := pgx.RowToStructByName[dbSubcategory](rows)
		if err != nil {
			return nil, scan_err(err)
		}
		subcategories = append(subcategories, subcategory.ToEntity())
	}
	if err := rows.Err(); err != nil {
		return nil, scan_err(err)
	}
	return subcategories, nil
}

func scanCategory(row pgx.Row) (*domain.Category, error) {
	var categoryDB dbCategory
	err := row.Scan(&categoryDB.ID, &categoryDB.UserID, &categoryDB.UserName, &categoryDB.Name, &categoryDB.Type, &categoryDB.CreatedAt, &categoryDB.UpdatedAt,
		&categoryDB.IsDeleted, &categoryDB.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	return categoryDB.ToEntity(), nil
}

func (r *Repository) getCategoryByID(ctx context.Context, runner RowGetter, categoryID, userID int) (*domain.Category, error) {
	query := `
        select 
			c.id,
			c.user_id,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			c.name,
			c.type,
			to_char(c.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(c.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			c.is_deleted,
			c.deleted_at
		from category c
		left join users u on c.user_id = u.id 
        where c.id = $1 and (c.user_id = $2 or c.user_id isnull) and c.is_deleted = false;
    `

	row := runner.QueryRow(ctx, query, categoryID, userID)
	return scanCategory(row)
}

func (r *Repository) GetCategoryByID(ctx context.Context, categoryID, userID int) (*domain.Category, error) {
	return r.getCategoryByID(ctx, r.postgres, categoryID, userID)
}

func (r *Repository) GetCategoryByIDTx(ctx context.Context, tx pgx.Tx, categoryID, userID int) (*domain.Category, error) {
	return r.getCategoryByID(ctx, tx, categoryID, userID)
}

func scanSubcategory(row pgx.Row) (*domain.Subcategory, error) {
	var subcategoryDB dbSubcategory
	err := row.Scan(&subcategoryDB.ID, &subcategoryDB.CategoryID, &subcategoryDB.CategoryName, &subcategoryDB.Name, &subcategoryDB.UserName, &subcategoryDB.CreatedAt, &subcategoryDB.UpdatedAt,
		&subcategoryDB.UserID, &subcategoryDB.IsDeleted, &subcategoryDB.DeletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errs.ErrNotFound
		}
		return nil, scan_err(err)
	}
	return subcategoryDB.ToEntity(), nil
}

func (r *Repository) getSubcategoryByID(ctx context.Context, runner RowGetter, subcategoryID, userID int) (*domain.Subcategory, error) {
	query := `
        select 
			s.id,
			s.category_id,
			c.name category_name,
			s.name subcategory_name,
			concat(concat(u.second_name, ' '), u.first_name) user_name,
			to_char(s.created_at, 'YYYY-MM-DD HH24:MI:SS') created_at,
			to_char(s.updated_at, 'YYYY-MM-DD HH24:MI:SS') updated_at,
			s.user_id,
			s.is_deleted,
			s.deleted_at
		from subcategory s
		left join category c on s.category_id = c.id
		left join users u on s.user_id = u.id
        where s.id = $1 and (s.user_id = $2 or s.user_id isnull) and s.is_deleted = false;
    `

	row := runner.QueryRow(ctx, query, subcategoryID, userID)
	return scanSubcategory(row)
}

func (r *Repository) GetSubcategoryByID(ctx context.Context, subcategoryID, userID int) (*domain.Subcategory, error) {
	return r.getSubcategoryByID(ctx, r.postgres, subcategoryID, userID)
}

func (r *Repository) GetSubcategoryByIDTx(ctx context.Context, tx pgx.Tx, subcategoryID, userID int) (*domain.Subcategory, error) {
	return r.getSubcategoryByID(ctx, tx, subcategoryID, userID)
}

func (r *Repository) CreateMyCategory(ctx context.Context, createCategory *domain.CreateMyCategory) error {
	query := `
        insert into category (user_id, name, type) 
        values ($1, $2, $3);
    `

	_, err := r.postgres.Exec(ctx, query, createCategory.UserID, createCategory.Name, createCategory.Type)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) CreateMySubcategory(ctx context.Context, createSubcategory *domain.CreateMySubcategory) error {
	query := `
        insert into subcategory (category_id, name, user_id)
        values ($1, $2, $3);
    `

	_, err := r.postgres.Exec(ctx, query, createSubcategory.CategoryID, createSubcategory.Name, createSubcategory.UserID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) UpdateMyCategory(ctx context.Context, updateCategory *domain.UpdateMyCategory) error {
	query := `
    update category set
    name = $1,
    type = $2,
    updated_at = now()
    where id = $3 and user_id = $4 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, updateCategory.Name, updateCategory.Type, updateCategory.ID, updateCategory.UserID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) UpdateMySubcategory(ctx context.Context, updateSubcategory *domain.UpdateMySubcategory) error {
	query := `
    update subcategory set
    category_id = $1,
    name = $2,
    updated_at = now()
    where id = $3 and user_id = $4 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, updateSubcategory.CategoryID, updateSubcategory.Name, updateSubcategory.ID, updateSubcategory.UserID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) DeleteMyCategory(ctx context.Context, id, userID int) error {
	query1 := `
    update category set
    is_deleted = true,
    deleted_at = now()
    where id = $1 and user_id = $2 and is_deleted = false;
    `

	query2 := `
    update subcategory set
    is_deleted = true,
    deleted_at = now()
    where category_id = $1 and is_deleted = false;`
	_, err := r.postgres.Exec(ctx, query1, id, userID)

	if err != nil {
		return exec_err(err)
	}

	_, err = r.postgres.Exec(ctx, query2, id)

	if err != nil {
		return exec_err(err)
	}

	return nil
}

func (r *Repository) DeleteMySubcategory(ctx context.Context, id, userID int) error {
	query := `
    update subcategory set
    is_deleted = true,
    deleted_at = now()
    where id = $1 and user_id = $2 and is_deleted = false;
    `

	_, err := r.postgres.Exec(ctx, query, id, userID)

	if err != nil {
		return exec_err(err)
	}

	return nil
}
