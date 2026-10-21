'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main style={{minHeight:'100vh',padding:'180px 8vw',background:'#0b0b0d',color:'#f5f5f2'}}><h1>데이터를 불러오지 못했습니다</h1><p>PostgreSQL 연결 상태와 데이터 초기화 여부를 확인해 주세요.</p><button style={{padding:15,background:'#00D2AC'}} onClick={reset}>다시 시도</button></main>}
