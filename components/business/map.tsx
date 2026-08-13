"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface BusinessMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  businessName?: string;
  className?: string;
}

export default function BusinessMap({
  latitude,
  longitude,
  address,
  businessName = "Negocio",
  className = "",
}: BusinessMapProps) {
  const [markerIcon, setMarkerIcon] = useState<DivIcon | null>(null);

  const validCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled) return;

      const icon = L.divIcon({
        className: "business-map-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            background: #8B5CF6;
            border: 3px solid #ffffff;
            box-shadow: 0 3px 12px rgba(0,0,0,0.45);
            transform: rotate(-45deg);
            box-sizing: border-box;
          ">
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #ffffff;
              position: absolute;
              top: 9px;
              left: 9px;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      setMarkerIcon(icon);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!validCoordinates) {
    return (
      <div
        className={`rounded-lg bg-surface-2 border border-border p-8 text-center ${className}`}
      >
        <p className="text-text-2">📍 Ubicación no disponible</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-64 rounded-lg overflow-hidden border border-border ${className}`}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={19}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerIcon && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{businessName}</strong>
              <br />
              {address || "Dirección confirmada"}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
