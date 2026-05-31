-- +goose Up
-- +goose StatementBegin
create table if not exists merchant(
    id serial primary key,
    user_id int not null references users(id),
    name varchar(150) not null,
    category_id int not null references category(id),
    created_at timestamp not null default now(),
    updated_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists merchant;
-- +goose StatementEnd
