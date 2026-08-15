"use client";
import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let raf2 = 0;
    // Doble rAF: le da tiempo a Next a terminar de hidratar el resto del
    // árbol (streaming/hidratación progresiva por Suspense) antes de que
    // esta mutación de clases directa al DOM corra -- si se hace en el
    // mismo tick del mount, puede ganarle a la hidratación de secciones
    // que todavía no terminaron y React reporta un mismatch real.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
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
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      io?.disconnect();
    };
  }, []);
  return null;
}
