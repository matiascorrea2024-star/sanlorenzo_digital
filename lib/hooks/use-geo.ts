"use client";
import { useEffect, useState } from "react";

export function useGeoLocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const request = () => {
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  useEffect(() => { request(); }, []);
  return { coords, error, loading, request };
}
