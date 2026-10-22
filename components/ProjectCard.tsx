import Link from "next/link";
import type { Locale, Project, Technology } from "@/lib/types";
import { projectSummary } from "@/lib/types";
import { categoryLabel, projectName, statusLabel } from "@/lib/presentation";

export function ProjectCard({
  project,
  techs,
  lang,
  index,
}: {
  project: Project;
  techs: Technology[];
  lang: Locale;
  index: number;
}) {
  const name = projectName(project, lang);
  return (
    <Link
      className={`project-card project-card-${index % 3}`}
      href={`/${lang}/projects/${project.slug}`}
    >
      <div className="project-card-visual" aria-hidden="true">
        <span className="visual-code">
          {String(index + 2).padStart(2, "0")} /{" "}
          {project.project_type.toUpperCase()}
        </span>
        <div className="visual-grid" />
        <strong>{name}</strong>
        <span className="visual-arrow">↗</span>
      </div>
      <div className="project-card-body">
        <div className="card-meta">
          <span>{categoryLabel(project.project_type, lang)}</span>
          <span>{statusLabel(project.status, lang)}</span>
        </div>
        <h3>
          <span className="link-label">{name}</span>
          <span aria-hidden="true">↗</span>
        </h3>
        {projectSummary(project, lang) && (
          <p>{projectSummary(project, lang)}</p>
        )}
        {project.role && (
          <span className="card-role">
            {lang === "ko" ? "역할" : "Role"} ·{" "}
            {lang === "en" && project.role_en ? project.role_en : project.role}
          </span>
        )}
        {techs.length > 0 && (
          <div className="tech-pills">
            {techs.slice(0, 3).map((t) => (
              <span key={t.id}>{t.name}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
