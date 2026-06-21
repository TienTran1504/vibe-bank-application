-- CHAR(3) maps to PostgreSQL bpchar which fails Hibernate schema validation.
-- This migration converts the column to VARCHAR(3) to match the JPA entity mapping.
ALTER TABLE wallets ALTER COLUMN currency TYPE VARCHAR(3);
