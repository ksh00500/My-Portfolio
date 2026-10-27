"use client";
import { useRef, useState, useEffect } from "react";
import type { Locale } from "@/lib/types";

export function CopyEmail({ email, lang }: { email: string; lang: Locale }) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setStatus(lang === "ko" ? "이메일을 복사했습니다." : "Email copied.");
    } catch {
      setStatus(
        lang === "ko"
          ? "복사하지 못했습니다. 이메일 주소를 직접 선택해 주세요."
          : "Copy unavailable. Please select the email address.",
      );
    }
    timer.current = setTimeout(() => setStatus(""), 4000);
  }
  return (
    <div className="copy-email">
      <button type="button" onClick={copy}>
        {lang === "ko" ? "주소 복사" : "Copy email"}
        <span aria-hidden="true">⧉</span>
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
export function PrintResume({ lang }: { lang: Locale }) {
  return (
    <button
      className="text-link print-button"
      type="button"
      onClick={() => window.print()}
    >
      {lang === "ko" ? "PDF로 저장" : "Save as PDF"}
      <span aria-hidden="true">↓</span>
    </button>
  );
}
