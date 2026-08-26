"use client";
// Banner de consentimiento de cookies -- GA no carga hasta que el
// usuario elige. "Esenciales" = la web funciona igual, sin analítica.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

export const CONSENT_KEY = "sld-cookie-consent";

export function readConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function decide(value: "all" | "essential") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    localStorage.setItem("sld-cookie-consent-fecha", new Date().toISOString());
  } catch {}
  window.dispatchEvent(new CustomEvent("sld-consent", { detail: value }));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      /* Mobile: barra compacta en el borde inferior (tapa la bottom-nav
         mientras se decide, nunca el contenido ni el CTA de la página).
         Desktop: tarjeta flotante. */
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-[var(--line-strong)] bg-[var(--surface)]/97 backdrop-blur-xl md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md md:rounded-3xl md:border"
    >
      <div className="p-3 md:p-5">
        <div className="flex items-start gap-2.5 md:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/15 md:h-10 md:w-10">
            <Cookie className="h-4.5 w-4.5 text-[var(--accent)] md:h-5 md:w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm uppercase tracking-wide text-[var(--text)] md:text-base">Cookies, sin vueltas</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--muted)] md:mt-1 md:text-xs md:leading-relaxed">
              Cookies anónimas de métricas para mejorar la web. Nada se vende a terceros.{" "}
              <Link href="/privacidad" className="font-bold text-[var(--accent)] hover:underline">
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex gap-2 md:mt-4">
          <button
            onClick={() => { decide("all"); setVisible(false); }}
            className="btn-hard flex-1 rounded-xl bg-[var(--accent)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white md:py-2.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Aceptar todo
          </button>
          <button
            onClick={() => { decide("essential"); setVisible(false); }}
            className="flex-1 rounded-xl border border-[var(--line-strong)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white md:py-2.5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  );
}
