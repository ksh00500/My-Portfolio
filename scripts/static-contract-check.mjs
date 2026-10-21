/* Static contract checks; not a substitute for checking against the real DB. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
const root=new URL('../',import.meta.url);
const read=x=>readFileSync(new URL(x,root),'utf8');
const repo=read('lib/repository.ts'),types=read('lib/types.ts'),detail=read('app/[lang]/projects/[slug]/page.tsx'),res=read('lib/admin-resources.ts');
assert(repo.includes("readPublic<Record<string,unknown>>('profiles'"));
assert(!/pt\.(effort_weight|verification_status)\b/.test(repo));
assert(repo.includes('defaultSiteContent'));
assert(repo.includes('project_id')&&repo.includes('certification_id'));
assert(!/a\.entity_type|a\.entity_id/.test(repo));
assert(detail.includes('projectDescription(p,lang)'));
assert(types.includes('summary:string|null')&&types.includes('description:string|null')&&types.includes('content_markdown:string|null'));
assert(types.includes('description:string|null;description_ko?'));
assert(res.includes('asset_id profile_id project_id experience_id recognition_id certification_id'));
const relationRoute=read('app/api/admin/project-technologies/route.ts');
assert(relationRoute.includes('INSERT INTO project_technologies(project_id,technology_id,usage_note,is_primary)'));
assert(!/SET.*verification_status/.test(relationRoute));
const files=[];function walk(folder){for(const f of readdirSync(new URL(folder,root),{withFileTypes:true})){if(f.isDirectory())walk(folder+f.name+'/');else if(/\.(tsx?|mjs)$/.test(f.name))files.push(folder+f.name)}}for(const dir of ['app/','lib/','components/'])walk(dir);
for(const path of files){const s=read(path);assert(!/SELECT\s+\*\s+FROM\s+profile\b/i.test(s),`legacy profile query ${path}`)}
const base=JSON.parse(read('seed/source-data.json'));assert.equal(base.projects.length,19);assert.equal(base.technologies.length,27);
console.log(`Static contract checks passed (${files.length} source files; JSON reference 19 projects / 27 technologies; no live DB access).`);
