"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="state-page">
      <div className="wrap">
        <span className="eyebrow">TEMPORARILY UNAVAILABLE</span>
        <h1>페이지를 불러오지 못했습니다.</h1>
        <p>잠시 후 다시 시도해 주세요.</p>
        <button className="button primary" onClick={reset}>
          다시 시도 <span aria-hidden="true">↻</span>
        </button>
      </div>
    </main>
  );
}
