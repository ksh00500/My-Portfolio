'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import type {Locale} from '@/lib/types';
import {langData} from '@/lib/i18n';
import {ScrollStatus} from './ScrollStatus';
export function Nav({lang,name}:{lang:Locale;name:string}){
 const [open,setOpen]=useState(false); const path=usePathname();const text=langData[lang];
 const other:Locale=lang==='ko'?'en':'ko';
 const toOther=path.replace(/^\/(ko|en)(?=\/|$)/,`/${other}`);
 const items=[{key:'projects',href:`/${lang}/projects`,label:text.projects},{key:'experience',href:`/${lang}/experience`,label:text.experience},{key:'recognition',href:`/${lang}/recognition`,label:text.recognition}];
 return <header className="site-nav"><div className="nav-primary"><Link className="brand" href={`/${lang}`}>{name}</Link><nav id="site-menu" className={open?'nav-items open':'nav-items'} aria-label="Main navigation">{items.map(item=><Link key={item.key} href={item.href} onClick={()=>setOpen(false)}>{item.label}</Link>)}<Link href={`/${lang}#tech`} onClick={()=>setOpen(false)}>{text.tech}</Link></nav><div className="nav-right"><Link href={toOther} className="language-switch" aria-label={lang==='ko'?'Switch to English':'한국어로 전환'}><span className={lang==='ko'?'current':''}>KR</span><span className="divider">/</span><span className={lang==='en'?'current':''}>EN</span></Link><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label={open?text.close:text.menu} aria-expanded={open} aria-controls="site-menu"><span aria-hidden="true">{open?'×':'☰'}</span></button></div></div><div className="nav-sub" aria-hidden="true"><span className="indicator"/><ScrollStatus/></div></header>
}
