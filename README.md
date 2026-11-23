# אנגלית בקליק PRO

Next.js 16 + Postgres. Kids learn English phonics; parents/teachers manage kids, rewards and resets.
The original Gemini single-file app (`code_artifact.html`) is kept for reference; the game is a 1:1
React rewrite of it (`src/components/game`), with all content in `src/content/game.ts`.

## Accounts & permissions

| Role | Logs in with | Can |
|---|---|---|
| **student** | username + 4-digit PIN | play, earn coins, buy in the shop, redeem rewards (coins deducted now, waits for a parent) |
| **parent** (parent / teacher / mentor — unlimited per family) | username + password | everything in *their own family*: add kids, set PIN, reset progress, rewards, mark redemptions done/cancel (refund), add other guardians |
| **admin** | username + password | everything in every family, create new families |

- Every rule is enforced **on the server** in each API route (`requireUser` + family scoping); hiding buttons is just UX.
- Sensitive parent actions (reset, delete, change PIN, remove guardian) require re-entering the parent's password.
- Login: 5 wrong attempts lock the user for 5 min, doubling up to 60 min (parent can unlock kids); 30 attempts / 10 min per IP.
- Passwords/PINs hashed with scrypt (Node built-in). Sessions in Postgres, `HttpOnly` + `SameSite=Lax` (+ `Secure` in production) cookie, 30 days sliding.
- Writes require same-origin (CSRF). User-entered text is HTML-escaped in the game.

## Structure

```
src/app/login, /parent, /admin, /        pages (/ = the game, students only)
src/app/api/auth/*                       login / logout / me
src/app/api/me/*                         student: progress (versioned), rewards, redemptions; guardian: password
src/app/api/family/*                     guardian actions, scoped to their family (?familyId= for admin)
src/app/api/admin/families               admin: list/create families
src/lib/migrations.ts                    append-only schema migrations (applied automatically at startup)
src/lib/bootstrap.ts                     one-time import of pre-auth data + first admin from env
src/lib/{session,http,family,rewards,progress,passwords}.ts
src/components/game/                     the main game (letters, blender, build-a-word, quiz, challenges, sentences, shop)
src/components/{kid,parent,report}/      practice modules, parent dashboard, weekly report
src/content/                             game content (game.ts = source of truth; phonics.ts derives from it), word bank, stories...
tests/api.test.mjs                       authorization & flow tests (run against a non-production server)
```

Progress sync: the game saves every action with the version it is based on. If the server copy changed
meanwhile (e.g. a parent reset), the save is rejected (409) and the device adopts the server copy, so a
reset is never silently undone. Other devices pick up changes within ~5s.

## Deploying this version (first time with accounts)

1. **Back up** the DB:
   `docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup-before-auth.sql`
2. Add to the server's `.env` (see `.env.example`):
   ```
   ADMIN_USERNAME=...        # your login
   ADMIN_PASSWORD=...        # 8+ chars; only used to create the admin the first time
   ADMIN_DISPLAY_NAME=...
   FAMILY_NAME=...           # name for the family the existing kids are moved into
   ```
3. Deploy (merge to `main` → GitHub Actions). On startup the app:
   - creates the new tables,
   - moves the existing kids (avigail, rani) with all progress, rewards and history into a family,
   - creates your admin account in that family.
   Check: `docker compose logs app | grep -E 'bootstrap|db|startup'`
4. Log in at `/login` → "הורה / מורה" → set a **PIN for each kid** (they can't log in until you do).

Without `ADMIN_USERNAME/ADMIN_PASSWORD` no admin is created (a warning is logged) — add them and restart.

## Deploy / update (general)

```bash
cp .env.example .env    # first time: fill in passwords, APP_PORT, ADMIN_*
docker compose up -d --build
curl http://127.0.0.1:3000/api/health        # {"ok":true,"db":"up"}
```
nginx: see `deploy/nginx.conf.example` (proxy to 127.0.0.1:APP_PORT, keep the X-Forwarded-* headers), HTTPS via certbot.

## Data safety & backups

- Data lives in the Docker volume `<project>_pgdata`; `docker compose up -d --build` never touches it.
  **Never** run `docker compose down -v` / `docker volume prune` on the server.
- Pin the project name in each server `.env` (different per environment!) so renaming a folder can't
  switch to a new empty volume: `COMPOSE_PROJECT_NAME=school` / `COMPOSE_PROJECT_NAME=school-staging`.
- Every deploy (GitHub Actions) first dumps the DB to `~/backups/<env>/<date>_<commit>.sql.gz`
  (last 14 kept). If the backup fails, the deploy is aborted.

Off-server copy (recommended): set `BACKUP_UPLOAD_URL` in the server `.env` and every deploy also uploads the
backup to Oracle Object Storage (`<env>/<file>.sql.gz`). If the upload fails the deploy still continues.
1. OCI Console → Object Storage → create a bucket (e.g. `school-backups`, private).
2. Bucket → Pre-Authenticated Requests → Create: target "Objects with prefix" (empty prefix),
   access "Permit object writes", pick an expiry (e.g. 1 year — renew it before it expires).
3. Copy the URL (it ends with `/o/`) into `BACKUP_UPLOAD_URL=` in `~/school/.env` and `~/school-staging/.env`.
4. Optional: a bucket lifecycle rule to delete objects older than e.g. 60 days.

Manual backup:
```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' | gzip > backup.sql.gz
```

Restore (replaces the current data — stop the app first):
```bash
docker compose stop app
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
gzip -dc ~/backups/school/<file>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
docker compose start app
```

## Local development

```bash
npm install
cp .env.example .env            # same password in POSTGRES_PASSWORD and DATABASE_URL; COOKIE_SECURE=false
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db   # Postgres on 127.0.0.1:5433
npm run dev                     # http://localhost:3000
npm test                        # app running with LOGIN_IP_LIMIT=1000; uses BASE_URL / ADMIN_USERNAME / ADMIN_PASSWORD
```
