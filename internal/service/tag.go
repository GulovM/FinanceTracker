package service

import (
	"Project/internal/domain"
	"Project/internal/errs"
	"context"
	"errors"
	"fmt"
)

// создание tag
func (s *Service) CreateTag(ctx context.Context, userID int, name string) error {
	err := s.tags.CreateTag(ctx, userID, name)

	if err != nil {
		return fmt.Errorf("s.tags.CreateTag error: %w", err)
	}

	return nil
}

// получение tag
func (s *Service) GetTags(ctx context.Context, userID int) ([]*domain.Tag, error) {
	tags, err := s.tags.GetTags(ctx, userID)

	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return []*domain.Tag{}, nil
		}
		return nil, fmt.Errorf("s.tags.GetTags error: %w", err)
	}

	return tags, nil
}

// редактирование tag
func (s *Service) UpdateTag(ctx context.Context, tag *domain.UpdateTag) error {
	_, err := s.tags.GetTagByID(ctx, tag.ID, tag.UserID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("tag %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.tags.GetTagByID error: %w", err)
	}

	err = s.tags.UpdateTag(ctx, tag)
	if err != nil {
		return fmt.Errorf("s.tags.UpdateTag error: %w", err)
	}

	return nil
}

// удаление tag
func (s *Service) DeleteTag(ctx context.Context, tagID, userID int) error {
	_, err := s.tags.GetTagByID(ctx, tagID, userID)
	if err != nil {
		if errors.Is(err, errs.ErrNotFound) {
			return fmt.Errorf("tag %w", errs.ErrNotFound)
		}
		return fmt.Errorf("s.tags.GetTagByID error: %w", err)
	}

	err = s.tags.DeleteTag(ctx, tagID, userID)
	if err != nil {
		return fmt.Errorf("s.tags.DeleteTag error: %w", err)
	}

	return nil
}
