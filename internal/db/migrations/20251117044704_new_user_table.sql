-- +goose Up
-- +goose StatementBegin
create table if not exists users (
    id serial primary key,
    first_name varchar(50) not null,
    second_name varchar(50) not null,
    email varchar(255) unique not null,
    password_hash varchar(255) not null,
    created_at timestamp not null default now(),
    is_deleted boolean not null default false,
    deleted_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists users;
-- +goose StatementEnd
