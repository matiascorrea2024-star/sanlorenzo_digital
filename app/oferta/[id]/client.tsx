"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, MapPin, Share2, MessageCircle, Store, Truck } from "lucide-react";
import Badge from "@/components/ui/badge";
import CountdownTimer from "@/components/ui/countdown-timer";
import CouponButton from "@/components/offers/coupon-button";
import FavoriteButton from "@/components/ui/favorite-button";
import NotifyMeButton from "@/components/offers/notify-me-button";
import { track } from "@/lib/track";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { planDe } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";
import { useLiveViewers } from "@/lib/hooks/use-live-viewers";
import GroupDealPanel from "@/components/offers/group-deal-panel";
import { generarImagenOferta } from "@/lib/share-image";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function OfertaPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToast();
  const offerId = params.id as string;
  const [oferta, setOferta] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canjeados, setCanjeados] = useState(0);
  const [compartiendo, setCompartiendo] = useState(false);
  const { trackViewOffer } = useAnalytics();
  const viendo = useLiveViewers(offerId);

  useEffect(() => {
    (async () => {
      const { data: offer } = await supabase().from("offers").select("*").eq("id", offerId).single();
      if (offer) {
        setOferta(offer);
        trackViewOffer(offer.id, offer.business_id);
        const { data: biz } = await supabase().from("businesses").select("*").eq("id", offer.business_id).single();
        if (biz) setNegocio(biz);
        // Prueba social real: cupones que YA se canjearon para esta oferta
        // (nunca un número inventado -- si nadie canjeó todavía, no se
        // muestra nada, en vez de arrancar en un "0" que se ve peor que
        // no mostrar el bloque).
        const { count } = await supabase().from("coupons")
          .select("*", { count: "exact", head: true })
          .eq("offer_id", offer.id).eq("status", "redeemed");
        setCanjeados(count || 0);
      }
      setLoading(false);
    })();
  }, [offerId]);

  const share = async () => {
    const url = window.location.href;
    const text = `🔥 ${oferta.title}\n💰 ${oferta.offer_price ? fmt(Number(oferta.offer_price)) : "OFERTA"}\n📍 ${negocio?.name || "San Lorenzo"}\n\n#LaGranBarataSanLorenzo`;

    // Preferimos compartir la imagen generada (lista para Instagram Story /
    // WhatsApp Status) cuando el navegador lo permite -- publicidad gratis
    // para el negocio, en un toque. Si no, cae al share de texto de siempre.
    setCompartiendo(true);
    let file: File | null = null;
    try {
      const blob = await generarImagenOferta(oferta, negocio);
      file = new File([blob], "oferta.png", { type: "image/png" });
    } catch {
      file = null; // no se pudo generar la imagen -- seguimos con el texto
    }
    setCompartiendo(false);

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: oferta.title, text });
        if (negocio?.id) track(negocio.id, "share");
        show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
      } catch {
        // Usuario canceló el share de la imagen -- no reintentamos con
        // texto, sería un segundo cartel molesto justo después de cerrar.
      }
      return;
    }

    if (navigator.share) {
      try { await navigator.share({ title: oferta.title, text, url }); } catch { return; }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
    if (negocio?.id) track(negocio.id, "share");
    show("📤 ¡Compartido! +10 pts para tu perfil de vecino", "success");
  };

  if (loading) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    );
  }

  if (!oferta || !negocio) {
    return (
      <main className="bg-[#0c0a0b] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black">Oferta no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const img = oferta.image_url || negocio.portada_url || "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85";
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = oferta.valid_until ? new Date(oferta.valid_until + "T00:00:00") : null;
  const dias = vence ? Math.round((vence.getTime() - hoy.getTime()) / 86400000) : null;
  const vencido = dias !== null && dias < 0;
  const venceHoy = dias === 0;
  const ahorro = oferta.old_price && oferta.offer_price ? Number(oferta.old_price) - Number(oferta.offer_price) : null;

  return (
    <main className="bg-[#0c0a0b] min-h-screen text-white pb-24">
      {/* HERO: foto de PRODUCTO, no de ambiente -- tarjeta centrada con
          proporción fija (estilo ficha de producto de Mercado Libre), no
          un banner de punta a punta. Un banner ancho y bajo recortaba mal
          fotos de celular (verticales o cuadradas) en pantallas grandes:
          con todo el ancho de la ventana y poca altura, terminaba
          mostrando un pedazo irreconocible del producto. */}
      <div className="mx-auto max-w-[480px] px-4 pt-4">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl">
          <Image src={img} alt={oferta.title} fill priority quality={92} sizes="480px" className="object-cover object-center" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c0a0b]/40 via-transparent to-transparent" />
          <button
            onClick={() => router.back()}
            aria-label="Volver"
            className="absolute left-3 top-3 rounded-full bg-black/50 p-2 backdrop-blur-md hover:bg-black/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="absolute right-3 top-3">
            <FavoriteButton itemType="offer" itemId={oferta.id} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {oferta.discount_percent && <Badge variant="danger" size="md">-{oferta.discount_percent}% OFF</Badge>}
          {oferta.precio_prometido && <Badge variant="info" size="md">🔒 Precio Prometido</Badge>}
          {venceHoy && <Badge variant="danger" size="md" pulse>🔥 VENCE HOY</Badge>}
          {dias !== null && dias > 0 && dias <= 3 && <Badge variant="warning" size="md">En {dias} días</Badge>}
          {vencido && <Badge variant="default" size="md">Finalizada</Badge>}
          {/* Cuenta regresiva real siempre que quede poco -- antes solo se
              mostraba el mismo día, perdiendo el "mañana también corre". */}
          {!vencido && dias !== null && dias <= 2 && oferta.valid_until && <CountdownTimer expiresAt={oferta.valid_until} compact />}
        </div>
        <h1 className="text-2xl font-black md:text-4xl">{oferta.title}</h1>
        {oferta.product && <p className="mt-1 text-sm text-white/80 md:text-base">{oferta.product}</p>}
        {/* Prueba social real (nunca inventada): solo aparece si de verdad
            hay canjes -- "0 personas" se ve peor que no decir nada. */}
        {canjeados > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-green-300">
            ✅ {canjeados} {canjeados === 1 ? "persona ya canjeó" : "personas ya canjearon"} esta oferta
          </p>
        )}
        {/* Gente mirando esto AHORA (presencia real) -- solo se muestra con
            actividad real de más de una persona, nunca "1 persona" (sos
            vos) ni un número inventado. */}
        {viendo >= 2 && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-orange-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" /></span>
            👀 {viendo} personas viendo esto ahora
          </p>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {vencido && (
          <div className="mb-6 rounded-2xl border-2 border-white/20 bg-white/5 p-6 text-center">
            <p className="text-2xl">⏰</p>
            <p className="mt-1 text-lg font-black">Esta oferta ya finalizó</p>
            <p className="mt-1 text-sm text-white/60">Mirá el negocio para ver sus ofertas activas.</p>
          </div>
        )}

        {/* Precio en medida normal */}
        <div className="mb-5 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-red-600/10 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {oferta.old_price && <p className="text-base text-white/50 line-through">{fmt(Number(oferta.old_price))}</p>}
              {oferta.offer_price && <p className="text-4xl font-black">{fmt(Number(oferta.offer_price))}</p>}
            </div>
            {ahorro && (
              <div className="rounded-xl bg-green-500/20 px-4 py-2 text-center">
                <p className="text-xs text-green-300">Ahorrás</p>
                <p className="text-xl font-black text-green-300">{fmt(ahorro)}</p>
              </div>
            )}
          </div>
        </div>

        {oferta.es_grupal && oferta.meta_participantes && (
          <GroupDealPanel offerId={oferta.id} metaParticipantes={oferta.meta_participantes} initialActivada={!!oferta.grupal_activada} offerTitle={oferta.title} />
        )}

        {/* Acciones: 3 tarjetas parejas */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {negocio.whatsapp && (
            <a
              href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi la oferta "${oferta.title}" en La Gran Barata Digital`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-green-400/30 bg-green-500/10 p-4 hover:bg-green-500/20"
            >
              <MessageCircle className="h-6 w-6 text-green-400" />
              <span className="text-sm font-bold">Consultar</span>
            </a>
          )}
          <button onClick={share} disabled={compartiendo} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 disabled:opacity-60">
            <Share2 className={`h-6 w-6 text-sky-400 ${compartiendo ? "animate-pulse" : ""}`} />
            <span className="text-sm font-bold">{compartiendo ? "Generando..." : "Compartir"}</span>
          </button>
          <Link href={`/negocio/${negocio.slug}`} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <Store className="h-6 w-6 text-orange-400" />
            <span className="text-sm font-bold">Ver negocio</span>
          </Link>
        </div>

        {/* Cupón: uno solo, protagonista -- herramienta de Plan PRO, no se
            muestra el botón si el negocio no lo tiene habilitado (evita
            ofrecer algo que después falla al tocarlo). */}
        {planDe(negocio).cupones && (
          <div className="mb-5">
            <CouponButton offerId={oferta.id} businessId={negocio.id} offerTitle={oferta.title} />
          </div>
        )}

        <div className="mb-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-red-600/10 p-5 md:flex-row">
          <div>
            <p className="font-black">⏰ ¿Te gusta esta oferta?</p>
            <p className="text-sm text-white/60">Te avisamos si el negocio publica una parecida.</p>
          </div>
          <NotifyMeButton businessId={String(negocio.id)} offerId={String(oferta.id)} productName={oferta.title} originalPrice={oferta.offer_price ? Number(oferta.offer_price) : undefined} />
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">{negocio.name}</h2>
            {negocio.type && negocio.type !== "comercio" && (
              <Badge variant="info" size="sm">
                {negocio.type === "particular" ? "Vendedor particular" : negocio.type === "servicio" ? "Servicio" : "Profesional"}
              </Badge>
            )}
          </div>
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
            {negocio.hace_envios && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-sky-400" />
                <span>
                  {negocio.envio_gratis ? "Envío gratis" : negocio.costo_envio ? `Envío: ${fmt(Number(negocio.costo_envio))}` : "Hace envíos"}
                  {negocio.zona_cobertura && ` · ${negocio.zona_cobertura}`}
                </span>
              </div>
            )}
          </div>
          <Link href={`/negocio/${negocio.slug}`} className="mt-3 inline-block text-sm text-orange-400 hover:text-orange-300">
            Ver perfil completo del negocio →
          </Link>
        </div>

        {oferta.description && (
          <div>
            <h2 className="mb-2 text-lg font-black">Detalles de la oferta</h2>
            <p className="text-sm leading-relaxed text-white/80">{oferta.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}
