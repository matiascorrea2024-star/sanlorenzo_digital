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
      className="fixed inset-x-3 bottom-20 z-[200] md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md"
    >
      <div className="rounded-3xl border border-white/10 bg-[#161314]/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/15">
            <Cookie className="h-5 w-5 text-[var(--accent)]" />
          </span>
          <div>
            <p className="font-display text-base uppercase tracking-wide text-[#f7f3ec]">Cookies, sin vueltas</p>
            <p className="mt-1 text-xs leading-relaxed text-[#a99b86]">
              Uso cookies anónimas de métricas para saber qué ofertas sirven y mejorar la web.
              Nada se vende a terceros.{" "}
              <Link href="/privacidad" className="font-bold text-[var(--accent)] hover:underline">
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { decide("all"); setVisible(false); }}
            className="btn-hard flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Aceptar todo
          </button>
          <button
            onClick={() => { decide("essential"); setVisible(false); }}
            className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#a99b86] transition hover:border-[var(--accent)] hover:text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  );
}
