"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import HowItWorks from "@/components/ui/how-it-works";

export default function CuponesPage() {
  const params = useParams();
  const offerId = params.id as string;
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validateCode, setValidateCode] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  const loadData = async () => {
    try {
      const { data: offerData } = await supabase()
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerData) {
        setOffer(offerData);
      }

      const { data: couponsData } = await supabase()
        .from("coupons")
        .select("*")
        .eq("offer_id", offerId)
        .order("generated_at", { ascending: false });

      if (couponsData) {
        setCoupons(couponsData);
      }
    } catch (error) {
      console.error("Error cargando cupones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offerId]);

  const validateCoupon = async () => {
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: validateCode }),
      });

      const data = await response.json();
      setValidationResult(data);

      if (response.ok) {
        loadData();
        setValidateCode("");
      }
    } catch (error) {
      console.error("Error validando cupón:", error);
    }
  };

  const stats = {
    total: coupons.length,
    generated: coupons.filter(c => c.status === "generated").length,
    redeemed: coupons.filter(c => c.status === "redeemed").length,
    expired: coupons.filter(c => c.status === "expired").length,
  };

  if (loading) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  return (
    <main className="bg-[#0c0a0b] min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <Link href="/dashboard/ofertas" className="text-sm font-bold text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Cupones</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Cupones de la oferta</h1>
        {offer && <p className="mt-3 text-white/50">{offer.title}</p>}

        <div className="mt-6">
          <HowItWorks steps={[
            "Cuando un cliente genera un cupón desde tu oferta, aparece acá como \"Generado\".",
            "Cuando venga al local, pedile el código y validalo arriba para marcarlo \"Canjeado\".",
            "Los que nadie usó antes de la fecha límite pasan a \"Vencido\" solos.",
          ]} />
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
        <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
          <h2 className="text-xl font-black">Validar cupón</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={validateCode}
              onChange={(e) => setValidateCode(e.target.value)}
              placeholder="Ej: SLD-ABC123-XYZ789"
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
            />
            <button
              onClick={validateCoupon}
              disabled={!validateCode}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              Validar
            </button>
          </div>
          {validationResult && (
            <div className={`mt-4 rounded-xl p-3 ${
              validationResult.error
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-green-500/10 border border-green-500/30"
            }`}>
              <p className={`text-sm ${validationResult.error ? "text-red-300" : "text-green-300"}`}>
                {validationResult.error || validationResult.message}
              </p>
            </div>
          )}
        </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.125rem] border border-white/[.05] bg-black/20 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="text-3xl font-black" style={{ fontFamily: "var(--font-ticket)" }}>{stats.total}</p>
              <p className="mt-1 text-xs text-white/50">Total</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-green-500/20 bg-green-500/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-green-500/10 bg-black/20 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="text-3xl font-black text-green-400" style={{ fontFamily: "var(--font-ticket)" }}>{stats.generated}</p>
              <p className="mt-1 text-xs text-white/50">Generados</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-sky-500/20 bg-sky-500/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-sky-500/10 bg-black/20 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="text-3xl font-black text-sky-400" style={{ fontFamily: "var(--font-ticket)" }}>{stats.redeemed}</p>
              <p className="mt-1 text-xs text-white/50">Canjeados</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-red-500/10 bg-black/20 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="text-3xl font-black text-red-400" style={{ fontFamily: "var(--font-ticket)" }}>{stats.expired}</p>
              <p className="mt-1 text-xs text-white/50">Vencidos</p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Historial de cupones</h2>
          {coupons.length === 0 ? (
            <div className="mt-4 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <p className="text-white/50">Aún no hay cupones generados para esta oferta</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
                <div className="rounded-[1.125rem] border border-white/[.05] bg-black/20 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono font-bold text-lg">{coupon.code}</p>
                      <p className="text-xs text-white/50 mt-1">
                        Generado: {new Date(coupon.generated_at).toLocaleString("es-AR")}
                      </p>
                      {coupon.redeemed_at && (
                        <p className="text-xs text-green-400 mt-1">
                          Canjeado: {new Date(coupon.redeemed_at).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${
                      coupon.status === "generated"
                        ? "bg-green-500/20 text-green-300"
                        : coupon.status === "redeemed"
                        ? "bg-blue-500/20 text-blue-300"
                        : coupon.status === "expired"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}>
                      {coupon.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
