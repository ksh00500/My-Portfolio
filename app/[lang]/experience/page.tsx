import Link from "next/link";
import { getPortfolioData } from "@/lib/repository";
import type { Locale, Experience } from "@/lib/types";
import { categoryLabel, statusLabel, textValue } from "@/lib/presentation";
export const dynamic = "force-dynamic";
export default async function ExperienceArchive({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = raw === "en" ? "en" : "ko";
  const ko = lang === "ko";
  const d = await getPortfolioData();
  const work = d.experiences.filter(
    (e) => e.category === "Work" || e.category === "Education",
  );
  const activities = d.experiences.filter(
    (e) => !["Work", "Education", "Certification & Badge"].includes(e.category),
  );
  const groups: [string, Experience[]][] = [
    [ko ? "경력 · 교육" : "Work & education", work],
    [ko ? "활동 · 대회" : "Activities & competitions", activities],
  ];
  const confirmed = d.participations.filter((p) =>
    ["attended", "completed", "confirmed"].includes(p.attendance_status),
  );
  return (
    <section className="page-top">
      <div className="wrap">
        <Link href={`/${lang}`} className="breadcrumb">
          ← {ko ? "홈" : "Home"}
        </Link>
        <span className="eyebrow">EXPERIENCE</span>
        <h1 className="archive-heading">{ko ? "경력과 활동" : "Experience"}</h1>
        <p className="archive-intro">
          {ko
            ? "실무, 교육, 팀 활동에서 쌓은 경험을 정리했습니다."
            : "Work, education, and activities I have taken part in."}
        </p>
        {groups.map(
          ([title, items]) =>
            items.length > 0 && (
              <section className="archive-section" key={title}>
                <h2>{title}</h2>
                <div className="experience-archive-list">
                  {[...items]
                    .sort((a, b) =>
                      (b.started_at || "").localeCompare(a.started_at || ""),
                    )
                    .map((e) => (
                      <div className="experience-archive-row" key={e.id}>
                        <time>
                          {e.started_at?.slice(0, 7) || e.period_label || "—"}
                          {e.is_ongoing && (ko ? " — 현재" : " — Present")}
                        </time>
                        <div>
                          <strong>
                            {lang === "en" && e.name_en ? e.name_en : e.name}
                          </strong>
                          <p>
                            {categoryLabel(e.category, lang)}
                            {e.role
                              ? " · " +
                                (lang === "en" && e.role_en
                                  ? e.role_en
                                  : e.role)
                              : ""}
                          </p>
                          {textValue(e.description) && (
                            <p>{textValue(e.description)}</p>
                          )}
                        </div>
                        <span>{statusLabel(e.status || "", lang)}</span>
                      </div>
                    ))}
                </div>
              </section>
            ),
        )}
        {confirmed.length > 0 && (
          <section className="archive-section">
            <h2>{ko ? "참여 프로그램" : "Programs"}</h2>
            <div className="experience-archive-list">
              {confirmed.map((p) => (
                <div className="experience-archive-row" key={p.id}>
                  <time>{p.started_at?.slice(0, 7) || "—"}</time>
                  <div>
                    <strong>{p.title}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {!work.length && !activities.length && !confirmed.length && (
          <p className="empty-note">
            {ko
              ? "아직 공개된 경험이 없습니다."
              : "No public experience records yet."}
          </p>
        )}
      </div>
    </section>
  );
}
