-- +goose Up
-- +goose StatementBegin
create table if not exists goal_contribution(
    id serial primary key,
    goal_id int not null references saving_goal(id),
    transaction_id int not null references transactions(id),
    amount numeric(18,2) not null,
    created_at timestamp not null default now()
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table if exists goal_contribution;
-- +goose StatementEnd
