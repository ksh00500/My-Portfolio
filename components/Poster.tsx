import Link from 'next/link';
import type {Locale,Project} from '@/lib/types';
import {projectName,projectSummary} from '@/lib/types';
import {label,projectPeriod} from '@/lib/i18n';
import {Status} from './Status';
// Each project is billed like a film poster. The palette is picked from the slug so it stays stable when order changes.
const TONES=6;
export function posterTone(slug:string){let v=0;for(let i=0;i<slug.length;i++)v=(v*31+slug.charCodeAt(i))>>>0;return v%TONES}
const credits={ko:{showing:'상영',starring:'출연',role:'역할'},en:{showing:'Showing',starring:'Starring',role:'Role'}};
export function Poster({project:p,lang,techs}:{project:Project;lang:Locale;techs:string[]}){
 const t=credits[lang];const year=(p.started_at||p.started_month||'').slice(0,4);const role=(lang==='en'&&p.role_en)||p.role;
 return <Link href={`/${lang}/projects/${p.slug}`} className={`poster poster-tone-${posterTone(p.slug)}`}>
  <div className="poster-top"><span>{label(p.project_type,lang)}</span>{year&&<span>{year}</span>}</div>
  <div className="poster-title"><h3>{projectName(p,lang)}</h3>{projectSummary(p,lang)&&<p>{projectSummary(p,lang)}</p>}</div>
  <dl className="poster-billing">
   {techs.length>0&&<div><dt>{t.starring}</dt><dd>{techs.join(' · ')}</dd></div>}
   {role&&<div><dt>{t.role}</dt><dd>{role}</dd></div>}
   <div><dt>{t.showing}</dt><dd>{projectPeriod(p,lang)}</dd></div>
   <div className="poster-status"><Status value={p.status} lang={lang}/></div>
  </dl>
 </Link>;
}
