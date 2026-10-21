import {getPortfolioData} from '@/lib/repository';
import {ArchiveFilters} from '@/components/ArchiveFilters';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
export default async function ProjectsArchive({params}:{params:Promise<{lang:string}>}){const {lang:raw}=await params;const lang:Locale=raw==='en'?'en':'ko';const d=await getPortfolioData();return <section className="archive-light page-top" data-chapter="ARCHIVE / PROJECTS"><div className="wrap"><div className="section-eyebrow ink">THE COMPLETE COLLECTION / {d.projects.length}</div><h1 className="archive-heading">{lang==='ko'?'프로젝트 아카이브':'Project Archive'}</h1><p className="archive-intro">{lang==='ko'?'기획, 개발, 배포, 운영까지. 모든 프로젝트를 살펴보세요.':'Browse the projects from planning to launch and operation.'}</p><ArchiveFilters projects={d.projects} lang={lang}/></div></section>}
