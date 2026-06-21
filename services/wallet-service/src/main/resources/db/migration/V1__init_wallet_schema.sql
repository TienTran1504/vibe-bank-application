CREATE TABLE wallets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL UNIQUE,
    balance     NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    currency    CHAR(3) NOT NULL DEFAULT 'USD',
    status      VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id   UUID NOT NULL REFERENCES wallets(id),
    type        VARCHAR(50) NOT NULL CHECK (type IN ('TOP_UP', 'WITHDRAWAL', 'TRANSFER')),
    amount      NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    status      VARCHAR(50) NOT NULL DEFAULT 'COMPLETED'
                CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    reference   VARCHAR(255),
    description VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
