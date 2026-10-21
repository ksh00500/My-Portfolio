/** READ-ONLY: compare public API responses with actual PostgreSQL records. No DML/DDL. */
import pg from 'pg';
import assert from 'node:assert/strict';
const origin=process.env.PORTFOLIO_BASE_URL||'http://127.0.0.1:3001';
const ok=[];const failures=[];const skipped=[];
const http=async path=>{
 const res=await fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-store'}});
 if(res.status!==200)throw new Error(`HTTP ${res.status}`);
 return res;
};
async function test(name,fn){try{await fn();ok.push(name);console.log('PASS',name)}catch(e){failures.push(name);console.error('FAIL',name,e instanceof Error?e.message.slice(0,160):'unknown error')}}
const names=['/ko','/en','/ko/projects','/ko/projects/senro'];
let reference=null;
if(process.env.DATABASE_URL){
 const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:7000});
 try{
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const p=await client.query('SELECT id,slug,name,summary,description,is_public FROM projects');
  const t=await client.query('SELECT id,name,description,is_public FROM technologies');
  const r=await client.query('SELECT project_id,technology_id,usage_note,is_primary FROM project_technologies');
  reference={projects:p.rows,technologies:t.rows,relations:r.rows};
  await test('DB baseline total rows',()=>{assert.equal(p.rows.length,19);assert.equal(t.rows.length,27)});
  await client.query('ROLLBACK');
 }catch(e){failures.push('DB read-only reference');console.error('FAIL DB read-only reference:',e instanceof Error?e.message.slice(0,80):'unknown');await client.query('ROLLBACK').catch(()=>{});}finally{await client.end().catch(()=>{})}
}else{skipped.push('live DB content comparison (DATABASE_URL not set)');console.log('SKIP: DATABASE_URL not provided for read-only comparison')}
await test('/api/health',async()=>{const data=await (await http('/api/health')).json();assert.equal(data.database,'connected')});
let payload=null;
await test('/api/portfolio actual content',async()=>{
 const d=await (await http('/api/portfolio')).json();
 for(const k of ['projects','technologies','projectTechnologies','mediaAssets','assetLinks','content'])assert.ok(Array.isArray(d[k])||k==='content'&&typeof d[k]==='object',`missing ${k}`);
 if(reference){
  const publicProjects=reference.projects.filter(p=>p.is_public===true);
  const publicTech=reference.technologies.filter(t=>t.is_public===true);
  assert.equal(d.projects.length,publicProjects.length,'public projects count mismatch');
  assert.equal(d.technologies.length,publicTech.length,'public technologies count mismatch');
  for(const tech of publicTech){const item=d.technologies.find(x=>String(x.id)===String(tech.id));assert.ok(item,`missing technology ${tech.name}`);assert.equal(item.description,tech.description,`technology description mismatch ${tech.name}`)}
  for(const p of publicProjects){const got=d.projects.find(x=>String(x.id)===String(p.id));assert.ok(got,`missing public project ${p.slug}`);
   assert.equal(got.name,p.name,`name mismatch ${p.slug}`);
   assert.equal(got.summary,p.summary,`summary mismatch ${p.slug}`);
   assert.equal(got.description,p.description,`description mismatch ${p.slug}`);
  }
  assert.ok(!d.projects.some(x=>reference.projects.some(p=>String(p.id)===String(x.id)&&p.is_public!==true)),'private projects exposed');
  assert.ok(!d.technologies.some(x=>reference.technologies.some(t=>String(t.id)===String(x.id)&&t.is_public!==true)),'private technologies exposed');
  const publicIds=new Set(publicProjects.map(p=>String(p.id))), techIds=new Set(publicTech.map(t=>String(t.id)));
  const expected=reference.relations.filter(r=>publicIds.has(String(r.project_id))&&techIds.has(String(r.technology_id)));
  const signature=r=>`${r.project_id}|${r.technology_id}`;
  assert.deepEqual(d.projectTechnologies.map(signature).sort(),expected.map(signature).sort(),'FK relation mismatch');
  for(const a of d.assetLinks){
   const match=d.mediaAssets.some(m=>String(m.id)===String(a.asset_id??a.media_asset_id));assert.ok(match,'link points to non-public asset');
   const refFields=['profile_id','project_id','experience_id','recognition_id','certification_id'].filter(k=>a[k]!=null);
   assert.equal(refFields.length,1,'asset link needs one visible FK');
   if(a.project_id)assert.ok(publicIds.has(String(a.project_id)),'asset link leaks private project');
  }
 }
 payload=d;
});
await test('/api/projects',async()=>{const data=await (await http('/api/projects')).json();assert.ok(Array.isArray(data.items));if(payload)assert.deepEqual(data.items.map(x=>x.id),payload.projects.map(x=>x.id))});
await test('/api/technologies',async()=>{const data=await (await http('/api/technologies')).json();assert.ok(Array.isArray(data.items));if(payload)assert.deepEqual(data.items.map(x=>x.id),payload.technologies.map(x=>x.id))});
for(const path of ['/api/experience','/api/recognition'])await test(path,async()=>{const data=await (await http(path)).json();assert.ok(typeof data==='object')});
await test('/api/projects/senro',async()=>{const data=await (await http('/api/projects/senro')).json();assert.equal(data.project.slug,'senro');assert.ok(typeof data.project.name==='string');if(payload)assert.equal(data.project.name,payload.projects.find(p=>p.slug==='senro')?.name);assert.ok(Array.isArray(data.media))});
for(const path of names)await test(path+' rendered',async()=>{
 const html=await (await http(path)).text();assert.ok(html.includes('<html'),'missing HTML document');assert.ok(!html.includes('Database unavailable'),'DB exception on page');
 if(path.includes('senro'))assert.match(html,/SENRO/i);
 if(path==='/ko'&&payload){const hero=payload.content?.['hero.title']?.ko; if(hero)assert.ok(html.includes(hero),'hero copy missing');}
 if(path==='/en'&&payload){const hero=payload.content?.['hero.title']?.en; if(hero)assert.ok(html.includes('Merchant'),'English hero copy missing');}
});
if(process.env.ADMIN_TEST_COOKIE){
 for(const path of ['/api/admin/resources','/api/admin/schema','/api/admin/projects','/api/admin/technologies','/api/admin/asset_links']){
  await test(path+' schema/auth',async()=>{
   const res=await fetch(new URL(path,origin),{headers:{Cookie:process.env.ADMIN_TEST_COOKIE},signal:AbortSignal.timeout(15000)});
   assert.equal(res.status,200,`HTTP ${res.status}`);const data=await res.json();
   assert.ok(typeof data==='object');
   if(path.endsWith('/schema')){assert.ok(data.tables.some(t=>t.table==='profiles'&&t.exists));}
   if(path.endsWith('/resources')){assert.ok(data.resources.some(x=>x.name==='projects'&&x.available));}
   if(path.endsWith('/asset_links')){assert.ok(data.fields.includes('project_id'));assert.ok(!data.fields.includes('entity_type'));}
  });
 }
}else{skipped.push('admin schema/list integration (ADMIN_TEST_COOKIE not set)');console.log('SKIP: authenticated admin checks require ADMIN_TEST_COOKIE')}
console.log(`Read-only smoke summary: ${ok.length} passed, ${failures.length} failed, ${skipped.length} skipped`);
if(failures.length)process.exitCode=1;
