import pg from 'pg';
import {readFileSync} from 'node:fs';
const seed=JSON.parse(readFileSync(new URL('../seed/source-data.json',import.meta.url),'utf8'));
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL missing');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const client=await pool.connect();
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
const displayMonth=v=>typeof v==='string'&&/^\d{4}-\d{2}$/.test(v)?v:null;
const common={is_public:true,display_order:0};
async function put(table,row){
 const entries=Object.entries(row).filter(([,v])=>v!==undefined);
 if(!entries.length)return;
 const columns=entries.map(([key])=>key);
 const values=entries.map(([,value])=>value);
 const q=`INSERT INTO ${table} (${columns.map(c=>'"'+c+'"').join(',')}) VALUES (${values.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT DO NOTHING`;
 await client.query(q,values);
}
try{
 await client.query('BEGIN');
 await put('profile',{id:'profile-main',...seed.profile});
 for(const p of seed.projects){
  const {media_assets,period_note_ko,period_note_en,brand_started_at,...rest}=p;
  await put('projects',{...rest,started_at:validDate(rest.started_at),ended_at:validDate(rest.ended_at),planned_end_at:validDate(rest.planned_end_at),period_label:period_note_ko||null,period_label_en:period_note_en||null,brand_started_at:validDate(brand_started_at),
   planned_end_month:rest.planned_end_month||null});
  // Earlier seeds wrote the English period note into description_en; move it back where it belongs.
  if(period_note_en)await client.query('UPDATE projects SET description_en=NULL,period_label_en=COALESCE(period_label_en,$2) WHERE id=$1 AND description_en=$2',[rest.id,period_note_en]);
 }
 for(const [i,m] of seed.project_metrics.entries())await put('project_metrics',{
  id:'metric-'+String(i+1).padStart(3,'0'),project_id:m.project_id,metric_key:m.metric_key,
  metric_name:m.name_ko||m.metric_key,display_value:m.display_value,comparison:m.comparison||'exact',
  numeric_value:m.numeric_value??null,unit:m.unit??null,source_type:'user_reported',is_verified:false,
 });
 for(const t of seed.technologies){const {linked_project_slugs,...tech}=t; await put('technologies',tech);}
 const idsBySlug=new Map(seed.projects.map(p=>[p.slug,p.id]));
 for(const t of seed.technologies){for(const slug of t.linked_project_slugs||[]){
  const projectId=idsBySlug.get(slug);if(!projectId)continue;
  await put('project_technologies',{project_id:projectId,technology_id:t.id,is_primary:false,verification_status:'confirmed'});
 }}
 for(const [i,r] of seed.recognitions.entries()){
  const experienceId='exp-'+r.id;
  await put('experiences',{id:experienceId,name:r.title,category:r.type==='scholarship'?'Scholarship':'Competition & Hackathon',
   outcome:r.award,started_at:validDate(r.date),outcome_at:validDate(r.date),is_public:true,display_order:i});
  await put('recognitions',{id:r.id,experience_id:experienceId,title:r.title,recognition_type:r.type,award_name:r.award,
   award_name_en:r.award_en||null,awarded_at:validDate(r.date),display_order:i,is_public:true,
   related_project_id:(r.title.includes('G-HOP')?idsBySlug.get('fresk'):null)||null});
 }
 for(const [i,l] of seed.leadership.entries()){
  const experienceId='exp-'+l.id;
  await put('experiences',{id:experienceId,name:l.title,category:'Leadership & Activity',role:l.role,
   status:l.status||'completed',started_at:validDate(l.started_at),ended_at:validDate(l.ended_at),
   period_label:[l.started_at,l.ended_at||'현재'].filter(Boolean).join(' ~ '),
   is_ongoing:l.status==='ongoing',is_public:true,display_order:i+100});
  await put('leadership',{id:l.id,experience_id:experienceId,activity_name:l.title,role:l.role,status:l.status||'completed',
   started_at:validDate(l.started_at),ended_at:validDate(l.ended_at),started_month:displayMonth(l.started_at),ended_month:displayMonth(l.ended_at),is_public:true,display_order:i});
 }
 // Program attendance is unverified; preserve source records without automatically
 // merging them into a possibly overlapping experiences master record.
 for(const [i,p] of seed.programs.entries()){
  await put('participations',{id:p.id,experience_id:null,title:p.title,
   started_at:validDate(p.started_at),ended_at:validDate(p.ended_at),
   attendance_status:p.attendance_status||'unknown',is_public:true,display_order:i});
 }
 for(const [i,e] of seed.education.entries()){
  const eid='exp-'+e.id;
  await put('experiences',{id:eid,name:e.school,category:'Education',started_at:validDate(e.started_at),ended_at:validDate(e.ended_at),
   status:e.status==='enrolled'?'ongoing':'completed',is_ongoing:e.status==='enrolled',display_order:i+200});
  await put('education',{id:e.id,experience_id:eid,school_name:e.school,department:e.department,started_at:validDate(e.started_at),
   ended_at:validDate(e.ended_at),status:e.status,display_order:i});
 }
 for(const [i,e] of seed.employment.entries()){
  const eid='exp-'+e.id;
  await put('experiences',{id:eid,name:e.company,category:'Work',started_at:validDate(e.started_at),ended_at:validDate(e.ended_at),display_order:i+300});
  await put('employment',{id:e.id,experience_id:eid,company_name:e.company,position:e.role,
   started_at:validDate(e.started_at),ended_at:validDate(e.ended_at),description_ko:e.description_ko,description_en:e.description_en,
   source_material_visibility:'private',display_order:i});
 }
 for(const [i,c] of seed.certifications.entries()){
  const eid='exp-'+c.id;
  await put('experiences',{id:eid,name:c.title,category:'Certification & Badge',started_at:validDate(c.issued_at),display_order:i+400});
  await put('certifications',{id:c.id,experience_id:eid,name:c.title,issuer:c.issuer,issued_at:validDate(c.issued_at),score:c.score,status:c.status,display_order:i});
 }
 const content={
  'hero.title':{ko:'셈을 못하는 상인',en:"A Merchant Who Can't Count",group_name:'hero'},
  'hero.subtitle':{ko:'삶은 계산하며 살아가되, 사람에게는 계산하지 않는다.',en:'I calculate my way through life, but never keep score with people.',group_name:'hero'},
  'about.title':{ko:'아이디어를 현실로 만드는 개발자',en:'A developer who turns ideas into reality',group_name:'about'},
  'about.description':{ko:'기획부터 개발, 배포, 운영까지. 제품을 직접 만들고 사용자와 만나는 과정을 중요하게 생각합니다.',en:'From planning and development to launch and operation, I care about making products that reach real people.',group_name:'about'},
  'projects.title':{ko:'만든 것들의 기록',en:'Selected Works',group_name:'projects'},
  'projects.description':{ko:'아이디어에서 운영까지. 직접 만든 제품과 시스템.',en:'From ideas to launch — products and systems I have built.',group_name:'projects'},
  'senro.title':{ko:'하나의 아이디어가 서비스가 되기까지',en:'From idea to a real product',group_name:'senro'},
  'senro.act1':{ko:'기획',en:'IDEA',group_name:'senro'},
  'senro.act2':{ko:'개발',en:'BUILD',group_name:'senro'},
  'senro.act3':{ko:'출시와 운영',en:'LAUNCH',group_name:'senro'},
  // Optional per-act copy, edited from /admin → 화면 문구. Empty acts fall back to project data.
  'senro.act1.body':{ko:null,en:null,group_name:'senro'},
  'senro.act2.body':{ko:null,en:null,group_name:'senro'},
  'senro.act3.body':{ko:null,en:null,group_name:'senro'},
  'tech.title':{ko:'사용한 기술과 연결된 작업',en:'Tools Behind the Work',group_name:'tech'},
  'tech.description':{ko:'원 크기는 해당 기술이 연결된 프로젝트 개수에 따라 달라집니다.',en:'Circle size is proportional to the number of linked projects.',group_name:'tech'},
  'recognition.title':{ko:'수상과 인증의 기록',en:'Honors & Recognition',group_name:'recognition'},
  'experience.title':{ko:'지금까지의 여정',en:'The Journey So Far',group_name:'experience'},
  'ending.title':{ko:'끝이 아닌, 다음 장면으로',en:'Not an ending. The next scene.',group_name:'ending'},
  'ending.tagline':{ko:'TO BE CONTINUED…',en:'TO BE CONTINUED…',group_name:'ending'}
 };
 for(const [key,row] of Object.entries(content))await put('site_content',{key,...row});
 await client.query('COMMIT');
 console.log(`Initial seed complete (upserts do not overwrite user edits): ${seed.projects.length} projects, ${seed.technologies.length} technologies, ${seed.recognitions.length} honors, ${seed.programs.length} programs`);
}catch(err){await client.query('ROLLBACK');throw err}finally{client.release();await pool.end()}
