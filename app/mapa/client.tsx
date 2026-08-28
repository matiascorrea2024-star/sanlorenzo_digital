"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAllBusinesses } from "@/lib/use-businesses";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { MapPin, Flame, Search, Star } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const CENTRO: [number, number] = [-32.7475, -60.7285];

export default function MapaPage() {
  const negocios = useAllBusinesses();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterRef = useRef<any>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radio, setRadio] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, conOfertas: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [q, setQ] = useState("");

  // Panel "Cerca de vos": mismos negocios reales del mapa, ordenados por
  // distancia -- no es data nueva, es la misma lista con otra vista.
  const cercaDeVos = useMemo(() => {
    const centro = userCoords || { lat: -32.7475, lon: -60.7285 };
    const t = q.trim().toLowerCase();
    return negocios
      .filter((b: any) => b.latitude && b.longitude)
      .filter((b: any) => !t || `${b.name} ${b.category}`.toLowerCase().includes(t))
      .map((b: any) => ({ ...b, _km: calcDistanceKm(centro.lat, centro.lon, Number(b.latitude), Number(b.longitude)) }))
      .filter((b: any) => !radio || b._km <= radio)
      .sort((a: any, b: any) => a._km - b._km)
      .slice(0, 30);
  }, [negocios, userCoords, radio, q]);

  // Geolocalización
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // Stats
  useEffect(() => {
    const conCoords = negocios.filter((b: any) => b.latitude && b.longitude);
    setStats({
      total: conCoords.length,
      abiertos: conCoords.filter((b: any) => b.open).length,
      conOfertas: conCoords.filter((b: any) => (b.promotions?.length || 0) > 0 || (b.ofertas || 0) > 0).length,
    });
  }, [negocios]);

  // Inicializar mapa
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapRef.current || leafletRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, { center: CENTRO, zoom: 14, scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors", maxZoom: 20,
      }).addTo(map);
      leafletRef.current = map;

      // Marcador del usuario
      if (userCoords) {
        L.marker([userCoords.lat, userCoords.lon], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,.8)"></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9],
          }),
        }).addTo(map).bindPopup("📍 Tu ubicación");
        map.setView([userCoords.lat, userCoords.lon], 15);
      }
      setMapReady(true);
    })();
    return () => { cancelled = true; };
  }, [userCoords]);

  // Marcadores de negocios (diferenciados), agrupados por cercanía --
  // con muchos negocios simultáneos, un marker por uno sin agrupar
  // pone pesado el mapa en celulares de gama media. El plugin extiende
  // el propio "leaflet" importado arriba (mismo L, no una copia nueva).
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      // leaflet.markercluster es un plugin UMD viejo que espera un "L"
      // global (window.L) al cargarse, no un import de "leaflet" --
      // usamos require() acá puntualmente porque devuelve el mismo
      // module.exports mutable que el plugin necesita poder extender
      // (un namespace de import() puede quedar congelado y tirar error).
      const Lglobal = require("leaflet");
      (window as any).L = Lglobal;
      await import("leaflet.markercluster");
      const map = leafletRef.current;
      if (!map) return;

      // Limpiar cluster previo (mismo criterio que antes con markersRef,
      // pero ahora las capas viven adentro del grupo, no del mapa).
      if (clusterRef.current) { map.removeLayer(clusterRef.current); }
      const cluster = Lglobal.markerClusterGroup({
        maxClusterRadius: 60,
        iconCreateFunction: (c: any) => Lglobal.divIcon({
          html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f97316,#dc2626);border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,.5);color:white;font-weight:900;font-size:13px">${c.getChildCount()}</div>`,
          className: "", iconSize: [40, 40],
        }),
      });
      clusterRef.current = cluster;
      markersRef.current = [];

      negocios.forEach((b: any) => {
        if (!b.latitude || !b.longitude) return;

        // Filtro por radio (con fallback al centro de San Lorenzo si no hay GPS)
        const centro = userCoords || { lat: -32.7475, lon: -60.7285 };
        if (radio) {
          const km = calcDistanceKm(centro.lat, centro.lon, Number(b.latitude), Number(b.longitude));
          if (km > radio) return;
        }

        const tieneOfertas = (b.promotions?.length || 0) > 0;
        const color = b.open ? "#22c55e" : "#ef4444";
        const emoji = tieneOfertas ? "🔥" : "🏪";

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.5)">
            <span style="transform:rotate(45deg);font-size:16px">${emoji}</span>
          </div>`,
          iconSize: [36, 36], iconAnchor: [18, 34], popupAnchor: [0, -34],
        });

        const centroDist = userCoords || { lat: -32.7475, lon: -60.7285 };
        const kmDist = calcDistanceKm(centroDist.lat, centroDist.lon, Number(b.latitude), Number(b.longitude));
        const dist = `<div style="margin-top:4px;color:#a99b86;font-size:12px">📍 ${fmtDistance(kmDist)} ${userCoords ? "de vos" : "del centro"}</div>`;

        const marker = L.marker([Number(b.latitude), Number(b.longitude)], { icon })
          .bindPopup(`
            <div style="min-width:180px">
              <strong style="font-size:15px;font-weight:900">${b.name}</strong>
              <div style="color:#a99b86;font-size:12px;text-transform:capitalize;margin-top:2px">${b.category}</div>
              <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:12px;color:#fbbf24;font-weight:700">★ ${Number(b.rating || 0).toFixed(1)} <span style="color:#7d6f5c;font-weight:400">(${b.reviews || 0})</span></span>
                <span style="font-size:11px;font-weight:900;color:${b.open ? "#34d399" : "#fb7185"}">${b.open ? "🟢 Abierto" : "🔴 Cerrado"}</span>
              </div>
              ${tieneOfertas ? `<div style="margin-top:4px;font-size:12px;font-weight:900;color:#f97316">🔥 ${b.promotions.length} oferta${b.promotions.length > 1 ? "s" : ""}</div>` : ""}
              ${dist}
              <a href="/negocio/${b.slug}" style="display:inline-block;margin-top:10px;padding:6px 14px;border-radius:9999px;background:linear-gradient(90deg,#f97316,#dc2626);color:white;font-weight:900;font-size:12px;text-decoration:none">Ver negocio →</a>
            </div>
          `);
        markersRef.current.push(marker);
        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
    })();
  }, [negocios, radio, userCoords]);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* IZQUIERDA: mapa protagonista */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>Exploración geográfica</p>
                <h1 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-6xl">
                  Mapa de la <span className="magenta-glow bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">Ciudad</span>
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[0.5, 1, 2, 3, 5, 10].map(r => (
                  <button key={r} onClick={() => setRadio(radio === r ? null : r)}
                    className={`rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                      radio === r
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                    }`} style={{ fontFamily: "var(--font-display)" }}>
                    {r < 1 ? "500 m" : `${r} km`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mapa -- mismo doble marco que el resto de la plataforma. */}
            <div className="relative flex-1 rounded-3xl border border-[var(--line-strong)] bg-[var(--ov-05)] p-2 shadow-2xl shadow-black/50">
              <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-[var(--line)] md:min-h-[560px]">
                <div ref={mapRef} className="relative z-0 h-full min-h-[420px] w-full md:min-h-[560px]" />
                {!mapReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface)]/90 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
                      <p className="text-sm text-[var(--muted)]">Cargando el mapa...</p>
                    </div>
                  </div>
                )}
                {mapReady && stats.total === 0 && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]/90 p-6 text-center backdrop-blur-sm">
                    <div>
                      <MapPin className="mx-auto h-8 w-8 text-[var(--muted2)]" />
                      <p className="mt-3 font-display text-xl uppercase tracking-tight">Todavía no hay negocios con ubicación cargada</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Los comercios van a aparecer acá a medida que carguen su ubicación exacta.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats reales + leyenda */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Negocios</span>
                <span className="font-display text-3xl">{stats.total}</span>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Abiertos ahora</span>
                <span className="font-display text-3xl text-[var(--ok)]">{stats.abiertos}</span>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Con ofertas</span>
                <span className="font-display text-3xl text-[var(--accent-ink)]">{stats.conOfertas}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
              <span>🟢 Abierto</span>
              <span>🔴 Cerrado</span>
              <span>🔥 Con ofertas</span>
              <span>🏪 Sin ofertas</span>
              {userCoords ? <span className="text-[var(--place)]">● Tu ubicación</span> : <span className="text-[var(--muted2)]">Distancias desde el centro de San Lorenzo</span>}
            </div>
          </div>

          {/* DERECHA: panel "cerca de vos" -- mismos negocios del mapa,
              ordenados por distancia, calco del mockup aprobado. */}
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-2xl uppercase tracking-tight">Cerca de vos</h3>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--accent-ink)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué buscás hoy?"
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--card-inner)] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-[var(--muted2)] focus:border-[var(--accent)]" />
            </div>
            <div className="custom-scrollbar flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[760px]">
              {cercaDeVos.length === 0 ? (
                <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
                  {q ? "No encontramos negocios con esa búsqueda." : "No hay negocios con ubicación en este radio todavía."}
                </p>
              ) : cercaDeVos.map((b: any) => {
                const tieneOfertas = (b.promotions?.length || 0) > 0;
                return (
                  <Link key={b.id} href={`/negocio/${b.slug}`}
                    className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card-inner)]">
                        {b.logo_url ? (
                          <Image src={b.logo_url} alt={b.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-[var(--muted2)]">{b.name[0]}</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[9px] font-bold uppercase tracking-widest text-[var(--accent-ink)]">{b.category}</p>
                            <h4 className="truncate text-base font-black leading-tight">{b.name}</h4>
                          </div>
                          {tieneOfertas && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-2 py-0.5 text-[var(--accent-ink)]">
                              <Flame className="h-2.5 w-2.5" /><span className="text-[9px] font-black">HOT</span>
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-[var(--muted)]">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[var(--place)]" /> {fmtDistance(b._km)}</span>
                          {Number(b.reviews) > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {Number(b.rating).toFixed(1)}</span>}
                          <span className={b.open ? "text-[var(--ok)]" : "text-[var(--bad)]"}>{b.open ? "● Abierto" : "● Cerrado"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
