import 'server-only';
import {rows} from './db';
import type {PortfolioData,Project,Technology,Relation,Metric,Recognition,Experience,Participation,Copy} from './types';
export async function getPortfolioData():Promise<PortfolioData>{
 const [profile,projects,technologies,projectTechnologies,projectMetrics,experiences,recognitions,participations,leadership,employment,education,certifications,mediaAssets,assetLinks,contents] = await Promise.all([
  rows<Record<string,unknown>>('SELECT * FROM profile WHERE is_public = true ORDER BY display_order LIMIT 1'),
  rows<Project>('SELECT * FROM projects WHERE is_public = true ORDER BY is_featured DESC,display_order,name'),
  rows<Technology>('SELECT * FROM technologies WHERE is_public = true ORDER BY display_order,name'),
  rows<Relation>(`SELECT pt.project_id,pt.technology_id,pt.usage_note,pt.is_primary,pt.effort_weight,pt.verification_status
   FROM project_technologies pt JOIN projects p ON p.id=pt.project_id JOIN technologies t ON t.id=pt.technology_id
   WHERE pt.verification_status='confirmed' AND p.is_public=true AND t.is_public=true`),
  rows<Metric>('SELECT * FROM project_metrics WHERE is_public=true ORDER BY display_order'),
  rows<Experience>('SELECT * FROM experiences WHERE is_public=true ORDER BY is_highlight DESC,started_at DESC NULLS LAST,display_order'),
  rows<Recognition>('SELECT * FROM recognitions WHERE is_public=true ORDER BY awarded_at DESC NULLS LAST,display_order'),
  rows<Participation>('SELECT * FROM participations WHERE is_public=true ORDER BY started_at DESC NULLS LAST,display_order'),
  rows<Record<string,unknown>>('SELECT * FROM leadership WHERE is_public=true ORDER BY started_at DESC NULLS LAST'),
  rows<Record<string,unknown>>('SELECT * FROM employment WHERE is_public=true ORDER BY started_at DESC NULLS LAST'),
  rows<Record<string,unknown>>('SELECT * FROM education WHERE is_public=true ORDER BY started_at DESC NULLS LAST'),
  rows<Record<string,unknown>>('SELECT * FROM certifications WHERE is_public=true AND status=\'acquired\' ORDER BY issued_at DESC'),
  rows<Record<string,unknown>>('SELECT * FROM media_assets WHERE is_public=true ORDER BY display_order'),
  rows<Record<string,unknown>>(`SELECT a.* FROM asset_links a JOIN media_assets m ON m.id=a.asset_id WHERE m.is_public=true ORDER BY a.display_order`),
  rows<{key:string;ko:string|null;en:string|null}>('SELECT key,ko,en FROM site_content WHERE is_public=true')
 ]);
 // Public APIs must not reveal migration tracking URLs/IDs or private source repositories.
 const publicProjects=projects.map(({source_notion_id,source_url,...p})=>({...p,github_url:p.source_code_visibility==='public'?p.github_url:null}));
 const publicTech=technologies.map(({source_notion_id,...t})=>t);
 const publicExperiences=experiences.map(({source_notion_id,source_url,...e})=>e);
 return {profile:profile[0]||null,projects:publicProjects,technologies:publicTech,projectTechnologies,projectMetrics,experiences:publicExperiences,recognitions,participations,leadership,employment,education,certifications,mediaAssets,assetLinks,content:Object.fromEntries(contents.map(({key,ko,en})=>[key,{ko,en}])) as Copy};
}
export async function getProjectBySlug(slug:string){
 const all=await getPortfolioData();
 return {project:all.projects.find(p=>p.slug===slug)||null,data:all};
}
