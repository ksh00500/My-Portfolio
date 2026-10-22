import type { Project, Relation, Technology } from "./types";

export interface AtlasLink {
  projectId: string;
  technologyId: string;
  note: string | null;
  primary: boolean;
}

export const BUBBLE_MIN_RADIUS = 16;
export const BUBBLE_MAX_RADIUS = 40;
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
  labelLeft: number;
  labelRight: number;
  labelTop: number;
  labelBottom: number;
}

function rectanglesOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number },
) {
  return !(
    a.right + 5 <= b.left ||
    b.right + 5 <= a.left ||
    a.bottom + 5 <= b.top ||
    b.bottom + 5 <= a.top
  );
}

function circleTouchesLabel(circle: TechBubble, label: TechBubble) {
  const nearestX = Math.max(
    label.labelLeft - 4,
    Math.min(circle.x, label.labelRight + 4),
  );
  const nearestY = Math.max(
    label.labelTop - 4,
    Math.min(circle.y, label.labelBottom + 4),
  );
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) < circle.r + 5;
}

/** Test circles and label rectangles separately instead of treating both as a cell. */
export function techBubblesOverlap(a: TechBubble, b: TechBubble) {
  if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 12) return true;
  if (
    rectanglesOverlap(
      {
        left: a.labelLeft,
        right: a.labelRight,
        top: a.labelTop,
        bottom: a.labelBottom,
      },
      {
        left: b.labelLeft,
        right: b.labelRight,
        top: b.labelTop,
        bottom: b.labelBottom,
      },
    )
  )
    return true;
  return circleTouchesLabel(a, b) || circleTouchesLabel(b, a);
}

/** Native-pixel labels, seeded elliptical packing, and a tight vertical crop. */
export function layoutTechBubbles(
  items: { id: string; count: number }[],
  maximum: number,
  availableWidth = 760,
) {
  const width = Math.max(320, Math.round(availableWidth));
  const visualScale = width / 1000;
  const ordered = [...items].sort(
    (a, b) => b.count - a.count || a.id.localeCompare(b.id),
  );
  if (!items.length) return { width, height: 0, nodes: [] as TechBubble[] };
  const baseHeight = Math.max(
    180,
    Math.ceil((items.length * 118 * 88) / (width * 0.68)),
  );
  for (let attempt = 0; attempt < 12; attempt++) {
    const height = baseHeight * (1 + attempt * 0.25);
    const placed: TechBubble[] = [];
    for (const item of ordered) {
      const r = techBubbleRadius(item.count, maximum) * visualScale;
      let hash = 2166136261;
      for (const char of item.id)
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      const phase = ((hash >>> 0) / 4294967296) * Math.PI * 2;
      let found = false;
      for (let step = 0; step < 9000; step++) {
        const distance = Math.sqrt(step / 9000) * 0.75;
        const theta = phase + step * 2.3999632297;
        const x = width / 2 + Math.cos(theta) * distance * width;
        const y = height / 2 + Math.sin(theta) * distance * height;
        const labelTop = y + r + 7;
        const node = {
          ...item,
          r,
          x,
          y,
          left: x - Math.max(59, r + 5),
          right: x + Math.max(59, r + 5),
          top: y - r - 5,
          bottom: labelTop + 34,
          labelLeft: x - 59,
          labelRight: x + 59,
          labelTop,
          labelBottom: labelTop + 34,
        };
        if (
          node.left < 12 ||
          node.right > width - 12 ||
          node.top < 12 ||
          node.bottom > height - 12
        )
          continue;
        if (placed.some((other) => techBubblesOverlap(node, other))) continue;
        placed.push(node);
        found = true;
        break;
      }
      if (!found) break;
    }
    if (placed.length === ordered.length) {
      const offset = Math.min(...placed.map((node) => node.top)) - 12;
      return {
        width,
        height: Math.ceil(
          Math.max(...placed.map((node) => node.bottom)) - offset + 12,
        ),
        nodes: placed.map((node) => ({
          ...node,
          y: node.y - offset,
          top: node.top - offset,
          bottom: node.bottom - offset,
          labelTop: node.labelTop - offset,
          labelBottom: node.labelBottom - offset,
        })),
      };
    }
  }
  // A staggered, non-grid fallback remains readable for extreme record counts.
  let cursorY = 16;
  const nodes = ordered.map((item, i) => {
    const r = techBubbleRadius(item.count, maximum) * visualScale;
    const x = width * (0.35 + (i % 3) * 0.15),
      y = cursorY + r;
    cursorY = y + r + 57;
    return {
      ...item,
      r,
      x,
      y,
      left: x - 59,
      right: x + 59,
      top: y - r - 5,
      bottom: y + r + 41,
      labelLeft: x - 59,
      labelRight: x + 59,
      labelTop: y + r + 7,
      labelBottom: y + r + 41,
    };
  });
  return { width, height: cursorY + 12, nodes };
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
