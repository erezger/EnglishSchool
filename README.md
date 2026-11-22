# אנגלית בקליק PRO

Next.js 16 + Postgres. The original Gemini single-file app (`code_artifact.html`, kept for reference)
was ported as-is; Firebase was replaced by a small API backed by Postgres.

## Structure

```
src/app/layout.tsx              html shell (RTL, fonts, body theme classes)
src/app/page.tsx                renders <LegacyApp />
src/app/globals.css             Tailwind + the original custom CSS
src/app/api/profiles            GET  /api/profiles          -> both profiles + version
src/app/api/profiles/[id]       GET/PUT /api/profiles/:id   (id = avigail | rani)
src/app/api/health              GET  /api/health            -> 200 when app + DB are up
src/lib/db.ts                   pg pool + auto-creates the `profiles` table
src/lib/profiles.ts             queries + validation
src/components/LegacyApp.tsx    mounts the original markup and boots the original logic
src/legacy/markup.ts            original body markup
src/legacy/app.js               original app logic (sync layer rewritten for the API)
```

Data: one row per child in table `profiles (id, data jsonb, version, updated_at)`.
Every action saves immediately; other devices pick up changes within ~5s (polling + on focus).
If the server is unreachable, progress is kept in the browser and uploaded automatically when it's back.

## Deploy (server with Docker + existing nginx)

```bash
# 1. copy the project folder to the server (node_modules/.next not needed), then:
cp .env.example .env
#    edit .env: set a strong POSTGRES_PASSWORD, and APP_PORT to a free port (default 3000)

# 2. build & start (app + postgres)
docker compose up -d --build
curl http://127.0.0.1:3000/api/health        # {"ok":true,"db":"up"}

# 3. nginx: add a server block like deploy/nginx.conf.example (proxy to 127.0.0.1:APP_PORT),
#    then: sudo nginx -t && sudo systemctl reload nginx
#    HTTPS:  sudo certbot --nginx -d your.domain
```

Update after code changes: `docker compose up -d --build` (data lives in the `pgdata` volume and is kept).

Backup: `docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup.sql`

## Local development

```bash
npm install
cp .env.example .env            # set the same password in POSTGRES_PASSWORD and DATABASE_URL
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db   # Postgres on 127.0.0.1:5433
npm run dev                     # http://localhost:3000
```

## Not done yet (next steps)

- **No authentication** — anyone who reaches the URL can change progress. Add before sharing widely
  (e.g. nginx basic auth as a quick fix, or a parent PIN + session).
- Split `src/legacy` into real React components.
