"use client";
import { useState } from "react";
import { Ticket, Copy, Check, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import Badge from "@/components/ui/badge";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CouponButton({ offerId, businessId, offerTitle }: {
  offerId: string;
  businessId: string;
  offerTitle: string;
}) {
  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { trackCouponGenerated } = useAnalytics();

  const generate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const code = generateCode();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 días de validez

    const { data, error } = await supabase().from("coupons").insert({
      business_id: businessId,
      offer_id: offerId,
      user_id: user.id,
      code,
      qr_data: `SLD-COUPON:${code}:${offerId}:${businessId}`,
      expires_at: expires.toISOString(),
    }).select().single();

    if (data && !error) {
      setCoupon(data);
      await trackCouponGenerated(offerId, businessId);
    }
    setLoading(false);
  };

  const copyCode = async () => {
    if (!coupon) return;
    await navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!coupon) {
    return (
      <button onClick={generate} disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50 transition">
        <Ticket className="h-4 w-4" />
        {loading ? "Generando..." : "Obtener cupón"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-green-400/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="success" size="sm">
          <Ticket className="h-3 w-3" /> Cupón generado
        </Badge>
      </div>
      
      <p className="text-xs text-white/60 mb-2">Para: {offerTitle}</p>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-center">
          <p className="text-2xl font-black tracking-wider">{coupon.code}</p>
        </div>
        <button onClick={copyCode}
          className="rounded-xl bg-white/10 border border-white/20 p-3 hover:bg-white/20 transition">
          {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>⏰ Válido por 7 días</span>
        <span className="flex items-center gap-1">
          <QrCode className="h-3 w-3" /> Mostrá este código en el negocio
        </span>
      </div>
    </div>
  );
}
