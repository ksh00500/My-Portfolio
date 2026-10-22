"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";

export interface FeaturedStory {
  name: string;
  slug: string;
  summary: string;
  description: string;
  role: string;
  period: string;
  status: string;
  technologies: string[];
  contributions: string;
  result: string;
  metrics: { id: string; name: string; value: string; verified: boolean }[];
  liveUrl: string | null;
}

/** Scroll selects a scene; it never changes the scroll position or locks the page. */
export function FeaturedSequence({
  story,
  lang,
}: {
  story: FeaturedStory;
  lang: Locale;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const ko = lang === "ko";
  useEffect(() => {
    const sections = Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-act]") || [],
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = innerHeight * 0.54;
      const visible = sections.findIndex((section) => {
        const r = section.getBoundingClientRect();
        return r.top <= center && r.bottom > center;
      });
      if (visible >= 0) setActive(visible);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
    };
  }, []);
  const labels = ko
    ? ["서비스", "구현", "결과"]
    : ["Overview", "Implementation", "Results"];
  return (
    <div className="sequence" ref={root}>
      <div
        className="sequence-visual"
        aria-hidden="true"
        data-active-act={active}
      >
        <div className="sequence-visual-top">
          <span>FEATURED PROJECT</span>
          <span>ACT {String(active + 1).padStart(2, "0")} / 03</span>
        </div>
        <div className="sequence-art">
          <div className="sequence-paths">
            <i />
            <i />
            <i />
          </div>
          <span className="sequence-crosshair crosshair-one" />
          <span className="sequence-crosshair crosshair-two" />
          <span className="sequence-orbit" />
          <div className="sequence-wordmark">{story.name}</div>
          <div className="sequence-platforms">
            <span>01 / {labels[0]}</span>
            <span>02 / {labels[1]}</span>
            <span>03 / {labels[2]}</span>
          </div>
        </div>
        <div className="sequence-visual-bottom">
          <span>{story.status}</span>
          <span>{labels[active]}</span>
          <span>↗</span>
        </div>
        <div className="sequence-ticks">
          {labels.map((label, index) => (
            <span key={label} className={index === active ? "active" : ""} />
          ))}
        </div>
      </div>
      <div className="sequence-script">
        <article className="sequence-act" id="featured-act-1" data-act="0">
          <div className="act-marker">
            <span>ACT 01</span>
            <span>THE PRODUCT</span>
          </div>
          <h3>{ko ? "서비스 소개" : "The product"}</h3>
          <p className="sequence-lead">{story.summary}</p>
          {story.description && story.description !== story.summary && (
            <p>{story.description}</p>
          )}
          <dl>
            <dt>{ko ? "프로젝트" : "Project"}</dt>
            <dd>{story.name}</dd>
            <dt>{ko ? "기간" : "Period"}</dt>
            <dd>{story.period}</dd>
          </dl>
          <Link className="text-link" href={`/${lang}/projects/${story.slug}`}>
            {ko ? "전체 프로젝트 내용" : "Read the case study"}
            <span aria-hidden="true">↗</span>
          </Link>
        </article>
        <article className="sequence-act" id="featured-act-2" data-act="1">
          <div className="act-marker">
            <span>ACT 02</span>
            <span>THE IMPLEMENTATION</span>
          </div>
          <h3>{ko ? "담당 역할과 구현" : "Role & implementation"}</h3>
          {story.role && (
            <div className="sequence-role">
              <small>{ko ? "담당 역할" : "My role"}</small>
              <strong>{story.role}</strong>
            </div>
          )}
          {story.contributions && <p>{story.contributions}</p>}
          {story.technologies.length > 0 && (
            <div className="tech-pills">
              {story.technologies.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          )}
          {!story.contributions && !story.technologies.length && (
            <p className="sequence-note">
              {ko
                ? "구체적인 구현 내용은 아직 등록되지 않았습니다."
                : "Detailed implementation notes have not been added yet."}
            </p>
          )}
        </article>
        <article className="sequence-act" id="featured-act-3" data-act="2">
          <div className="act-marker">
            <span>ACT 03</span>
            <span>THE RESULT</span>
          </div>
          <h3>{ko ? "결과와 기록" : "Results & records"}</h3>
          {story.result && <p>{story.result}</p>}
          {story.metrics.length > 0 && (
            <>
              <div className="sequence-metrics">
                {story.metrics.map((metric) => (
                  <div key={metric.id}>
                    <strong>{metric.value}</strong>
                    <span>
                      {metric.name}
                      {!metric.verified ? " *" : ""}
                    </span>
                  </div>
                ))}
              </div>
              {story.metrics.some((metric) => !metric.verified) && (
                <p className="sequence-note">
                  {ko
                    ? "* 프로젝트 기록 기준 수치입니다."
                    : "* Values reported in the project records."}
                </p>
              )}
            </>
          )}
          {!story.metrics.length && !story.result && (
            <p>
              {story.status} · {story.period}
            </p>
          )}
          <div className="sequence-links">
            <Link
              href={`/${lang}/projects/${story.slug}`}
              className="button light"
            >
              {ko ? "프로젝트 자세히 보기" : "Read the case study"}
              <span aria-hidden="true">↗</span>
            </Link>
            {story.liveUrl && (
              <a
                href={story.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                {ko ? "서비스 방문" : "Visit the site"}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
