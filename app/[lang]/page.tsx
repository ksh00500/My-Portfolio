import Link from "next/link";
import { getPortfolioData } from "@/lib/repository";
import { Hero } from "@/components/Hero";
import { FeaturedSequence } from "@/components/FeaturedSequence";
import { ProjectCard } from "@/components/ProjectCard";
import { Skills } from "@/components/Skills";
import { CopyEmail, PrintResume } from "@/components/Contact";
import { TechAtlas } from "@/components/TechAtlas";
import { projectPeriod } from "@/lib/i18n";
import { projectSummary, translate } from "@/lib/types";
import type { Locale } from "@/lib/types";
import {
  projectName,
  projectTechnologies,
  selectedProjects,
  statusLabel,
  textValue,
} from "@/lib/presentation";
export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = raw === "en" ? "en" : "ko";
  const ko = lang === "ko";
  const d = await getPortfolioData();
  const c = (key: string) => translate(d.content, key, lang);
  const name =
    textValue(d.profile?.[ko ? "name_ko" : "name_en"]) ||
    (ko ? "김시호" : "KIM SIHO");
  const school = [
    textValue(d.profile?.school_name),
    textValue(d.profile?.department),
  ]
    .filter(Boolean)
    .join(" · ");
  const { featured, selected } = selectedProjects(d.projects);
  const email = c("contact.email") || textValue(d.profile?.email);
  const github = textValue(d.profile?.github_url);
  const featuredTech = featured ? projectTechnologies(d, featured.id) : [];
  const awards = d.recognitions
    .filter((r) => r.recognition_type === "award")
    .sort((a, b) => (b.awarded_at || "").localeCompare(a.awarded_at || ""))
    .slice(0, 3);
  const employment = [...d.employment].sort((a, b) =>
    textValue(b.started_at).localeCompare(textValue(a.started_at)),
  );
  const education = [...d.education].sort((a, b) =>
    textValue(b.started_at).localeCompare(textValue(a.started_at)),
  );
  return (
    <>
      <Hero
        lang={lang}
        title={c("hero.title")}
        subtitle={c("hero.subtitle")}
        name={name}
        featured={featured}
        school={school}
      />
      {featured && (
        <section
          className="feature-sequence-section"
          id="featured"
          data-chapter="02 / FEATURED"
          data-scene-color="#b4d4b0"
          data-scene-label={ko ? "대표작" : "Featured"}
          aria-labelledby="featured-title"
        >
          <div className="wrap">
            <div className="feature-sequence-heading">
              <div>
                <span className="eyebrow">02 / FEATURED PROJECT</span>
                <h2 id="featured-title">{projectName(featured, lang)}</h2>
              </div>
              <div className="feature-sequence-caption">
                <span>01 — 03</span>
                <p>
                  {ko
                    ? "서비스, 구현, 결과. 세 장면으로 살펴보는 대표 프로젝트."
                    : "The product, the implementation, and the results."}
                </p>
              </div>
            </div>
            <FeaturedSequence
              lang={lang}
              story={{
                name: projectName(featured, lang),
                slug: featured.slug,
                summary: projectSummary(featured, lang),
                description:
                  (lang === "en"
                    ? featured.description_en || featured.description
                    : featured.description_ko || featured.description) || "",
                role:
                  (lang === "en"
                    ? featured.role_en || featured.role
                    : featured.role) || "",
                period: projectPeriod(featured, lang),
                status: statusLabel(featured.status, lang),
                technologies: featuredTech.map((t) => t.name),
                contributions:
                  (lang === "en"
                    ? featured.key_contributions_en ||
                      featured.key_contributions
                    : featured.key_contributions) || "",
                result:
                  (lang === "en"
                    ? featured.result_summary_en || featured.result_summary
                    : featured.result_summary) || "",
                metrics: d.projectMetrics
                  .filter((m) => m.project_id === featured.id)
                  .map((m) => ({
                    id: m.id,
                    name: m.metric_name,
                    value: m.display_value,
                    verified: m.is_verified === true,
                  })),
                liveUrl: featured.live_url,
              }}
            />
          </div>
        </section>
      )}
      <section
        className="section projects-section"
        id="projects"
        data-chapter="03 / PROJECTS"
        data-scene-color="#456455"
        data-scene-label={ko ? "프로젝트" : "Projects"}
        aria-labelledby="projects-title"
      >
        <div className="wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / SELECTED WORK</span>
              <h2 id="projects-title">{c("projects.title")}</h2>
            </div>
            <Link className="text-link" href={`/${lang}/projects`}>
              {ko ? "전체 프로젝트" : "All projects"}
              <span className="count">{d.projects.length}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="project-grid">
            {selected.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                techs={projectTechnologies(d, p.id)}
                lang={lang}
                index={i}
              />
            ))}
          </div>
          {d.projects.length === 0 && (
            <p className="empty-note">
              {ko
                ? "아직 공개된 프로젝트가 없습니다."
                : "No public projects yet."}
            </p>
          )}
        </div>
      </section>
      <section
        className="section about-section"
        id="about"
        data-chapter="04 / EXPERIENCE"
        data-scene-color="#aebedc"
        data-scene-label={ko ? "경험" : "Experience"}
        aria-labelledby="about-title"
      >
        <div className="wrap about-grid">
          <div className="about-intro">
            <span className="eyebrow">04 / ABOUT</span>
            <h2 id="about-title">{c("about.title")}</h2>
            <p>{c("about.description")}</p>
            <div className="about-links">
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  GitHub<span aria-hidden="true">↗</span>
                </a>
              )}
              <PrintResume lang={lang} />
            </div>
          </div>
          <div className="career-summary">
            <div className="subheading">
              <h3>{c("experience.title")}</h3>
              <Link href={`/${lang}/experience`}>
                {ko ? "전체 보기" : "View all"}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            {employment.map((e) => (
              <div className="career-row" key={textValue(e.id)}>
                <span className="career-type">{ko ? "경력" : "Work"}</span>
                <h4>{textValue(e.company_name)}</h4>
                <p>{textValue(e.position)}</p>
                {textValue(
                  e[ko ? "description_ko" : "description_en"] || e.description,
                ) && (
                  <p className="career-description">
                    {textValue(
                      e[ko ? "description_ko" : "description_en"] ||
                        e.description,
                    )}
                  </p>
                )}
                <time>
                  {textValue(e.started_at).slice(0, 7)} —{" "}
                  {textValue(e.ended_at).slice(0, 7) ||
                    (ko ? "현재" : "Present")}
                </time>
              </div>
            ))}
            {education.map((e) => (
              <div className="career-row" key={textValue(e.id)}>
                <span className="career-type">{ko ? "교육" : "Education"}</span>
                <h4>{textValue(e.school_name)}</h4>
                <p>
                  {textValue(e.department)}
                  <span className="inline-separator">/</span>
                  {statusLabel(textValue(e.status), lang)}
                </p>
                <time>
                  {textValue(e.started_at).slice(0, 7)} —{" "}
                  {textValue(e.ended_at).slice(0, 7) ||
                    (ko ? "현재" : "Present")}
                </time>
              </div>
            ))}
            {!employment.length && !education.length && (
              <p className="empty-note">
                {ko
                  ? "경력과 교육 정보가 아직 등록되지 않았습니다."
                  : "No experience or education records yet."}
              </p>
            )}
          </div>
        </div>
      </section>
      <section
        className="section tech-section"
        id="tech"
        data-chapter="05 / ENGINEERING"
        data-scene-color="#a0d3e6"
        data-scene-label={ko ? "기술" : "Technology"}
        aria-labelledby="skills-title"
      >
        <div className="wrap">
          <div className="section-heading">
            <div>
              <span className="eyebrow">05 / TECHNICAL SKILLS</span>
              <h2 id="skills-title">{c("tech.title")}</h2>
            </div>
            <p>{c("tech.description")}</p>
          </div>
          <Skills
            techs={d.technologies}
            relations={d.projectTechnologies}
            projects={d.projects}
            lang={lang}
          />
          {d.technologies.length > 0 && (
            <details className="atlas-disclosure">
              <summary>
                {ko
                  ? "기술과 프로젝트의 관계도 보기"
                  : "Explore the technology relationship map"}
                <span aria-hidden="true">+</span>
              </summary>
              <TechAtlas
                techs={d.technologies}
                relations={d.projectTechnologies}
                projects={d.projects}
                lang={lang}
              />
            </details>
          )}
        </div>
      </section>
      {(awards.length > 0 || d.certifications.length > 0) && (
        <section
          className="section awards-section"
          id="recognition"
          data-chapter="06 / RECOGNITION"
          data-scene-color="#e2b886"
          data-scene-label={ko ? "수상" : "Awards"}
          aria-labelledby="awards-title"
        >
          <div className="wrap">
            <div className="section-heading">
              <div>
                <span className="eyebrow">06 / RECOGNITION</span>
                <h2 id="awards-title">{c("recognition.title")}</h2>
              </div>
              <Link href={`/${lang}/recognition`} className="text-link">
                {ko ? "전체 보기" : "View all"}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="award-list">
              {awards.map((a) => (
                <div className="award-row" key={a.id}>
                  <span className="award-icon" aria-hidden="true">
                    ✳
                  </span>
                  <div>
                    <h3>
                      {lang === "en" && a.title_en ? a.title_en : a.title}
                    </h3>
                    <p>
                      {lang === "en" && a.award_name_en
                        ? a.award_name_en
                        : a.award_name}
                    </p>
                  </div>
                  <time>{a.awarded_at?.slice(0, 7) || "—"}</time>
                </div>
              ))}
              {d.certifications.map((cert) => (
                <div className="award-row" key={textValue(cert.id)}>
                  <span className="award-icon" aria-hidden="true">
                    ↗
                  </span>
                  <div>
                    <h3>{textValue(cert.name)}</h3>
                    <p>{textValue(cert.issuer)}</p>
                  </div>
                  <time>{textValue(cert.issued_at).slice(0, 7) || "—"}</time>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <footer
        className="contact-section"
        id="contact"
        data-chapter="07 / CONTACT"
        data-scene-color="#bad8c2"
        data-scene-label={ko ? "연락" : "Contact"}
      >
        <div className="wrap">
          <span className="eyebrow">CONTACT</span>
          <div className="contact-heading">
            <h2>{c("ending.title")}</h2>
            <span className="contact-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
          <div className="contact-line">
            <a className="email-link" href={`mailto:${email}`}>
              {email}
            </a>
            <CopyEmail email={email} lang={lang} />
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {name}
            </span>
            <span>Full-stack developer</span>
            {github && (
              <a href={github} target="_blank" rel="noopener noreferrer">
                GitHub ↗
              </a>
            )}
            <a href="#intro-title">{ko ? "맨 위로" : "Back to top"} ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
}
