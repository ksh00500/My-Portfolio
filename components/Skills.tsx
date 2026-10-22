"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale, Project, Relation, Technology } from "@/lib/types";
import { categoryLabel, projectName } from "@/lib/presentation";

export function Skills({
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
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected || !window.matchMedia("(max-width:640px)").matches) return;
    detail.current?.focus({ preventScroll: true });
    detail.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selected]);
  const ko = lang === "ko";
  const filtered = techs.filter(
    (t) =>
      t.proficiency !== "planned" &&
      (filter === "all" || t.proficiency === filter),
  );
  const categories = Array.from(new Set(filtered.map((t) => t.category)));
  const active = techs.find((t) => t.id === selected);
  const linkedIds = new Set(
    relations
      .filter((r) => r.technology_id === selected)
      .map((r) => r.project_id),
  );
  const linked = projects.filter((p) => linkedIds.has(p.id));
  const description = active
    ? lang === "en"
      ? active.description_en || active.description
      : active.description_ko || active.description
    : null;
  return (
    <div className="skills-explorer">
      <div className="skills-toolbar">
        <div
          className="segmented"
          role="group"
          aria-label={ko ? "기술 상태 필터" : "Filter technologies"}
        >
          {[
            ["all", ko ? "전체" : "All"],
            ["usable", ko ? "활용 중" : "Using"],
            ["learning", ko ? "학습 중" : "Learning"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setSelected(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span>
          {ko
            ? "기술을 선택하면 연결된 프로젝트를 볼 수 있습니다."
            : "Select a technology to see related projects."}
        </span>
      </div>
      <div className="skills-layout">
        <div>
          {categories.map((category) => (
            <div className="skill-category" key={category}>
              <h3>{categoryLabel(category, lang)}</h3>
              <div className="skill-buttons">
                {filtered
                  .filter((t) => t.category === category)
                  .map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      aria-pressed={selected === t.id}
                      onClick={() =>
                        setSelected(selected === t.id ? null : t.id)
                      }
                    >
                      {t.name}
                      {t.proficiency === "learning" && (
                        <span>{ko ? "학습 중" : "Learning"}</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="empty-note">
              {ko ? "등록된 기술이 없습니다." : "No technologies recorded."}
            </p>
          )}
        </div>
        <aside
          ref={detail}
          className="skill-detail"
          aria-live="polite"
          tabIndex={-1}
          aria-label={ko ? "선택한 기술 상세" : "Selected technology details"}
        >
          {active ? (
            <>
              <span className="eyebrow">TECHNOLOGY</span>
              <h3>{active.name}</h3>
              {description && <p>{description}</p>}
              <h4>{ko ? "연결된 프로젝트" : "Related projects"}</h4>
              {linked.length ? (
                linked.map((p) => (
                  <Link key={p.id} href={`/${lang}/projects/${p.slug}`}>
                    {projectName(p, lang)}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))
              ) : (
                <p className="muted">
                  {ko
                    ? "연결된 프로젝트가 아직 없습니다."
                    : "No linked projects yet."}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="skill-detail-icon" aria-hidden="true">
                ↗
              </span>
              <h3>
                {ko ? "기술에서\n프로젝트로." : "From tools\nto projects."}
              </h3>
              <p>
                {ko
                  ? "기술 이름을 선택해 실제 프로젝트와의 연결을 확인하세요."
                  : "Select a technology to explore the projects behind it."}
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
