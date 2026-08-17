"use client";
import { useEffect, useRef, useState } from "react";
import { useAllBusinesses } from "@/lib/use-businesses";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { MapPin, Flame, Store } from "lucide-react";
import Badge from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const CENTRO: [number, number] = [-32.7475, -60.7285];

export default function MapaPage({ initial = [] }: { initial?: any[] }) {
  const negocios = useAllBusinesses();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clusterRef = useRef<any>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radio, setRadio] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, conOfertas: 0 });
  const [mapReady, setMapReady] = useState(false);

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
    <main className="bg-[#0c0a0b] min-h-screen text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-orange-400" />
          <h1 className="text-3xl font-black tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Mapa de San Lorenzo</h1>
        </div>
        <p className="mt-1 text-white/60">Tocá un marcador para ver el negocio</p>

        {/* Stats + filtros */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="success" size="md"><Store className="h-3 w-3" /> {stats.total} negocios</Badge>
          <Badge variant="success" size="md">🟢 {stats.abiertos} abiertos</Badge>
          <Badge variant="warning" size="md"><Flame className="h-3 w-3" /> {stats.conOfertas} con ofertas</Badge>

          <div className="ml-auto flex gap-1.5 rounded-full border border-white/10 bg-white/[.03] p-1">
            {[0.5, 1, 2, 3, 5, 10].map(r => (
              <button key={r} onClick={() => setRadio(radio === r ? null : r)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                  radio === r ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}>
                {r < 1 ? "500 m" : `${r} km`}
              </button>
            ))}
          </div>
        </div>

        {/* Leyenda -- solo lo que realmente se dibuja en el mapa */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/60">
          <span>🟢 Abierto</span>
          <span>🔴 Cerrado</span>
          <span>🔥 Con ofertas</span>
          <span>🏪 Sin ofertas</span>
          {userCoords ? <span className="text-sky-400">● Tu ubicación</span> : <span className="text-white/40">Distancias desde el centro de San Lorenzo</span>}
        </div>

        {/* Mapa -- mismo doble marco que el resto de la plataforma, no un
            iframe pegado sin más. */}
        <div className="relative mt-4 mb-6 rounded-[1.75rem] border border-white/[.08] bg-white/[.03] p-1.5 shadow-2xl shadow-black/30">
          <div className="relative overflow-hidden rounded-[1.375rem] border border-white/[.06]">
            <div ref={mapRef} className="relative z-0 h-[420px] md:h-[520px] w-full" />
            {!mapReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/5">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                  <p className="text-sm text-white/50">Cargando el mapa...</p>
                </div>
              </div>
            )}
            {mapReady && stats.total === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c0a0b]/90 p-6 text-center backdrop-blur-sm">
                <div>
                  <MapPin className="mx-auto h-8 w-8 text-white/30" />
                  <p className="mt-3 font-bold">Todavía no hay negocios con ubicación cargada</p>
                  <p className="mt-1 text-sm text-white/50">Los comercios van a aparecer acá a medida que carguen su ubicación exacta.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
