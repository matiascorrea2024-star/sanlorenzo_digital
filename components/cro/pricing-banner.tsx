"use client";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    trackEvent?: (name: string, params: Record<string, any>) => void;
  }
}

export default function PricingBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pricing-banner-dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => setShowBanner(true), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--accent)]/40 bg-[var(--surface)]/95 p-6 shadow-[0_0_50px_rgba(209,47,104,.15)] backdrop-blur-md">
        <div className="pointer-events-none absolute left-[-20%] top-[-50%] h-[90%] w-[90%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[100px]" aria-hidden="true" />

        {/* Close button */}
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("pricing-banner-dismissed", "true");
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-[var(--muted2)] transition hover:bg-[var(--ov-10)] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative pr-6">
          <h3 className="font-display text-xl tracking-tight text-[var(--text)]">¿Querés destacar tu negocio?</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Planes desde <span className="font-black text-[var(--accent)]">$4.900/mes</span>
          </p>

          <Link
            href="/planes"
            onClick={() => {
              if (typeof window !== "undefined" && window.trackEvent) {
                window.trackEvent("cro_banner_click", { banner: "pricing" });
              }
            }}
            className="btn-hard mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ver planes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
