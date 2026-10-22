import type { Locale } from "./types";
export function parseLocale(raw: string): Locale {
  return raw === "en" ? "en" : "ko";
}
export const langData = {
  ko: {
    projects: "프로젝트",
    about: "소개",
    tech: "기술",
    experience: "경험",
    recognition: "수상",
    contact: "연락",
    archive: "전체 보기",
    view: "상세 보기",
    period: "기간",
    status: "상태",
    role: "역할",
    results: "성과",
    links: "바로가기",
    search: "프로젝트명 검색",
    all: "전체",
    technology: "사용 기술",
    filter: "필터",
    none: "조회 가능한 데이터가 없습니다",
    back: "홈으로",
    work: "작업",
    close: "닫기",
  },
  en: {
    projects: "Projects",
    about: "About",
    tech: "Technology",
    experience: "Experience",
    recognition: "Honors",
    contact: "Contact",
    archive: "Explore Archive",
    view: "View Details",
    period: "Period",
    status: "Status",
    role: "Role",
    results: "Results",
    links: "Links",
    search: "Search projects",
    all: "All",
    technology: "Technologies",
    filter: "Filter",
    none: "No records match",
    back: "Home",
    work: "Works",
    close: "Close",
  },
};
export function dateLabel(d: string | null | undefined) {
  return d ? String(d).slice(0, 10).replace(/-/g, ".") : "—";
}
export function projectPeriod(
  p: {
    started_at: string | null;
    started_month?: string | null;
    ended_at: string | null;
    ended_month?: string | null;
    period_label?: string | null;
    status: string;
  },
  lang: Locale,
) {
  if (p.period_label) return p.period_label;
  const start = p.started_at || p.started_month;
  const end = p.ended_at || p.ended_month;
  if (!start && !end)
    return lang === "ko" ? "기간 정보 없음" : "Dates not recorded";
  const current = ["operating", "developing", "planning"].includes(
    p.status || "",
  );
  if (!start) return lang === "ko" ? `${end} 종료` : `Ended ${end}`;
  if (!end && !current)
    return lang === "ko" ? `${start} 시작` : `Started ${start}`;
  return `${start} — ${end || (lang === "ko" ? "현재" : "Present")}`;
}
