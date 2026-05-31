-- +goose Up
-- +goose StatementBegin
alter table merchant
    add column is_deleted boolean not null default false,
    add column deleted_at timestamp null;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter table merchant
    drop column is_deleted,
    drop column deleted_at;
-- +goose StatementEnd
