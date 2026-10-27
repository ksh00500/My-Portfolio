import Link from "next/link";
import { getPortfolioData } from "@/lib/repository";
import { ArchiveFilters } from "@/components/ArchiveFilters";
import type { Locale } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function Projects({
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
        <span className="eyebrow">PROJECTS / {d.projects.length}</span>
        <h1 className="archive-heading">{ko ? "프로젝트" : "Projects"}</h1>
        <p className="archive-intro">
          {ko
            ? "개인 서비스, 팀 프로젝트, 실무에서의 작업을 모았습니다. 관심 있는 프로젝트의 역할과 구현 내용을 확인해 보세요."
            : "Personal products, team projects, and work experience. Explore the roles and implementation behind each project."}
        </p>
        <ArchiveFilters projects={d.projects} lang={lang} />
      </div>
    </section>
  );
}
