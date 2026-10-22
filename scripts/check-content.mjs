/** Keep the requested identity, retire the philosophy copy, and preserve DB rows. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/site-content.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { defaultSiteContent, resolveSiteContent } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
assert.deepEqual(resolveSiteContent([]), defaultSiteContent);
const old = [
  {
    key: "hero.title",
    ko: "셈을 못하는 상인",
    en: "A Merchant Who Can't Count",
  },
  {
    key: "hero.subtitle",
    ko: "삶은 계산하며 살아가되, 사람에게는 계산하지 않는다.",
    en: "I calculate my way through life, but never keep score with people.",
  },
  { key: "ending.tagline", ko: "TO BE CONTINUED…", en: "TO BE CONTINUED…" },
];
const snapshot = structuredClone(old);
const clean = resolveSiteContent(old);
assert.equal(defaultSiteContent["hero.title"].ko, "셈을 못하는 상인");
assert.deepEqual(
  clean["hero.title"],
  { ko: old[0].ko, en: old[0].en },
  "the requested brand name must survive content resolution",
);
assert.equal(
  resolveSiteContent([
    { key: "hero.title", ko: null, en: "A Merchant Who Can’t Count" },
  ])["hero.title"].en,
  "A Merchant Who Can’t Count",
);
assert.deepEqual(clean["hero.subtitle"], defaultSiteContent["hero.subtitle"]);
assert.ok(!Object.hasOwn(clean, "ending.tagline"));
assert.deepEqual(
  old,
  snapshot,
  "reading content must not mutate input records",
);
const custom = resolveSiteContent([
  { key: "hero.title", ko: "서비스를 만드는 개발자", en: null },
  { key: "constructor", ko: "bad", en: "bad" },
]);
assert.equal(custom["hero.title"].ko, "서비스를 만드는 개발자");
assert.equal(custom["hero.title"].en, defaultSiteContent["hero.title"].en);
assert.ok(!Object.hasOwn(custom, "constructor"));
assert.deepEqual(
  resolveSiteContent([]),
  defaultSiteContent,
  "one request must not mutate the shared defaults",
);
console.log(
  "Content regression checks passed: restored identity, retired philosophy, custom copy, locale fallbacks, immutable defaults.",
);
