-- +goose Up
-- +goose StatementBegin
create type period_type_enum as enum('Ежедневно', 'Еженедельно', 'Ежемесячно', 'Ежегодно');
create type status_type_enum as enum('Активен', 'Остановлен', 'Отменен');
create table if not exists recurring_transaction(
    id serial primary key,
    user_id int not null references users(id),
    account_id int not null references account(id),
    category_id int not null references category(id),
    subcategory_id int null references subcategory(id),
    merchant_id int null references merchant(id),
    type category_type_enum not null,
    amount numeric(18,2) not null,
    recipient varchar(150) null,
    comment text null,
    period_type period_type_enum not null,
    interval int not null default 1,
    day_of_month smallint null,
    day_of_week smallint null,
    start_date date not null,
    end_date date null,
    next_run_at timestamp not null,
    timezone varchar(100) not null default 'Asia/Dushanbe',
    status status_type_enum not null default 'Активен',
    created_at timestamp not null default now(),
    updated_at timestamp null
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists recurring_transaction;
drop type status_type_enum;
drop type period_type_enum;
-- +goose StatementEnd
