import type { Project, Relation, Technology } from "./types";

export interface AtlasLink {
  projectId: string;
  technologyId: string;
  note: string | null;
  primary: boolean;
}

export const BUBBLE_MIN_RADIUS = 34;
export const BUBBLE_MAX_RADIUS = 88;
export const TECH_CATEGORY_COLORS = [
  "#a2dcf1",
  "#b9d4ff",
  "#b5dfc7",
  "#e2c9f1",
  "#ddcd9e",
  "#92d4d0",
  "#d8b5c8",
  "#b8cce2",
  "#c9dca6",
];

/** A visible zero baseline plus equal area increments for each distinct project. */
export function techBubbleRadius(count: number, maximum: number) {
  const value = Math.max(0, count);
  const scale = Math.max(1, maximum, value);
  return Math.sqrt(
    BUBBLE_MIN_RADIUS ** 2 +
      ((BUBBLE_MAX_RADIUS ** 2 - BUBBLE_MIN_RADIUS ** 2) * value) / scale,
  );
}

export interface TechBubble {
  id: string;
  count: number;
  x: number;
  y: number;
  r: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Label bounds participate in packing, so readable names do not overlap circles. */
export function layoutTechBubbles(
  items: { id: string; count: number }[],
  maximum: number,
) {
  const width = 1000;
  const ordered = [...items].sort(
    (a, b) => b.count - a.count || a.id.localeCompare(b.id),
  );
  const area = ordered.reduce((sum, item) => {
    const r = techBubbleRadius(item.count, maximum);
    return sum + Math.max(168, r * 2 + 24) * (r * 2 + 66);
  }, 0);
  const baseHeight = Math.max(540, Math.ceil(area / (width * 0.48)));
  for (let attempt = 0; attempt < 5; attempt++) {
    const height = baseHeight + attempt * 160;
    const placed: TechBubble[] = [];
    for (const item of ordered) {
      const r = techBubbleRadius(item.count, maximum);
      const halfWidth = Math.max(84, r + 12);
      let found = false;
      for (let step = 0; step < 14000; step++) {
        const distance = Math.sqrt(step) * 6;
        const theta = step * 2.3999632297;
        const x = width / 2 + Math.cos(theta) * distance * 1.35;
        const y = height / 2 - 22 + Math.sin(theta) * distance;
        const node = {
          ...item,
          r,
          x,
          y,
          left: x - halfWidth,
          right: x + halfWidth,
          top: y - r - 12,
          bottom: y + r + 54,
        };
        if (
          node.left < 22 ||
          node.right > width - 22 ||
          node.top < 22 ||
          node.bottom > height - 22
        )
          continue;
        if (
          placed.some(
            (other) =>
              !(
                node.right + 8 <= other.left ||
                other.right + 8 <= node.left ||
                node.bottom + 8 <= other.top ||
                other.bottom + 8 <= node.top
              ),
          )
        )
          continue;
        placed.push(node);
        found = true;
        break;
      }
      if (!found) break;
    }
    if (placed.length === ordered.length)
      return { width, height, nodes: placed };
  }
  // Bounded deterministic fallback for unusually large data sets.
  const cellWidth = 240,
    cellHeight = 260;
  return {
    width,
    height: Math.max(540, Math.ceil(ordered.length / 4) * cellHeight + 44),
    nodes: ordered.map((item, i) => {
      const r = techBubbleRadius(item.count, maximum);
      const x = 140 + (i % 4) * cellWidth,
        y = 122 + Math.floor(i / 4) * cellHeight;
      return {
        ...item,
        r,
        x,
        y,
        left: x - 100,
        right: x + 100,
        top: y - r - 12,
        bottom: y + r + 54,
      };
    }),
  };
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
