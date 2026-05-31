-- +goose Up
-- +goose StatementBegin
create table if not exists user_event_log(
    id serial primary key,
    user_id int not null references users(id),
    event_type varchar(100) not null,
    playload jsonb null,
    created_at timestamp not null default now(),
    ip_address varchar(45) null,
    user_agent text null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists user_event_log;
-- +goose StatementEnd
