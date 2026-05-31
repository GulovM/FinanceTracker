-- +goose Up
-- +goose StatementBegin
create type status_goal_enum as enum('Активный', 'Достигнут', 'Отменен');
create table if not exists saving_goal(
    id serial primary key,
    user_id int not null references users(id),
    name varchar(150) not null,
    target_amount numeric(18,2) not null,
    target_date date null,
    status status_goal_enum not null default 'Активный',
    priority int null,
    created_at timestamp not null default now(),
    updated_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists saving_goal;
drop type status_goal_enum;
-- +goose StatementEnd
