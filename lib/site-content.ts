import type { Copy } from "./types";

/** Editable defaults. Reading these values never writes to the connected database. */
export const defaultSiteContent: Copy = {
  "hero.title": {
    ko: "셈을 못하는 상인",
    en: "A Merchant Who Can’t Count",
  },
  "hero.subtitle": {
    ko: "아이디어를 현실로 만드는 개발자.\n웹 서비스부터 실시간 게임까지, 직접 기획하고 개발하고 운영합니다.",
    en: "Turning ideas into working products.\nWeb services and real-time games I have planned, built, and operated.",
  },
  "about.title": {
    ko: "풀스택 개발자 김시호입니다.",
    en: "Hi, I’m Siho, a full-stack developer.",
  },
  "about.description": {
    ko: "화면과 서버, 데이터를 연결해 하나의 서비스를 만듭니다. 개인 프로젝트의 출시·운영부터 팀 프로젝트, 실무 데이터베이스 작업까지 경험을 쌓고 있습니다.",
    en: "I connect interfaces, servers, and data to build services. My experience spans personal products, team projects, and database work.",
  },
  "projects.title": { ko: "주요 프로젝트", en: "Selected projects" },
  "projects.description": {
    ko: "직접 만든 서비스와 참여한 프로젝트를 살펴보세요.",
    en: "Products I built and projects I contributed to.",
  },
  "tech.title": { ko: "사용하고 배운 기술", en: "Technologies I use and learn" },
  "tech.description": {
    ko: "프로젝트와 실무·교육·수상·활동·자격의 기록에서 기술 경험을 확인할 수 있습니다.",
    en: "Explore technology experience across projects, work, education, awards, activities, and credentials.",
  },
  "recognition.title": { ko: "수상 및 자격", en: "Awards & credentials" },
  "experience.title": { ko: "경력과 교육", en: "Experience & education" },
  "ending.title": { ko: "더 이야기 나누고 싶다면.", en: "Let’s get in touch." },
  "contact.email": { ko: "ksh@keyda.site", en: "ksh@keyda.site" },
};

// Retire previous template copy without overwriting custom text or mutating DB rows.
const retired: Record<string, string[]> = {
  "contact.email": ["ksh.05.ow@gmail.com"],
  "hero.subtitle": [
    "삶은 계산하며 살아가되, 사람에게는 계산하지 않는다.",
    "I calculate my way through life, but never keep score with people.",
  ],
  "experience.title": ["지금까지의 여정", "The Journey So Far"],
  "ending.title": [
    "끝이 아닌, 다음 장면으로",
    "Not an ending. The next scene.",
  ],
};
export function resolveSiteContent(
  records: { key: string; ko: string | null; en: string | null }[],
): Copy {
  const content: Copy = Object.fromEntries(
    Object.entries(defaultSiteContent).map(([key, value]) => [
      key,
      { ...value },
    ]),
  );
  for (const record of records) {
    if (!Object.hasOwn(defaultSiteContent, record.key)) continue;
    for (const lang of ["ko", "en"] as const) {
      const text = record[lang]?.trim();
      if (text && !retired[record.key]?.includes(text))
        content[record.key][lang] = text;
    }
  }
  return content;
}
