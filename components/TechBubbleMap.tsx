"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  layoutTechBubbles,
  techBubbleRadius,
  TECH_CATEGORY_COLORS,
} from "@/lib/tech-atlas";
import type { Locale, Technology } from "@/lib/types";
import { categoryLabel } from "@/lib/presentation";

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
  const chartElement = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const ko = lang === "ko";
  useEffect(() => {
    const element = chartElement.current;
    if (!element) return;
    const measure = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const used = technologies.filter((t) => counts[t.id] > 0);
  const unlinked = technologies.filter((t) => !counts[t.id]);
  const chart = useMemo(
    () =>
      layoutTechBubbles(
        technologies
          .filter((t) => counts[t.id] > 0)
          .map((t) => ({ id: t.id, count: counts[t.id] })),
        maximum,
        width,
      ),
    [technologies, counts, maximum, width],
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
          ? "원 안 숫자는 사용 프로젝트 수입니다. 기술을 선택하면 사용 프로젝트와 함께 쓴 기술을 볼 수 있습니다."
          : "Numbers show project usage. Select a skill to explore its projects and the technologies used with it."}
      </p>
      <div
        ref={chartElement}
        className="bubble-desktop-chart"
        style={{ height: chart.height }}
        role="group"
        aria-label={
          ko
            ? "프로젝트 사용 횟수별 기술 지도"
            : "Technology map by project usage"
        }
        aria-describedby={descriptionId}
      >
        <svg
          className="bubble-edge-layer"
          viewBox={`0 0 ${chart.width} ${Math.max(1, chart.height)}`}
          aria-hidden="true"
        >
          {activeNode &&
            chart.nodes
              .filter((node) => node.id !== selectedId && peers.has(node.id))
              .map((node) => (
                <path
                  className="bubble-connection"
                  key={node.id}
                  d={`M${activeNode.x},${activeNode.y} Q${(activeNode.x + node.x) / 2},${Math.max(8, Math.min(activeNode.y, node.y) - 20)} ${node.x},${node.y}`}
                />
              ))}
        </svg>
        {chart.nodes.map((node) => {
          const technology = byId.get(node.id)!;
          return (
            <button
              key={node.id}
              className="tech-bubble"
              type="button"
              aria-pressed={node.id === selectedId}
              aria-label={label(technology)}
              aria-controls={detailId}
              title={technology.name}
              data-linked={
                projectSelected && linkedIds.has(node.id) ? "true" : undefined
              }
              data-dimmed={isDimmed(technology) ? "true" : undefined}
              style={
                {
                  left: node.x,
                  top: node.y - node.r,
                  "--bubble-size": `${node.r * 2}px`,
                  "--bubble-color": color(technology),
                } as CSSProperties
              }
              onClick={() => onSelect(technology)}
            >
              <span className="bubble-disc">
                <strong className="bubble-count">{node.count}</strong>
              </span>
              <span className="bubble-name">{technology.name}</span>
            </button>
          );
        })}
      </div>
      {used.length > 0 && (
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
                  projectSelected && linkedIds.has(node.id) ? "true" : undefined
                }
                data-dimmed={isDimmed(technology) ? "true" : undefined}
                style={
                  {
                    "--bubble-color": color(technology),
                    "--bubble-size": `${techBubbleRadius(node.count, maximum) * 1.35}px`,
                  } as CSSProperties
                }
                onClick={() => onSelect(technology)}
              >
                <span className="mobile-bubble-disc">
                  <strong>{node.count}</strong>
                </span>
                <span className="mobile-bubble-name">{technology.name}</span>
              </button>
            );
          })}
        </div>
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
