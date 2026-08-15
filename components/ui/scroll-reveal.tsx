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
        // Si el elemento ya está a la vista -- o el usuario ya scrolleó
        // más allá -- revelarlo directo en vez de dejarlo esperando un
        // evento de intersección que ya pasó (scroll rápido a fondo de
        // página antes de que esto llegue a correr, ej. tecla "Fin").
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add("reveal-init", "reveal-in");
          return;
        }
        el.classList.add("reveal-init");
        io!.observe(el);
      });
    };

    // Delay fijo y corto: alcanza de sobra para no ganarle a la
    // hidratación de React (que termina en el mismo tick/microtask,
    // incluso con Suspense boundaries propios como en /buscar) sin
    // arriesgar perder contra un scroll rápido del usuario -- a
    // diferencia de requestIdleCallback, que puede tardar hasta 500ms
    // bajo carga y de hecho llegó a perder esa carrera en pruebas reales.
    const timeoutId = window.setTimeout(start, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      io?.disconnect();
    };
  }, []);
  return null;
}
