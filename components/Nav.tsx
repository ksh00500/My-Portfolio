"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";

export function Nav({ lang, name }: { lang: Locale; name: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const other = lang === "ko" ? "en" : "ko";
  const ko = lang === "ko";
  const toOther = path.replace(/^\/(ko|en)(?=\/|$)/, `/${other}`);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !nav.current?.contains(event.target) &&
        !toggle.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  const items = [
    { href: `/${lang}/projects`, label: ko ? "프로젝트" : "Projects" },
    { href: `/${lang}/experience`, label: ko ? "경력 · 활동" : "Experience" },
    { href: `/${lang}/recognition`, label: ko ? "수상 · 자격" : "Awards" },
    { href: `/${lang}#tech`, label: ko ? "기술" : "Skills" },
  ];
  return (
    <header className="site-nav">
      <div className="wrap nav-primary">
        <Link
          className="brand"
          href={`/${lang}`}
          onClick={() => setOpen(false)}
        >
          <span className="brand-symbol" aria-hidden="true">
            s.
          </span>
          <span>{name}</span>
        </Link>
        <nav
          id="main-navigation"
          ref={nav}
          className={open ? "nav-items open" : "nav-items"}
          aria-label={ko ? "주 메뉴" : "Main navigation"}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={path === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-right">
          <Link
            href={toOther}
            className="language-switch"
            hrefLang={other}
            lang={other}
            aria-label={ko ? "Switch to English" : "한국어로 전환"}
          >
            {other === "en" ? "EN" : "KO"}
            <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href={`/${lang}#contact`}
            className="nav-contact"
            onClick={() => setOpen(false)}
          >
            {ko ? "연락하기" : "Contact"}
            <span aria-hidden="true">↗</span>
          </Link>
          <button
            ref={toggle}
            className="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={
              open
                ? ko
                  ? "메뉴 닫기"
                  : "Close menu"
                : ko
                  ? "메뉴 열기"
                  : "Open menu"
            }
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
