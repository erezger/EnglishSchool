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
  {
    id: 3,
    name: 'grades_and_word_lists',
    sql: `
      ALTER TABLE users ADD COLUMN grade SMALLINT CHECK (grade BETWEEN 1 AND 12);

      CREATE TABLE word_lists (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        student_id  UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = every kid in the family
        title       TEXT NOT NULL,
        created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX word_lists_family_idx ON word_lists (family_id);

      CREATE TABLE words (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        list_id       UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
        word          TEXT NOT NULL,
        hebrew        TEXT NOT NULL DEFAULT '',
        emoji         TEXT NOT NULL DEFAULT '',
        example_en    TEXT NOT NULL DEFAULT '',
        example_he    TEXT NOT NULL DEFAULT '',
        ai_generated  BOOLEAN NOT NULL DEFAULT false,  -- true until a parent edits/approves it
        position      INT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX words_list_word_key ON words (list_id, lower(word));
    `,
  },
  {
    id: 4,
    name: 'mastery_checks_and_coin_adjustments',
    sql: `
      -- Parent-assigned checks of what a kid marked as known. Questions + answers stay server-side.
      CREATE TABLE checks (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
        scopes         TEXT[] NOT NULL,
        status         TEXT NOT NULL DEFAULT 'assigned'
                       CHECK (status IN ('assigned', 'in_progress', 'done', 'cancelled')),
        questions      JSONB NOT NULL,
        answers        JSONB NOT NULL DEFAULT '{}'::jsonb,
        results        JSONB,
        total          INT NOT NULL,
        score          INT,
        coins_awarded  INT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        started_at     TIMESTAMPTZ,
        finished_at    TIMESTAMPTZ
      );
      CREATE INDEX checks_student_idx ON checks (student_id, created_at DESC);

      -- Coins added/removed by a parent, with a reason the kid sees.
      CREATE TABLE coin_adjustments (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount      INT NOT NULL CHECK (amount <> 0),   -- requested
        applied     INT NOT NULL,                        -- actual change (coins never go below 0)
        reason      TEXT NOT NULL,
        created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        seen_at     TIMESTAMPTZ
      );
      CREATE INDEX coin_adjustments_student_idx ON coin_adjustments (student_id, created_at DESC);
    `,
  },
  {
    id: 5,
    name: 'kid_settings',
    sql: `
      -- Per-kid settings chosen by parents (e.g. which practice modules are off).
      ALTER TABLE users ADD COLUMN settings JSONB NOT NULL DEFAULT '{}'::jsonb;
    `,
  },
  {
    id: 6,
    name: 'activity_log',
    sql: `
      -- Practice activity per kid, per day (Israel date), per module. Rows are incremented.
      CREATE TABLE activity (
        student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day         DATE NOT NULL,
        module      TEXT NOT NULL,
        answers     INT NOT NULL DEFAULT 0,
        correct     INT NOT NULL DEFAULT 0,
        seconds     INT NOT NULL DEFAULT 0,
        PRIMARY KEY (student_id, day, module)
      );
    `,
  },
];
