-- +goose Up
-- +goose StatementBegin
create type period_type_enum2 as enum('Еженедельный', 'Ежемесячный', 'Кастомный');
create table if not exists budget(
    id serial primary key,
    user_id int not null references users(id),
    name varchar(150) not null,
    period_type period_type_enum2 not null,
    period_start date not null,
    period_end date not null,
    amount_limit numeric(18,2) not null,
    created_at timestamp not null default now(),
    updated_at timestamp null,
    is_deleted boolean not null default false,
    deleted_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists budget;
drop type period_type_enum2;
-- +goose StatementEnd
