"use client";
import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";

// Scroll con física real (inercia/lerp) en vez del scroll nativo "a los
// saltos" -- es lo que hace que sitios como Linear/Stripe se sientan
// cinematográficos. Se apaga solo si el usuario prefiere menos movimiento.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
