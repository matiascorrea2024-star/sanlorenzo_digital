"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import HowItWorks from "@/components/ui/how-it-works";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function CuponesPage() {
  const params = useParams();
  const offerId = params.id as string;
  const [coupons, setCoupons] = useState<any[]>([]);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validateCode, setValidateCode] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const { show } = useToast();

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
      show(`❌ ${friendlyError(error, "No pudimos cargar los cupones. Probá de nuevo.")}`, "error");
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
      setValidationResult({ error: friendlyError(error, "No se pudo validar el cupón. Probá de nuevo.") });
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
      <main className="bg-[var(--bg)] min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--muted)] text-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        Cargando cupones…
      </main>
    );
  }

  return (
    <main className="bg-[var(--bg)] min-h-screen text-[var(--text)]">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <Link href="/dashboard/ofertas" className="text-sm font-bold text-[var(--accent-ink)] hover:opacity-80 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent-ink)]">Cupones</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Cupones de la oferta</h1>
        {offer && <p className="mt-3 text-[var(--muted)]">{offer.title}</p>}

        <div className="mt-6">
          <HowItWorks steps={[
            "Cuando un cliente genera un cupón desde tu oferta, aparece acá como \"Generado\".",
            "Cuando venga al local, pedile el código y validalo arriba para marcarlo \"Canjeado\".",
            "Los que nadie usó antes de la fecha límite pasan a \"Vencido\" solos.",
          ]} />
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <h2 className="text-xl font-black">Validar cupón</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={validateCode}
              onChange={(e) => setValidateCode(e.target.value)}
              placeholder="Ej: SLD-ABC123-XYZ789"
              className="flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={validateCoupon}
              disabled={!validateCode}
              className="rounded-full bg-[var(--accent)] px-6 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              Validar
            </button>
          </div>
          {validationResult && (
            <div className={`mt-4 rounded-xl p-3 ${
              validationResult.error
                ? "bg-[var(--bad)]/10 border border-[var(--bad)]/30"
                : "bg-[var(--ok)]/10 border border-[var(--ok)]/30"
            }`}>
              <p className={`text-sm ${validationResult.error ? "text-[var(--bad)]" : "text-[var(--ok)]"}`}>
                {validationResult.error || validationResult.message}
              </p>
            </div>
          )}
        </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.125rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black" style={{ fontFamily: "var(--font-ticket)" }}>{stats.total}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Total</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--ok)]/20 bg-[var(--ok)]/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-[var(--ok)]/10 bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black text-[var(--ok)]" style={{ fontFamily: "var(--font-ticket)" }}>{stats.generated}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Generados</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--place)]/20 bg-[var(--place)]/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-[var(--place)]/10 bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black text-[var(--place)]" style={{ fontFamily: "var(--font-ticket)" }}>{stats.redeemed}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Canjeados</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--bad)]/20 bg-[var(--bad)]/[.04] p-1.5">
            <div className="rounded-[1.125rem] border border-[var(--bad)]/10 bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black text-[var(--bad)]" style={{ fontFamily: "var(--font-ticket)" }}>{stats.expired}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Vencidos</p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Historial de cupones</h2>
          {coupons.length === 0 ? (
            <div className="mt-4 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <p className="text-[var(--muted)]">Aún no hay cupones generados para esta oferta</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="rounded-[1.125rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono font-bold text-lg">{coupon.code}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Generado: {new Date(coupon.generated_at).toLocaleString("es-AR")}
                      </p>
                      {coupon.redeemed_at && (
                        <p className="text-xs text-[var(--ok)] mt-1">
                          Canjeado: {new Date(coupon.redeemed_at).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${
                      coupon.status === "generated"
                        ? "bg-[var(--ok)]/20 text-[var(--ok)]"
                        : coupon.status === "redeemed"
                        ? "bg-[var(--place)]/20 text-[var(--place)]"
                        : coupon.status === "expired"
                        ? "bg-[var(--bad)]/20 text-[var(--bad)]"
                        : "bg-[var(--muted)]/20 text-[var(--muted)]"
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
