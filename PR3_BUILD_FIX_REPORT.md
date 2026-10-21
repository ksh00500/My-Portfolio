# PR #3 — PostgreSQL 17.11 compatibility follow-up

## Operational evidence supplied by server operator
- PostgreSQL 17.11 connection succeeded.
- Existing DB rows: **19 projects** and **27 technologies**.
- `npm run db:verify` and `npm run check:static` passed on Ubuntu.
- Pre-fix `npm run typecheck` failed with 6 TS errors and `npm run build` failed.
- New version has not yet been deployed.

## Fixes in this commit
- `app/[lang]/layout.tsx`: guard values from `Record<string, unknown>` before passing a name to `<Nav>`.
- `app/[lang]/page.tsx`: render links only after string checks; prevent `unknown` from becoming a React child.
- `lib/repository.ts`: normalize from actual `projects.summary`, `.description`, `.content_markdown` and `technologies.description`. No invented translations. Remove `source_notion_id` and private links using a record-safe projection (no untyped delete of inferred object properties). Read `asset_links` with actual `profile_id`, `project_id`, `experience_id`, `recognition_id`, `certification_id` foreign keys; do not expose links to non-public entities or non-public media. Filter relationship data using public project/technology IDs.
- `lib/types.ts`: align project/technology fields with actual PostgreSQL columns; legacy translation columns are optional and do not enter SQL directly.
- `app/[lang]/projects/[slug]/page.tsx`: use physical project descriptions; use `project_id` FK for public proof media; show original `content_markdown` as escaped plain text rather than fabricate data.
- `components/TechAtlas.tsx`: show actual technology descriptions where present; graph still uses only real project-technology relationships.
- `lib/admin-resources.ts`: use real asset FK names and physical descriptive columns.
- `lib/admin-data.ts`, `lib/schema-introspection.ts`, `app/admin/page.tsx`: get primary key metadata from the live SQL catalog; use server-discovered record keys in the administrator.
- `scripts/smoke-readonly.mjs`: compare API project names and summaries/descriptions, technology descriptions, project/tech counts, public filtering, FK relationships and page rendering to PostgreSQL records; optionally inspect authenticated admin metadata.
- `scripts/static-contract-check.mjs`: reject old table/column assumptions and check the source model.

## Verification performed here
- `npm run check:static`: **passed**.
- TS/TSX transpilation/syntax check over 38 application sources: **passed**.
- `node --check` for test scripts: **passed**.
- `npm install`: **blocked** by npm registry DNS (`EAI_AGAIN`).
- `npm run typecheck` and `npm run build`: **not validated** because the required dependencies were unavailable; the resulting 'Cannot find module next/react' diagnostics are environmental, not evidence of a successful typecheck.
- PostgreSQL/database-connected API and rendered HTML tests: **not run from this environment**. The operator's previously reported PostgreSQL counts and `db:verify` success were not re-checked here.
- Administrator CRUD was not exercised on production to preserve data.

## Safe verification on the Ubuntu server (no writes to DB)
```bash
cd My-Portfolio
git fetch origin
git switch refactor/postgres17-live-schema-compat-20261021
npm install
npm run check:static
npm run db:verify
npm run typecheck
npm run build
# After the web service is serving the new code:
PORTFOLIO_BASE_URL=http://127.0.0.1:3001 npm run check:smoke
```

`check:smoke` performs GET requests and read-only SQL queries. With `DATABASE_URL` set in the environment it also compares the API with actual PostgreSQL rows. Without it, DB parity checks are explicitly skipped. To check admin metadata, an authenticated administrator cookie can be supplied through `ADMIN_TEST_COOKIE`; never paste cookies, tokens, passwords, or complete environment settings into logs or issue comments.

No schema migrations, bootstrap, seed, TRUNCATE, DROP, or automatic database modifications have been added. Production is not considered verified until the full Ubuntu typecheck, build, and read-only smoke results pass.
