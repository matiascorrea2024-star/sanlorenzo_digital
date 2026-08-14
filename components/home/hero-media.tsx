"use client";
import { useEffect, useState } from "react";

// Muestra el video /hero.mp4 si existe en public/; sino el banner imagen.
export default function HeroMedia() {
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    fetch("/hero.mp4", { method: "HEAD" })
      .then(r => setHasVideo(r.ok))
      .catch(() => setHasVideo(false));
  }, []);

  if (hasVideo) {
    return (
      <video
        src="/hero.mp4"
        poster="/banner.png"
        autoPlay
        muted
        loop
        playsInline
        className="hero-media block h-auto w-full"
        aria-label="La Gran Barata Digital: ofertas y negocios de San Lorenzo"
      />
    );
  }

  return (
    <img
      src="/banner.png"
      alt="La Gran Barata Digital: ofertas y negocios de San Lorenzo"
      className="hero-media block h-auto w-full kenburns"
      loading="eager"
    />
  );
}
