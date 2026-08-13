"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  name: string;
  price?: number;
  children: React.ReactNode;
};

export default function UnlockGate({
  slug,
  name,
  price = 1999,
  children,
}: Props) {
  const key = `sld-premium-${slug}`;
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(key) === "1");
    } finally {
      setLoading(false);
    }
  }, [key]);

  function unlockDemo() {
    localStorage.setItem(key, "1");
    setUnlocked(true);
  }

  if (loading) {
    return (
      <div className="sld-premium-loading">
        Cargando ficha...
      </div>
    );
  }

  if (unlocked) {
    return (
      <div>
        <div className="sld-unlocked-banner">
          ✓ Ficha desbloqueada
        </div>
        {children}
      </div>
    );
  }

  return (
    <section className="sld-paywall">
      <div className="sld-paywall-glow" />

      <div className="sld-paywall-card">
        <span className="sld-paywall-icon">🔓</span>

        <span className="sld-paywall-kicker">
          FICHA PREMIUM
        </span>

        <h2>Desbloqueá {name}</h2>

        <p>
          Accedé a la ficha completa del comercio: contacto,
          ubicación, horarios, promociones, productos y toda
          la información disponible.
        </p>

        <div className="sld-paywall-price">
          <small>Desbloqueo de prueba</small>
          <strong>${price.toLocaleString("es-AR")}</strong>
        </div>

        <button
          type="button"
          onClick={unlockDemo}
          className="sld-paywall-button"
        >
          Desbloquear ficha →
        </button>

        <small className="sld-paywall-note">
          MODO DEMO · No se realiza ningún cobro real.
        </small>
      </div>
    </section>
  );
}
