CREATE TABLE cards (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    account_id          UUID NOT NULL,
    card_number_masked  VARCHAR(19) NOT NULL,
    card_token          VARCHAR(255) NOT NULL UNIQUE,
    card_type           VARCHAR(50) NOT NULL CHECK (card_type IN ('VIRTUAL', 'PHYSICAL')),
    status              VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'FROZEN', 'CANCELLED')),
    spending_limit      NUMERIC(19, 4),
    expiry_date         DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
