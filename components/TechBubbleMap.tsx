"use client";

import { useId, useMemo } from "react";
import type { CSSProperties } from "react";
import { layoutTechBubbles, TECH_CATEGORY_COLORS } from "@/lib/tech-atlas";
import type { Locale, Technology } from "@/lib/types";
import { categoryLabel } from "@/lib/presentation";

/** Full names remain in the accessible label and detail panel. */
function nameLines(name: string) {
  const words = name.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    if (
      !lines.length ||
      (lines.at(-1)!.length + word.length + 1 > 21 && lines.length < 2)
    )
      lines.push(word);
    else lines[lines.length - 1] += " " + word;
  }
  return lines
    .slice(0, 2)
    .map((line) => (line.length > 21 ? line.slice(0, 20) + "…" : line));
}

export function TechBubbleMap({
  technologies,
  categories,
  counts,
  maximum,
  selectedId,
  projectSelected,
  linkedIds,
  peers,
  detailId,
  lang,
  onSelect,
}: {
  technologies: Technology[];
  categories: string[];
  counts: Record<string, number>;
  maximum: number;
  selectedId?: string;
  projectSelected: boolean;
  linkedIds: Set<string>;
  peers: Set<string>;
  detailId: string;
  lang: Locale;
  onSelect: (technology: Technology) => void;
}) {
  const descriptionId = useId();
  const ko = lang === "ko";
  const used = technologies.filter((t) => counts[t.id] > 0);
  const unlinked = technologies.filter((t) => !counts[t.id]);
  const chart = useMemo(
    () =>
      layoutTechBubbles(
        technologies
          .filter((t) => counts[t.id] > 0)
          .map((t) => ({ id: t.id, count: counts[t.id] })),
        maximum,
      ),
    [technologies, counts, maximum],
  );
  const byId = new Map(technologies.map((t) => [t.id, t]));
  const activeNode = chart.nodes.find((n) => n.id === selectedId);
  const color = (technology: Technology) =>
    TECH_CATEGORY_COLORS[
      Math.max(0, categories.indexOf(technology.category)) %
        TECH_CATEGORY_COLORS.length
    ];
  const isDimmed = (technology: Technology) =>
    projectSelected
      ? !linkedIds.has(technology.id)
      : selectedId
        ? technology.id !== selectedId && !peers.has(technology.id)
        : false;
  const label = (technology: Technology) =>
    `${technology.name}, ${counts[technology.id] || 0} ${ko ? "개 프로젝트에서 사용" : "projects"}, ${categoryLabel(technology.category, lang)}`;
  return (
    <div className="tech-bubble-map">
      <p className="bubble-reading-guide" id={descriptionId}>
        {ko
          ? "큰 원일수록 더 많은 프로젝트에서 사용했습니다. 원을 선택하면 실제 사용 프로젝트와 함께 쓴 기술이 나타납니다."
          : "Larger circles mean use in more projects. Select one to explore its projects and the technologies used alongside it."}
      </p>
      {used.length > 0 && (
        <>
          <svg
            className="bubble-desktop-chart"
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            role="group"
            aria-label={
              ko
                ? "프로젝트 사용 횟수별 기술 원형 지도"
                : "Technology bubbles by project usage"
            }
            aria-describedby={descriptionId}
          >
            {activeNode &&
              chart.nodes
                .filter((n) => n.id !== selectedId && peers.has(n.id))
                .map((node) => (
                  <path
                    className="bubble-connection"
                    key={node.id}
                    d={`M${activeNode.x},${activeNode.y} Q${(activeNode.x + node.x) / 2},${Math.min(activeNode.y, node.y) - 45} ${node.x},${node.y}`}
                    aria-hidden="true"
                  />
                ))}
            {chart.nodes.map((node) => {
              const technology = byId.get(node.id)!;
              const active = node.id === selectedId;
              return (
                <g
                  key={node.id}
                  className="tech-bubble"
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={label(technology)}
                  aria-controls={detailId}
                  data-linked={
                    linkedIds.has(node.id) && projectSelected
                      ? "true"
                      : undefined
                  }
                  data-dimmed={isDimmed(technology) ? "true" : undefined}
                  style={
                    { "--bubble-color": color(technology) } as CSSProperties
                  }
                  onClick={() => onSelect(technology)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(technology);
                    }
                  }}
                >
                  <title>{label(technology)}</title>
                  <circle
                    className="bubble-focus-ring"
                    cx={node.x}
                    cy={node.y}
                    r={node.r + 7}
                  />
                  <circle
                    className="bubble-disc"
                    cx={node.x}
                    cy={node.y}
                    r={node.r}
                  />
                  <circle
                    className="bubble-inner-ring"
                    cx={node.x}
                    cy={node.y}
                    r={node.r - 7}
                  />
                  <text
                    className="bubble-count"
                    x={node.x}
                    y={node.y + 2}
                    textAnchor="middle"
                    style={{ fontSize: Math.min(42, 24 + node.r * 0.13) }}
                  >
                    {node.count}
                  </text>
                  <text
                    className="bubble-unit"
                    x={node.x}
                    y={node.y + 22}
                    textAnchor="middle"
                  >
                    {ko ? "프로젝트" : "PROJECTS"}
                  </text>
                  <text
                    className="bubble-name"
                    x={node.x}
                    y={node.y + node.r + 23}
                    textAnchor="middle"
                  >
                    {nameLines(technology.name).map((line, index) => (
                      <tspan key={index} x={node.x} dy={index ? 18 : 0}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
          <div
            className="bubble-mobile-chart"
            aria-label={
              ko ? "기술별 프로젝트 사용 횟수" : "Projects per technology"
            }
          >
            {chart.nodes.map((node) => {
              const technology = byId.get(node.id)!;
              return (
                <button
                  className="mobile-tech-bubble"
                  type="button"
                  key={node.id}
                  aria-pressed={node.id === selectedId}
                  aria-label={label(technology)}
                  aria-controls={detailId}
                  data-linked={
                    projectSelected && linkedIds.has(node.id)
                      ? "true"
                      : undefined
                  }
                  data-dimmed={isDimmed(technology) ? "true" : undefined}
                  style={
                    {
                      "--bubble-color": color(technology),
                      "--bubble-size": `${node.r * 1.35}px`,
                    } as CSSProperties
                  }
                  onClick={() => onSelect(technology)}
                >
                  <span className="mobile-bubble-disc">
                    <strong>{node.count}</strong>
                    <small>{ko ? "프로젝트" : "projects"}</small>
                  </span>
                  <span className="mobile-bubble-name">{technology.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {unlinked.length > 0 && (
        <div className="bubble-unlinked-section">
          <div className="bubble-unlinked-heading">
            <h3>{ko ? "프로젝트 연결 미등록" : "No project links recorded"}</h3>
            <span>{unlinked.length}</span>
          </div>
          <p>
            {ko
              ? "경험이 없다는 뜻이 아니라, 프로젝트 사용 이력이 아직 연결되지 않은 기술입니다."
              : "These skills have no project usage linked in the records yet."}
          </p>
          <div className="bubble-unlinked-grid">
            {unlinked.map((technology) => (
              <button
                type="button"
                key={technology.id}
                className="unlinked-tech-bubble"
                aria-label={label(technology)}
                aria-pressed={selectedId === technology.id}
                aria-controls={detailId}
                style={{ "--bubble-color": color(technology) } as CSSProperties}
                onClick={() => onSelect(technology)}
              >
                <span aria-hidden="true">0</span>
                <strong>{technology.name}</strong>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
