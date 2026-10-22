import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/repository";
import { projectSummary, projectDescription } from "@/lib/types";
import type { Locale } from "@/lib/types";
import { projectPeriod } from "@/lib/i18n";
import {
  categoryLabel,
  projectName,
  projectTechnologies,
  statusLabel,
  textValue,
} from "@/lib/presentation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  const lang: Locale = raw === "en" ? "en" : "ko";
  const { project } = await getProjectBySlug(slug);
  if (!project)
    return {
      title:
        lang === "ko" ? "프로젝트를 찾을 수 없습니다" : "Project not found",
    };
  const title = projectName(project, lang);
  const description = projectSummary(project, lang);
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang: Locale = raw === "en" ? "en" : "ko";
  const ko = lang === "ko";
  const { project: p, data: d } = await getProjectBySlug(slug);
  if (!p) notFound();
  const related = projectTechnologies(d, p.id);
  const metrics = d.projectMetrics.filter((m) => m.project_id === p.id);
  const assetIds = new Set(
    d.assetLinks
      .filter((a) => String(a.project_id ?? "") === p.id)
      .map((a) => String(a.asset_id ?? a.media_asset_id)),
  );
  const assets = d.mediaAssets.filter((a) => assetIds.has(String(a.id)));
  const projectIndex = d.projects.findIndex((project) => project.id === p.id);
  const next = d.projects[projectIndex + 1] || d.projects[0];
  const description = projectDescription(p, lang);
  const contributions =
    lang === "en" && p.key_contributions_en
      ? p.key_contributions_en
      : p.key_contributions;
  const results =
    lang === "en" && p.result_summary_en
      ? p.result_summary_en
      : p.result_summary;
  const lessons =
    lang === "en" && p.lessons_learned_en
      ? p.lessons_learned_en
      : p.lessons_learned;
  return (
    <>
      <section className="case-hero page-top">
        <div className="wrap">
          <Link href={`/${lang}/projects`} className="breadcrumb">
            ← {ko ? "전체 프로젝트" : "All projects"}
          </Link>
          <div className="case-labels">
            <span>{categoryLabel(p.project_type, lang)}</span>
            <span>{statusLabel(p.status, lang)}</span>
            {p.is_featured && <span>{ko ? "대표 프로젝트" : "Featured"}</span>}
          </div>
          <h1>{projectName(p, lang)}</h1>
          {projectSummary(p, lang) && <p>{projectSummary(p, lang)}</p>}
        </div>
      </section>
      <section className="case-paper">
        <div className="wrap case-columns">
          <aside>
            <span>PROJECT INFORMATION</span>
            <dl>
              <dt>{ko ? "담당 역할" : "Role"}</dt>
              <dd>
                {(lang === "en" && p.role_en ? p.role_en : p.role) ||
                  (ko ? "아직 등록되지 않았습니다." : "Not recorded yet.")}
              </dd>
              <dt>{ko ? "기간" : "Period"}</dt>
              <dd>{projectPeriod(p, lang)}</dd>
              <dt>{ko ? "유형" : "Type"}</dt>
              <dd>{categoryLabel(p.project_type, lang)}</dd>
              <dt>{ko ? "상태" : "Status"}</dt>
              <dd>{statusLabel(p.status, lang)}</dd>
            </dl>
            <div className="case-links">
              {p.live_url && (
                <a href={p.live_url} target="_blank" rel="noopener noreferrer">
                  {ko ? "서비스 보기" : "Live site"}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {p.store_url && (
                <a href={p.store_url} target="_blank" rel="noopener noreferrer">
                  {ko ? "스토어" : "Store"}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {p.github_url && p.source_code_visibility === "public" && (
                <a
                  href={p.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub<span aria-hidden="true">↗</span>
                </a>
              )}
              {p.source_code_visibility === "private" && (
                <span>{ko ? "소스 코드 비공개" : "Private source code"}</span>
              )}
            </div>
          </aside>
          <article className="case-content">
            <section>
              <h2>{ko ? "프로젝트 개요" : "Overview"}</h2>
              {description ? (
                <p>{description}</p>
              ) : (
                <p className="empty-note">
                  {ko
                    ? "상세 설명을 준비하고 있습니다."
                    : "A detailed overview is being prepared."}
                </p>
              )}
              {p.content_markdown && p.content_markdown !== description && (
                <div className="project-markdown">{p.content_markdown}</div>
              )}
            </section>
            {contributions && (
              <section>
                <h2>
                  {ko ? "주요 구현과 기여" : "Implementation & contributions"}
                </h2>
                <p>{contributions}</p>
              </section>
            )}
            {results && (
              <section>
                <h2>{ko ? "결과" : "Results"}</h2>
                <p>{results}</p>
              </section>
            )}
            {related.length > 0 && (
              <section>
                <h2>{ko ? "사용 기술" : "Technologies"}</h2>
                <div className="tech-pills">
                  {related.map((t) => (
                    <span key={t.id}>{t.name}</span>
                  ))}
                </div>
              </section>
            )}
            {metrics.length > 0 && (
              <section>
                <h2>{ko ? "프로젝트 지표" : "Project metrics"}</h2>
                <div className="case-metrics">
                  {metrics.map((m) => (
                    <div key={m.id}>
                      <strong>{m.display_value}</strong>
                      <span>
                        {m.metric_name}
                        {m.is_verified !== true ? " *" : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {metrics.some((m) => m.is_verified !== true) && (
                  <p className="empty-note">
                    {ko
                      ? "* 프로젝트 기록 기준 수치입니다."
                      : "* Values reported in the project records."}
                  </p>
                )}
              </section>
            )}
            {lessons && (
              <section>
                <h2>{ko ? "배운 점" : "What I learned"}</h2>
                <p>{lessons}</p>
              </section>
            )}
            {assets.length > 0 && (
              <section>
                <h2>{ko ? "관련 자료" : "Supporting materials"}</h2>
                {assets.map((a) => (
                  <div key={String(a.id)} className="asset-row">
                    {textValue(a.external_url) ? (
                      <a
                        href={textValue(a.external_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {textValue(a.file_name) ||
                          textValue(a.caption) ||
                          (ko ? "자료 보기" : "View resource")}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span>
                        {textValue(a.file_name) || textValue(a.caption)}
                      </span>
                    )}
                  </div>
                ))}
              </section>
            )}
            {next && next.id !== p.id && (
              <div className="case-navigation">
                <Link href={`/${lang}/projects/${next.slug}`}>
                  <div>
                    <small>{ko ? "다음 프로젝트" : "Next project"}</small>
                    <strong>{projectName(next, lang)}</strong>
                  </div>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
