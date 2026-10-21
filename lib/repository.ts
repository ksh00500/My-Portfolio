import 'server-only';
import {rows} from './db';
import {tableInfo,quoted} from './schema-introspection';
import {defaultSiteContent} from './site-content';
import type {PortfolioData,Project,Technology,Relation,Metric,Recognition,Experience,Participation,Copy} from './types';

const publicTables=new Set(['profiles','projects','technologies','project_metrics','experiences','recognitions',
 'participations','leadership','employment','education','certifications','media_assets','asset_links','site_content']);
/** SELECTs only columns whose presence was checked; optional tables may be absent. */
async function readPublic<T>(table:string,order:string[],required=false):Promise<T[]>{
 const info=await tableInfo(table);
 if(!info.exists){if(required)throw new Error(`Required table unavailable: ${table}`);return []}
 // Fail closed: never expose rows from a public-facing entity without an explicit visibility column.
 if(!info.names.has('is_public')&&publicTables.has(table)&&table!=='asset_links')return [];
 const sorts=order.filter(x=>info.names.has(x));
 const orderSQL=sorts.length?' ORDER BY '+sorts.map(quoted).join(', '):'';
 const whereSQL=info.names.has('is_public')?' WHERE is_public = true':'';
 return rows<T>(`SELECT * FROM ${quoted(table)}${whereSQL}${orderSQL}`);
}
async function publicRelations():Promise<Relation[]>{
 const info=await tableInfo('project_technologies');
 if(!info.exists)return [];
 const [pInfo,tInfo]=await Promise.all([tableInfo('projects'),tableInfo('technologies')]);
 if(!pInfo.names.has('is_public')||!tInfo.names.has('is_public'))return [];
 for(const key of ['project_id','technology_id'])if(!info.names.has(key))return [];
 // DB does not contain effort_weight or verification_status. No inferred verification labels.
 return rows<Relation>(`SELECT pt.project_id,pt.technology_id,${info.names.has('usage_note')?'pt.usage_note':'NULL::text AS usage_note'},${info.names.has('is_primary')?'pt.is_primary':'false AS is_primary'}
 FROM project_technologies pt JOIN projects p ON p.id=pt.project_id JOIN technologies t ON t.id=pt.technology_id
 WHERE p.is_public=true AND t.is_public=true ORDER BY pt.project_id,pt.technology_id`);
}
export async function getPortfolioData():Promise<PortfolioData>{
 const [profiles,projects,technologies,projectTechnologies,projectMetrics,experiences,recognitions,participations,
  leadership,employment,education,certifications,mediaAssets,assetLinks,contents]=await Promise.all([
  readPublic<Record<string,unknown>>('profiles',['display_order','id'],true),
  readPublic<Project>('projects',['display_order','name'],true),
  readPublic<Technology>('technologies',['display_order','name'],true),
  publicRelations(),
  readPublic<Metric>('project_metrics',['display_order','id']),
  readPublic<Experience>('experiences',['display_order','started_at','id']),
  readPublic<Recognition>('recognitions',['display_order','awarded_at','id']),
  readPublic<Participation>('participations',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('leadership',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('employment',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('education',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('certifications',['display_order','issued_at','id']),
  readPublic<Record<string,unknown>>('media_assets',['display_order','created_at','id']),
  readPublic<Record<string,unknown>>('asset_links',['display_order','id']),
  readPublic<{key:string;ko:string|null;en:string|null}>('site_content',['display_order','key'])
 ]);
 const visibleProjectIds=new Set(projects.map(p=>p.id));
 const visibleExperienceIds=new Set(experiences.map(e=>e.id));
 const visibleAssets=new Set(mediaAssets.map(a=>String(a.id)));
 const visibleRecognitionIds=new Set(recognitions.map(r=>r.id));
 const visibleCertificationIds=new Set(certifications.map(c=>String(c.id)));
 const visibleProfileIds=new Set(profiles.map(p=>String(p.id)));
 const visibleTechIds=new Set(technologies.map(t=>t.id));
 const maskedProjects=projects.map(p=>{
  const safe={...p,github_url:p.source_code_visibility==='public'?p.github_url:null};
  delete safe.source_notion_id;delete safe.source_url;
  return safe;
 });
 const visibleLinks=assetLinks.filter(a=>visibleAssets.has(String(a.asset_id))&&
  (a.entity_type==='projects'?visibleProjectIds.has(String(a.entity_id)):
   a.entity_type==='experiences'?visibleExperienceIds.has(String(a.entity_id)):
   a.entity_type==='recognitions'?visibleRecognitionIds.has(String(a.entity_id)):
   a.entity_type==='certifications'?visibleCertificationIds.has(String(a.entity_id)):
   a.entity_type==='profiles'?visibleProfileIds.has(String(a.entity_id)):false));
 const copy:Copy={...defaultSiteContent};
 for(const r of contents)if(r.key in copy || typeof r.key==='string')copy[r.key]={ko:r.ko??copy[r.key]?.ko??null,en:r.en??copy[r.key]?.en??null};
 const profile=profiles[0]||null;
 const safeProfile=profile?Object.fromEntries(Object.entries(profile).filter(([k])=>!['source_notion_id','phone'].includes(k))):null;
 const stripInternal=(r:Record<string,unknown>)=>Object.fromEntries(Object.entries(r).filter(([k])=>!['source_notion_id','source_url'].includes(k)));
 return {
  profile:safeProfile,
  projects:maskedProjects,technologies:technologies.map(t=>{const safe={...t};delete safe.source_notion_id;return safe;}),
  projectTechnologies:projectTechnologies.filter(r=>visibleProjectIds.has(r.project_id)&&visibleTechIds.has(r.technology_id)),
  projectMetrics:projectMetrics.filter(m=>visibleProjectIds.has(m.project_id)),
  experiences:experiences.map(e=>{const safe={...e};delete safe.source_notion_id;delete safe.source_url;return safe;}),
  recognitions:recognitions.filter(r=>!r.related_project_id||visibleProjectIds.has(r.related_project_id)).map(r=>stripInternal(r as unknown as Record<string,unknown>) as unknown as Recognition),
  participations:participations.map(p=>stripInternal(p as unknown as Record<string,unknown>) as unknown as Participation),leadership:leadership.map(stripInternal),employment:employment.map(stripInternal),education:education.map(stripInternal),certifications:certifications.filter(c=>c.status==='acquired').map(stripInternal),
  mediaAssets:mediaAssets.map(stripInternal),assetLinks:visibleLinks.map(stripInternal),content:copy
 };
}
export async function getProjectBySlug(slug:string){const data=await getPortfolioData();return {project:data.projects.find(p=>p.slug===slug)||null,data};}
/** Read-only compatibility report: inspect without mutating application data. */
export async function inspectPublicSchema(){
 const names=['profiles','projects','technologies','project_technologies','project_metrics','experiences','recognitions',
 'participations','leadership','employment','education','certifications','media_assets','asset_links','site_content'];
 return Promise.all(names.map(async table=>{const info=await tableInfo(table);return {table,exists:info.exists,columns:info.columns.map(c=>c.name)}}));
}
