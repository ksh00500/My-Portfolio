import 'server-only';
import {rows} from './db';
import {tableInfo,quoted} from './schema-introspection';
import {defaultSiteContent} from './site-content';
import type {PortfolioData,Project,Technology,Relation,Metric,Recognition,Experience,Participation,Copy} from './types';

const publicEntities = new Set(['profiles','projects','technologies','project_metrics','experiences','recognitions',
 'participations','leadership','employment','education','certifications','media_assets','site_content']);
const safeRecord=(row:Record<string,unknown>):Record<string,unknown>=>{
 const {source_notion_id:_notion,source_url:_source,phone:_phone,internal_note:_internal,admin_note:_admin,...publicRow}=row;
 return publicRow;
};
const stringOrNull=(v:unknown):string|null=>typeof v==='string'?v:null;
const bool=(v:unknown)=>v===true;
const numberOr=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
/** Only columns present in the real DB are selected. Public rows never fall back to unfiltered access. */
async function readPublic<T>(table:string,orders:string[],required=false):Promise<T[]>{
 const info=await tableInfo(table);
 if(!info.exists){if(required)throw new Error(`Required table unavailable: ${table}`);return []}
 if(publicEntities.has(table)&&!info.names.has('is_public'))return [];
 const sortable=orders.filter(x=>info.names.has(x));
 const order=sortable.length?` ORDER BY ${sortable.map(quoted).join(', ')}`:'';
 const where=info.names.has('is_public')?' WHERE is_public = true':'';
 return rows<T>(`SELECT * FROM ${quoted(table)}${where}${order}`);
}
function normalProject(raw:Record<string,unknown>):Project{
 const r=safeRecord(raw);
 // The real schema's summary/description/content_markdown are the source of truth;
 // language-specific legacy keys are used only if actually present in a record.
 return {...r,id:String(r.id),slug:String(r.slug||''),name:String(r.name||''),
  summary:stringOrNull(r.summary),description:stringOrNull(r.description),content_markdown:stringOrNull(r.content_markdown),
  status:stringOrNull(r.status)||'',project_type:stringOrNull(r.project_type)||'',is_featured:bool(r.is_featured),
  started_at:stringOrNull(r.started_at),ended_at:stringOrNull(r.ended_at),period_label:stringOrNull(r.period_label),
  role:stringOrNull(r.role),key_contributions:stringOrNull(r.key_contributions),
  result_summary:stringOrNull(r.result_summary),lessons_learned:stringOrNull(r.lessons_learned),
  github_url:r.source_code_visibility==='public'?stringOrNull(r.github_url):null,
  live_url:stringOrNull(r.live_url),source_code_visibility:stringOrNull(r.source_code_visibility),
  display_order:numberOr(r.display_order,0)};
}
function normalTechnology(raw:Record<string,unknown>):Technology{
 const r=safeRecord(raw);const status=r.proficiency;
 return {...r,id:String(r.id),name:String(r.name||''),category:String(r.category||''),
  description:stringOrNull(r.description),proficiency:status==='usable'||status==='learning'||status==='planned'?status:null,
  display_order:numberOr(r.display_order,0)};
}
async function publicRelations():Promise<Relation[]>{
 const info=await tableInfo('project_technologies');if(!info.exists)return [];
 const [p,t]=await Promise.all([tableInfo('projects'),tableInfo('technologies')]);
 if(!p.names.has('is_public')||!t.names.has('is_public')||!info.names.has('project_id')||!info.names.has('technology_id'))return [];
 return rows<Relation>(`SELECT pt.project_id,pt.technology_id,${info.names.has('usage_note')?'pt.usage_note':'NULL::text AS usage_note'},${info.names.has('is_primary')?'pt.is_primary':'false AS is_primary'}
 FROM project_technologies pt JOIN projects p ON p.id=pt.project_id JOIN technologies t ON t.id=pt.technology_id
 WHERE p.is_public=true AND t.is_public=true ORDER BY pt.project_id,pt.technology_id`);
}
async function publicAssetLinks():Promise<Record<string,unknown>[]> {
 const info=await tableInfo('asset_links');if(!info.exists)return [];
 const assetFk=info.names.has('asset_id')?'asset_id':info.names.has('media_asset_id')?'media_asset_id':null;
 if(!assetFk)return [];
 const keys=['profile_id','project_id','experience_id','recognition_id','certification_id'].filter(k=>info.names.has(k));
 if(keys.length===0)return [];
 // Never use the legacy entity_type/entity_id polymorphic scheme: FK relations are the source of truth.
 return rows<Record<string,unknown>>(`SELECT * FROM asset_links${info.names.has('is_public')?' WHERE is_public=true':''}`);
}
export async function getPortfolioData():Promise<PortfolioData>{
 const [profilesRaw,projectsRaw,technologiesRaw,projectTechnologies,projectMetrics,experiences,recognitions,participations,
  leadership,employment,education,certifications,mediaAssets,assetLinks,contents]=await Promise.all([
  readPublic<Record<string,unknown>>('profiles',['display_order','id'],true),
  readPublic<Record<string,unknown>>('projects',['display_order','name'],true),
  readPublic<Record<string,unknown>>('technologies',['display_order','name'],true),
  publicRelations(),readPublic<Metric>('project_metrics',['display_order','id']),
  readPublic<Experience>('experiences',['display_order','started_at','id']),
  readPublic<Recognition>('recognitions',['display_order','awarded_at','id']),
  readPublic<Participation>('participations',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('leadership',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('employment',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('education',['display_order','started_at','id']),
  readPublic<Record<string,unknown>>('certifications',['display_order','issued_at','id']),
  readPublic<Record<string,unknown>>('media_assets',['created_at','id']),
  publicAssetLinks(),readPublic<{key:string;ko:string|null;en:string|null}>('site_content',['display_order','key'])
 ]);
 const projects=projectsRaw.map(normalProject),technologies=technologiesRaw.map(normalTechnology);
 // Avoid accessing ids while the object is still being initialized.
 const experienceIds=new Set(experiences.map(e=>String(e.id)));
 const ids={profile:new Set(profilesRaw.map(p=>String(p.id))),project:new Set(projects.map(p=>p.id)),
  experience:experienceIds,recognition:new Set(recognitions.map(r=>String(r.id))),
  certification:new Set(certifications.filter(c=>c.status==='acquired'&&(!c.experience_id||experienceIds.has(String(c.experience_id)))).map(c=>String(c.id)))};
 // If a recognition references a hidden project, its public projection must not leak it.
 const publicRecognitions=recognitions.filter(r=>(!r.related_project_id||ids.project.has(String(r.related_project_id)))&&(!r.experience_id||ids.experience.has(String(r.experience_id))));
 ids.recognition=new Set(publicRecognitions.map(r=>String(r.id)));
 const visibleAssets=new Set(mediaAssets.map(a=>String(a.id)));
 const FK:Record<string,keyof typeof ids>={profile_id:'profile',project_id:'project',experience_id:'experience',recognition_id:'recognition',certification_id:'certification'};
 const visibleLinks=assetLinks.filter(a=>{
  if(!visibleAssets.has(String(a.asset_id??a.media_asset_id??'')))return false;
  const occupied=Object.entries(FK).filter(([key])=>a[key]!=null);
  // Fail closed on ambiguous references, including links to private entities.
  return occupied.length===1&&ids[occupied[0][1]].has(String(a[occupied[0][0]]));
 });
 const copy:Copy={...defaultSiteContent};for(const r of contents)if(typeof r.key==='string'&&r.key)copy[r.key]={ko:r.ko??copy[r.key]?.ko??null,en:r.en??copy[r.key]?.en??null};
 const linkedAssetIds=new Set(visibleLinks.map(a=>String(a.asset_id??a.media_asset_id)));
 const safeAssets=mediaAssets.filter(a=>linkedAssetIds.has(String(a.id))).map(safeRecord);
 const profile=profilesRaw[0]?safeRecord(profilesRaw[0]):null;
 return {profile,projects,technologies,projectTechnologies:projectTechnologies.filter(r=>ids.project.has(String(r.project_id))&&technologies.some(t=>t.id===String(r.technology_id))),
  projectMetrics:projectMetrics.filter(m=>ids.project.has(String(m.project_id))).map(m=>safeRecord(m as unknown as Record<string,unknown>) as unknown as Metric),
  experiences:experiences.map(e=>safeRecord(e as unknown as Record<string,unknown>) as unknown as Experience),
  recognitions:publicRecognitions.map(r=>safeRecord(r as unknown as Record<string,unknown>) as unknown as Recognition),
  participations:participations.filter(p=>(!p.related_project_id||ids.project.has(String(p.related_project_id)))&&(!p.experience_id||ids.experience.has(String(p.experience_id)))).map(p=>safeRecord(p as unknown as Record<string,unknown>) as unknown as Participation),
  leadership:leadership.filter(l=>(!l.related_project_id||ids.project.has(String(l.related_project_id)))&&(!l.experience_id||ids.experience.has(String(l.experience_id)))).map(safeRecord),employment:employment.filter(e=>!e.experience_id||ids.experience.has(String(e.experience_id))).map(safeRecord),education:education.filter(e=>!e.experience_id||ids.experience.has(String(e.experience_id))).map(safeRecord),
  certifications:certifications.filter(c=>c.status==='acquired'&&(!c.experience_id||ids.experience.has(String(c.experience_id)))).map(safeRecord),mediaAssets:safeAssets,assetLinks:visibleLinks.map(safeRecord),content:copy};
}
export async function getProjectBySlug(slug:string){const data=await getPortfolioData();return {project:data.projects.find(p=>p.slug===slug)||null,data};}
export async function inspectPublicSchema(){
 const names=['profiles','projects','technologies','project_technologies','project_metrics','experiences','recognitions',
 'participations','leadership','employment','education','certifications','media_assets','asset_links','site_content'];
 return Promise.all(names.map(async table=>{const info=await tableInfo(table);return {table,exists:info.exists,columns:info.columns.map(c=>c.name)}}));
}
