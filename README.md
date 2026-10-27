# KIM SIHO Portfolio — PostgreSQL 17 existing-DB refactor

Next.js 16 + React 19 + TypeScript, PostgreSQL-backed public pages and administrator CRUD. The portfolio now focuses on full-stack internship/job applications: selected projects, role and implementation details, work and education, skills, awards, and contact. Korean/English routes and existing DB compatibility are retained.

## Production deploy tracking

The server runs `~/services/portfolio/deploy-portfolio.sh` outside this checkout.
Its versioned source and isolated regression tests are `scripts/deploy-portfolio.sh`
and `scripts/check-deploy.py`; see [deployment setup and retry rules](db/DEPLOYMENT.md).
Deployment is skipped only when the recorded successful commit, running image/container,
Docker health and both APIs match. Pulling Git first or retrying a failed deployment
does not count as a successful deployment. The deployment default is `main`.
Reconcile the existing PostgreSQL 17 compatibility branch into `main` before
switching an existing server; do not deploy the older DB/bootstrap Compose stack.

## Local design preview (no Docker or production database)

```bash
npm ci
npm run preview
```

Open `http://127.0.0.1:3100/ko` or `/en`. This **explicit preview command** creates a disposable, in-memory PGlite database on loopback port `55439`, using the historical repository JSON as a fixture. It ignores the existing `DATABASE_URL`, generates temporary administrator secrets, does not persist data, and displays a preview notice. The fixture demonstrates the application; it is not a copy of the live PostgreSQL 17 schema or its current contents. Close with Ctrl+C. `PREVIEW_PORT` can override the web port.

For a production-build preview, run `npm run build` followed by `npm run preview:production`. This runs the standalone server with the same temporary fixture. These preview commands are never called by Docker, `npm start`, or production startup.

## Presentation and content

- Self-hosted Pretendard variable font, with its OFL license under `public/fonts/`; no external font CSS requests.
- Shared Korean word wrapping covers titles, prose, roles, and metadata. Headings balance lines, paragraphs avoid short trailing lines where supported, and compact actions wrap as whole controls. Narrow screens release decorative hard breaks; long email addresses and filenames retain overflow protection.
- Cinematic scene sequence: ink opening → forest featured project → light project archive → slate experience → blue engineering → amber awards → ink contact. The original section color and scroll concept is developed through distinct compositions rather than a uniform dark theme.
- The featured project has three acts (overview, implementation, results), with a sticky visual that follows the active act on desktop. Mobile uses normal document flow. The page retains native scrolling, accessible scene links, reduced-motion support, and a separate print layout.
- The opening uses large typography, a perspective light plane and a next-scene link instead of the former side card. Scroll progress changes the light's position; scene colors also carry through the navigation indicator.
- The requested identity “셈을 못하는 상인” is retained as the opening title; the rejected philosophy sentence remains retired. “아이디어를 현실로 만드는 개발자” appears in the default introduction. The desktop chapter index uses an unboxed hairline track, persistent labels, and 44px targets. Header actions use a consistent SVG arrow instead of font glyphs. The opening light has no isolated point decoration.
- Project search by name/description/role, translated status labels, clear filters, and missing-date handling.
- The technical section opens with a bubble usage map. Circle area increases with distinct recorded project counts using a fixed scale across searches and category/proficiency filters. Selecting a circle reveals its projects and connects technologies used in the same projects. Disconnected skills have a separate small-circle section, while the list view retains full category/name/status records. Tablet/mobile use native-size circles and labels instead of shrinking the desktop SVG. Counts represent project usage, not proficiency scores.
- Explicit `technology_evidence` links connect skills to work, education, awards, activities and acquired credentials. The detail panel separates practice, learning, attendance and credentials; skills with only non-project evidence appear in their own group. The same event is deduplicated through experience/project references. These records do not increase the bubble's project count. No keywords or related-project stacks are automatically converted into experience.
- Bubble diameters are now 45–47% of the initial map at the same chart width. Desktop names use native 13px HTML text, independent of circle scaling. A ResizeObserver adapts seeded organic packing to the available width; circle and label shapes are tested separately, and the result is vertically cropped to remove empty space. There is no regular-grid fallback.
- Recognition uses an amber award-room composition with engraved laurel medallions, a large first record, supporting award cards, and links to related projects. The same cards appear in the recognition archive. The navigation shows the name without a decorative initial.
- Confirmed participation only in the public experience page. Unconfirmed program records remain in the database and administrator; they are not presented as achievements.
- Email is configured through `contact.email` in `lib/site-content.ts`. The user-provided default is `ksh@keyda.site`; the exact previous Gmail address is replaced at read time without modifying DB rows.
- The PDF button opens the browser print dialog. Print styles remove navigation and decorative covers. It does not claim that a separate PDF has already been generated.
- `resolveSiteContent()` replaces exact retired template phrases at read time while preserving custom text and database rows. No migration or seed runs as part of this change.
- Missing contributions and results are not invented. Populate project roles, technical decisions, outcomes, and supporting materials using actual records.

