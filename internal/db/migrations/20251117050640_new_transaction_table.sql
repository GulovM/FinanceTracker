-- +goose Up
-- +goose StatementBegin
create table if not exists transactions(
    id serial primary key,
    user_id int not null references  users(id),
    account_id int not null references account(id),
    category_id int not null references category(id),
    subcategory_id int null references subcategory(id),
    merchant_id int null references merchant(id),
    type category_type_enum not null,
    amount numeric(18,2) not null,
    recipient varchar(150) null,
    comment text null,
    created_at timestamp not null default now(),
    updated_at timestamp null,
    recurring_id int null references recurring_transaction(id),
    transfer_id int null references transfers(id),
    is_deleted boolean not null default false,
    deleted_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists transactions;
-- +goose StatementEnd
