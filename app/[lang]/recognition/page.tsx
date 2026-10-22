import Link from "next/link";
import { RecognitionShowcase } from "@/components/RecognitionShowcase";
import { getPortfolioData } from "@/lib/repository";
import type { Locale } from "@/lib/types";
import { textValue } from "@/lib/presentation";
export const dynamic = "force-dynamic";
export default async function RecognitionArchive({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = raw === "en" ? "en" : "ko";
  const ko = lang === "ko";
  const d = await getPortfolioData();
  return (
    <section className="page-top">
      <div className="wrap">
        <Link href={`/${lang}`} className="breadcrumb">
          ← {ko ? "홈" : "Home"}
        </Link>
        <span className="eyebrow">AWARDS & CREDENTIALS</span>
        <h1 className="archive-heading">
          {ko ? "수상 및 자격" : "Awards & credentials"}
        </h1>
        <p className="archive-intro">
          {ko
            ? "대회 수상, 장학 이력과 취득한 자격을 모았습니다."
            : "Competition awards, scholarships, and acquired credentials."}
        </p>
        {d.recognitions.length > 0 ? (
          <RecognitionShowcase
            recognitions={[...d.recognitions].sort((a, b) =>
              (b.awarded_at || "").localeCompare(a.awarded_at || ""),
            )}
            projects={d.projects}
            lang={lang}
          />
        ) : (
          <p className="empty-note">
            {ko ? "공개된 수상 이력이 없습니다." : "No public awards yet."}
          </p>
        )}
        {d.certifications.length > 0 && (
          <>
            <h2 className="subsection-heading">
              {ko ? "자격증" : "Certifications"}
            </h2>
            <div className="recognition-list">
              {d.certifications.map((c) => (
                <div className="recognition-item" key={String(c.id)}>
                  <span>{textValue(c.issued_at).slice(0, 10) || "—"}</span>
                  <div>
                    <h2>{textValue(c.name)}</h2>
                    <p>{textValue(c.issuer)}</p>
                  </div>
                  <strong>{ko ? "취득" : "Acquired"}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
