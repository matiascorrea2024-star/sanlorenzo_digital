"use client";
import { useEffect } from "react";

export default function Spotlight() {
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("[data-spot]") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
      el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return null;
}