Design changes were made on top of PR #3's compatibility branch, baseline `68ad7b11348ed915b68ec1363545a4a9bbfdab3a`, rather than the older `main`.

> **Preservation rules:** Existing `portfolio-postgres` (PostgreSQL 17), the `portfolio` database and its records are never reset. The historical fixture has 19 projects/27 technologies; verified live maintenance on 2026-10-22 preserved 19 projects/41 project links and added 6 technologies/8 evidence rows. This version does **not** create any Postgres service, run schema.sql, bootstrap, seed or migration during deployment.

## Backup before agent DB maintenance

Every agent-executed DB change requires a fresh, verified backup **before** writing. Configure the ignored local `.env`, install PostgreSQL 17+ client tools, then run `npm run db:snapshot -- before operation-slug`. This read-only command creates a full local recovery archive, a public portfolio JSON export and a verification manifest in ignored `.backups/`. It does not modify portfolio rows or automatically upload data to Obsidian.

The agent must review and mirror the public JSON/manifest into a new timestamped Basic Memory note in project `my-portfolio`, read it back, perform the scoped transaction, and record a new after-snapshot and change log. No credentials, private rows or raw dumps go to Obsidian/Git. Failed backups or failed pre-change memory storage block writes. The administrator UI does not automatically implement this maintenance workflow. See [the complete workflow](db/BACKUP_WORKFLOW.md) and `AGENTS.md`.

Run `npm run check:snapshot` for disposable-memory-DB tests of export privacy and backup preflight. Archive readability/hash verification is separate from a real restore test in an isolated DB.

When the user authenticates an SSH agent, `npm run db:snapshot:ssh -- before operation-slug` uses SSH plus the existing container's `pg_dump`, `pg_restore` and `psql`, without reading DB connection secrets. The default SSH alias is `ksh@kshserver`; `PORTFOLIO_SSH_TARGET` can override it. Both transports export the archive and JSON from the same PostgreSQL snapshot and require reviewed Obsidian mirroring/read-back before any mutation.

The additive `db/technology-evidence.sql` defines the optional evidence table. It was manually applied to the live DB on 2026-10-22 in a backed-up, validated transaction; never run it automatically or reapply it. Public projection fails closed for private, ambiguous, unknown-attendance and unearned-credential references. An older DB without this table still returns an empty evidence list. See `db/TECHNOLOGY_EVIDENCE.md`.

## Deployment on existing Ubuntu host

Prerequisites: existing running `portfolio-postgres` container accessible on external Docker network `portfolio-net`; existing `keyda-tunnel` running in host network mode. `docker network inspect portfolio-net` and `docker ps` may be used to inspect. Do not remove volumes or containers.

```bash
# From a newly cloned/refactored working directory
test -f .env || cp .env.example .env
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
docker compose config --quiet
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

The admin uses server-side entity allowlists with writable columns discovered from live `information_schema.columns` (generated, system and sensitive fields excluded) and validates required columns based on the live schema. PostgreSQL applies FK, unique, enum and CHECK constraints. If `site_content` is unavailable, the administrator hides that resource and the public site uses Korean/English defaults in `lib/site-content.ts` without inserting rows.

### Security

- Keep `.env` off Git. Never commit a populated config or database dump.
- `/admin` and `/api/admin/*` require authentication; POST/PUT/DELETE also verify request origin. Session cookies are HttpOnly, SameSite=Strict and Secure behind HTTPS forwarding.
- Recommended **Cloudflare Access** application policy: protect BOTH `/admin*` **and** `/api/admin/*` with your identity policy. Configure externally in Cloudflare before public administrative use.
- Admin APIs return generic DB errors; logs include SQLSTATE and constraint name but never credentials, query parameters or request bodies.
- `ksh.keyda.site` is reachable over Cloudflare Tunnel; local Docker port only listens on `127.0.0.1:3001`.

### Tests & DB read-only verification

```bash
npm run check:static      # source schema contract / dangerous compose pattern / source baseline
npm run check:content     # retired copy, custom copy, locale fallback regression checks
npm run check:evidence    # evidence privacy, event deduplication, FK/check/unique constraints
npm run check:snapshot    # public backup export and fail-closed preflight
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
