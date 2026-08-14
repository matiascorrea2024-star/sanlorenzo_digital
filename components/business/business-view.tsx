"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track } from "@/lib/track";
import ReviewsSection from "./reviews-section";
import Chat from "./chat";
import FollowButton from "./follow-button";
import LevelBadge from "./level-badge";
import BusinessMap from "@/components/business/map";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1600&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1600&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85";

export default function BusinessView({ b }: { b: any }) {
  useEffect(() => {
    track(String(b.id), "view");
  }, [b.id]);

  if (!b) {
    return (
      <main className="bg-[#0d0a12] text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-black">Negocio no encontrado</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const locationStatus = b.location_source === "manual" && b.location_verified
    ? { color: "bg-green-500/15 border-green-400/40 text-green-300", text: "🟢 Confirmada por el negocio" }
    : b.location_source === "auto" && b.location_verified
    ? { color: "bg-green-500/15 border-green-400/40 text-green-300", text: "🟢 Verificada" }
    : b.location_source === "auto"
    ? { color: "bg-yellow-500/15 border-yellow-400/40 text-yellow-300", text: "🟡 Aproximada" }
    : { color: "bg-red-500/15 border-red-400/40 text-red-300", text: "🔴 No disponible" };

  const portada = b.portada_url || CATEGORY_IMAGES[b.category] || FALLBACK_IMAGE;

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen">
      {/* HERO con portada */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={portada} alt={b.name} className="h-56 w-full object-cover md:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a12] via-[#0d0a12]/50 to-transparent" />
        <div className="relative h-full mx-auto max-w-4xl px-4 flex items-end pb-6">
          <div className="flex items-end gap-4">
            {b.logo_url ? (
              <img src={b.logo_url} alt="logo" className="h-20 w-20 rounded-2xl border-4 border-[#0d0a12] object-cover shadow-2xl" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 border-4 border-[#0d0a12] flex items-center justify-center text-3xl font-black shadow-2xl">
                {b.name[0]}
              </div>
            )}
            <div>
              <Link href="/" className="text-xs text-orange-300 hover:text-orange-200 mb-1 inline-block">← La Gran Barata</Link>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">{b.name}</h1>
              <p className="text-sm capitalize text-white/70">{b.category}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3"><FollowButton businessId={String(b.id)} /><LevelBadge businessId={String(b.id)} verificado={b.status === "verificado"} /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {b.description && (
          <p className="text-white/80 text-lg mb-8 leading-relaxed">{b.description}</p>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Contacto */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-black text-orange-400">📞 Contacto</h2>

            {b.address && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Dirección</p>
                <p className="font-semibold">{b.address}</p>
                <p className="text-sm text-white/60">{b.city}, {b.province}</p>
                <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs ${locationStatus.color}`}>
                  {locationStatus.text}
                </span>
              </div>
            )}

            {b.whatsapp && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">WhatsApp</p>
                <a
                  onClick={() => track(String(b.id), "whatsapp")}
                  href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-green-500 px-4 py-2 text-sm font-black hover:bg-green-600 transition"
                >
                  💬 {b.whatsapp}
                </a>
              </div>
            )}

            {b.instagram && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Instagram</p>
                <a href={`https://instagram.com/${b.instagram}`} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">
                  📸 @{b.instagram}
                </a>
              </div>
            )}

            {b.schedule && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Horarios</p>
                <p className="text-sm text-white/80">{b.schedule}</p>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div>
            {b.latitude && b.longitude ? (
              <>
                <h2 className="text-xl font-black text-orange-400 mb-3">📍 Ubicación</h2>
                <BusinessMap latitude={b.latitude} longitude={b.longitude} address={b.address} />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black hover:opacity-90 transition"
                >
                  🚗 Cómo llegar →
                </a>
                <button
                  onClick={async () => {
                    track(String(b.id), "share");
                    const url = window.location.href;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: b.name, text: `Mirá ${b.name} en La Gran Barata Digital 🛍️`, url });
                      } else {
                        await navigator.clipboard.writeText(url);
                        alert("¡Link copiado! Pegalo donde quieras.");
                      }
                    } catch {}
                  }}
                  className="mt-4 ml-3 inline-block rounded-xl border-2 border-white/30 px-5 py-2.5 text-sm font-black hover:bg-white/10 transition"
                >
                  📤 Compartir
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/50">
                <p className="text-3xl mb-2">🗺️</p>
                <p className="text-sm">Ubicación no disponible todavía</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        {Array.isArray(b.items) && b.items.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-black text-orange-400 mb-4">🛍️ Productos y servicios</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {b.items.map((it: any, i: number) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  {it.photo && <img src={it.photo} alt={it.name} className="h-32 w-full object-cover" />}
                  <div className="p-4">
                    <p className="font-bold">{it.name}</p>
                    {it.price && <p className="mt-1 text-sm text-orange-400 font-black">{it.price}</p>}
                    {it.note && <p className="mt-1 text-xs text-white/60">{it.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Promos activas */}
        {Array.isArray((b as any).promotions) && (b as any).promotions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-black text-orange-400 mb-4">🔥 Promociones activas</h2>
            <div className="grid gap-3">
              {(b as any).promotions
                .filter((p: any) => p.title && (!p.expires || p.expires >= new Date().toISOString().slice(0, 10)))
                .map((p: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-orange-400/40 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{p.title}</p>
                      {p.discount && <p className="text-sm text-orange-400 font-black">{p.discount}</p>}
                    </div>
                    {p.expires && <span className="text-xs text-white/60">Vence {p.expires}</span>}
                  </div>
                ))}
            </div>
          </section>
        )}

        {b.tags && b.tags.length > 0 && (
          <section className="mt-8">
            <div className="flex flex-wrap gap-2">
              {b.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">{tag}</span>
              ))}
            </div>
          </section>
        )}

        {/* 🤳 QR */}
        <ReviewsSection businessId={b.id} />

        <Chat businessId={String(b.id)} ownerId={b.owner_id} businessName={b.name} businessSlug={b.slug} />

        {/* 🤳 QR */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-xl font-black text-orange-400">🤳 Escaneá y guardá este negocio</h2>
          <p className="mt-1 text-sm text-white/60">Con el QR llegás directo a esta miniweb desde cualquier celu.</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("https://sanlorenzodigital.vercel.app/negocio/" + b.slug)}`}
            alt="QR"
            className="mx-auto mt-4 h-40 w-40 rounded-xl bg-white p-2"
          />
        </section>
      </div>
    </main>
  );
}
