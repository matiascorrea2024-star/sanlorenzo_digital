"use client";
import { useEffect, useRef, useState } from "react";
import { useAllBusinesses } from "@/lib/use-businesses";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { MapPin, Flame, Store } from "lucide-react";
import Badge from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

const CENTRO: [number, number] = [-32.7475, -60.7285];

export default function MapaPage({ initial = [] }: { initial?: any[] }) {
  const negocios = useAllBusinesses();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
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

  // Marcadores de negocios (diferenciados)
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      const map = leafletRef.current;
      if (!map) return;

      // Limpiar marcadores previos
      markersRef.current.forEach(m => m.remove());
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
        const dist = `<br/><span style="color:#666;font-size:12px">📍 ${fmtDistance(kmDist)} ${userCoords ? "de vos" : "del centro"}</span>`;

        const marker = L.marker([Number(b.latitude), Number(b.longitude)], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:170px">
              <strong style="font-size:14px">${b.name}</strong><br/>
              <span style="color:#666;font-size:12px;text-transform:capitalize">${b.category}</span><br/>
              <span style="font-size:12px">⭐ ${Number(b.rating || 0).toFixed(1)} (${b.reviews || 0})</span><br/>
              <span style="color:${b.open ? "#16a34a" : "#dc2626"};font-size:12px;font-weight:bold">${b.open ? "🟢 Abierto ahora" : "🔴 Cerrado"}</span>
              ${tieneOfertas ? `<br/><span style="color:#f97316;font-size:12px;font-weight:bold">🔥 ${b.promotions.length} oferta${b.promotions.length > 1 ? "s" : ""}</span>` : ""}
              ${dist}
              <br/><a href="/negocio/${b.slug}" style="color:#f97316;font-weight:bold;font-size:13px;text-decoration:none">Ver negocio →</a>
            </div>
          `);
        markersRef.current.push(marker);
      });
    })();
  }, [negocios, radio, userCoords]);

  return (
    <main className="bg-[#120d09] min-h-screen text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-orange-400" />
          <h1 className="text-3xl font-black">Mapa de San Lorenzo</h1>
        </div>
        <p className="mt-1 text-white/60">Tocá un marcador para ver el negocio</p>

        {/* Stats + filtros */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="success" size="md"><Store className="h-3 w-3" /> {stats.total} negocios</Badge>
          <Badge variant="success" size="md">🟢 {stats.abiertos} abiertos</Badge>
          <Badge variant="warning" size="md"><Flame className="h-3 w-3" /> {stats.conOfertas} con ofertas</Badge>

          <div className="ml-auto flex gap-1.5">
            {[0.5, 1, 2, 3, 5, 10].map(r => (
              <button key={r} onClick={() => setRadio(radio === r ? null : r)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  radio === r ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" : "border border-white/15 bg-white/5 text-white/70"
                }`}>
                📍 {r < 1 ? "500 m" : `${r} km`}
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

        {/* Mapa */}
        <div className="relative mt-4 mb-6">
          <div ref={mapRef} className="relative z-0 h-[380px] md:h-[440px] w-full overflow-hidden rounded-2xl border border-white/10" />
          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                <p className="text-sm text-white/50">Cargando el mapa...</p>
              </div>
            </div>
          )}
          {mapReady && stats.total === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border border-white/10 bg-[#120d09]/90 p-6 text-center backdrop-blur-sm">
              <div>
                <MapPin className="mx-auto h-8 w-8 text-white/30" />
                <p className="mt-3 font-bold">Todavía no hay negocios con ubicación cargada</p>
                <p className="mt-1 text-sm text-white/50">Los comercios van a aparecer acá a medida que carguen su ubicación exacta.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
