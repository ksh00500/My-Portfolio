"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project, Locale } from "@/lib/types";
import { projectSummary } from "@/lib/types";
import { langData, projectPeriod } from "@/lib/i18n";
import { categoryLabel, projectName, statusLabel } from "@/lib/presentation";

export function ArchiveFilters({
  projects,
  lang,
}: {
  projects: Project[];
  lang: Locale;
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("featured");
  const types = Array.from(new Set(projects.map((p) => p.project_type)))
    .filter(Boolean)
    .sort();
  const statuses = Array.from(new Set(projects.map((p) => p.status))).filter(
    Boolean,
  );
  const filtered = useMemo(
    () =>
      projects
        .filter((p) => {
          const query = search.trim().toLocaleLowerCase();
          const haystack = [
            p.name,
            p.name_en,
            projectSummary(p, lang),
            p.role,
            categoryLabel(p.project_type, lang),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();
          return (
            haystack.includes(query) &&
            (status === "all" || status === p.status) &&
            (type === "all" || type === p.project_type)
          );
        })
        .sort((a, b) => {
          if (sort === "name")
            return projectName(a, lang).localeCompare(
              projectName(b, lang),
              lang,
            );
          if (sort === "featured")
            return (
              Number(b.is_featured) - Number(a.is_featured) ||
              a.display_order - b.display_order
            );
          const startA = a.started_at || a.started_month,
            startB = b.started_at || b.started_month;
          if (!startA) return startB ? 1 : 0;
          if (!startB) return -1;
          return sort === "oldest"
            ? startA.localeCompare(startB)
            : startB.localeCompare(startA);
        }),
    [projects, search, status, type, sort, lang],
  );
  const t = langData[lang],
    ko = lang === "ko";
  const dirty = !!search || status !== "all" || type !== "all";
  const reset = () => {
    setSearch("");
    setStatus("all");
    setType("all");
  };
  return (
    <div>
      <div className="filter-row">
        <label className="input-field">
          <span>{ko ? "프로젝트 검색" : "Search projects"}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              ko ? "이름, 설명 또는 역할로 검색" : "Name, description, or role"
            }
          />
        </label>
        <label className="select-field">
          <span>{t.status}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">{t.all}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>{ko ? "프로젝트 유형" : "Project type"}</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{t.all}</option>
            {types.map((value) => (
              <option key={value} value={value}>
                {categoryLabel(value, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>{ko ? "정렬" : "Sort by"}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">{ko ? "추천순" : "Featured first"}</option>
            <option value="latest">{ko ? "최신순" : "Newest"}</option>
            <option value="oldest">{ko ? "오래된순" : "Oldest"}</option>
            <option value="name">{ko ? "이름순" : "Name"}</option>
          </select>
        </label>
      </div>
      <div className="archive-counter">
        <span role="status" aria-live="polite">
          {ko
            ? `전체 ${projects.length}개 중 ${filtered.length}개`
            : `${filtered.length} of ${projects.length} projects`}
        </span>
        {dirty && (
          <button className="filter-reset" type="button" onClick={reset}>
            {ko ? "필터 초기화" : "Clear filters"}
          </button>
        )}
      </div>
      <div className="archive-records">
        {filtered.map((p, i) => (
          <Link
            className="archive-row"
            key={p.id}
            href={`/${lang}/projects/${p.slug}`}
          >
            <span className="archive-index">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="archive-entry">
              <h2>{projectName(p, lang)}</h2>
              {projectSummary(p, lang) && <p>{projectSummary(p, lang)}</p>}
            </div>
            <div className="archive-tag">
              {statusLabel(p.status, lang)}
              <small>{projectPeriod(p, lang)}</small>
            </div>
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="archive-empty">
            <p>{ko ? "검색 결과가 없습니다." : "No matching projects."}</p>
            <span>
              {ko
                ? "다른 검색어를 입력하거나 필터를 초기화해 보세요."
                : "Try another search or clear the filters."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
