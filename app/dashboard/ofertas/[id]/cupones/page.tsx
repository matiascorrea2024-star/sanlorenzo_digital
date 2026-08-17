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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <h1 className="text-3xl font-black mb-2">Cupones de la Oferta</h1>
        {offer && <p className="text-white/60 mb-4">{offer.title}</p>}

        <HowItWorks steps={[
          "Cuando un cliente genera un cupón desde tu oferta, aparece acá como \"Generado\".",
          "Cuando venga al local, pedile el código y validalo arriba para marcarlo \"Canjeado\".",
          "Los que nadie usó antes de la fecha límite pasan a \"Vencido\" solos.",
        ]} />

        <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-6 mb-8">
          <h2 className="text-xl font-black mb-4">Validar Cupón</h2>
          <div className="flex gap-3">
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
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-3xl font-black">{stats.total}</p>
            <p className="text-xs text-white/60 mt-1">Total</p>
          </div>
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-3xl font-black text-green-400">{stats.generated}</p>
            <p className="text-xs text-white/60 mt-1">Generados</p>
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
            <p className="text-3xl font-black text-blue-400">{stats.redeemed}</p>
            <p className="text-xs text-white/60 mt-1">Canjeados</p>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-3xl font-black text-red-400">{stats.expired}</p>
            <p className="text-xs text-white/60 mt-1">Vencidos</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black mb-4">Historial de Cupones</h2>
          {coupons.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-white/60">Aún no hay cupones generados para esta oferta</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-lg">{coupon.code}</p>
                      <p className="text-xs text-white/60 mt-1">
                        Generado: {new Date(coupon.generated_at).toLocaleString("es-AR")}
                      </p>
                      {coupon.redeemed_at && (
                        <p className="text-xs text-green-400 mt-1">
                          Canjeado: {new Date(coupon.redeemed_at).toLocaleString("es-AR")}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-lg px-3 py-1 text-xs font-bold ${
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
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
