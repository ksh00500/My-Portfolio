"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildTechAtlas } from "@/lib/tech-atlas";
import { categoryLabel, projectName, statusLabel } from "@/lib/presentation";
import { projectSummary } from "@/lib/types";
import type { Locale, Technology, Relation, Project } from "@/lib/types";

type Selection = { kind: "tech" | "project"; id: string } | null;

export function TechAtlas({
  techs,
  relations,
  projects,
  lang,
}: {
  techs: Technology[];
  relations: Relation[];
  projects: Project[];
  lang: Locale;
}) {
  const ko = lang === "ko";
  const id = useId();
  const model = useMemo(
    () => buildTechAtlas(techs, projects, relations),
    [techs, projects, relations],
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [query, setQuery] = useState("");
  const [proficiency, setProficiency] = useState("all");
  const [view, setView] = useState("map");
  const selectedTech =
    selection?.kind === "tech"
      ? model.techs.find((t) => t.id === selection.id)
      : undefined;
  const selectedProject =
    selection?.kind === "project"
      ? model.projects.find((p) => p.id === selection.id)
      : undefined;
  const activeLinks = selectedTech
    ? model.byTech.get(selectedTech.id) || []
    : selectedProject
      ? model.byProject.get(selectedProject.id) || []
      : [];
  const linkedTechs = new Set(activeLinks.map((l) => l.technologyId));
  const linkedProjects = new Set(activeLinks.map((l) => l.projectId));
  const visible = model.techs.filter(
    (t) =>
      (proficiency === "all" || t.proficiency === proficiency) &&
      `${t.name} ${t.category} ${categoryLabel(t.category, lang)}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  const families = model.categories
    .map((category) => ({
      category,
      nodes: visible.filter((t) => t.category === category),
    }))
    .filter((g) => g.nodes.length);
  const displayedProjects = selectedTech
    ? model.projects.filter((p) => linkedProjects.has(p.id))
    : model.projects;
  const status = (t: Technology) =>
    t.proficiency === "usable"
      ? ko
        ? "활용 중"
        : "Using"
      : t.proficiency === "learning"
        ? ko
          ? "학습 중"
          : "Learning"
        : t.proficiency === "planned"
          ? ko
            ? "학습 예정"
            : "Planned"
          : ko
            ? "상태 미등록"
            : "Not recorded";
  const description =
    selectedTech &&
    (lang === "en"
      ? selectedTech.description_en || selectedTech.description
      : selectedTech.description_ko || selectedTech.description);
  const selectTech = (technology: Technology) =>
    setSelection(
      selection?.kind === "tech" && selection.id === technology.id
        ? null
        : { kind: "tech", id: technology.id },
    );
  const clearFilters = () => {
    setQuery("");
    setProficiency("all");
    setSelection(null);
  };

  return (
    <div className="skill-atlas">
      <div className="skill-atlas-top">
        <div className="atlas-signature">
          <span aria-hidden="true">✳</span>
          <div>
            <strong>TECH → PROJECT</strong>
            <p>
              {ko ? "기술을 따라 프로젝트로" : "Follow a skill into the work"}
            </p>
          </div>
        </div>
        <dl className="atlas-totals">
          <div>
            <dt>{ko ? "기술" : "Skills"}</dt>
            <dd>{model.techs.length}</dd>
          </div>
          <div>
            <dt>{ko ? "프로젝트" : "Projects"}</dt>
            <dd>{model.projects.length}</dd>
          </div>
          <div>
            <dt>{ko ? "연결" : "Links"}</dt>
            <dd>{model.links.length}</dd>
          </div>
        </dl>
      </div>
      <div className="atlas-tools">
        <label className="atlas-search">
          <span>{ko ? "기술 찾기" : "Find a skill"}</span>
          <input
            type="search"
            value={query}
            placeholder={
              ko ? "기술명 또는 분야 검색" : "Search skills or categories"
            }
            onChange={(e) => {
              setQuery(e.target.value);
              setSelection(null);
            }}
          />
        </label>
        <label className="atlas-filter">
          <span>{ko ? "활용 상태" : "Status"}</span>
          <select
            value={proficiency}
            onChange={(e) => {
              setProficiency(e.target.value);
              setSelection(null);
            }}
          >
            <option value="all">{ko ? "전체" : "All"}</option>
            <option value="usable">{ko ? "활용 중" : "Using"}</option>
            <option value="learning">{ko ? "학습 중" : "Learning"}</option>
            <option value="planned">{ko ? "학습 예정" : "Planned"}</option>
          </select>
        </label>
        <div
          className="atlas-view-switch"
          role="group"
          aria-label={ko ? "기술 보기 방식" : "Skill view"}
        >
          {["map", "list"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {value === "map" ? (ko ? "관계도" : "Map") : ko ? "목록" : "List"}
            </button>
          ))}
        </div>
      </div>
      <div className="atlas-explorer">
        <div className="atlas-constellation" data-view={view} id={`${id}-map`}>
          <div className="atlas-root">
            <span className="atlas-root-dot" aria-hidden="true" />
            <strong>FULL-STACK</strong>
            <span>
              {ko ? "분야 → 기술 → 프로젝트" : "Category → skill → project"}
            </span>
          </div>
          {selectedTech && (
            <div className="atlas-current-selection">
              <span>{selectedTech.name}</span>
              <a href={`#${id}-detail`}>
                {ko
                  ? `프로젝트 ${activeLinks.length}개 보기 ↓`
                  : `View ${activeLinks.length} projects ↓`}
              </a>
            </div>
          )}
          <div className="atlas-families">
            {families.map(({ category, nodes }, index) => (
              <section
                className="atlas-family"
                key={category}
                style={{ "--branch-index": index } as CSSProperties}
              >
                <h3>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {categoryLabel(category, lang)}
                </h3>
                <div className="atlas-skill-nodes">
                  {nodes.map((t) => {
                    const active = selectedTech?.id === t.id;
                    const linked = selectedProject && linkedTechs.has(t.id);
                    const dimmed = selectedProject && !linked;
                    const count = model.byTech.get(t.id)?.length || 0;
                    return (
                      <button
                        className="atlas-skill-node"
                        type="button"
                        key={t.id}
                        data-status={t.proficiency || "unknown"}
                        data-linked={linked ? "true" : undefined}
                        data-dimmed={dimmed ? "true" : undefined}
                        aria-pressed={active}
                        aria-controls={`${id}-detail`}
                        onClick={() => selectTech(t)}
                      >
                        <span className="atlas-node-port" aria-hidden="true" />
                        <span className="atlas-node-name">
                          {t.name}
                          <small>{status(t)}</small>
                        </span>
                        <span
                          className="atlas-node-count"
                          aria-label={
                            ko
                              ? `연결된 프로젝트 ${count}개`
                              : `${count} linked projects`
                          }
                        >
                          {count || "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          {!visible.length && (
            <div className="atlas-empty">
              <p>
                {ko ? "조건에 맞는 기술이 없습니다." : "No matching skills."}
              </p>
              <button type="button" onClick={clearFilters}>
                {ko ? "검색·필터 초기화" : "Clear filters"}
              </button>
            </div>
          )}
          <div className="atlas-map-caption">
            <span role="status">
              {ko
                ? `${model.techs.length}개 중 ${visible.length}개 기술`
                : `${visible.length} of ${model.techs.length} skills`}
            </span>
            <span>
              {ko ? "선을 따라 연결을 탐색하세요." : "Explore the connections."}
            </span>
          </div>
        </div>
        <aside
          className="atlas-project-panel"
          id={`${id}-detail`}
          aria-label={ko ? "연결된 프로젝트" : "Connected projects"}
        >
          <div className="atlas-panel-heading">
            <span className="eyebrow">
              {selectedTech
                ? "SELECTED TECHNOLOGY"
                : selectedProject
                  ? "SELECTED PROJECT"
                  : "PROJECT CONNECTIONS"}
            </span>
            {selection && (
              <button
                type="button"
                className="atlas-clear"
                onClick={() => setSelection(null)}
              >
                {ko ? "선택 해제" : "Clear"} ×
              </button>
            )}
          </div>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="atlas-selection-summary"
          >
            <h3>
              {selectedTech?.name ||
                (selectedProject && projectName(selectedProject, lang)) ||
                (ko
                  ? "무엇을 만들었는지까지."
                  : "From skills to things built.")}
            </h3>
            <p>
              {selectedTech
                ? `${categoryLabel(selectedTech.category, lang)} · ${status(selectedTech)}`
                : selectedProject
                  ? statusLabel(selectedProject.status, lang)
                  : ko
                    ? "기술을 누르면 사용한 프로젝트가, 프로젝트를 누르면 사용 기술이 강조됩니다."
                    : "Select a skill to find its projects, or a project to highlight its stack."}
            </p>
            {description && <p>{description}</p>}
            {selectedProject && (
              <>
                <p>{projectSummary(selectedProject, lang)}</p>
                <Link
                  className="text-link"
                  href={`/${lang}/projects/${selectedProject.slug}`}
                >
                  {ko ? "프로젝트 상세" : "Read the project"}
                  <span aria-hidden="true">↗</span>
                </Link>
                <p className="atlas-project-stack">
                  <a href={`#${id}-map`}>
                    {ko
                      ? `사용 기술 ${activeLinks.length}개 보기 ↑`
                      : `Explore ${activeLinks.length} skills ↑`}
                  </a>
                </p>
              </>
            )}
          </div>
          <div className="atlas-project-branches">
            {displayedProjects.map((p) => {
              const note =
                selectedTech &&
                activeLinks.find((l) => l.projectId === p.id)?.note;
              return (
                <div className="atlas-project-branch" key={p.id}>
                  <button
                    type="button"
                    className="atlas-project-node"
                    aria-pressed={selectedProject?.id === p.id}
                    onClick={() =>
                      setSelection(
                        selectedProject?.id === p.id
                          ? null
                          : { kind: "project", id: p.id },
                      )
                    }
                  >
                    <span className="atlas-project-dot" aria-hidden="true" />
                    <span>
                      <strong>{projectName(p, lang)}</strong>
                      <small>
                        {statusLabel(p.status, lang)} ·{" "}
                        {model.byProject.get(p.id)?.length || 0}{" "}
                        {ko ? "기술" : "skills"}
                      </small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                  {note && <p className="atlas-usage-note">{note}</p>}
                  {selectedTech && (
                    <Link
                      className="atlas-project-link"
                      href={`/${lang}/projects/${p.slug}`}
                    >
                      {ko ? "상세 보기" : "View project"} ↗
                    </Link>
                  )}
                </div>
              );
            })}
            {!displayedProjects.length && (
              <p className="atlas-empty-note">
                {ko
                  ? "등록된 프로젝트 연결이 없습니다."
                  : "No project connections recorded."}
              </p>
            )}
          </div>
        </aside>
      </div>
      <p className="atlas-data-note">
        {ko
          ? "분야의 가지는 기술 분류를, 프로젝트 연결은 등록된 사용 이력을 나타냅니다. 숫자는 연결된 프로젝트 수이며 숙련도 점수가 아닙니다."
          : "Branches group technologies by category. Project links show recorded usage; counts represent connected projects, not proficiency scores."}
      </p>
    </div>
  );
}
