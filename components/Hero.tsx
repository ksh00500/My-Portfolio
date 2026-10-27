'use client';
import {useEffect,useState} from 'react';
import type {Locale} from '@/lib/types';
export function Hero({lang,title,subtitle,name}:{lang:Locale;title:string;subtitle:string;name:string}){
 const [intro,setIntro]=useState(false);
 useEffect(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const played=sessionStorage.getItem('portfolio_intro_seen');if(!played&&!reduced){setIntro(true);sessionStorage.setItem('portfolio_intro_seen','true');const timer=setTimeout(()=>setIntro(false),1300);return()=>clearTimeout(timer)}},[]);
 return <><div className={`opening-frame ${intro?'playing':''}`} aria-hidden={!intro}><span>A PORTFOLIO BY</span><strong>{name}</strong><i/></div><section className="hero-film" data-chapter="CHAPTER 01 / THE PHILOSOPHY"><div className="hero-light"/><div className="hero-vignette"/><div className="frame-corners"><span/><span/><span/><span/></div><div className="wrap hero-content"><h1 className={lang==='en'?'hero-en':'hero-ko'}>{title}</h1><div className="mint-rule"/><p className="hero-deck">{subtitle}</p><div className="hero-meta"><span>{name} — SOFTWARE DEVELOPER / PRODUCT BUILDER</span><a href="#about">SCROLL TO EXPLORE ↓</a></div></div></section></>
}
