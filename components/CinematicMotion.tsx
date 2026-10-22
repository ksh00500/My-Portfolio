"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Visual navigation and optional reveals. Content remains visible without JavaScript. */
export function CinematicMotion() {
  const path = usePathname();
  const progress = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState("");
  useEffect(() => {
    let frame = 0;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter]"),
    );
    function update() {
      frame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const fraction = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (progress.current)
        progress.current.style.transform = `scaleX(${fraction})`;
      const current =
        [...sections]
          .reverse()
          .find(
            (section) =>
              section.getBoundingClientRect().top < innerHeight * 0.55,
          ) || sections[0];
      setChapter(current?.dataset.chapter || "");
    }
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".section-heading,.featured-project,.project-card,.about-intro,.career-row,.award-row",
      ),
    );
    let observer: IntersectionObserver | undefined;
    function configureMotion() {
      observer?.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-pending"));
      if (reduced.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.remove("reveal-pending");
              observer?.unobserve(entry.target);
            }
        },
        { threshold: 0.06, rootMargin: "0px 0px -35px 0px" },
      );
      for (const element of elements) {
        if (element.getBoundingClientRect().top > innerHeight) {
          element.classList.add("reveal-pending");
          observer.observe(element);
        }
      }
    }
    configureMotion();
    reduced.addEventListener("change", configureMotion);
    const focus = (event: FocusEvent) => {
      if (event.target instanceof Element)
        event.target
          .closest(".reveal-pending")
          ?.classList.remove("reveal-pending");
    };
    document.addEventListener("focusin", focus);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-pending"));
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      reduced.removeEventListener("change", configureMotion);
      document.removeEventListener("focusin", focus);
    };
  }, [path]);
  return (
    <div aria-hidden="true" className="cinema-indicators">
      <div className="cinema-progress" ref={progress} />
      {chapter && (
        <div className="cinema-chapter">
          <i />
          <span>{chapter}</span>
          <span className="cinema-frame">
            FRAME / {String(chapter.split(" / ")[0]).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
