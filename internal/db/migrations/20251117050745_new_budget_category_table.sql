-- +goose Up
-- +goose StatementBegin
create table if not exists budget_category(
    id serial primary key,
    budget_id int not null references budget(id),
    category_id int not null references category(id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists budget_category;
-- +goose StatementEnd
