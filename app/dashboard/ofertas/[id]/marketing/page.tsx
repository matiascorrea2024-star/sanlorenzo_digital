"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MarketingPage() {
  const params = useParams();
  const offerId = params.id as string;
  const [offer, setOffer] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

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
      <main className="bg-[#120d09] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  if (!offer || !business) {
    return (
      <main className="bg-[#120d09] min-h-screen flex items-center justify-center text-white">
        <p>Oferta no encontrada</p>
      </main>
    );
  }

  const offerUrl = `https://sanlorenzodigital.vercel.app/negocio/${business.slug}`;
  const igUrl = `${offerUrl}?source=instagram`;
  const waUrl = `${offerUrl}?source=whatsapp`;
  const qrUrl = `${offerUrl}?source=qr`;

  return (
    <main className="bg-[#120d09] min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/dashboard/ofertas" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← Volver a mis ofertas
        </Link>

        <h1 className="text-3xl font-black mb-2">Marketing de la Oferta</h1>
        <p className="text-white/60 mb-8">{offer.title}</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-xl font-black mb-4">Links Trackeables</h2>
          <p className="text-sm text-white/60 mb-4">
            Usá estos links para saber desde dónde vienen tus clientes
          </p>
          
          <div className="space-y-3">
            {[
              { label: "Instagram", url: igUrl, icon: "📸" },
              { label: "WhatsApp", url: waUrl, icon: "💬" },
              { label: "QR / Otros", url: qrUrl, icon: "📱" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs text-white/50 truncate">{item.url}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(item.url, item.label)}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
                >
                  {copied === item.label ? "✅ Copiado" : "📋 Copiar"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-xl font-black mb-4">Story para Instagram</h2>
          <p className="text-sm text-white/60 mb-4">
            Copiá este texto y pegalo en tu historia de Instagram
          </p>
          <div className="rounded-xl bg-black/30 p-4 font-mono text-sm whitespace-pre-wrap mb-4">
            {generateStoryText()}
          </div>
          <button
            onClick={() => copyToClipboard(generateStoryText(), "story")}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-black text-white hover:opacity-90"
          >
            {copied === "story" ? "✅ Copiado" : "📋 Copiar Story"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black mb-4">Compartir en WhatsApp</h2>
          <p className="text-sm text-white/60 mb-4">
            Texto listo para enviar a tus clientes
          </p>
          <div className="rounded-xl bg-black/30 p-4 font-mono text-sm whitespace-pre-wrap mb-4">
            {generateWhatsAppText()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(generateWhatsAppText(), "whatsapp")}
              className="flex-1 rounded-xl border border-white/20 px-6 py-3 font-bold hover:bg-white/5"
            >
              {copied === "whatsapp" ? "✅ Copiado" : "📋 Copiar Texto"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(generateWhatsAppText() + "\n\n" + waUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-green-500 px-6 py-3 font-black text-white hover:bg-green-600 text-center"
            >
              💬 Abrir WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
