"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, MapPin, Share2, Heart, MessageCircle, Store } from "lucide-react";
import Badge from "@/components/ui/badge";
import CountdownTimer from "@/components/ui/countdown-timer";
import CouponButton from "@/components/offers/coupon-button";
import FavoriteButton from "@/components/ui/favorite-button";
import NotifyMeButton from "@/components/offers/notify-me-button";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function OfertaPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const [oferta, setOferta] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: offer } = await supabase()
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offer) {
        setOferta(offer);
        const { data: biz } = await supabase()
          .from("businesses")
          .select("*")
          .eq("id", offer.business_id)
          .single();
        if (biz) setNegocio(biz);
      }
      setLoading(false);
    })();
  }, [offerId]);

  const share = async () => {
    const url = window.location.href;
    const text = `🔥 ${oferta.title}\n💰 ${oferta.offer_price ? fmt(oferta.offer_price) : "OFERTA"}\n📍 ${negocio?.name || "San Lorenzo"}`;
    if (navigator.share) {
      try { await navigator.share({ title: oferta.title, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("¡Link copiado!");
    }
  };

  if (loading) {
    return <main className="bg-[#0a0710] min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></main>;
  }

  if (!oferta || !negocio) {
    return (
      <main className="bg-[#0a0710] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black">Oferta no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const img = oferta.image_url || negocio.portada_url || "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85";
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const vence = oferta.valid_until ? new Date(oferta.valid_until + "T00:00:00") : null;
  const dias = vence ? Math.round((vence.getTime() - hoy.getTime()) / 86400000) : null;
  const vencido = dias !== null && dias < 0;
  const venceHoy = dias === 0;
  const ahorro = oferta.old_price && oferta.offer_price ? Number(oferta.old_price) - Number(oferta.offer_price) : null;

  return (
    <main className="bg-[#0a0710] min-h-screen text-white pb-24">
      <section className="relative h-80 md:h-96">
        <img src={img} alt={oferta.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0710] via-[#0a0710]/60 to-transparent" />
        <button onClick={() => router.back()} className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur-md hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex gap-2 mb-3">
              {oferta.discount_percent && <Badge variant="danger" size="md">-{oferta.discount_percent}% OFF</Badge>}
              {venceHoy && <Badge variant="danger" size="md" pulse>🔥 VENCE HOY</Badge>}
              {dias !== null && dias > 0 && dias <= 3 && <Badge variant="warning" size="md">En {dias} días</Badge>}
              {vencido && <Badge variant="default" size="md">Finalizada</Badge>}
            </div>
            <h1 className="text-3xl font-black md:text-5xl">{oferta.title}</h1>
            {oferta.product && <p className="mt-2 text-lg text-white/80">{oferta.product}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {vencido && (
          <div className="mb-6 rounded-2xl border-2 border-white/20 bg-white/5 p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 text-lg font-black">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-white/60">
              Mirá el negocio para ver sus ofertas activas.
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-6 mb-6">
          <div className="flex items-end justify-between">
            <div>
              {oferta.old_price && <p className="text-lg text-white/50 line-through">{fmt(Number(oferta.old_price))}</p>}
              {oferta.offer_price && <p className="text-5xl font-black">{fmt(Number(oferta.offer_price))}</p>}
            </div>
            {ahorro && (
              <div className="rounded-xl bg-green-500/20 px-4 py-2 text-center">
                <p className="text-xs text-green-300">Ahorrás</p>
                <p className="text-2xl font-black text-green-300">{fmt(ahorro)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {negocio.whatsapp && (
            <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en San Lorenzo Digital`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 p-4 hover:bg-green-500/20">
              <MessageCircle className="h-6 w-6 text-green-400" />
              <span className="text-sm font-bold">Consultar</span>
            </a>
          )}
          <button onClick={share} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <Share2 className="h-6 w-6 text-sky-400" />
            <span className="text-sm font-bold">Compartir</span>
          </button>
          <FavoriteButton itemType="offer" itemId={oferta.id} />
          <div className="col-span-2 md:col-span-4">
            <CouponButton offerId={oferta.id} businessId={negocio.id} offerTitle={oferta.title} />
          </div>
          <Link href={`/negocio/${negocio.slug}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <Store className="h-6 w-6 text-orange-400" />
            <span className="text-sm font-bold">Ver negocio</span>
          </Link>
        </div>

        <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-5 md:flex-row">
          <div>
            <p className="font-black">⏰ ¿Te gusta esta oferta?</p>
            <p className="text-sm text-white/60">Te avisamos si el negocio publica una parecida.</p>
          </div>
          <NotifyMeButton businessId={String(negocio.id)} offerId={String(oferta.id)} productName={oferta.title} originalPrice={oferta.offer_price ? Number(oferta.offer_price) : undefined} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-xl font-black mb-4">📍 {negocio.name}</h2>
          <div className="space-y-2 text-sm">
            {negocio.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                <span>{negocio.address}</span>
              </div>
            )}
            {negocio.schedule && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <span>{negocio.schedule}</span>
              </div>
            )}
          </div>
          <div className="col-span-2 md:col-span-4">
            <CouponButton offerId={oferta.id} businessId={negocio.id} offerTitle={oferta.title} />
          </div>
          <Link href={`/negocio/${negocio.slug}`} className="mt-4 inline-block text-sm text-orange-400 hover:text-orange-300">
            Ver perfil completo del negocio →
          </Link>
        </div>

        {oferta.description && (
          <div className="mb-6">
            <h2 className="text-xl font-black mb-3">Detalles de la oferta</h2>
            <p className="text-white/80 leading-relaxed">{oferta.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}
