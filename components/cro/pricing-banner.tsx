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
      <div className="relative rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-600/20 to-red-600/20 p-5 shadow-2xl backdrop-blur-md">
        {/* Close button */}
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("pricing-banner-dismissed", "true");
          }}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="font-bold text-orange-300">¿Querés destacar tu negocio?</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Planes desde <span className="font-bold text-orange-400">$4.900/mes</span>
          </p>

          <Link
            href="/planes"
            onClick={() => {
              if (typeof window !== "undefined" && window.trackEvent) {
                window.trackEvent("cro_banner_click", { banner: "pricing" });
              }
            }}
            className="mt-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/50"
          >
            Ver planes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
