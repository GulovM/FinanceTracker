-- +goose Up
-- +goose StatementBegin
create table if not exists tag(
    id serial primary key,
    user_id int not null references users(id),
    name varchar(100) not null,
    created_at timestamp not null default now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists tag;
-- +goose StatementEnd
