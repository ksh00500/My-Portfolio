import type { Locale, PortfolioData, Project } from "./types";

export const textValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
export const projectName = (project: Project, lang: Locale) =>
  lang === "en" && project.name_en ? project.name_en : project.name;
const statuses: Record<string, [string, string]> = {
  operating: ["운영 중", "Live"],
  developing: ["개발 중", "In development"],
  planning: ["기획 중", "Planning"],
  completed: ["완료", "Completed"],
  closed: ["운영 종료", "Closed"],
  paused: ["일시 중단", "Paused"],
  ongoing: ["진행 중", "Ongoing"],
  enrolled: ["재학 중", "Enrolled"],
  graduated: ["졸업", "Graduated"],
  acquired: ["취득", "Acquired"],
};
const categories: Record<string, [string, string]> = {
  Product: ["서비스", "Product"],
  Personal: ["개인 프로젝트", "Personal"],
  Academic: ["교과 프로젝트", "Academic"],
  Startup: ["창업 프로젝트", "Startup"],
  Competition: ["대회 프로젝트", "Competition"],
  Team: ["팀 프로젝트", "Team"],
  Capstone: ["캡스톤", "Capstone"],
  Work: ["실무", "Work"],
  Language: ["언어", "Languages"],
  "Web & Frameworks": ["웹 · 프레임워크", "Web & frameworks"],
  Mobile: ["모바일", "Mobile"],
  Database: ["데이터베이스", "Databases"],
  "Cloud & Infrastructure": ["인프라", "Infrastructure"],
  Collaboration: ["협업", "Collaboration"],
  Design: ["디자인", "Design"],
  "AI & Agents": ["AI · 에이전트", "AI & agents"],
  "Game Development": ["게임 개발", "Game development"],
  "Data & ML": ["데이터 · 머신러닝", "Data & ML"],
  "Leadership & Activity": ["리더십 · 활동", "Leadership & activities"],
  "Competition & Hackathon": ["대회 · 해커톤", "Competitions & hackathons"],
  Education: ["교육", "Education"],
  Scholarship: ["장학", "Scholarships"],
  "Certification & Badge": ["자격", "Credentials"],
  award: ["수상", "Award"],
  scholarship: ["장학", "Scholarship"],
};
export const statusLabel = (value: string, lang: Locale) =>
  statuses[value]?.[lang === "ko" ? 0 : 1] || value;
export const categoryLabel = (value: string, lang: Locale) =>
  categories[value]?.[lang === "ko" ? 0 : 1] || value;
export function projectTechnologies(data: PortfolioData, id: string) {
  const links = new Set(
    data.projectTechnologies
      .filter((r) => r.project_id === id)
      .map((r) => r.technology_id),
  );
  return data.technologies.filter((t) => links.has(t.id));
}
export function selectedProjects(projects: Project[]) {
  const featured =
    projects.find((p) => p.is_featured) ||
    projects.find((p) => p.status === "operating") ||
    projects[0];
  const priorities = ["nrc-ddss", "postit-meeting", "setstop"];
  const remaining = projects.filter((p) => p.id !== featured?.id);
  const selected = [...remaining]
    .sort((a, b) => {
      const rank = (p: Project) => {
        const i = priorities.indexOf(p.slug);
        return i < 0 ? priorities.length : i;
      };
      return rank(a) - rank(b) || a.display_order - b.display_order;
    })
    .slice(0, 3);
  return { featured, selected };
}
