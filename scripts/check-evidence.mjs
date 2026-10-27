/** Evidence/privacy checks and additive schema checks; no external database. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const source = readFileSync(new URL('../lib/technology-evidence.ts',import.meta.url),'utf8');
const { outputText } = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {resolveTechnologyContexts,technologyContextCounts} = await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const data={projects:[{id:'project'}],technologies:[{id:'tech'},{id:'hidden-tech',is_public:false}],experiences:[{id:'event',name:'Event',category:'Program & Training',status:'completed'},{id:'private',name:'Private',is_public:false},{id:'uncertain',name:'Uncertain',status:'completed'}],recognitions:[{id:'award',title:'Award',experience_id:'event'}],participations:[{id:'course',title:'Course',experience_id:'event',attendance_status:'completed'},{id:'pending',title:'Pending',experience_id:'uncertain',attendance_status:'unknown'}],employment:[],education:[],leadership:[],certifications:[{id:'cert',name:'Planned certification',status:'planned'}]};
const row=(id,refs,kind='learning')=>({id,technology_id:'tech',is_public:true,evidence_kind:kind,evidence_note:'Verified source note',...refs});
const rows=[row('one',{experience_id:'event'}),row('two',{recognition_id:'award'},'practice'),row('three',{participation_id:'course'}),row('duplicate',{participation_id:'course'}),row('hidden',{experience_id:'private'}),row('ambiguous',{experience_id:'event',recognition_id:'award'}),row('dangling',{experience_id:'missing'}),row('pending',{participation_id:'pending'}),row('parent-pending',{experience_id:'uncertain'}),row('unearned',{certification_id:'cert'}),{...row('private-evidence',{experience_id:'event'}),is_public:false},{...row('private-tech',{experience_id:'event'}),technology_id:'hidden-tech'},row('invalid-kind',{experience_id:'event'},'proficient')];
const input=structuredClone({data,rows});
const contexts=resolveTechnologyContexts(rows,data);
assert.equal(contexts.length,3);
assert.equal(technologyContextCounts(contexts).tech,1,'one event across education, award and participation is counted once');
assert.deepEqual(contexts.map(r=>r.evidenceKind).sort(),['learning','learning','practice']);
const projectLinked=resolveTechnologyContexts(rows,data,[{project_id:'project',experience_id:'event'}]);
assert.ok(projectLinked.every(r=>r.canonicalKey==='project:project'));
assert.deepEqual({data,rows},input,'projection must preserve DB inputs');
assert.deepEqual(resolveTechnologyContexts([],data),[],'missing optional table is empty');
assert.ok(!/Private|Pending|Uncertain|Planned/.test(JSON.stringify(contexts)));

const db = new PGlite();
try {
  for(const name of ['technologies','experiences','recognitions','participations','education','employment','leadership','certifications']) await db.exec(`CREATE TABLE ${name}(id uuid PRIMARY KEY)`);
  await db.exec(readFileSync(new URL('../db/technology-evidence.sql',import.meta.url),'utf8'));
  const tech='11111111-1111-4111-8111-111111111111', experience='22222222-2222-4222-8222-222222222222';
  await db.query('INSERT INTO technologies(id) VALUES ($1)',[tech]);
  await db.query('INSERT INTO experiences(id) VALUES ($1)',[experience]);
  const insert='INSERT INTO technology_evidence(technology_id,experience_id,evidence_kind,evidence_note) VALUES ($1,$2,$3,$4)';
  await db.query(insert,[tech,experience,'learning','Actual coursework']);
  await assert.rejects(db.query(insert,[tech,experience,'practice','Duplicate']),e=>e.code==='23505');
  await assert.rejects(db.query(insert,[tech,null,'learning','No source']),e=>e.code==='23514');
  await assert.rejects(db.query(insert,[tech,experience,'expert','Unsupported claim']),e=>e.code==='23514');
  await assert.rejects(db.query('DELETE FROM experiences WHERE id=$1',[experience]),e=>e.code==='23001');
} finally { await db.close(); }
console.log('Evidence checks passed: explicit sources, hidden/unknown/planned exclusion, event/project deduplication, immutable inputs, optional-table fallback, FK/check/uniqueness constraints. No live DB used.');
