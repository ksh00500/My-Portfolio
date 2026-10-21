# KIM SIHO Portfolio — PostgreSQL 17 existing-DB refactor

Next.js 16 + React 19 + TypeScript frontend, server APIs, database-driven content and administrator CRUD. Original cinematic visuals, organic technology distribution network, bilingual `/ko` / `/en`, projects, achievements and timeline retained.

> **Preservation rules:** Existing `portfolio-postgres` (PostgreSQL 17), `portfolio` database, 19 projects and 27 technologies are never reset. This version does **not** create any Postgres service, run schema.sql, bootstrap, seed or migration during deployment.

## Deployment on existing Ubuntu host

Prerequisites: existing running `portfolio-postgres` container accessible on external Docker network `portfolio-net`; existing `keyda-tunnel` running in host network mode. `docker network inspect portfolio-net` and `docker ps` may be used to inspect. Do not remove volumes or containers.

```bash
# From a newly cloned/refactored working directory
cp .env.example .env
# Edit .env using an editor. Do not print credentials in terminal logs.
# Set DATABASE_URL with URL-encoded password, ADMIN_PASSWORD and SESSION_SECRET (>=32 chars).
# Example format: postgresql://portfolio_admin:<URL_ENCODED_PASSWORD>@portfolio-postgres:5432/portfolio

# Non-destructive validation of the project source
npm run check:static

# Optional READ-ONLY DB introspection; run only where PostgreSQL can be reached
# (node_modules / pg must have been installed by npm install first)
npm install
npm run db:verify

# Build and run ONLY the web container, bound to host loopback
# Existing database container and volume are not touched.
docker compose config
docker compose up -d --build web

docker compose ps
docker compose logs --tail=80 web
npm run check:smoke
```

Do **not** use `docker compose down -v`, `docker volume rm`, `DROP`, `TRUNCATE` or initialization scripts. `down` without `-v` will only stop Compose-managed web container, but avoid it if other services share Compose files. `docker compose up -d --build web` targets the web service only.

Existing Cloudflare Tunnel service URL: **`http://127.0.0.1:3001`**, since `keyda-tunnel` uses `network_mode: host`. Public target: `https://ksh.keyda.site/ko`. Do not change the tunnel destination to the container hostname in this topology.

## Application routes

| Path | Purpose |
|---|---|
| `/ko`, `/en` | Bilingual home |
| `/ko/projects`, `/en/projects` | Project archive |
| `/ko/projects/senro` | SENRO case study |
| `/ko/experience`, `/ko/recognition` | Experience and honors |
| `/admin` | Cookie-authenticated content administrator |
| `/api/health`, `/api/portfolio`, `/api/projects`, `/api/technologies`, `/api/experience`, `/api/recognition` | Public read-only APIs |
| `/api/admin/resources` | Authenticated list of tables actually available in DB |
| `/api/admin/schema` | Authenticated read-only table/column inspection |

Public pages use `is_public = true`, and project source links are exposed only when `source_code_visibility='public'`. Relations use exactly the columns `project_id`, `technology_id`, `usage_note`, `is_primary` — no unverified `confirmed` markers or made-up weights. Circle size is computed from project link counts.

The admin uses server-side entity allowlists intersected with live `information_schema.columns` and validates required columns based on the live schema. PostgreSQL applies FK, unique, enum and CHECK constraints. For an unavailable `site_content` table, the administrator hides that resource, and the public site uses original Korean/English copy stored in `lib/site-content.ts` (does not insert any row).

### Security

- Keep `.env` off Git. Never commit a populated config or database dump.
- `/admin` and `/api/admin/*` require authentication; POST/PUT/DELETE also verify request origin. Session cookies are HttpOnly, SameSite=Strict and Secure behind HTTPS forwarding.
- Recommended **Cloudflare Access** application policy: protect BOTH `/admin*` **and** `/api/admin/*` with your identity policy. Configure externally in Cloudflare before public administrative use.
- Admin APIs return generic DB errors; logs include SQLSTATE and constraint name but never credentials, query parameters or request bodies.
- `ksh.keyda.site` is reachable over Cloudflare Tunnel; local Docker port only listens on `127.0.0.1:3001`.

### Tests & DB read-only verification

```bash
npm run check:static      # source schema contract / dangerous compose pattern / source baseline
npm run data:check        # checks historical imported JSON, not the production database
npm run typecheck         # TypeScript check (requires installed packages)
npm run build             # Next.js production build (requires installed packages)
npm run db:verify         # SELECT-only information_schema and row counts (requires DB connectivity)
npm run check:smoke       # GET-only API and page checks (requires running server)
```

No CRUD test is run against the production database. Use a separate disposable test database to perform insert/update/delete tests. Do not assume the historical seed data equals the live DB. See `db/SCHEMA_COMPATIBILITY.md` for reported schema differences and verification limitations.

### Source code structure

- `lib/repository.ts` — public data read, optional table handling, privacy filtering, bilingual copy fallback
- `lib/schema-introspection.ts` — read-only DB catalog inspection and safe error metadata
- `lib/admin-data.ts` / `lib/admin-resources.ts` — schema-aware admin CRUD, PK/FK handling
- `app/api/*` — public read APIs and protected administrator APIs
- `components/TechAtlas.tsx` — DB relationship based organic technology map
- `docker-compose.yml` — existing external `portfolio-net`, web-only deploy
- `scripts/verify-existing-db.mjs` — PostgreSQL read-only verification

### Status and limitations

At refactor time the real PostgreSQL schema dump `001_portfolio_schema.sql` and remote DB connection were not provided inside this execution environment, so physical DB validation, full Next.js typecheck/build, real API smoke tests and Cloudflare live verification are **not claimed as completed**. Application performs run-time live column inspection for safety, but deployments should run `db:verify` and smoke checks in the host environment before promoting to production.

The historical `db/schema.sql` is a **reference from the initial prototype**. Never run it against the existing production database. An optional future `site_content` migration could enable editing bilingual strings in DB, but is not required for the current site and must be reviewed separately before any manual application.
