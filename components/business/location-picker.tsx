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

      if (hasCoordinates) {
        markerRef.current = L.marker(center).addTo(map);
      }

      map.on("click", (event: any) => {
        const clickedLat = event.latlng.lat;
        const clickedLng = event.latlng.lng;

        if (markerRef.current) {
          markerRef.current.setLatLng([clickedLat, clickedLng]);
        } else {
          markerRef.current = L.marker([
            clickedLat,
            clickedLng,
          ]).addTo(map);
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

        markerRef.current = L.marker(position).addTo(
          leafletMapRef.current
        );
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
    <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div>
        <p className="text-sm font-semibold">
          📍 Ubicación del negocio
        </p>

        <p className="mt-1 text-xs text-[var(--muted)]">
          Buscá la dirección o hacé clic directamente en el mapa para
          colocar el pin exactamente donde está tu negocio.
        </p>
      </div>

      <button
        type="button"
        onClick={buscarDireccion}
        disabled={loading}
        className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
      >
        {loading ? "🔎 Buscando..." : "🔎 Buscar dirección en el mapa"}
      </button>

      <div
        ref={mapRef}
        className="h-80 w-full overflow-hidden rounded-lg border border-[var(--line)]"
        style={{ minHeight: "320px" }}
      />

      {latitude && longitude ? (
        <div className="rounded-lg bg-[var(--surface2)] p-3 text-xs">
          <p className="font-semibold">
            📌 Ubicación seleccionada
          </p>

          <p className="mt-1 text-[var(--muted)]">
            Latitud: {latitude}
          </p>

          <p className="text-[var(--muted)]">
            Longitud: {longitude}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Todavía no hay una ubicación seleccionada.
        </p>
      )}

      {message && (
        <p className="text-xs text-[var(--muted)]">
          {message}
        </p>
      )}
    </div>
  );
}
