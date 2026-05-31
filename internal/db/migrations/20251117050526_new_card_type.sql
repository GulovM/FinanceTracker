-- +goose Up
-- +goose StatementBegin
create table if not exists card_type(
    id serial primary key,
    name varchar(100) not null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists card_type;
-- +goose StatementEnd
