/**
 * Ordered, append-only list of schema migrations.
 * NEVER edit a migration that has shipped — add a new one instead.
 * Applied automatically at server start (see src/lib/db.ts -> ready()).
 */
export type Migration = { id: number; name: string; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'legacy_profiles',
    // The table from the first (pre-auth) version. Kept so old data can be imported.
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id          TEXT PRIMARY KEY,
        data        JSONB NOT NULL,
        version     BIGINT NOT NULL DEFAULT 1,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
  {
    id: 2,
    name: 'users_families_sessions',
    sql: `
      CREATE TABLE families (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE users (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id      UUID REFERENCES families(id) ON DELETE CASCADE,
        role           TEXT NOT NULL CHECK (role IN ('admin', 'parent', 'student')),
        username       TEXT NOT NULL,
        display_name   TEXT NOT NULL,
        secret_hash    TEXT,                -- NULL = cannot log in yet (e.g. PIN not set)
        failed_logins  INT NOT NULL DEFAULT 0,
        locked_until   TIMESTAMPTZ,
        disabled       BOOLEAN NOT NULL DEFAULT false,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at  TIMESTAMPTZ,
        CHECK (role = 'admin' OR family_id IS NOT NULL)
      );
      CREATE UNIQUE INDEX users_username_key ON users (lower(username));
      CREATE INDEX users_family_idx ON users (family_id);

      CREATE TABLE sessions (
        token_hash    TEXT PRIMARY KEY,     -- sha256 of the cookie token; raw token never stored
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at    TIMESTAMPTZ NOT NULL,
        user_agent    TEXT
      );
      CREATE INDEX sessions_user_idx ON sessions (user_id);

      CREATE TABLE student_progress (
        user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data        JSONB NOT NULL,
        version     BIGINT NOT NULL DEFAULT 1,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE rewards (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        cost        INT NOT NULL CHECK (cost > 0),
        created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX rewards_student_idx ON rewards (student_id);

      CREATE TABLE redemptions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_id     UUID REFERENCES rewards(id) ON DELETE SET NULL,
        title         TEXT NOT NULL,        -- copied so history survives reward deletion
        cost          INT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
        requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        resolved_at   TIMESTAMPTZ,
        resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX redemptions_student_idx ON redemptions (student_id, requested_at DESC);

      CREATE TABLE app_meta (
        key    TEXT PRIMARY KEY,
        value  TEXT NOT NULL
      );

      CREATE TABLE audit_log (
        id          BIGSERIAL PRIMARY KEY,
        actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
        action      TEXT NOT NULL,
        target_id   UUID,
        details     JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
];
