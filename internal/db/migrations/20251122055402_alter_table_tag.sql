-- +goose Up
-- +goose StatementBegin
alter table tag
    add column updated_at timestamp null,
    add column is_deleted boolean not null default false,
    add column deleted_at timestamp null;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table tag
    drop column updated_at,
    drop column is_deleted,
    drop column deleted_at;
-- +goose StatementEnd
