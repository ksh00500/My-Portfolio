# Operating PostgreSQL 17 compatibility — no DB changes

The running DB is authoritative. The bundled `db/schema.sql` and `db/ERD.md` describe an *older candidate schema*, not an instruction to initialize production. They must **never** be run against the existing data without explicit approval.

Observed differences reported from the live deployment (not independently queried here):

| Old application assumption | Existing DB | Change |
|--|--|--|
| `profile` | `profiles` | public repository and admin resource use `profiles` |
| `project_technologies.effort_weight` | absent | no longer queried/written |
| `project_technologies.verification_status` | absent | no longer queried/written; relationships are not labeled confirmed |
| `media_assets.display_order` | absent | choose actual available sort columns at runtime |
| `site_content` | absent | local bilingual copy fallback, optional DB override only if table exists |
| Docker starts Postgres 16 and bootstrap | Postgres 17 already running | Compose web-only on `portfolio-net`, no startup seeding |

`npm run db:verify` queries information_schema and row counts **read-only**. No live DB connectivity or full SQL dump was available at authoring time, so full physical compatibility cannot honestly be claimed. App-level schema introspection guards optional queries and admin write fields.

Optional future extension (NOT automatic): site_content table may be added after DBA review to edit UI strings through /admin. No migration is required for the site to function with the fallback copy.
