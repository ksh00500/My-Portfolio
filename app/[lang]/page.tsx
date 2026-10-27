import Link from 'next/link';
import {getPortfolioData} from '@/lib/repository';
import {Hero} from '@/components/Hero';
import {TechAtlas} from '@/components/TechAtlas';
import {Status} from '@/components/Status';
import {Laurel} from '@/components/Laurel';
import {Poster} from '@/components/Poster';
import {FilmLeader} from '@/components/FilmLeader';
import {langData,label,formatDate,projectPeriod} from '@/lib/i18n';
import {translate,projectSummary,projectName} from '@/lib/types';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function Home({params}:{params:Promise<{lang:string}>}){
 const {lang:raw}=await params;const lang:Locale=raw==='en'?'en':'ko';
 const d=await getPortfolioData();const t=langData[lang];const c=(key:string,fallback='')=>translate(d.content,key,lang,fallback);
 const profileName=lang==='ko'?String(d.profile?.name_ko||''):String(d.profile?.name_en||'');
 const featured=d.projects.find(p=>p.is_featured)||d.projects[0];
 const other=d.projects.filter(p=>p.id!==featured?.id).slice(0,4);
 const awards=d.recognitions.filter(r=>r.recognition_type==='award').slice(0,3);
 const email=d.profile?.email?String(d.profile.email):null,github=d.profile?.github_url?String(d.profile.github_url):null,keyda=d.profile?.keyda_url?String(d.profile.keyda_url):null;
 const techNames=(id:string)=>d.projectTechnologies.filter(r=>r.project_id===id).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)).map(r=>d.technologies.find(x=>x.id===r.technology_id)?.name).filter((n):n is string=>Boolean(n)).slice(0,3);
 const featuredMetrics=featured?d.projectMetrics.filter(m=>m.project_id===featured.id):[];
 const featuredRole=featured?((lang==='en'&&featured.role_en)||featured.role):null;
 const recent=d.experiences.filter(e=>e.category!=='Certification & Badge').slice(0,5);
 return <>
  <Hero lang={lang} title={c('hero.title')} subtitle={c('hero.subtitle')} name={profileName}/>
  <section id="about" className="about-block" data-chapter="CHAPTER 02 / ABOUT"><div className="wrap"><div className="about-columns"><div className="about-statement"><span className="opening-quote">“</span><h2>{c('about.title')}</h2><p>{c('about.description')}</p></div><div className="about-facts"><span>PROFILE / {new Date().getFullYear()}</span><h3>{profileName}</h3><dl><dt>{t.role}</dt><dd>{String(d.profile?.headline||'')}</dd><dt>{t.education}</dt><dd>{String(d.profile?.school_name||'')} · {String(d.profile?.department||'')}</dd><dt>{t.product}</dt><dd>{featured?.name||'—'}</dd></dl></div></div></div></section>
  {featured&&<section className="feature-block" id="featured" data-chapter="CHAPTER 03 / DIRECTOR'S CUT"><div className="wrap"><div className="section-eyebrow">{lang==='ko'?'대표 프로젝트':'Featured project'}</div><div className="feature-masthead"><h2>{featured.name}</h2><p>{c('senro.title')}</p></div>
  <div className="acts-filmstrip">
   <div className="act-panel"><small>ACT 01</small><FilmLeader step={1}/><div className="act-body"><strong>{c('senro.act1')}</strong><p>{c('senro.act1.body')||projectSummary(featured,lang)}</p></div></div>
   <div className="act-panel"><small>ACT 02</small><FilmLeader step={2}/><div className="act-body"><strong>{c('senro.act2')}</strong>{c('senro.act2.body')&&<p>{c('senro.act2.body')}</p>}<dl className="act-facts">{featuredRole&&<><dt>{t.role}</dt><dd>{featuredRole}</dd></>}{techNames(featured.id).length>0&&<><dt>{t.technology}</dt><dd>{techNames(featured.id).join(' · ')}</dd></>}</dl></div></div>
   <div className="act-panel"><small>ACT 03</small><FilmLeader step={3}/><div className="act-body"><strong>{c('senro.act3')}</strong>{c('senro.act3.body')&&<p>{c('senro.act3.body')}</p>}<p className="act-run">{projectPeriod(featured,lang)}　<Status value={featured.status} lang={lang}/></p>{featuredMetrics.length>0&&<div className="act-metrics">{featuredMetrics.map(m=><div key={m.id}><strong>{m.display_value}</strong><small>{m.metric_name}{!m.is_verified?' *':''}</small></div>)}</div>}{featured.live_url&&<a className="act-live" href={featured.live_url} target="_blank" rel="noopener noreferrer">{featured.live_url.replace(/^https?:\/\//,'').replace(/\/$/,'')} ↗</a>}</div></div>
  </div>
  <div className="feature-details">{featuredMetrics.some(m=>!m.is_verified)?<p className="provenance-note">{lang==='ko'?'* 초기 기록에 근거한 지표이며 별도 검증 여부는 DB에 보관됩니다.':'* Initial reported metrics; verification state is stored separately.'}</p>:<span/>}<Link href={`/${lang}/projects/${featured.slug}`} className="dark-outline-link">{t.view}</Link></div></div></section>}
  <section className="projects-block" id="work" data-chapter="CHAPTER 04 / SELECTED WORKS"><div className="wrap"><div className="section-title-row"><h2>{c('projects.title')}</h2><p>{c('projects.description')}</p></div><div className="poster-wall">{other.map(p=><Poster key={p.id} project={p} lang={lang} techs={techNames(p.id)}/>)}</div><div className="project-list-mini">{d.projects.filter(p=>p.id!==featured?.id).slice(4,9).map(p=><Link href={`/${lang}/projects/${p.slug}`} key={p.id}>{projectName(p,lang)}<Status value={p.status} lang={lang}/></Link>)}</div><Link href={`/${lang}/projects`} className="ink-link">{t.archive}</Link></div></section>
  <section className="tech-block" id="tech" data-chapter="CHAPTER 05 / ENGINEERING"><div className="wrap"><h2>{c('tech.title')}</h2><p className="section-descrip">{c('tech.description')}</p><TechAtlas techs={d.technologies} relations={d.projectTechnologies} projects={d.projects} lang={lang}/></div></section>
  <section className="honors-block" id="honors" data-chapter="CHAPTER 06 / RECOGNITION"><div className="wrap"><h2>{c('recognition.title')}</h2><div className="laurel-showcase">{awards.map(a=><div className="laurel-spot" key={a.id}><Laurel className="laurel-glyph" width={300} height={230} steps={12} leaf={.42}/><div className="laurel-text"><small>{lang==='en'&&a.title_en?a.title_en:a.title}</small><strong>{lang==='en'&&a.award_name_en?a.award_name_en:a.award_name}</strong><span>{a.awarded_at?.slice(0,4)||'—'}</span></div></div>)}</div><Link className="bronze-link" href={`/${lang}/recognition`}>{t.archive}</Link></div></section>
  <section className="experience-block" id="experience" data-chapter="CHAPTER 07 / THE JOURNEY"><div className="wrap"><h2>{c('experience.title')}</h2><div className="timeline">{recent.map(e=><div className="timeline-entry" key={e.id}><time dateTime={e.started_at||undefined}>{formatDate(e.started_at,lang,'month')||'—'}</time><div><h3>{lang==='en'&&e.name_en?e.name_en:e.name}</h3><span>{label(e.category,lang)}{e.role?' · '+(lang==='en'&&e.role_en?e.role_en:e.role):''}</span></div></div>)}</div><Link className="slate-link" href={`/${lang}/experience`}>{t.archive}</Link></div></section>
  <footer className="closing-block" id="contact" data-chapter="FINAL CHAPTER / CREDITS"><div className="wrap"><span className="section-eyebrow">THE END / CREDITS</span><h2>{c('ending.title')}</h2><div className="credits-line"/><div className="credits-table"><span>{t.development}</span><strong>{profileName}</strong>{(email||github)&&<><span>{t.contact}</span><strong>{email?<a href={`mailto:${email}`}>{email}</a>:<a href={github!} target="_blank" rel="noopener noreferrer">{github!.replace(/^https?:\/\//,'')}</a>}</strong></>}</div><div className="closing-links">{github&&<a href={github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}{email&&<a href={`mailto:${email}`}>Email</a>}{keyda&&<a href={keyda} target="_blank" rel="noopener noreferrer">KeyDa ↗</a>}</div><span className="the-end">{c('ending.tagline')}</span></div></footer>
 </>;
}
