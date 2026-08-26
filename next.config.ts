import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  // 'unsafe-inline' en script-src es REQUERIDO: el App Router de Next 16
  // hidrata y streamea el RSC payload con <script> inline en cada página.
  // Sin esto, la web queda colgada en el loading (confirmado en local).
  // La alternativa estricta (nonce por request vía proxy) obliga a render
  // dinámico total -- se evalúa más adelante, no ahora.
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.vercel.app https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data:",
  "connect-src 'self' https: wss: https://www.google-analytics.com",
  "frame-src 'self' https://checkout.mercadopago.com https://*.livekit.cloud",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Next 16 bloquea requests con Origin fuera de la allowlist para assets
  // internos (/_next/*): sin esto, entrar por 127.0.0.1 o por la IP de LAN
  // (p.ej. probando desde el celular) deja la página en spinner eterno.
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.local"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), microphone=(self), camera=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
