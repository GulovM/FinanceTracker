-- +goose Up
-- +goose StatementBegin
create type account_enum as enum('Наличные', 'Карта', 'Кошелек', 'Депозит', 'Другое');
create table if not exists account(
    id serial primary key,
    user_id int not null references users(id),
    name varchar(150) not null,
    account_type account_enum not null,
    balance numeric(18, 2) not null default 0,
    wallet_type_id int null references wallet_type(id),
    card_type_id int null references card_type(id),
    created_at timestamp not null default now(),
    updated_at timestamp null,
    is_deleted boolean not null default false,
    deleted_at timestamp null
); 
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists account;
drop type account_enum;
-- +goose StatementEnd
