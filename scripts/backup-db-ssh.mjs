/** Backup through SSH + container-local PostgreSQL tools; never reads DB credentials. */
import { spawn } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPortfolioSnapshot } from './portfolio-snapshot.mjs';

const [phase, operation, ...extra] = process.argv.slice(2);
if (!['before', 'after'].includes(phase) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(operation || '') || extra.length) {
  console.error('Usage: node scripts/backup-db-ssh.mjs before|after operation-slug');
  process.exit(1);
}
const destination = process.env.PORTFOLIO_SSH_TARGET || 'ksh@kshserver';
if (!/^[a-zA-Z0-9_.@-]+$/.test(destination) || destination.startsWith('-')) throw new Error('Invalid SSH target');
const ssh = command => spawn('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', destination, command], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
const base = 'docker exec portfolio-postgres';
const psql = ssh('docker exec -i portfolio-postgres psql -X -qAt -U portfolio_admin -d portfolio -P pager=off -v ON_ERROR_STOP=1');
let pending;
let dead = false;
const lines = createInterface({ input: psql.stdout });
lines.on('line', line => {
  if (!pending) return;
  if (line.trim() === pending.marker) {
    const call = pending;
    pending = undefined;
    clearTimeout(call.timer);
    call.accept(call.output.join('\n'));
  } else pending.output.push(line);
});
const closed = () => {
  dead = true;
  if (pending) { clearTimeout(pending.timer); pending.reject(new Error('SSH_PSQL_CLOSED')); pending = undefined; }
};
psql.on('error', closed);
psql.on('close', closed);
function command(sql) {
  if (pending || dead) return Promise.reject(new Error('SSH_PSQL_UNAVAILABLE'));
  const marker = 'snapshot_' + randomUUID().replaceAll('-', '');
  return new Promise((accept, reject) => {
    const timer = setTimeout(() => { psql.kill(); reject(new Error('SSH_PSQL_TIMEOUT')); }, 30000);
    pending = { marker, output: [], accept, reject, timer };
    psql.stdin.write(`${sql.trim().replace(/;$/, '')};\n\\echo ${marker}\n`);
  });
}
const client = {
  async query(sql) {
    const statement = sql.trim().replace(/;$/, '');
    if (!/^SELECT\b/i.test(statement)) throw new Error('ONLY_SELECT_ALLOWED');
    const json = await command(`SELECT coalesce(json_agg(row_to_json(snapshot_row)), '[]'::json)::text FROM (${statement}) snapshot_row`);
    return { rows: JSON.parse(json) };
  },
};
function finished(child) {
  return new Promise((accept, reject) => {
    child.once('error', () => reject(new Error('SSH_COMMAND_FAILED')));
    child.once('close', code => code === 0 ? accept() : reject(new Error('SSH_COMMAND_FAILED')));
  });
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const createdAt = new Date().toISOString();
const folder = resolve(fileURLToPath(new URL('../', import.meta.url)), '.backups', `${createdAt.replace(/[:.]/g, '-')}-${operation}-${phase}-${randomUUID()}`);
let stage = 'read-only-snapshot';
try {
  await command('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await command("SET LOCAL statement_timeout='30s'");
  const { rows: [snapshot] } = await client.query("SELECT pg_export_snapshot() AS id, current_setting('server_version') AS version");
  if (!/^[0-9A-F-]+$/.test(snapshot.id)) throw new Error('INVALID_SNAPSHOT_ID');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  stage = 'full-archive';
  const archive = resolve(folder, 'database.dump');
  const dump = ssh(`${base} pg_dump -U portfolio_admin -d portfolio --format=custom --no-owner --no-privileges --lock-wait-timeout=15000 --snapshot=${snapshot.id}`);
  dump.stdin.end();
  await Promise.all([pipeline(dump.stdout, createWriteStream(archive, { flags: 'wx', mode: 0o600 })), finished(dump)]);
  stage = 'public-json';
  const portfolio = await collectPortfolioSnapshot(client);
  Object.assign(portfolio, { createdAt, phase, operation });
  const json = JSON.stringify(portfolio, null, 2) + '\n';
  await writeFile(resolve(folder, 'portfolio.json'), json, { flag: 'wx', mode: 0o600 });
  await command('ROLLBACK');
  stage = 'verification';
  const restore = ssh('docker exec -i portfolio-postgres pg_restore --list');
  let listing = '';
  restore.stdout.on('data', chunk => { listing += chunk; });
  await Promise.all([pipeline(createReadStream(archive), restore.stdin), finished(restore)]);
  const bytes = await readFile(archive);
  const jsonBytes = await readFile(resolve(folder, 'portfolio.json'));
  if (!listing.includes('Archive created at') || bytes.subarray(0, 5).toString() !== 'PGDMP' || jsonBytes.toString() !== json) throw new Error('INVALID_BACKUP');
  const manifest = {
    format: 'my-portfolio/backup/v1', transport: 'SSH + container-local PostgreSQL tools; no DB secret read',
    status: 'verified-local', createdAt, phase, operation, serverVersion: snapshot.version,
    checks: ['shared repeatable-read PostgreSQL snapshot', 'pg_restore --list', 'JSON read-back', 'SHA-256'],
    restoreTested: false, obsidianMirrored: false,
    files: { 'database.dump': { bytes: bytes.length, sha256: hash(bytes) }, 'portfolio.json': { bytes: jsonBytes.length, sha256: hash(jsonBytes) } },
    publicRowCounts: Object.fromEntries(Object.entries(portfolio.tables).map(([name, rows]) => [name, rows.length])),
  };
  await writeFile(resolve(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ folder, manifest }, null, 2));
  console.log('No DB rows changed by this backup command. Obsidian mirroring and read-back are required before any further DB write.');
} catch {
  console.error(`SSH backup FAILED at ${stage}. No DB write is permitted; no verified manifest was issued.`);
  process.exitCode = 1;
} finally {
  if (pending) { clearTimeout(pending.timer); pending = undefined; }
  psql.stdin.end('ROLLBACK;\n\\q\n');
  psql.kill();
  lines.close();
}
