/** Read-only inventory of content that may need manual review. Never edits production data. */
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required; no connection was attempted.');
  process.exit(1);
}

const tables = {
  profiles: {label:'name_ko',fields:['name_ko','headline','intro_title','bio','school_name','department'],details:['headline','intro_title','bio']},
  projects: {label:'slug',fields:['slug','name','summary','description','content_markdown','status','is_featured','github_url','live_url','store_url','evidence_url','source_code_visibility'],details:['summary','description','content_markdown']},
  technologies: {label:'name',fields:['name','category','proficiency','description'],details:['description']},
  experiences: {label:'name',fields:['name','category','description','outcome','status'],details:['description','outcome']},
  participations: {label:'title',fields:['title','attendance_status','description','outcome'],details:['description','outcome']},
  recognitions: {label:'title',fields:['title','award_name','rank_or_result','description'],details:['description']},
  certifications: {label:'name',fields:['name','status','credential_url'],details:[]},
  project_metrics: {label:'metric_name',fields:['metric_name','display_value','is_verified','note'],details:['note']},
  media_assets: {label:'file_name',fields:['file_name','external_url','storage_key','caption'],details:['caption']}
};
const placeholder=/\\b(?:lorem|ipsum|dummy|placeholder|sample|tbd|todo|replace[ _-]?me)\\b|example\\.com|test@example\\.com|샘플|테스트용|가짜 데이터|임시 문구|추후 입력|내용 입력/i;
const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:7000});
const report={source:'live PostgreSQL (read-only)',notes:[
  'Suspected placeholders are candidates for review, not proven dummy records.',
  'Missing descriptions or unverified metrics are not grounds for deleting records.',
  'No row data, private contact information, credentials or full descriptions are printed.'
],tables:{},attention:[]};
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const schema=await client.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'");
  const columns=new Map();
  for(const row of schema.rows){if(!columns.has(row.table_name))columns.set(row.table_name,new Set());columns.get(row.table_name).add(row.column_name)}
  for(const [table,spec] of Object.entries(tables)){
    const names=columns.get(table);
    if(!names){report.tables[table]={exists:false};continue}
    const selected=[...new Set([spec.label,'id','is_public',...spec.fields].filter(x=>names.has(x)))];
    const sql='SELECT '+selected.map(x=>'"'+x+'"').join(',')+' FROM "'+table+'"';
    const rows=(await client.query(sql)).rows;
    const visible=rows.filter(r=>r.is_public!==false);
    const hidden=rows.length-visible.length;
    const summary={exists:true,total:rows.length,publicOrUnrestricted:visible.length,private:hidden,suspectedPlaceholders:[],missingCoreContent:[],reviewStatus:[]};
    for(const row of visible){
      const label=String(row[spec.label]||row.id||'(unnamed)').slice(0,90);
      const hits=spec.fields.filter(col=>typeof row[col]==='string'&&placeholder.test(row[col]));
      if(hits.length)summary.suspectedPlaceholders.push({record:label,fields:hits});
      if(table==='projects'&&!['summary','description','content_markdown'].some(col=>present(row[col])))
        summary.missingCoreContent.push(label);
      if(table==='participations'&&['unknown','unconfirmed','pending','applied','registered'].includes(String(row.attendance_status||'').toLowerCase()))
        summary.reviewStatus.push({record:label,reason:'attendance not confirmed'});
      if(table==='project_metrics'&&row.is_verified===false)
        summary.reviewStatus.push({record:label,reason:'metric not verified'});
    }
    report.tables[table]=summary;
  }
  report.attention.push('The home-page bilingual fallback comes from lib/site-content.ts, not the PostgreSQL site_content table.');
  report.attention.push('Empty media_assets is an evidence-upload backlog, not dummy content.');
  await client.query('ROLLBACK');
  console.log(JSON.stringify(report,null,2));
} catch (e) {
  await client.query('ROLLBACK').catch(()=>{});
  console.error('Read-only content audit failed:',e.code||e.name||'unknown');
  process.exitCode=1;
} finally {
  await client.end().catch(()=>{});
}
