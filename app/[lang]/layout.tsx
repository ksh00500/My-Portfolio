import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/repository";
import { Nav } from "@/components/Nav";
import { DocumentLanguage } from "@/components/DocumentLanguage";
import { CinematicMotion } from "@/components/CinematicMotion";
import type { Locale } from "@/lib/types";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return lang === "en"
    ? {
        title: { absolute: "Siho Kim | Full-stack developer" },
        description:
          "Projects, experience, and education. A full-stack developer building web services and real-time games.",
        openGraph: {
          title: "Siho Kim | Full-stack developer",
          locale: "en_US",
        },
      }
    : {};
}
export default async function LanguageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (lang !== "ko" && lang !== "en") notFound();
  const data = await getPortfolioData();
  const field = lang === "ko" ? data.profile?.name_ko : data.profile?.name_en;
  const name =
    typeof field === "string" && field.trim()
      ? field
      : lang === "ko"
        ? "김시호"
        : "KIM SIHO";
  return (
    <>
      <DocumentLanguage lang={lang as Locale} />
      <a className="skip-link" href="#main-content">
        {lang === "ko" ? "본문으로 건너뛰기" : "Skip to content"}
      </a>
      {process.env.PORTFOLIO_PREVIEW === "1" && (
        <div className="preview-banner">
          {lang === "ko"
            ? "로컬 미리보기 · 저장소의 초기 자료를 사용합니다. 운영 DB와 연결되지 않았습니다."
            : "Local preview · Historical repository data. Not connected to the production database."}
        </div>
      )}
      <Nav lang={lang as Locale} name={name} />
      <CinematicMotion />
      <main id="main-content" lang={lang}>
        {children}
      </main>
    </>
  );
}
