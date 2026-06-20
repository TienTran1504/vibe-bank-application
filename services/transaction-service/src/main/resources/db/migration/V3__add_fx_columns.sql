ALTER TABLE transactions
    ADD COLUMN to_currency      VARCHAR(3),
    ADD COLUMN exchange_rate    NUMERIC(19, 8),
    ADD COLUMN fee_amount       NUMERIC(19, 4),
    ADD COLUMN converted_amount NUMERIC(19, 4);
