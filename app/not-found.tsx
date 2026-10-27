import Link from "next/link";
export default function NotFound() {
  return (
    <main className="state-page">
      <div className="wrap">
        <span className="eyebrow">404 / PAGE NOT FOUND</span>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>주소가 변경되었거나 공개되지 않은 페이지입니다.</p>
        <Link className="button primary" href="/ko">
          홈으로 돌아가기 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
