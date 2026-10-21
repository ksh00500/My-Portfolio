export type AdminResource={columns:string[];required:string[];sort:string;};
const base=['id','is_public','display_order','source_notion_id'];
const extended=(fields:string,required:string[]=['id'],sort='display_order')=>({columns:[...new Set([...base,...fields.split(' ').filter(Boolean)])],required,sort});
// Server-side registry. Identifiers never come from the request unvalidated.
export const resources:Record<string,AdminResource>={
 profile:extended('name_ko name_en headline intro_title_ko intro_title_en bio_ko bio_en school_name department current_grade academic_status academic_plan email phone github_url instagram_url youtube_url keyda_url primary_product_url profile_image_id',['id','name_ko']),
 projects:extended('slug name name_en summary_ko summary_en description_ko description_en project_type status is_featured featured_order started_at ended_at planned_end_at started_month ended_month planned_end_month brand_started_at date_precision start_date_source end_date_estimated period_label role role_en ownership team_size team_label organization organization_en key_contributions key_contributions_en tech_stack_summary result_summary result_summary_en lessons_learned lessons_learned_en github_url live_url store_url source_url evidence_url source_code_visibility linkedin_sync_status',['id','slug','name']),
 project_metrics:extended('project_id metric_key metric_name numeric_value display_value unit comparison measured_at source_type is_verified note',['id','project_id','metric_key','metric_name','display_value']),
 technologies:extended('name category proficiency description_ko description_en',['id','name','category']),
 project_technologies:{columns:['project_id','technology_id','usage_note','is_primary','effort_weight','verification_status'],required:['project_id','technology_id'],sort:'project_id'},
 experiences:extended('name name_en category subcategory organization role role_en description_ko description_en outcome outcome_en location started_at ended_at outcome_at date_precision period_label status is_ongoing is_highlight credential_id credential_url source_url linkedin_sync_status',['id','name','category']),
 recognitions:extended('experience_id title title_en recognition_type award_name award_name_en rank_or_result issuer awarded_at academic_year academic_term related_project_id description evidence_asset_id',['id','title','recognition_type','award_name']),
 certifications:extended('experience_id name issuer credential_number issued_at expires_at status score credential_url note',['id','name','issuer']),
 leadership:extended('experience_id activity_name activity_name_en organization organization_type role role_en started_at ended_at started_month ended_month status responsibilities related_project_id',['id','activity_name']),
 participations:extended('experience_id title title_en participation_type organizer instructor location started_at ended_at attendance_status role description outcome related_project_id',['id','title']),
 education:extended('experience_id school_name school_name_en department department_en education_level program_type started_at ended_at expected_end_at status description',['id','school_name']),
 employment:extended('experience_id company_name company_name_en employment_type position position_en started_at ended_at responsibilities tech_summary description_ko description_en source_material_visibility',['id','company_name']),
 goals:extended('title title_en description target_period target_date status',['id','title']),
 media_assets:extended('file_name media_type mime_type storage_key external_url caption source',['id','file_name','media_type']),
 asset_links:extended('asset_id entity_type entity_id asset_role',['id','asset_id','entity_type','entity_id']),
 project_experiences:{columns:['project_id','experience_id'],required:['project_id','experience_id'],sort:'project_id'},
 tags:extended('name category',['id','name']),
 experience_tags:{columns:['experience_id','tag_id'],required:['experience_id','tag_id'],sort:'experience_id'},
 site_content:{columns:['key','ko','en','group_name','is_public','display_order'],required:['key'],sort:'group_name'},
};
export function resourceConfig(name:string){return resources[name]??null}
