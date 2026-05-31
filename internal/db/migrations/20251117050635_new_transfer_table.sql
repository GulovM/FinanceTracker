-- +goose Up
-- +goose StatementBegin
create table if not exists transfers(
    id serial primary key,
    user_id int not null references users(id),
    from_account_id int not null references account(id),
    to_account_id int not null references account(id),
    amount numeric(18,2) not null,
    created_at timestamp not null default now(),
    comment text null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists transfers;
-- +goose StatementEnd
