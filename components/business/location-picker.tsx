"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  address: string;
  latitude: string;
  longitude: string;
  onChange: (location: {
    latitude: string;
    longitude: string;
  }) => void;
}

const DEFAULT_CENTER: [number, number] = [-32.7475, -60.7285];

export default function LocationPicker({
  address,
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = await import("leaflet");

      // FIX CLÁSICO DE LEAFLET + NEXT.JS
      // Configuramos el icono por defecto usando URLs externas (siempre funcionan)
      // PIN NARANJA PERSONALIZADO (SVG inline, siempre visible)
      const OrangeIcon = L.divIcon({
        className: "",
        html: `<svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 28 16 28s16-16 16-28C32 7.2 24.8 0 16 0z" fill="#f97316" stroke="#fff" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="#fff"/>
        </svg>`,
        iconSize: [32, 44],
        iconAnchor: [16, 44],
        popupAnchor: [0, -44],
      });
      L.Marker.prototype.options.icon = OrangeIcon;

      if (cancelled || !mapRef.current) return;

      const lat = Number(latitude);
      const lng = Number(longitude);

      const hasCoordinates =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;

      const center: [number, number] = hasCoordinates
        ? [lat, lng]
        : DEFAULT_CENTER;

      const map = L.map(mapRef.current, {
        center,
        zoom: hasCoordinates ? 18 : 14,
        scrollWheelZoom: true,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 20,
        }
      ).addTo(map);

      leafletMapRef.current = map;

      // Si hay coordenadas, poner el marker
      if (hasCoordinates) {
        markerRef.current = L.marker(center).addTo(map);
      } else {
        // Si NO hay coordenadas, poner un marker en el centro (San Lorenzo)
        // para que el usuario vea el mapa y pueda hacer click
        markerRef.current = L.marker(DEFAULT_CENTER).addTo(map);
      }

      map.on("click", (event: any) => {
        const clickedLat = event.latlng.lat;
        const clickedLng = event.latlng.lng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickedLat, clickedLng]);
        } else {
          markerRef.current = L.marker([clickedLat, clickedLng]).addTo(map);
        }

        onChange({
          latitude: clickedLat.toFixed(7),
          longitude: clickedLng.toFixed(7),
        });

        setMessage("📍 Ubicación seleccionada manualmente");
      });
    }

    initMap();

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return;
    }

    const position: [number, number] = [lat, lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      import("leaflet").then((L) => {
        if (!leafletMapRef.current) return;
        markerRef.current = L.marker(position).addTo(leafletMapRef.current);
      });
    }

    map.setView(position, Math.max(map.getZoom(), 17));
  }, [latitude, longitude]);

  async function buscarDireccion() {
    const cleanAddress = address.trim();

    if (!cleanAddress) {
      setMessage("⚠️ Primero escribí una dirección.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const query = cleanAddress.toLowerCase().includes("san lorenzo")
        ? cleanAddress
        : `${cleanAddress}, San Lorenzo, Santa Fe, Argentina`;

      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "1",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo consultar el mapa.");
      }

      const results = await response.json();

      if (!results.length) {
        setMessage(
          "❌ No encontramos esa dirección. Podés hacer clic directamente sobre el mapa."
        );
        return;
      }

      const result = results[0];

      const lat = Number(result.lat);
      const lng = Number(result.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Coordenadas inválidas.");
      }

      onChange({
        latitude: lat.toFixed(7),
        longitude: lng.toFixed(7),
      });

      const map = leafletMapRef.current;

      if (map) {
        const position: [number, number] = [lat, lng];

        if (markerRef.current) {
          markerRef.current.setLatLng(position);
        } else {
          const L = await import("leaflet");
          markerRef.current = L.marker(position).addTo(map);
        }

        map.setView(position, 18);
      }

      setMessage("✅ Dirección encontrada. Revisá que el pin esté exactamente donde corresponde.");
    } catch (error) {
      console.error(error);
      setMessage(
        "❌ No pudimos buscar la dirección. Podés colocar el pin manualmente haciendo clic en el mapa."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-4">
      <div>
        <p className="text-sm font-bold">📍 Ubicación del negocio</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Buscá la dirección o hacé clic directamente en el mapa para colocar el pin donde está tu negocio.
        </p>
      </div>

      <button
        type="button"
        onClick={buscarDireccion}
        disabled={loading}
        className="w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
      >
        {loading ? "🔎 Buscando..." : "🔎 Buscar dirección en el mapa"}
      </button>

      <div
        ref={mapRef}
        className="h-80 w-full overflow-hidden rounded-xl border border-[var(--line)]"
        style={{ minHeight: "320px" }}
      />

      {latitude && longitude ? (
        <div className="rounded-xl bg-green-500/10 border border-green-400/30 p-3 text-xs">
          <p className="font-bold text-[var(--ok)]">📌 Ubicación seleccionada</p>
          <p className="mt-1 text-[var(--muted)]">
            Lat: {latitude} · Lng: {longitude}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--ov-05)] p-3 text-xs text-[var(--muted)]">
          Todavía no seleccionaste ubicación. Hacé clic en el mapa o buscá la dirección.
        </div>
      )}

      {message && (
        <p className="text-xs text-[var(--text)]/70">{message}</p>
      )}
    </div>
  );
}
