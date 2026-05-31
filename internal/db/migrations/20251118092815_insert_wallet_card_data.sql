-- +goose Up
-- +goose StatementBegin
insert into wallet_type (name)
values ('Алиф Mobi'),
    ('Эсхата Онлайн'),
    ('DC'),
    ('Humo Online'),
    ('IBT'),
    ('Oriyon'),
    ('Васл'),
    ('ICB Mobile'),
    ('Эмин Сармоя'),
    ('IMONLINE'),
    ('Зудамал'),
    ('CCБ Мобайл'),
    ('Sarvat'),
    ('DBT PAY'),
    ('Пайванд Кошелёк'),
    ('Spitamen Pay'),
    ('Актив Банк'),
    ('Moliya Pay'),
    ('Пайкар Wallet'),
    ('«Фаври»'),
    ('«Арванд»'),
    ('«МегаФон Life»');

insert into card_type (name)
values ('Корти Милли'),
    ('Visa'),
    ('Mastercard'),
    ('UnionPay'),
    ('МИР');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
truncate wallet_type restart identity cascade; 
truncate card_type restart identity cascade; 
-- +goose StatementEnd
