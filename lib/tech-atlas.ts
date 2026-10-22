import type { Project, Relation, Technology } from "./types";

export interface AtlasLink {
  projectId: string;
  technologyId: string;
  note: string | null;
  primary: boolean;
}

/** The map represents recorded relations, including disconnected nodes. */
export function buildTechAtlas(
  technologies: Technology[],
  projects: Project[],
  relations: Relation[],
) {
  const techs = [...technologies].sort(
    (a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id),
  );
  const products = [...projects].sort(
    (a, b) => a.display_order - b.display_order || a.id.localeCompare(b.id),
  );
  const techIds = new Set(techs.map((t) => t.id));
  const projectIds = new Set(products.map((p) => p.id));
  const unique = new Map<string, AtlasLink>();
  for (const relation of relations) {
    if (
      !techIds.has(relation.technology_id) ||
      !projectIds.has(relation.project_id)
    )
      continue;
    const key = JSON.stringify([relation.technology_id, relation.project_id]);
    const previous = unique.get(key);
    unique.set(key, {
      technologyId: relation.technology_id,
      projectId: relation.project_id,
      note: previous?.note || relation.usage_note || null,
      primary: Boolean(previous?.primary || relation.is_primary),
    });
  }
  const links = [...unique.values()];
  const byTech = new Map(
    techs.map((t) => [t.id, links.filter((l) => l.technologyId === t.id)]),
  );
  const byProject = new Map(
    products.map((p) => [p.id, links.filter((l) => l.projectId === p.id)]),
  );
  const categories = [...new Set(techs.map((t) => t.category))];
  return { techs, projects: products, links, byTech, byProject, categories };
}
