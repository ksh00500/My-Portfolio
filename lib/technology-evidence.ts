import type { PortfolioData, TechnologyContext, TechnologyEvidence, TechnologySourceKind } from './types';

const sourceTables = {
  experience: 'experiences', recognition: 'recognitions', participation: 'participations',
  education: 'education', employment: 'employment', leadership: 'leadership', certification: 'certifications',
} as const;
type Sources = Pick<PortfolioData, 'projects' | 'technologies' | 'experiences' | 'recognitions' | 'participations' | 'education' | 'employment' | 'leadership' | 'certifications'>;
const text = (v: unknown) => typeof v === 'string' ? v : '';

/** Resolve only explicit evidence with visible references; never mine keywords or inherit stacks. */
export function resolveTechnologyContexts(
  evidence: TechnologyEvidence[], sources: Sources,
  projectExperiences: { project_id:string;experience_id:string }[] = [],
): TechnologyContext[] {
  const techIds = new Set(sources.technologies.filter(t => t.is_public !== false).map(t => t.id));
  const projectIds = new Set(sources.projects.filter(p => p.is_public !== false).map(p => p.id));
  const sourceMaps = Object.fromEntries(Object.entries(sourceTables).map(([kind, table]) => [
    kind, new Map(sources[table].filter(row => row.is_public !== false).map(row => [String(row.id), row as unknown as Record<string, unknown>])),
  ])) as Record<TechnologySourceKind, Map<string, Record<string, unknown>>>;
  const blocked = new Set(['planned', 'planning', 'cancelled', 'canceled', 'not_attended', 'unknown', 'unconfirmed', 'pending', 'applied', 'registered']);
  const validProjectsByExperience = new Map<string, Set<string>>();
  for (const link of projectExperiences) {
    if (!projectIds.has(link.project_id) || !sourceMaps.experience.has(link.experience_id)) continue;
    const ids = validProjectsByExperience.get(link.experience_id) || new Set<string>();
    ids.add(link.project_id); validProjectsByExperience.set(link.experience_id, ids);
  }
  const result: TechnologyContext[] = [];
  const seen = new Set<string>();
  for (const row of evidence) {
    if (row.is_public !== true || !techIds.has(row.technology_id) || !row.evidence_note?.trim()) continue;
    if (!['practice', 'learning', 'attendance', 'credential'].includes(row.evidence_kind)) continue;
    const occupied = (Object.keys(sourceTables) as TechnologySourceKind[]).filter(kind => row[`${kind}_id`] != null);
    if (occupied.length !== 1) continue;
    const kind = occupied[0];
    const source = sourceMaps[kind].get(String(row[`${kind}_id`]));
    if (!source || blocked.has(text(source.status))) continue;
    if (kind === 'participation' && !['attended', 'completed'].includes(text(source.attendance_status))) continue;
    if (kind === 'certification' && source.status !== 'acquired') continue;
    const experienceId = kind === 'experience' ? String(source.id) : text(source.experience_id);
    const experience = experienceId ? sourceMaps.experience.get(experienceId) : undefined;
    if (experienceId && (!experience || blocked.has(text(experience.status)))) continue;
    // A completed parent record must not turn unknown/cancelled attendance into experience.
    const participations = experienceId ? sources.participations.filter(p => p.experience_id === experienceId) : [];
    if (participations.length && participations.every(p => !['attended', 'completed'].includes(p.attendance_status))) continue;
    const relatedProject = text(source.related_project_id);
    if (relatedProject && !projectIds.has(relatedProject)) continue;
    const projects = experienceId ? validProjectsByExperience.get(experienceId) : undefined;
    const projectId = relatedProject || (projects?.size === 1 ? [...projects][0] : '');
    const canonicalKey = projectId ? `project:${projectId}` : experienceId ? `experience:${experienceId}` : `${kind}:${source.id}`;
    const category = text(experience?.category || source.category);
    const family: TechnologyContext['family'] = kind === 'recognition' ? 'award'
      : kind === 'employment' || category === 'Work' ? 'work'
      : kind === 'certification' || category === 'Certification & Badge' ? 'certification'
      : kind === 'education' || category === 'Education' || category === 'Program & Training' ? 'education' : 'activity';
    const title = text(source.title || source.name || source.activity_name || source.school_name || source.company_name);
    const key = JSON.stringify([row.technology_id, kind, source.id, row.evidence_kind]);
    if (!title || seen.has(key)) continue;
    seen.add(key);
    result.push({ id: row.id, technologyId: row.technology_id, sourceKind: kind, canonicalKey, family, title, note: row.evidence_note.trim(), evidenceKind: row.evidence_kind });
  }
  return result.sort((a,b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

/** One event can have a participation, award and experience row. Count it once. */
export function technologyContextCounts(contexts: TechnologyContext[]) {
  const keys = new Map<string, Set<string>>();
  for (const context of contexts) {
    const distinct = keys.get(context.technologyId) || new Set<string>();
    distinct.add(context.canonicalKey); keys.set(context.technologyId, distinct);
  }
  return Object.fromEntries([...keys].map(([id, distinct]) => [id, distinct.size]));
}
