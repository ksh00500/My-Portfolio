'use client';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import type {Project,Locale} from '@/lib/types';
import {projectSummary,projectName} from '@/lib/types';
import {Status} from './Status';
import {langData,projectPeriod,label} from '@/lib/i18n';
export function ArchiveFilters({projects,lang}:{projects:Project[];lang:Locale}){
 const [search,setSearch]=useState(''),[status,setStatus]=useState('all'),[type,setType]=useState('all');
 const [sort,setSort]=useState('latest');
 const types=Array.from(new Set(projects.map(p=>p.project_type))).filter(Boolean).sort();
 const filtered=useMemo(()=>projects.filter(p=>{
  const s=[p.name,p.name_en,projectSummary(p,lang),p.project_type,label(p.project_type,lang)].filter(Boolean).join(' ').toLowerCase();
  return s.includes(search.toLowerCase())&&(status==='all'||status===p.status)&&(type==='all'||type===p.project_type);
 }).sort((a,b)=>sort==='name'?projectName(a,lang).localeCompare(projectName(b,lang),lang):sort==='oldest'?(a.started_at||'').localeCompare(b.started_at||''):(b.started_at||'').localeCompare(a.started_at||'')),[projects,search,status,type,sort,lang]);
 const text=langData[lang];
 return <div><div className="filter-row"><label className="input-field"><span>{text.search}</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={text.search}/></label><label className="select-field"><span>{text.status}</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">{text.all}</option>{['operating','developing','planning','completed','closed','paused'].map(s=><option key={s} value={s}>{label(s,lang)}</option>)}</select></label><label className="select-field"><span>{text.filter}</span><select value={type} onChange={e=>setType(e.target.value)}><option value="all">{text.all}</option>{types.map(t=><option key={t} value={t}>{label(t,lang)}</option>)}</select></label><label className="select-field"><span>ORDER</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">{lang==='ko'?'최신순':'Newest'}</option><option value="oldest">{lang==='ko'?'오래된순':'Oldest'}</option><option value="name">{lang==='ko'?'이름순':'Name'}</option></select></label></div><div className="archive-counter">{filtered.length} / {projects.length} {lang==='ko'?'프로젝트':'PROJECTS'}</div><div className="archive-records">{filtered.map((p,i)=><Link className="archive-row" key={p.id} href={`/${lang}/projects/${p.slug}`}><div className="archive-index">{String(i+1).padStart(2,'0')}</div><div className="archive-entry"><h2>{projectName(p,lang)}</h2><p>{projectSummary(p,lang)}</p></div><div className="archive-tag"><Status value={p.status} lang={lang}/><small>{projectPeriod(p,lang)}</small></div><span className="arrow">↗</span></Link>)}{filtered.length===0&&<p>{text.none}</p>}</div></div>
}
