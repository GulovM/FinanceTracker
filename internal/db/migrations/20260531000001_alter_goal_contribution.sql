-- +goose Up
-- +goose StatementBegin
ALTER TABLE goal_contribution ALTER COLUMN transaction_id DROP NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE goal_contribution ALTER COLUMN transaction_id SET NOT NULL;
-- +goose StatementEnd
