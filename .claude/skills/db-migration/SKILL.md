---
name: db-migration
description: Create a Flyway database migration for a schema change — new table, alter column, add index. Includes JPA entity updates and repository changes.
disable-model-invocation: true
---

Create a database migration. Description: $ARGUMENTS

Steps:

1. **Check existing migrations** — look at `services/<service>/src/main/resources/db/migration/` to find the latest version number.

2. **Design the SQL** following these rules:
   - File name: `V<next_number>__<description_in_snake_case>.sql`
   - Primary keys: `UUID DEFAULT gen_random_uuid()`
   - Money amounts: `NUMERIC(19, 4) NOT NULL`
   - Timestamps: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - Always include `created_at` and `updated_at` on new tables
   - Add indexes for: all FK columns, `status`, `created_at`
   - Use `IF NOT EXISTS` for safety

3. **Write the migration file** — clean, commented SQL.

4. **Update the JPA entity** if the migration adds/modifies columns that map to an existing `@Entity`.

5. **Update repository** if new query methods are needed for the new columns.

6. **Test the migration** by running `mvn flyway:migrate` (or confirming the app starts cleanly).

7. Use the `db-reviewer` subagent to validate the migration before finalizing.

IMPORTANT: Never modify an existing migration file — always create a new version.
