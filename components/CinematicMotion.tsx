"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface Scene {
  id: string;
  chapter: string;
  label: string;
  color: string;
}

/** Native page scrolling, with a labeled, accessible scene index. No scroll interception. */
export function CinematicMotion() {
  const path = usePathname();
  const progress = useRef<HTMLDivElement>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [active, setActive] = useState("");
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter]"),
    );
    const sceneList = sections.map((section) => ({
      id: section.id || "intro-title",
      chapter: section.dataset.chapter || "",
      label: section.dataset.sceneLabel || section.dataset.chapter || "",
      color: /^#[0-9a-f]{6}$/i.test(section.dataset.sceneColor || "")
        ? section.dataset.sceneColor!
        : "#b8d8c1",
    }));
    setScenes(sceneList);
    const root = document.documentElement;
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    const hero = document.querySelector<HTMLElement>(".opening-scene");
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (progress.current) progress.current.style.transform = `scaleX(${pct})`;
      let index = 0;
      for (let i = 0; i < sections.length; i++)
        if (sections[i].getBoundingClientRect().top < innerHeight * 0.5)
          index = i;
      const scene = sceneList[index];
      if (scene && scene.id !== last) {
        last = scene.id;
        setActive(scene.id);
        root.style.setProperty("--scene-color", scene.color);
      }
      if (hero) {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty(
          "--hero-progress",
          reduced.matches
            ? "0"
            : String(Math.min(1, Math.max(0, -rect.top / rect.height))),
        );
      }
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll);
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".section-heading,.project-card,.about-intro,.career-row,.award-row,.honor-card,.feature-sequence-heading,.sequence-act",
      ),
    );
    let observer: IntersectionObserver | undefined;
    function configure() {
      observer?.disconnect();
      elements.forEach((element) => element.classList.remove("reveal-pending"));
      if (reduced.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.remove("reveal-pending");
              observer?.unobserve(entry.target);
            }
        },
        { threshold: 0.05, rootMargin: "0px 0px -20px 0px" },
      );
      for (const element of elements)
        if (element.getBoundingClientRect().top > innerHeight) {
          element.classList.add("reveal-pending");
          observer.observe(element);
        }
    }
    configure();
    reduced.addEventListener("change", configure);
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
      root.style.removeProperty("--scene-color");
      hero?.style.removeProperty("--hero-progress");
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      reduced.removeEventListener("change", configure);
      document.removeEventListener("focusin", focus);
    };
  }, [path]);
  const current = scenes.find((scene) => scene.id === active);
  return (
    <>
      <div className="cinema-progress" ref={progress} aria-hidden="true" />
      {scenes.length > 0 && (
        <nav
          className="scene-index"
          aria-label={path.startsWith("/en") ? "Page sections" : "페이지 섹션"}
        >
          {scenes.map((scene, index) => (
            <a
              key={scene.id}
              href={`#${scene.id}`}
              aria-current={active === scene.id ? "location" : undefined}
            >
              <span className="scene-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="scene-label">{scene.label}</span>
              <i style={{ background: scene.color }} aria-hidden="true" />
            </a>
          ))}
        </nav>
      )}
      {current && (
        <div className="cinema-chapter" aria-hidden="true">
          <i />
          <span>{current.chapter}</span>
          <span className="cinema-frame">
            {String(scenes.indexOf(current) + 1).padStart(2, "0")} /{" "}
            {String(scenes.length).padStart(2, "0")}
          </span>
        </div>
      )}
    </>
  );
}
