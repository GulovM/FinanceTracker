-- +goose Up
-- +goose StatementBegin
insert into category (name, type)
values ('Еда и напитки', 'Расход'),
('Покупки', 'Расход'),
('Жилье', 'Расход'),
('Транспорт', 'Расход'),
('Транспортное средство', 'Расход'),
('Жизнь и развлечения', 'Расход'),
('Связь, ПК', 'Расход'),
('Финансовые расходы', 'Расход'),
('Инвестиции', 'Расход'),
('Доход', 'Доход'),
('Прочее', 'Доход'),
('Прочее', 'Расход'),
('Перевод', 'Перевод');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
truncate category restart identity cascade;
-- +goose StatementEnd
