/** Verify relationship semantics; visual appearance is not asserted here. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/tech-atlas.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { buildTechAtlas } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
const technologies = [
  {
    id: "t:1",
    name: "Next.js",
    category: "Web",
    display_order: 2,
    proficiency: "usable",
  },
  {
    id: "t2",
    name: "Python",
    category: "Language",
    display_order: 1,
    proficiency: "learning",
  },
  {
    id: "t3",
    name: "Isolated",
    category: "Web",
    display_order: 3,
    proficiency: "planned",
  },
];
const projects = [
  { id: "p1", display_order: 1 },
  { id: "p2", display_order: 2 },
];
const relations = [
  {
    technology_id: "t:1",
    project_id: "p1",
    usage_note: null,
    is_primary: false,
  },
  {
    technology_id: "t:1",
    project_id: "p1",
    usage_note: "UI implementation",
    is_primary: true,
  },
  {
    technology_id: "t2",
    project_id: "p1",
    usage_note: null,
    is_primary: false,
  },
  {
    technology_id: "private-tech",
    project_id: "p1",
    usage_note: null,
    is_primary: false,
  },
  {
    technology_id: "t2",
    project_id: "private-project",
    usage_note: null,
    is_primary: false,
  },
];
const snapshot = structuredClone({ technologies, projects, relations });
const graph = buildTechAtlas(technologies, projects, relations);
assert.deepEqual(
  graph.techs.map((t) => t.id),
  ["t2", "t:1", "t3"],
);
assert.deepEqual(graph.categories, ["Language", "Web"]);
assert.equal(
  graph.links.length,
  2,
  "duplicate and unavailable records must not inflate counts",
);
assert.equal(graph.byTech.get("t:1").length, 1);
assert.equal(graph.byTech.get("t:1")[0].note, "UI implementation");
assert.equal(graph.byTech.get("t:1")[0].primary, true);
assert.equal(graph.byProject.get("p1").length, 2);
assert.deepEqual(
  graph.byProject.get("p2"),
  [],
  "projects without records remain visible",
);
assert.deepEqual(
  graph.byTech.get("t3"),
  [],
  "planned and disconnected technologies remain visible",
);
assert.deepEqual(
  { technologies, projects, relations },
  snapshot,
  "building the map must not mutate repository data",
);
assert.equal(buildTechAtlas([], [], relations).links.length, 0);
console.log(
  "Atlas checks passed: real links, deduplicated counts, unavailable records, isolated nodes, stable order, immutable inputs.",
);
