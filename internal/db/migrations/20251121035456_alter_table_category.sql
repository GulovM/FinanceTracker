-- +goose Up
-- +goose StatementBegin
ALTER TABLE category
    ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
    ADD COLUMN deleted_at timestamp NULL;

ALTER TABLE subcategory
    ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
    ADD COLUMN deleted_at timestamp NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table category 
    drop column is_deleted,
    drop column deleted_at;

alter table subcategory 
    drop column is_deleted,
    drop column deleted_at;
-- +goose StatementEnd
