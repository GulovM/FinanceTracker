-- +goose Up
-- +goose StatementBegin
create table if not exists transaction_tag(
    id serial primary key,
    transaction_id int not null references transactions(id),
    tag_id int not null references tag(id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists transaction_tag;
-- +goose StatementEnd
