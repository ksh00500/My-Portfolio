import Link from "next/link";
import type { Locale, Project } from "@/lib/types";
import { projectName, statusLabel } from "@/lib/presentation";

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
    <section className="hero" aria-labelledby="intro-title">
      <div className="wrap">
        <div className="hero-kicker">
          <span className="status-dot" />
          {ko ? "김시호의 개발 포트폴리오" : "SIHO KIM / DEVELOPER PORTFOLIO"}
          <span className="edition">WEB · SERVER · DATA</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1 id="intro-title">{title}</h1>
            <p className="hero-description">{subtitle}</p>
            <div className="hero-actions">
              <Link className="button primary" href="#projects">
                {ko ? "프로젝트 살펴보기" : "Explore projects"}
                <span aria-hidden="true">↘</span>
              </Link>
              <Link className="text-link" href="#about">
                {ko ? "소개 보기" : "About me"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          {featured && (
            <Link
              className="hero-project"
              href={`/${lang}/projects/${featured.slug}`}
              aria-label={`${projectName(featured, lang)} ${ko ? "프로젝트 상세" : "project details"}`}
            >
              <div className="hero-project-top">
                <span>PROJECT SPOTLIGHT</span>
                <span aria-hidden="true">↗</span>
              </div>
              <div className="project-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <i>{projectName(featured, lang).slice(0, 1)}</i>
              </div>
              <div className="hero-project-bottom">
                <strong>{projectName(featured, lang)}</strong>
                <span className="project-state">
                  <i />
                  {statusLabel(featured.status, lang)}
                </span>
              </div>
              <p>{ko ? "프로젝트 자세히 보기" : "Explore the project"}</p>
            </Link>
          )}
        </div>
        <div className="hero-foot">
          <span>
            <strong>{name}</strong>Full-stack developer
          </span>
          {school && <span>{school}</span>}
          <a href="#projects" className="scroll-link">
            {ko ? "아래에서 더 보기" : "Scroll to explore"}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
