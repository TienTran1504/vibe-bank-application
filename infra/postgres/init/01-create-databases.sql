-- Create all service databases on first startup
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE account_db;
CREATE DATABASE transaction_db;
CREATE DATABASE card_db;
CREATE DATABASE wallet_db;
CREATE DATABASE fraud_db;

-- Grant all to the bankapp user
GRANT ALL PRIVILEGES ON DATABASE auth_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE user_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE account_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE transaction_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE card_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE wallet_db TO bankapp;
GRANT ALL PRIVILEGES ON DATABASE fraud_db TO bankapp;
