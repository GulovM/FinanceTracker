-- +goose Up
-- +goose StatementBegin
ALTER TABLE subcategory
ADD COLUMN user_id int null references users(id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
alter TABLE subcategory
drop column user_id cascade;
-- +goose StatementEnd
