"use client";
import { useEffect } from "react";
import type { Locale } from "@/lib/types";
export function DocumentLanguage({ lang }: { lang: Locale }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
