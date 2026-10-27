import Link from "next/link";
import type { Locale, Project, Recognition } from "@/lib/types";
import { categoryLabel, projectName } from "@/lib/presentation";

function LaurelMedal() {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      className="honor-medal"
    >
      <circle cx="80" cy="80" r="49" />
      <circle cx="80" cy="80" r="39" strokeDasharray="1 6" />
      <path d="M66 135C21 116 18 66 42 32M94 135C139 116 142 66 118 32" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`rotate(${i * 15} 80 80)`}>
          <path d="M34 91C17 83 16 74 19 69C31 70 37 79 34 91Z" />
          <path d="M126 69C143 77 144 86 141 91C129 90 123 81 126 69Z" />
        </g>
      ))}
      <path
        className="honor-star"
        d="M80 54L87 70L105 72L91 84L95 102L80 93L65 102L69 84L55 72L73 70Z"
      />
      <path d="M63 137L80 131L97 137M80 131V144" />
    </svg>
  );
}

export function RecognitionShowcase({
  recognitions,
  projects,
  lang,
}: {
  recognitions: Recognition[];
  projects: Project[];
  lang: Locale;
}) {
  const ko = lang === "ko";
  return (
    <div className="honors-grid">
      {recognitions.map((record, index) => {
        const title = !ko && record.title_en ? record.title_en : record.title;
        const award =
          !ko && record.award_name_en
            ? record.award_name_en
            : record.award_name;
        const project = projects.find(
          (p) => p.id === record.related_project_id,
        );
        return (
          <article
            className={`honor-card${index === 0 ? " honor-card-featured" : ""}`}
            key={record.id}
          >
            <div className="honor-card-light" aria-hidden="true" />
            <div className="honor-card-top">
              <span>{categoryLabel(record.recognition_type, lang)}</span>
              <time dateTime={record.awarded_at || undefined}>
                {record.awarded_at?.slice(0, 7) ||
                  (ko ? "날짜 미등록" : "Date not recorded")}
              </time>
            </div>
            <div className="honor-card-body">
              <LaurelMedal />
              <div className="honor-copy">
                <span className="honor-index">
                  RECOGNITION / {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{award || title}</h3>
                {award && <p>{title}</p>}
                {record.rank_or_result && record.rank_or_result !== award && (
                  <p className="honor-result">{record.rank_or_result}</p>
                )}
              </div>
            </div>
            <div className="honor-card-foot">
              {project ? (
                <Link href={`/${lang}/projects/${project.slug}`}>
                  <span className="link-label">
                    {projectName(project, lang)}
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <span>
                  {categoryLabel(record.recognition_type, lang)} ·{" "}
                  {record.awarded_at?.slice(0, 4) || "—"}
                </span>
              )}
              <span className="honor-serial" aria-hidden="true">
                ✦
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
