-- CHAR(3) maps to PostgreSQL bpchar which fails Hibernate schema validation.
-- Convert to VARCHAR(3) to match the JPA entity mapping (mirrors wallet V2 fix).
ALTER TABLE card_transactions ALTER COLUMN currency TYPE VARCHAR(3);
