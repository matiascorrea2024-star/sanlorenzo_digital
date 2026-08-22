"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import HowItWorks from "@/components/ui/how-it-works";

export default function MarketingPage() {
  const params = useParams();
  const offerId = params.id as string;
  const [offer, setOffer] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [trackedUrls, setTrackedUrls] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      const { data: offerData } = await supabase()
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerData) {
        setOffer(offerData);

        const { data: businessData } = await supabase()
          .from("businesses")
          .select("*")
          .eq("id", offerData.business_id)
          .single();

        if (businessData) {
          setBusiness(businessData);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [offerId]);

  useEffect(() => {
    if (!offer?.id || !business?.id) return;
    const origin = window.location.origin;
    (async () => {
      const entries = await Promise.all(["instagram", "whatsapp", "qr"].map(async (source) => {
        try {
          const response = await fetch("/api/tracked-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business_id: business.id, offer_id: offer.id, source }),
          });
          const data = await response.json();
          return [source, response.ok && data.short_url ? data.short_url : `${origin}/oferta/${offer.id}?source=${source}`] as const;
        } catch {
          return [source, `${origin}/oferta/${offer.id}?source=${source}`] as const;
        }
      }));
      setTrackedUrls(Object.fromEntries(entries));
    })();
  }, [offer?.id, business?.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const generateStoryText = () => {
    if (!offer || !business) return "";
    return `🔥 ¡NUEVA OFERTA EN ${business.name.toUpperCase()}! 🔥\n\n` +
           `${offer.title}\n` +
           (offer.discount_percent ? `🏷️ ${offer.discount_percent}% OFF\n` : "") +
           (offer.old_price && offer.offer_price 
             ? `💰 Antes: $${offer.old_price.toLocaleString()} → Ahora: $${offer.offer_price.toLocaleString()}\n` 
             : "") +
           `\n📍 Encontranos en San Lorenzo Digital\n` +
           `👇 Mirá la oferta completa acá:\n` +
           `https://sanlorenzodigital.vercel.app/negocio/${business.slug}`;
  };

  const generateWhatsAppText = () => {
    if (!offer || !business) return "";
    return `Hola! Vi tu oferta en San Lorenzo Digital: "${offer.title}" ` +
           (offer.discount_percent ? `(${offer.discount_percent}% OFF) ` : "") +
           `¿Sigue disponible?`;
  };

  if (loading) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  if (!offer || !business) {
    return (
      <main className="bg-[var(--bg)] min-h-screen flex items-center justify-center text-[var(--text)]">
        <p>Oferta no encontrada</p>
      </main>
    );
  }

  const offerUrl = `https://sanlorenzodigital.vercel.app/oferta/${offer.id}`;
  const igUrl = trackedUrls.instagram || offerUrl;
  const waUrl = trackedUrls.whatsapp || offerUrl;
  const qrUrl = trackedUrls.qr || offerUrl;

  return (
    <main className="bg-[var(--bg)] min-h-screen text-[var(--text)]">
      <div className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <Link href="/dashboard/ofertas" className="text-sm font-bold text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Marketing</p>
        <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Marketing de la oferta</h1>
        <p className="mt-3 text-[var(--muted)]">{offer.title}</p>
        <div className="mt-4 rounded-2xl border border-orange-400/25 bg-orange-500/[.06] p-4 text-sm text-[var(--muted)]">
          <strong className="text-[var(--text)]">Compartir estos links es gratis.</strong> “Impulsar oferta” es una
          promoción paga aparte y hoy se activa manualmente desde administración; no se simula ningún cobro.
          El checkout autoservicio de impulso queda pendiente de una orden/precio con RLS y conciliación propios.
        </div>

        <div className="mt-6">
          <HowItWorks steps={[
            "Cada link es igual a tu oferta, pero distinto según dónde lo compartas.",
            "Así sabés si te llegan más clientes por Instagram o por WhatsApp.",
            "Copiá el texto de la story o del mensaje y pegalo directo, sin editar nada.",
          ]} />
        </div>

        <div className="mt-6 space-y-6">
        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-space)" }}>Links trackeables</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Cada link tiene un código propio y registra clics, sin inventar conversiones.
          </p>

          <div className="mt-4 space-y-3">
            {[
              { label: "Instagram", url: igUrl, icon: "📸" },
              { label: "WhatsApp", url: waUrl, icon: "💬" },
              { label: "QR / Otros", url: qrUrl, icon: "📱" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--ov-05)] p-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{item.url}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.url, item.label)}
                  className="shrink-0 rounded-xl border border-[var(--line-strong)] px-4 py-2 text-sm hover:bg-[var(--ov-05)]"
                >
                  {copied === item.label ? "✅ Copiado" : "📋 Copiar"}
                </button>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-space)" }}>Story para Instagram</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Copiá este texto y pegalo en tu historia de Instagram
          </p>
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-black/30 p-4 font-mono text-sm">
            {generateStoryText()}
          </div>
          <button
            onClick={() => copyToClipboard(generateStoryText(), "story")}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 font-black text-white hover:opacity-90"
          >
            {copied === "story" ? "✅ Copiado" : "📋 Copiar story"}
          </button>
        </div>
        </div>

        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-space)" }}>Compartir en WhatsApp</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Texto listo para enviar a tus clientes
          </p>
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-black/30 p-4 font-mono text-sm">
            {generateWhatsAppText()}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => copyToClipboard(generateWhatsAppText(), "whatsapp")}
              className="flex-1 rounded-full border border-[var(--line-strong)] px-6 py-3 font-bold hover:bg-[var(--ov-05)]"
            >
              {copied === "whatsapp" ? "✅ Copiado" : "📋 Copiar texto"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(generateWhatsAppText() + "\n\n" + waUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-green-500 px-6 py-3 text-center font-black text-white hover:bg-green-600"
            >
              💬 Abrir WhatsApp
            </a>
          </div>
        </div>
        </div>
        </div>
      </div>
    </main>
  );
}
