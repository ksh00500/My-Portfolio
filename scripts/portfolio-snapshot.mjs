/** Public portfolio export for Obsidian; full recovery uses the local pg_dump archive. */
export const fields = Object.fromEntries(Object.entries({
  profiles: 'id name_ko name_en headline intro_title bio school_name department email github_url keyda_url display_order',
  projects: 'id slug name name_en summary summary_en description description_en content_markdown project_type status is_featured started_at ended_at period_label role role_en ownership team_size team_label organization key_contributions result_summary lessons_learned github_url live_url store_url evidence_url source_code_visibility display_order',
  technologies: 'id name category proficiency description description_en display_order',
  project_technologies: 'project_id technology_id usage_note is_primary',
  project_metrics: 'id project_id metric_key metric_name numeric_value display_value unit comparison measured_at is_verified note display_order',
  experiences: 'id name name_en category organization role description outcome started_at ended_at period_label status is_ongoing is_highlight display_order',
  recognitions: 'id experience_id title title_en recognition_type award_name award_name_en rank_or_result issuer awarded_at related_project_id description display_order',
  certifications: 'id experience_id name issuer issued_at expires_at status score credential_url note display_order',
  education: 'id experience_id school_name school_name_en department program_type started_at ended_at expected_end_at status description display_order',
  employment: 'id experience_id company_name company_name_en employment_type position started_at ended_at responsibilities tech_summary description_ko description_en display_order',
  leadership: 'id experience_id activity_name organization role started_at ended_at status responsibilities related_project_id display_order',
  participations: 'id experience_id title participation_type organizer location started_at ended_at attendance_status role description outcome related_project_id display_order',
  goals: 'id title title_en description target_period target_date status display_order',
  tags: 'id name category display_order',
  project_experiences: 'project_id experience_id',
  experience_tags: 'experience_id tag_id',
  site_content: 'key ko en group_name display_order',
}).map(([table, columns]) => [table, columns.split(' ')]));

const relations = {
  project_technologies: { project_id: 'projects', technology_id: 'technologies' },
  project_experiences: { project_id: 'projects', experience_id: 'experiences' },
  experience_tags: { experience_id: 'experiences', tag_id: 'tags' },
};
const quote = value => '"' + value.replaceAll('"', '""') + '"';

export async function collectPortfolioSnapshot(client) {
  const { rows: schema } = await client.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`);
  const tables = {};
  for (const [table, allowlist] of Object.entries(fields)) {
    const names = new Set(schema.filter(row => row.table_name === table).map(row => row.column_name));
    const columns = allowlist.filter(name => names.has(name));
    if (!columns.length) continue;
    // Fail closed for entity tables with no visibility flag. Link tables are filtered below.
    if (!relations[table] && !names.has('is_public')) continue;
    const visible = names.has('is_public') ? ' WHERE is_public=true' : '';
    const { rows } = await client.query(`SELECT ${columns.map(quote).join(',')} FROM public.${quote(table)}${visible}`);
    tables[table] = rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  for (const [table, references] of Object.entries(relations)) {
    if (!tables[table]) continue;
    const visibleIds = Object.entries(references).map(([column, target]) => [column, new Set((tables[target] || []).map(row => String(row.id)))]);
    tables[table] = tables[table].filter(row => visibleIds.every(([column, ids]) => ids.has(String(row[column]))));
  }
  return { format: 'my-portfolio/public-snapshot/v1', scope: 'Public portfolio fields only; credentials, private rows and unlisted tables/columns are excluded. Restore from the local full archive.', tables };
}
