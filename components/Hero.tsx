import Link from "next/link";
import type { Locale, Project } from "@/lib/types";
import { projectName } from "@/lib/presentation";

export function Hero({
  lang,
  title,
  subtitle,
  name,
  featured,
  school,
}: {
  lang: Locale;
  title: string;
  subtitle: string;
  name: string;
  featured?: Project;
  school: string;
}) {
  const ko = lang === "ko";
  return (
    <section
      className="hero opening-scene"
      aria-labelledby="intro-title"
      data-chapter="01 / INTRO"
      data-scene-color="#a9dfc8"
      data-scene-label={ko ? "소개" : "Intro"}
    >
      <div className="opening-light" aria-hidden="true">
        <div className="light-plane" />
        <div className="light-rim" />
        <div className="light-horizon" />
      </div>
      <div className="opening-guide" aria-hidden="true">
        <span>01 / INTRO</span>
        <span>WEB · SERVER · DATA</span>
      </div>
      <div className="wrap opening-layout">
        <div className="opening-topline">
          <span className="eyebrow">
            {ko ? "김시호 · 풀스택 개발자" : `${name} · FULL-STACK DEVELOPER`}
          </span>
          <span className="opening-edition">
            PORTFOLIO / {new Date().getFullYear()}
          </span>
        </div>
        <div className="opening-title">
          <h1 id="intro-title">{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="opening-bottom">
          <div className="opening-actions">
            <Link
              href={featured ? "#featured" : "#projects"}
              className="button primary"
            >
              {ko ? "프로젝트 살펴보기" : "Explore the work"}
              <span aria-hidden="true">↘</span>
            </Link>
            <Link href="#about" className="text-link">
              {ko ? "개발자 소개" : "About me"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          {featured && (
            <Link className="opening-next" href="#featured">
              <span>
                {ko ? "다음 장면" : "UP NEXT"}
                <i>02</i>
              </span>
              <strong>
                <span className="link-label">{projectName(featured, lang)}</span>
                <span aria-hidden="true">↗</span>
              </strong>
            </Link>
          )}
        </div>
        <div className="opening-footer">
          <span>{school || name}</span>
          <span>FULL-STACK DEVELOPMENT</span>
          <a
            href={featured ? "#featured" : "#projects"}
            aria-label={ko ? "다음 섹션으로" : "Next section"}
          >
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
