import Link from 'next/link';
export default function NotFound(){return <main style={{minHeight:'100vh',padding:'180px 8vw',background:'#0b0b0d',color:'#f5f5f2'}}><h1 style={{fontSize:90}}>404</h1><p>해당 페이지 또는 공개 프로젝트를 찾을 수 없습니다.</p><Link href="/ko" style={{color:'#00D2AC'}}>홈으로 돌아가기 ↗</Link></main>}
