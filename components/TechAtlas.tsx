'use client';
import {useMemo,useState,useRef} from 'react';
import Link from 'next/link';
import type {Locale,Technology,Relation,Project} from '@/lib/types';
const W=1200,H=790;
function hash(s:string){let v=2166136261;for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619);return v>>>0}
function rand(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
interface Node extends Technology{x:number;y:number;r:number;degree:number;projects:Project[]}
type Edge={a:string;b:string;count:number}
function layout(techs:Technology[],relations:Relation[],projects:Project[]){
 const projectById=new Map(projects.map(p=>[p.id,p]));
 const linksByTech=new Map<string,Project[]>();
 for(const t of techs)linksByTech.set(t.id,[]);
 for(const r of relations){const p=projectById.get(r.project_id);if(p)linksByTech.get(r.technology_id)?.push(p)}
 const maxDegree=Math.max(1,...Array.from(linksByTech.values()).map(a=>a.length));
 const nodes:Node[]=techs.map(t=>{const ps=linksByTech.get(t.id)||[];const degree=ps.length;const rng=rand(hash(t.id+t.name));const d=degree/maxDegree;const theta=rng()*Math.PI*2;const radius=95+(1-d)*220+(rng()-.5)*90;return {...t,degree,projects:ps,r:19+Math.pow(d,.62)*42,x:W/2+Math.cos(theta)*radius*1.32,y:H/2+Math.sin(theta)*radius*.95}});
 const edges:Edge[]=[];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];const count=a.projects.filter(p=>b.projects.some(q=>p.id===q.id)).length;if(count)edges.push({a:a.id,b:b.id,count})}
 const lookup=new Map(nodes.map(n=>[n.id,n]));
 // Deterministic force relaxation: no grid, stable across page loads.
 for(let iter=0;iter<220;iter++){
  for(const a of nodes){
   let fx=0,fy=0;
   const dx=a.x-W/2,dy=a.y-H/2;const dist=Math.hypot(dx,dy)||1;
   const target=85+(1-a.degree/maxDegree)*240;
   fx+=(target-dist)*(dx/dist)*.013;fy+=(target-dist)*(dy/dist)*.013;
   for(const b of nodes){if(a===b)continue;const vx=a.x-b.x,vy=a.y-b.y,d=Math.hypot(vx,vy)||1;const required=a.r+b.r+18;if(d<required){fx+=(required-d)*vx/d*.054;fy+=(required-d)*vy/d*.054}}
   for(const e of edges){const peer=e.a===a.id?lookup.get(e.b):e.b===a.id?lookup.get(e.a):null;if(!peer)continue;fx+=(peer.x-a.x)*.00075*Math.min(3,e.count);fy+=(peer.y-a.y)*.00075*Math.min(3,e.count)}
   a.x=Math.max(a.r+66,Math.min(W-a.r-66,a.x+fx));a.y=Math.max(a.r+66,Math.min(H-a.r-66,a.y+fy));
  }
 }
 return {nodes,edges,lookup};
}
export function TechAtlas({techs,relations,projects,lang}:{techs:Technology[];relations:Relation[];projects:Project[];lang:Locale}){
 const graph=useMemo(()=>layout(techs,relations,projects),[techs,relations,projects]);
 const [selected,setSelected]=useState<string|null>(null);const [camera,setCamera]=useState({x:0,y:0,w:W,h:H});
 const start=useRef<{x:number;y:number;cam:{x:number;y:number;w:number;h:number}}|null>(null);
 const selectedNode=graph.nodes.find(n=>n.id===selected);
 const connectedIds=new Set(graph.edges.filter(e=>e.a===selected||e.b===selected).flatMap(e=>[e.a,e.b]));
 const zoom=(factor:number)=>setCamera(c=>{if(factor===0)return {x:0,y:0,w:W,h:H};const w=Math.min(W,Math.max(400,c.w*factor));const h=Math.min(H,Math.max(300,c.h*factor));return {x:Math.max(0,Math.min(W-w,c.x+(c.w-w)/2)),y:Math.max(0,Math.min(H-h,c.y+(c.h-h)/2)),w,h}});
 const status=(t:Technology)=>t.proficiency==='usable'?(lang==='ko'?'활용 가능':'Using'):t.proficiency==='learning'?(lang==='ko'?'학습 중':'Learning'):(lang==='ko'?'학습 예정':'Planned');
 return <div className="atlas-box"><div className="atlas-top"><div className="atlas-legend"><span className="dot-blue"/>{lang==='ko'?'사용 기술':'Technology'} <span className="dot-mint"/>{lang==='ko'?'선택된 기술':'Selected'}</div><div className="atlas-controls"><button onClick={()=>zoom(.8)} aria-label="Zoom in">+</button><button onClick={()=>zoom(1.25)} aria-label="Zoom out">−</button><button onClick={()=>zoom(0)}>FIT</button></div></div>
 <div className="atlas-grid"><div className="atlas-stage" onPointerDown={e=>{if((e.target as Element).closest('[data-tech]'))return;start.current={x:e.clientX,y:e.clientY,cam:camera};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(!start.current)return;const bb=e.currentTarget.getBoundingClientRect();const dx=(e.clientX-start.current.x)*start.current.cam.w/bb.width,dy=(e.clientY-start.current.y)*start.current.cam.h/bb.height;setCamera({...start.current.cam,x:Math.min(W-start.current.cam.w,Math.max(0,start.current.cam.x-dx)),y:Math.min(H-start.current.cam.h,Math.max(0,start.current.cam.y-dy))})}} onPointerUp={()=>start.current=null} onPointerCancel={()=>start.current=null}>
 <svg viewBox={`${camera.x} ${camera.y} ${camera.w} ${camera.h}`} aria-label="Organic technology relationship map" role="group"><defs><radialGradient id="atlaslight"><stop stopColor="#223c4c" stopOpacity=".8"/><stop offset="1" stopColor="#0b111a" stopOpacity="0"/></radialGradient><pattern id="atlasdots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#708ea1" opacity=".22"/></pattern></defs><rect width={W} height={H} fill="url(#atlasdots)"/><ellipse cx={W/2} cy={H/2} rx="420" ry="300" fill="url(#atlaslight)"/>
 {graph.edges.map(e=>{const a=graph.lookup.get(e.a)!,b=graph.lookup.get(e.b)!;const active=Boolean(selected&&(e.a===selected||e.b===selected));const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const bend=(hash(e.a+e.b)%50-25);const dist=Math.hypot(b.x-a.x,b.y-a.y)||1;const cx=mx+(b.y-a.y)/dist*bend,cy=my-(b.x-a.x)/dist*bend;return <path key={e.a+e.b} d={`M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`} fill="none" stroke={active?'#00D2AC':'#7298ae'} strokeWidth={active?2:Math.min(1.6,.6+e.count*.4)} opacity={selected?(active?.93:.07):.28}/>})}
 {graph.nodes.map(n=>{const active=n.id===selected;const faded=Boolean(selected&&!active&&!connectedIds.has(n.id));return <g key={n.id} data-tech={n.id} tabIndex={0} role="button" aria-label={`${n.name}, ${n.degree} projects`} onClick={()=>setSelected(active?null:n.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(active?null:n.id)}}} style={{cursor:'pointer',opacity:faded?.27:1}}><title>{`${n.name} · ${n.degree} projects`}</title><circle cx={n.x} cy={n.y} r={n.r+7} fill={active?'rgba(0,210,172,.10)':'rgba(70,135,165,.10)'}/><circle cx={n.x} cy={n.y} r={n.r} fill={active?'#12473f':'#1a3b4d'} stroke={active?'#00D2AC':'#8eb5c9'} strokeWidth={active?2.6:1.1}/><text x={n.x} y={n.y+4} textAnchor="middle" fill="#eef7fa" fontSize="12" fontWeight="700">{n.name.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase()||'T'}</text><text x={n.x} y={n.y+n.r+18} textAnchor="middle" fill="#e8f1f6" fontSize="12" fontWeight="550">{n.name.length>18?n.name.slice(0,17)+'…':n.name}</text><circle cx={n.x+n.r*.75} cy={n.y-n.r*.75} r="9" fill={active?'#00D2AC':'#9ec6da'}/><text x={n.x+n.r*.75} y={n.y-n.r*.75+3} textAnchor="middle" fontSize="9" fill="#071017" fontWeight="700">{n.degree}</text></g>})}</svg></div>
 <aside className="atlas-side"><span className="eyebrow steel">TECH ATLAS / {graph.nodes.length}</span>{selectedNode?<><h3>{selectedNode.name}</h3><p>{selectedNode.category} · {status(selectedNode)}</p><div className="atlas-stat"><strong>{selectedNode.projects.length}</strong><span>{lang==='ko'?'연결된 프로젝트':'Linked projects'}</span></div>{selectedNode.projects.length?selectedNode.projects.map(p=><Link className="related-link" href={`/${lang}/projects/${p.slug}`} key={p.id}>{p.name}</Link>):<p>{lang==='ko'?'아직 확인된 프로젝트 연결이 없습니다.':'No confirmed project link yet.'}</p>}</>:<><h3>{lang==='ko'?'기술을 선택해 보세요':'Select a technology'}</h3><p>{lang==='ko'?'큰 원일수록 더 많은 프로젝트에서 사용됐습니다. 주변 곡선은 같은 프로젝트에서 함께 쓰인 기술을 나타냅니다.':'Larger circles represent usage in more projects. Curved links connect technologies used together.'}</p><div className="atlas-stat"><strong>{relations.length}</strong><span>{lang==='ko'?'확인된 기술-프로젝트 관계':'Confirmed project-technology relations'}</span></div></>}</aside></div>
 <div className="atlas-note">{lang==='ko'?'확인된 프로젝트 연결만 집계합니다. 미확인 관계는 임의로 생성하지 않습니다.':'Only confirmed project links are counted; unverified links are not fabricated.'}</div></div>
}
