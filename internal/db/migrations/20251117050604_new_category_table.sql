-- +goose Up
-- +goose StatementBegin
create type category_type_enum as enum('Доход', 'Расход', 'Перевод');
create table if not exists category(
    id serial primary key,
    user_id int null references users(id),
    name varchar(150) not null,
    type category_type_enum not null,
    created_at timestamp not null default now(),
    updated_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists category;
drop type category_type_enum;
-- +goose StatementEnd
