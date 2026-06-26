CREATE TABLE card_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id         UUID NOT NULL REFERENCES cards(id),
    user_id         UUID NOT NULL,
    account_id      UUID NOT NULL,                 -- linked bank account that was debited
    merchant        VARCHAR(255) NOT NULL,
    amount          NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    status          VARCHAR(50) NOT NULL CHECK (status IN ('COMPLETED', 'DECLINED')),
    decline_reason  VARCHAR(100),                  -- CARD_FROZEN | LIMIT_EXCEEDED | INSUFFICIENT_FUNDS | ...
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    authorized_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_authorized_at ON card_transactions(authorized_at DESC);
