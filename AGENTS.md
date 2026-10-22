# My Portfolio project context

memory_project: my-portfolio
memory_server: basic_memory_remote

- Read the relevant `project-overview`, `current-status`, and `decisions` notes in `my-portfolio` before continuing development. Specify `project: my-portfolio` on every project-specific memory call.
- Update existing notes after verified important changes. Distinguish implemented and tested results from plans, and do not store credentials or write this project's records to `shared`.
- Follow the user's global memory instructions and any additional project instructions they provide. Prefer verified current source and execution results over older notes.

## Database maintenance — mandatory backup before every change

- The user permits portfolio data corrections after providing local connection settings. Never infer project–technology links without confirming actual usage. Start with a read-only audit; never initialize, reset, or seed the live database.
- Before EVERY agent-executed DB mutation, create a new full PostgreSQL archive and a portfolio JSON snapshot with `npm run db:snapshot -- before <operation-slug>` or `npm run db:snapshot:ssh -- before <operation-slug>`. The SSH transport uses the authenticated agent and container-local tools without reading DB credentials. Verify the archive listing, SHA-256 hashes, and manifest. A failed or missing backup blocks all writes, including retries and fixes.
- Before writing, mirror the reviewed portfolio JSON and manifest into a NEW timestamped note in Basic Memory project `my-portfolio`, directory `db-history`. Read it back and verify JSON/checksums. Do not overwrite or delete past snapshots. If memory storage fails, stop before the DB write.
- Full archives remain in local gitignored `.backups/`; never upload raw archives, environment files, credentials, passwords, tokens, session values, or private records to Basic Memory/Git. The JSON export uses explicit public portfolio column allowlists; review its free text before mirroring.
- Use a narrow transaction with parameterized SQL, explicit target IDs and expected affected-row counts. Recheck the audited state inside the transaction; abort on unexpected differences. Do not silently broaden a change.
- After each committed change, take `db:snapshot -- after <operation-slug>`, verify the affected relations/content, and append the reviewed JSON plus a before/after change log to Obsidian. If post-change archival fails, report the committed state accurately and stop further writes; never pretend a committed change rolled back. A compensating write also requires a fresh before-backup.
- Backup verification currently means archive readability and content hashes, not a demonstrated full restore. Test restoration only in a separate disposable database; never restore over the live DB without explicit user authorization.
- Technical evidence covers work, education, awards, activities and credentials in addition to project usage. Use explicit `technology_evidence` references and distinguish practice, learning, attendance and credentials. Do not infer technical experience from an event title, award or related project's entire stack. Deduplicate the same event through existing experience/project references; keep the bubble's project count separate.
- Ask the user only for missing evidence in a consolidated list. Linux project targets, school-specific coursework and unspecified AI training tools remain unconfirmed until answered. Do not treat an unanswered question as permission to invent links.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
