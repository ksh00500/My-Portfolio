/** Integration checks against a disposable in-memory database; never uses DATABASE_URL. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { collectPortfolioSnapshot } from './portfolio-snapshot.mjs';

const db = new PGlite();
try {
  await db.exec(`
    CREATE TABLE projects(id text, name text, is_public boolean, api_token text);
    CREATE TABLE technologies(id text, name text, is_public boolean, admin_password text);
    CREATE TABLE project_technologies(project_id text, technology_id text, usage_note text, is_primary boolean);
    CREATE TABLE profiles(id text, email text, is_public boolean, session_secret text);
    CREATE TABLE site_content(key text, ko text, en text, is_public boolean);
    CREATE TABLE sessions(token text);
    CREATE TABLE goals(id text, title text);
    INSERT INTO projects VALUES ('public', 'Visible project', true, 'fake-token'), ('private', 'Hidden project', false, 'fake-private-token');
    INSERT INTO technologies VALUES ('linux', 'Linux', true, 'fake-password');
    INSERT INTO project_technologies VALUES ('public','linux','Personal Linux server',false),('private','linux','Hidden connection',false);
    INSERT INTO profiles VALUES ('profile','ksh@keyda.site',true,'fake-session-secret');
    INSERT INTO site_content VALUES ('contact.email','ksh@keyda.site','ksh@keyda.site',true),('private-note','Hidden note',null,false);
    INSERT INTO sessions VALUES ('fake-session-token');
    INSERT INTO goals VALUES ('no-visibility','Must be excluded');
  `);
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot = await collectPortfolioSnapshot(db);
  assert.equal(snapshot.tables.projects.length, 1);
  assert.equal(snapshot.tables.project_technologies.length, 1);
  assert.equal(snapshot.tables.project_technologies[0].technology_id, 'linux');
  assert.equal(snapshot.tables.profiles[0].email, 'ksh@keyda.site');
  assert.equal(snapshot.tables.site_content.length, 1);
  assert.ok(!Object.hasOwn(snapshot.tables, 'sessions'));
  assert.ok(!Object.hasOwn(snapshot.tables, 'goals'), 'missing visibility must fail closed');
  assert.ok(!/fake-|Hidden|api_token|admin_password|session_secret/.test(JSON.stringify(snapshot)));
  assert.deepEqual(await collectPortfolioSnapshot(db), snapshot, 'export must be deterministic');
  await db.exec('ROLLBACK');
  assert.equal((await db.query('SELECT count(*)::int AS count FROM projects')).rows[0].count, 2, 'export preserves private and public source records');
  await db.exec('DROP TABLE technologies');
  const missingTarget = await collectPortfolioSnapshot(db);
  assert.equal(missingTarget.tables.project_technologies.length, 0, 'missing reference tables cannot leak links');
} finally {
  await db.close();
}

const script = new URL('./backup-db.mjs', import.meta.url);
const attempt = env => spawnSync(process.execPath, [fileURLToPath(script), 'before', 'test'], { env: { ...process.env, ...env }, encoding: 'utf8' });
const empty = attempt({ DATABASE_URL: '' });
assert.equal(empty.status, 1);
assert.match(empty.stderr, /No connection was attempted/);
const unavailable = attempt({ DATABASE_URL: 'postgresql://placeholder:must-not-be-printed@127.0.0.1:1/missing', PG_DUMP_BIN: '__missing_portfolio_pg_dump__' });
assert.equal(unavailable.status, 1);
assert.match(unavailable.stderr, /client-tools/);
assert.ok(!/must-not-be-printed|placeholder|postgresql/.test(unavailable.stderr + unavailable.stdout));
console.log('Snapshot checks passed: public column allowlists, private/unknown data exclusion, valid links, immutable DB records, deterministic JSON, fail-closed preflight, no credential logging. No live DB used.');
