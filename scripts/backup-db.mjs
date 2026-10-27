/** Read-only backup. This command never performs portfolio data mutations. */
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import pg from 'pg';
import { collectPortfolioSnapshot } from './portfolio-snapshot.mjs';

const [phase, operation, ...extra] = process.argv.slice(2);
if (!['before', 'after'].includes(phase) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(operation || '') || extra.length) {
  console.error('Usage: npm run db:snapshot -- before|after operation-slug');
  process.exit(1);
}
if (!process.env.DATABASE_URL?.trim()) {
  console.error('Fill DATABASE_URL in the local .env first. No connection was attempted.');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const createdAt = new Date().toISOString();
const folder = resolve(root, '.backups', `${createdAt.replace(/[:.]/g, '-')}-${operation}-${phase}-${randomUUID()}`);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 7000, statement_timeout: 60000 });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// The URL is passed only through the child environment, never command arguments or logs.
const childEnv = { ...process.env, PGDATABASE: process.env.DATABASE_URL, PGCONNECT_TIMEOUT: '7' };
function run(binary, args) {
  return new Promise((accept, reject) => {
    const child = spawn(binary, args, { env: childEnv, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.on('error', () => reject(new Error('PG_TOOL_UNAVAILABLE')));
    child.on('close', code => code === 0 ? accept(output) : reject(new Error('PG_TOOL_FAILED')));
  });
}
let stage = 'client-tools';
try {
  // Discover missing tools before even connecting. PostgreSQL 17+ tools are required.
  await run(process.env.PG_DUMP_BIN || 'pg_dump', ['--version']);
  await run(process.env.PG_RESTORE_BIN || 'pg_restore', ['--version']);
  stage = 'read-only-snapshot';
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const { rows: [snapshot] } = await client.query('SELECT pg_export_snapshot() AS id, current_database() AS database, current_setting(\'server_version\') AS version');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  stage = 'full-archive';
  const archive = resolve(folder, 'database.dump');
  await run(process.env.PG_DUMP_BIN || 'pg_dump', ['--format=custom', '--no-owner', '--no-privileges', '--lock-wait-timeout=15000', `--snapshot=${snapshot.id}`, '--file', archive]);
  stage = 'public-json';
  const portfolio = await collectPortfolioSnapshot(client);
  portfolio.createdAt = createdAt;
  portfolio.phase = phase;
  portfolio.operation = operation;
  const json = JSON.stringify(portfolio, null, 2) + '\n';
  await writeFile(resolve(folder, 'portfolio.json'), json, { flag: 'wx', mode: 0o600 });
  await client.query('ROLLBACK');
  stage = 'verification';
  const listing = await run(process.env.PG_RESTORE_BIN || 'pg_restore', ['--list', archive]);
  if (!listing.includes('Archive created at')) throw new Error('ARCHIVE_LIST_INVALID');
  const archiveBytes = await readFile(archive);
  const jsonBytes = await readFile(resolve(folder, 'portfolio.json'));
  if (archiveBytes.length < 5 || archiveBytes.subarray(0, 5).toString() !== 'PGDMP' || jsonBytes.toString() !== json) throw new Error('BACKUP_INVALID');
  const manifest = {
    format: 'my-portfolio/backup/v1', status: 'verified-local', createdAt, phase, operation,
    serverVersion: snapshot.version,
    checks: ['shared repeatable-read PostgreSQL snapshot', 'pg_restore --list', 'JSON read-back', 'SHA-256'],
    restoreTested: false, obsidianMirrored: false,
    files: { 'database.dump': { bytes: archiveBytes.length, sha256: sha256(archiveBytes) }, 'portfolio.json': { bytes: jsonBytes.length, sha256: sha256(jsonBytes) } },
    publicRowCounts: Object.fromEntries(Object.entries(portfolio.tables).map(([name, rows]) => [name, rows.length])),
  };
  await writeFile(resolve(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Verified LOCAL backup: ${folder}\nNo DB rows changed. Obsidian mirroring/read-back is still required before any write.`);
} catch (error) {
  // pg/libpq errors can contain connection details. Never print the raw error or child stderr.
  console.error(`Backup FAILED at ${stage} (${/^[A-Z_0-9]+$/.test(error.code || '') ? error.code : 'CHECK_FAILED'}). No DB write is permitted; no verified manifest was issued.`);
  process.exitCode = 1;
} finally {
  await client.query('ROLLBACK').catch(() => {});
  await client.end().catch(() => {});
}
