# Refactor report — 2026-10-21

## Status

Source changes completed in separate GitHub branch, not deployed to the live server. The operating PostgreSQL database was NOT accessed or modified during this work. Do not treat source-level tests as proof of live compatibility.

## 1. Changed source / key changes

- `lib/repository.ts` — use `profiles`, inspect optional tables/columns, avoid `verification_status`/`effort_weight`, public data isolation, site-copy fallback and safe media sorting.
- `lib/schema-introspection.ts` (new) — read-only information_schema lookup, allowlisted SQL identifier quoting, safe SQLSTATE logs/error translation.
- `lib/site-content.ts` (new) — source-preserved 14 bilingual site strings, when `site_content` is absent.
- `lib/admin-data.ts`, `lib/admin-resources.ts` — physical `profiles` mapping, schema-aware writable columns, required/default/null validations, UUID generation, constrained CRUD, optional audit table.
- `lib/types.ts` — relationship type contains actual four attributes.
- `app/api/admin/project-technologies/route.ts` — safe upsert/delete based on four actual fields, no fabricated verification.
- `app/api/admin/[entity]/**`, `app/api/admin/resources`, `app/api/admin/schema` — safe CRUD errors, runtime column metadata and authenticated live schema inspection.
- `app/admin/page.tsx` — dynamic fields/available resources, simplified four-field relationship editor, no unsupported weight/verification flags; only editable columns loaded into JSON editor.
- `app/[lang]/layout.tsx`, project detail and home, `components/TechAtlas.tsx` — correct public queries, missing media behavior, null-safe rendering and source-linked graph with unchanged cinematic appearance.
- `lib/db.ts`, `lib/auth.ts`, auth route, `next.config.ts` — DATE-safe serialization, error metadata without SQL parameter values, proxy-aware CSRF/cookie handling, admin response hardening.
- `docker-compose.yml`, `Dockerfile`, `.dockerignore`, `.env.example` — existing `portfolio-net` only; no additional PostgreSQL, no automatic DB bootstrap/seed. Expose only `127.0.0.1:3001`.
- `scripts/verify-existing-db.mjs`, `scripts/static-contract-check.mjs`, `scripts/smoke-readonly.mjs` — read-only validation scripts; legacy seed/bootstrap entrypoints removed from repo.
- `db/SCHEMA_COMPATIBILITY.md` — reported differences and future optional migration guidance; `db/schema.sql` explicitly marked legacy prototype reference.

## 2. Reported schema mismatch list

1. `profile` -> `profiles`.
2. No `project_technologies.effort_weight` or `project_technologies.verification_status`.
3. No `media_assets.display_order`.
4. No `site_content` table.
5. Old Compose creates PostgreSQL 16 and runs bootstrap; actual environment already has PostgreSQL 17.

These points are grounded in the user's operational diagnostics. The complete live schema/DDL has **not** been inspected in this environment. `db/schema.sql` in the initial application ZIP is a legacy prototype reference, not the operational `001_portfolio_schema.sql` specified by the user.

## 3. Resolved without database changes

All five reported issues have source-level fixes. Frontend reads current PostgreSQL tables and uses sensible fallback behavior for optional columns/data. The four-column join relation is used by the graph and administrator. Public responses filter `is_public` and hide nonpublic project GitHub URLs. Admin CRUD uses actual column metadata at runtime and relies on PostgreSQL PK/FK/CHECK/enum constraints.

## 4. Optional future migrations

No migration is required for the reported differences. If you want to edit site copy in the admin rather than in the versioned fallback module, manually review and approve an additive `site_content` table migration **in a separate change**. Do not auto-apply SQL.

## 5. Validation outcomes

| Test | Status |
|---|---|
| Source contract safety checks | PASS (`node scripts/static-contract-check.mjs`) |
| Historical JSON baseline 19 projects / 27 technologies | PASS (`node scripts/validate-seed.mjs`; not operating DB) |
| TypeScript/TSX syntax parse | PASS (38 files parsed by TypeScript transpiler) |
| Docker Compose YAML parse and external network structure | PASS (PyYAML) |
| Full `tsc --noEmit` | **NOT VERIFIED** (npm dependencies unavailable; missing React/Next types) |
| Next.js production build | **NOT VERIFIED** (npm dependencies unavailable) |
| PostgreSQL 17 schema and actual 19 / 27 database counts | **NOT VERIFIED** (no server DB access) |
| All public APIs and UI page HTTP smoke tests | **NOT VERIFIED** (no app server) |
| Admin login and CRUD integration | **NOT VERIFIED** (no test database; production mutations prohibited) |
| Public Cloudflare `https://ksh.keyda.site/ko` | **NOT VERIFIED** (no tunnel/live deployment access) |

## 6. Safe deployment and verification

See `README.md` for exact commands. Use `npm run db:verify` on a connected host, `npm run typecheck`, `npm run build`, `docker compose up -d --build web`, then `npm run check:smoke`. Only read-only verification was authored; no changes were sent to the running DB. Apply Cloudflare Access policy to `/admin*` and `/api/admin/*` before exposing admin externally.

## 7. Risks / remaining work

- Obtain actual `001_portfolio_schema.sql` or a read-only catalog export, compare column types and table constraints. Some runtime optionality is dynamic, but required table names and expected data shapes still need live proof.
- Resolve any full Next.js typecheck/build errors on a connected install environment.
- Verify API results and `is_public=false` records, project detail and graph relations, admin login and CRUD on a **separate test DB**, not production.
- Do not merge to `main` as implicit evidence of successful production deployment. Keep the PR in draft until these checks pass.
