-- +goose Up
-- +goose StatementBegin
create table if not exists subcategory(
    id serial primary key,
    category_id int not null references category(id),
    name varchar(150) not null,
    created_at timestamp not null default now(),
    updated_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists subcategory;
-- +goose StatementEnd
