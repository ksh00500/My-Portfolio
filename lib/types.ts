export type Locale = 'ko' | 'en';
/** Physical project columns take precedence. Legacy localization keys remain optional so old imported records still render. */
export interface Project {
 id:string;slug:string;name:string;name_en?:string|null;
 summary:string|null;description:string|null;content_markdown:string|null;
 summary_ko?:string|null;summary_en?:string|null;description_ko?:string|null;description_en?:string|null;
 status:string;project_type:string;is_featured:boolean;
 started_at:string|null;ended_at:string|null;period_label:string|null;
 planned_end_at?:string|null;started_month?:string|null;ended_month?:string|null;planned_end_month?:string|null;
 role:string|null;role_en?:string|null;ownership?:string|null;
 key_contributions:string|null;key_contributions_en?:string|null;result_summary:string|null;result_summary_en?:string|null;
 lessons_learned:string|null;lessons_learned_en?:string|null;
 github_url:string|null;live_url:string|null;store_url?:string|null;source_code_visibility:string|null;
 display_order:number;[key:string]:unknown;
}
export interface Technology {
 id:string;name:string;category:string;proficiency:'usable'|'learning'|'planned'|null;
 description:string|null;description_ko?:string|null;description_en?:string|null;display_order:number;[key:string]:unknown;
}
export interface Relation {project_id:string;technology_id:string;usage_note:string|null;is_primary:boolean;}
export interface Metric {id:string;project_id:string;metric_key:string;metric_name:string;display_value:string;comparison:string;is_verified:boolean}
export interface Recognition {id:string;title:string;title_en:string|null;recognition_type:string;award_name:string;award_name_en:string|null;rank_or_result:string|null;awarded_at:string|null;related_project_id:string|null;[key:string]:unknown}
export interface Experience {id:string;name:string;name_en:string|null;category:string;organization:string|null;role:string|null;role_en?:string|null;started_at:string|null;ended_at:string|null;period_label:string|null;status:string|null;is_ongoing:boolean;is_highlight:boolean;[key:string]:unknown}
export interface Participation {id:string;title:string;started_at:string|null;ended_at:string|null;attendance_status:string;[key:string]:unknown}
export type Copy = Record<string,{ko:string|null;en:string|null}>;
export type TechnologyEvidenceKind = 'practice' | 'learning' | 'attendance' | 'credential';
export type TechnologySourceKind = 'experience' | 'recognition' | 'participation' | 'education' | 'employment' | 'leadership' | 'certification';
export interface TechnologyEvidence {
 id:string;technology_id:string;evidence_kind:TechnologyEvidenceKind;evidence_note:string;is_public:boolean;
 experience_id?:string|null;recognition_id?:string|null;participation_id?:string|null;education_id?:string|null;
 employment_id?:string|null;leadership_id?:string|null;certification_id?:string|null;
}
export interface TechnologyContext {
 id:string;technologyId:string;canonicalKey:string;sourceKind:TechnologySourceKind;
 family:'work'|'education'|'award'|'activity'|'certification';
 title:string;note:string;evidenceKind:TechnologyEvidenceKind;
}
export interface PortfolioData {profile:Record<string,unknown>|null;projects:Project[];technologies:Technology[];projectTechnologies:Relation[];projectMetrics:Metric[];experiences:Experience[];recognitions:Recognition[];participations:Participation[];leadership:Record<string,unknown>[];employment:Record<string,unknown>[];education:Record<string,unknown>[];certifications:Record<string,unknown>[];mediaAssets:Record<string,unknown>[];assetLinks:Record<string,unknown>[];content:Copy;technologyContexts?:TechnologyContext[];}
export const translate=(content:Copy,key:string,lang:Locale,fallback='')=>content[key]?.[lang]||content[key]?.ko||fallback;
export const projectSummary=(p:Project,lang:Locale)=> (lang==='en'?(p.summary_en||p.summary):(p.summary_ko||p.summary)) || p.summary || p.description || '';
export const projectDescription=(p:Project,lang:Locale)=> (lang==='en'?(p.description_en||p.description):(p.description_ko||p.description)) || p.description || projectSummary(p,lang);
