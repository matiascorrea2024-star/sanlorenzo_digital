"use client";
import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      const els = Array.from(document.querySelectorAll("main section"));
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("reveal-in");
              io!.unobserve(en.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      els.forEach((el) => {
        el.classList.add("reveal-init");
        io!.observe(el);
      });
    };

    // Esperamos a que el navegador esté ocioso (con tope de 500ms) antes
    // de mutar el DOM -- un par de rAF no alcanza cuando la página tiene
    // sus propios Suspense boundaries (ej. /buscar con useSearchParams)
    // que pueden tardar más que un par de frames en terminar de hidratar;
    // si esta mutación les gana de mano, React reporta un mismatch real.
    // requestIdleCallback no existe en Safari -- fallback a setTimeout.
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const cic = window.cancelIdleCallback as typeof window.cancelIdleCallback | undefined;
    let idleId = 0;
    let timeoutId = 0;
    if (ric) {
      idleId = ric(start, { timeout: 500 });
    } else {
      timeoutId = window.setTimeout(start, 150);
    }

    return () => {
      cancelled = true;
      if (idleId && cic) cic(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
      io?.disconnect();
    };
  }, []);
  return null;
}
