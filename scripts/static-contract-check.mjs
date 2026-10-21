/** Non-destructive repository checks. No DB connections. */
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const get=f=>readFileSync(join(root,f),'utf8');
const compose=get('docker-compose.yml');
assert(!/^\s{2}(db|bootstrap|seed):/m.test(compose),'Compose must not start DB/bootstrap/seed');
assert(compose.includes('external: true')&&compose.includes('portfolio-net'));
assert(compose.includes('127.0.0.1:3001:3000'));
assert(!get('package.json').includes('"db:init"')&&!get('package.json').includes('"db:seed"'));
assert(!get('next.config.ts').includes('ignoreBuildErrors'));
const rel=get('lib/repository.ts');
assert(rel.includes("readPublic<Record<string,unknown>>('profiles'"));
assert(!/pt\.(effort_weight|verification_status)\b/.test(rel));
assert(rel.includes("readPublic<Record<string,unknown>>('media_assets'"));
assert(rel.includes('defaultSiteContent'));
const relationRoute=get('app/api/admin/project-technologies/route.ts');
assert(relationRoute.includes('INSERT INTO project_technologies(project_id,technology_id,usage_note,is_primary)'));
assert(!/SET.*verification_status/.test(relationRoute));
const records=[];function walk(dir){for(const x of readdirSync(join(root,dir),{withFileTypes:true})){const file=join(dir,x.name);if(x.isDirectory())walk(file);else if(/\.(?:tsx?|mjs)$/.test(file))records.push(file)}}walk('app');walk('lib');walk('components');
for(const f of records){const data=get(f);assert(!/SELECT\s+\*\s+FROM\s+profile\b/i.test(data),`legacy profile query in ${f}`)}
const seed=JSON.parse(get('seed/source-data.json'));
assert.equal(seed.projects.length,19);assert.equal(seed.technologies.length,27);
console.log(`Contract checks passed (${records.length} application files; source baseline: 19 projects / 27 technologies). Live DB not accessed.`);
