"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { getFavorites } from "@/lib/favorites";
import { getMiBarata } from "@/lib/mi-barata";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { Route, LocateFixed, Navigation, ArrowRight, MessageCircle, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

const CENTRO: [number, number] = [-32.7475, -60.7285];
const ACCENT = "#e00d0f";

type Stop = {
  id: string;
  name: string;
  slug: string;
  category: string;
  portada_url: string | null;
  whatsapp: string | null;
  lat: number;
  lon: number;
};

type OrderedStop = Stop & { leg: number | null };

export default function RecorridoClient() {
  const { user, loading: authLoading } = useAuth();
  const fuente = useSearchParams().get("fuente");
  const [stops, setStops] = useState<Stop[] | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    if (!user) {
      setStops(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const byId = new Map<string, Stop>();
      const addBiz = (b: any) => {
        if (!b || byId.has(b.id)) return;
        const lat = Number(b.latitude);
        const lon = Number(b.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        byId.set(b.id, {
          id: b.id,
          name: b.name,
          slug: b.slug,
          category: b.category || "",
          portada_url: b.portada_url || null,
          whatsapp: b.whatsapp || null,
          lat,
          lon,
        });
      };
      if (fuente === "barata") {
        // Modo "armá la vuelta": los negocios de Mi Barata, no los favoritos.
        const barata = await getMiBarata(user.id);
        const slugs = Array.from(new Set(barata.map((i) => i.slug).filter(Boolean)));
        if (slugs.length) {
          const { data } = await supabase()
            .from("businesses")
            .select("id, name, slug, category, portada_url, whatsapp, latitude, longitude")
            .in("slug", slugs);
          (data || []).forEach(addBiz);
        }
      } else {
        const favs = await getFavorites(user.id);
        if (favs.businesses.length) {
          const { data } = await supabase()
            .from("businesses")
            .select("id, name, slug, category, portada_url, whatsapp, latitude, longitude")
            .in("id", favs.businesses);
          (data || []).forEach(addBiz);
        }
        if (favs.offers.length) {
          const { data } = await supabase()
            .from("offers")
            .select("businesses!inner(id, name, slug, category, portada_url, whatsapp, latitude, longitude)")
            .in("id", favs.offers);
          (data || []).forEach((o: any) => addBiz(o.businesses));
        }
      }
      if (!cancelled) setStops(Array.from(byId.values()));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, fuente]);

  // Vecino más cercano desde la ubicación del usuario. Sin ubicación,
  // la lista queda en el orden en que se guardaron los favoritos.
  const ordered = useMemo<OrderedStop[] | null>(() => {
    if (!stops) return null;
    if (!coords) return stops.map((s) => ({ ...s, leg: null }));
    const remaining = [...stops];
    let cur = coords;
    const out: OrderedStop[] = [];
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((s, i) => {
        const d = calcDistanceKm(cur.lat, cur.lon, s.lat, s.lon);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      const [next] = remaining.splice(bestIdx, 1);
      out.push({ ...next, leg: bestDist });
      cur = { lat: next.lat, lon: next.lon };
    }
    return out;
  }, [stops, coords]);

  const totalKm = ordered?.reduce((acc, s) => acc + (s.leg ?? 0), 0) ?? 0;
  const conOrden = !!coords && !!ordered?.length;

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoError(false);
        setGeoLocating(false);
      },
      () => {
        setGeoError(true);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-ink)]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0a0b] to-transparent" />
          <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <Route className="mx-auto h-14 w-14 text-[var(--accent-ink)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
            <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">Mi recorrido</h1>
            <p className="mt-3 text-base text-[var(--muted)]">Armá el camino más corto entre tus negocios y ofertas favoritas.</p>
            <Link
              href="/login"
              className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ingresá para armar tu recorrido
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const mapCenter: [number, number] = coords
    ? [coords.lat, coords.lon]
    : stops && stops.length > 0
      ? [
          stops.reduce((a, s) => a + s.lat, 0) / stops.length,
          stops.reduce((a, s) => a + s.lon, 0) / stops.length,
        ]
      : CENTRO;

  const linePositions: [number, number][] = [
    ...(coords ? ([[coords.lat, coords.lon]] as [number, number][]) : []),
    ...((ordered || []).map((s) => [s.lat, s.lon]) as [number, number][]),
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <style>{`
        .stop-num { background: transparent; border: 0; box-shadow: none; color: #fff; font-weight: 900; font-size: 11px; padding: 0; font-family: var(--font-display); }
        .stop-num::before { display: none; }
      `}</style>

      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0a0b] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6">
          <Route className="h-10 w-10 text-[var(--accent-ink)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            {fuente === "barata" ? "Tu barata, ordenada" : "Hoy salgo a comprar"}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-6xl">
            Mi <span className="magenta-glow bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">recorrido</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-[var(--muted)]">
            {fuente === "barata"
              ? "Los negocios de tu barata, ordenados para levantar todas las ofertas en el menor tiempo."
              : "Tus favoritos ordenados para recorrerlos en el menor tiempo posible."}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={usarMiUbicacion}
              disabled={geoLocating}
              className="btn-hard inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-55"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <LocateFixed className="h-4 w-4" />
              {geoLocating ? "Buscando…" : coords ? "✓ Ubicación lista" : "Usar mi ubicación"}
            </button>
            {ordered && ordered.length > 0 && (
              <>
                <span className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
                  {ordered.length} parada{ordered.length !== 1 ? "s" : ""}
                </span>
                {conOrden && (
                  <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                    Total · {fmtDistance(totalKm)}
                  </span>
                )}
              </>
            )}
          </div>
          {geoError && (
            <p className="mt-4 max-w-xl rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200/90">
              Sin tu ubicación no puedo ordenar el recorrido — te muestro la lista sin orden.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {stops === null ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-[2rem] border border-[var(--line)] bg-[var(--ov-05)]" />
            ))}
          </div>
        ) : stops.length === 0 ? (
          <div className="mt-4 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
            <Route className="mx-auto h-16 w-16 text-[var(--muted2)]" />
            <h2 className="mt-4 font-display text-2xl uppercase tracking-tight sm:text-3xl">Nada para recorrer todavía</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Ninguno de tus favoritos guardados tiene ubicación cargada en el mapa. Guardá negocios u ofertas con ubicación y volvé para armar tu recorrido.
            </p>
            <Link
              href="/favoritos"
              className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ver mis favoritos
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_460px]">
            <div className="flex flex-col gap-4">
              {!conOrden && !geoError && (
                <p className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted)]">
                  Tocá <span className="font-bold text-[var(--text)]">“Usar mi ubicación”</span> para ordenar las paradas del punto más cercano al más lejano.
                </p>
              )}

              <ol className="flex flex-col gap-3">
                {(ordered || []).map((s, i) => (
                  <li key={s.id}>
                    <div className="group rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] sm:p-5">
                      <div className="flex items-start gap-4">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-black text-white"
                          style={{ background: ACCENT }}
                        >
                          {i + 1}
                        </span>
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-inner)]">
                          {s.portada_url ? (
                            <Image src={s.portada_url} alt={s.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-display text-2xl text-[var(--muted2)]">{s.name[0]}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[9px] font-black uppercase tracking-widest text-[var(--accent-ink)]">{s.category}</p>
                          <h3 className="truncate font-display text-lg uppercase leading-tight">{s.name}</h3>
                          {s.leg !== null && (
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                              <Navigation className="h-3 w-3 text-[var(--place)]" />
                              {fmtDistance(s.leg)} desde {i === 0 ? "tu ubicación" : "la parada anterior"}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Link
                              href={`/negocio/${s.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] font-black uppercase tracking-widest transition hover:border-[var(--accent)] hover:text-white"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              Ver negocio <ArrowRight className="h-3 w-3" />
                            </Link>
                            {s.whatsapp && (
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://wa.me/${String(s.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${s.name} en La Gran Barata Digital`)}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-400 transition hover:bg-green-500/25"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {conOrden && (
                <div className="flex items-center justify-between rounded-[2rem] border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-6 py-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                    Total del recorrido
                  </span>
                  <span className="font-display text-3xl">{fmtDistance(totalKm)}</span>
                </div>
              )}
            </div>

            <div className="self-start lg:sticky lg:top-24">
              <div className="relative rounded-3xl border border-[var(--line-strong)] bg-[var(--ov-05)] p-2 shadow-2xl shadow-black/50">
                <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-[var(--line)] md:min-h-[560px]">
                  <MapContainer
                    key={`${coords ? `${coords.lat.toFixed(5)},${coords.lon.toFixed(5)}` : "sin-gps"}-${stops.length}`}
                    center={mapCenter}
                    zoom={14}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Polyline positions={linePositions} pathOptions={{ color: ACCENT, weight: 3, opacity: 0.9, dashArray: "8 10" }} />

                    {coords && (
                      <CircleMarker center={[coords.lat, coords.lon]} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#3b82f6", fillOpacity: 1 }}>
                        <Popup>📍 Tu ubicación</Popup>
                      </CircleMarker>
                    )}

                    {(ordered || []).map((s, i) => (
                      <CircleMarker key={s.id} center={[s.lat, s.lon]} radius={14} pathOptions={{ color: "#ffffff", weight: 2, fillColor: ACCENT, fillOpacity: 1 }}>
                        <Tooltip permanent direction="center" className="stop-num">
                          {i + 1}
                        </Tooltip>
                        <Popup>
                          <div style={{ minWidth: 170 }}>
                            <strong style={{ fontSize: 15, fontWeight: 900 }}>{s.name}</strong>
                            <div style={{ marginTop: 2, fontSize: 12, color: "#a99b86", textTransform: "capitalize" }}>{s.category}</div>
                            {s.leg !== null && (
                              <div style={{ marginTop: 4, fontSize: 12, color: "#a99b86" }}>
                                🧭 {fmtDistance(s.leg)} desde {i === 0 ? "tu ubicación" : "la parada anterior"}
                              </div>
                            )}
                            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <a href={`/negocio/${s.slug}`} style={{ display: "inline-block", padding: "6px 14px", borderRadius: 9999, background: ACCENT, color: "#fff", fontWeight: 900, fontSize: 12, textDecoration: "none" }}>
                                Ver negocio →
                              </a>
                              {s.whatsapp && (
                                <a
                                  href={`https://wa.me/${String(s.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${s.name} en La Gran Barata Digital`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "inline-block", padding: "6px 14px", borderRadius: 9999, background: "#22c55e", color: "#fff", fontWeight: 900, fontSize: 12, textDecoration: "none" }}
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </div>
              <p className="mt-3 px-2 text-xs text-[var(--muted2)]">
                {coords ? "Ruta ordenada por vecino más cercano desde tu ubicación." : "Tocá “Usar mi ubicación” para trazar la ruta óptima."}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
