package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
)

// получение всех категорий
func (s *Service) GetAllCategories(ctx context.Context, userID int) ([]*domain.Category, error) {
	categories, err := s.categories.GetCategories(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("s.categories.GetCategories error: %w", err)
	}

	return categories, nil
}

// получение подкатегорий
func (s *Service) GetAllSubcategories(ctx context.Context, categoryID, userID int) ([]*domain.Subcategory, error) {
	subcategories, err := s.categories.GetSubcategories(ctx, categoryID, userID)

	if err != nil {
		return nil, fmt.Errorf("s.categories.GetSubcategories error: %w", err)
	}

	return subcategories, nil
}

// создание категории
func (s *Service) CreateMyCategory(ctx context.Context, createCategory *domain.CreateMyCategory) error {
	err := s.categories.CreateMyCategory(ctx, createCategory)
	if err != nil {
		return fmt.Errorf("s.categories.CreateMyCategory error: %w", err)
	}
	return nil
}

// создание подкатегории
func (s *Service) CreateMySubcategory(ctx context.Context, createSubcategory *domain.CreateMySubcategory) error {
	err := s.categories.CreateMySubcategory(ctx, createSubcategory)
	if err != nil {
		return fmt.Errorf("s.categories.CreateMySubcategory error: %w", err)
	}
	return nil
}

// редактирование категории
func (s *Service) UpdateMyCategory(ctx context.Context, updateCategory *domain.UpdateMyCategory) error {
	ctg, err := s.categories.GetCategoryByID(ctx, updateCategory.ID, updateCategory.UserID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.categories.GetMyCategoryByID: %w", err)
	}
	if ctg.UserID == nil {
		return fmt.Errorf("%w: global categories can not be modified", errs.ErrForbidden)
	}
	err = s.categories.UpdateMyCategory(ctx, updateCategory)
	if err != nil {
		return fmt.Errorf("s.categories.UpdateMyCategory: %w", err)
	}
	return nil
}

// редактирование подкатегории
func (s *Service) UpdateMySubcategory(ctx context.Context, updateSubcategory *domain.UpdateMySubcategory) error {
	stg, err := s.categories.GetSubcategoryByID(ctx, updateSubcategory.ID, updateSubcategory.UserID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("subcategory %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.categories.GetMySubcategoryByID: %w", err)
	}
	if stg.UserID == nil {
		return fmt.Errorf("%w: global subcategories can not be modified", errs.ErrForbidden)
	}
	err = s.categories.UpdateMySubcategory(ctx, updateSubcategory)
	if err != nil {
		return fmt.Errorf("s.categories.UpdateMySubcategory: %w", err)
	}
	return nil
}

// soft удаление категории
func (s *Service) DeleteMyCategory(ctx context.Context, id, userID int) error {
	ctg, err := s.categories.GetCategoryByID(ctx, id, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("category %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.categories.GetMyCategoryByID: %w", err)
	}
	if ctg.UserID == nil {
		return fmt.Errorf("%w: global categories can not be modified", errs.ErrForbidden)
	}
	err = s.categories.DeleteMyCategory(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("s.categories.DeleteMyCategory: %w", err)
	}
	return nil
}

// soft удаление подкатегории
func (s *Service) DeleteMySubcategory(ctx context.Context, id, userID int) error {
	stg, err := s.categories.GetSubcategoryByID(ctx, id, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("subcategory %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.categories.GetMySubcategoryByID: %w", err)
	}
	if stg.UserID == nil {
		return fmt.Errorf("%w: global categories can not be modified", errs.ErrForbidden)
	}
	err = s.categories.DeleteMySubcategory(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("s.categories.DeleteMySubcategory: %w", err)
	}
	return nil
}
