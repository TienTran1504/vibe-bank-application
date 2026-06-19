CREATE TABLE bank_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL,
    account_number    VARCHAR(34) NOT NULL UNIQUE,
    account_type      VARCHAR(50) NOT NULL CHECK (account_type IN ('SAVINGS', 'CHECKING', 'WALLET')),
    currency          CHAR(3) NOT NULL DEFAULT 'USD',
    balance           NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    available_balance NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    status            VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON bank_accounts(account_number);
