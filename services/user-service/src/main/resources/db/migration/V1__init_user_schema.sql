CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    address         TEXT,
    country_code    CHAR(2),
    kyc_status      VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                    CHECK (kyc_status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    kyc_reviewed_at TIMESTAMPTZ,
    kyc_reviewed_by UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_kyc_status ON user_profiles(kyc_status);
