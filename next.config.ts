import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  // 'unsafe-inline' en script-src es REQUERIDO: el App Router de Next 16
  // hidrata y streamea el RSC payload con <script> inline en cada página.
  // Sin esto, la web queda colgada en el loading (confirmado en local).
  // La alternativa estricta (nonce por request vía proxy) obliga a render
  // dinámico total -- se evalúa más adelante, no ahora.
  // 'unsafe-eval' SOLO en dev: Turbopack/React usan eval() para
  // reconstruir stack traces y para Fast Refresh -- sin esto, el
  // navegador bloquea eval(), React tira errores internos y el HMR
  // termina forzando reloads que cancelan fetches en curso a mitad
  // de carga (confirmado: se veian pedidos reales a Supabase
  // abortados con net::ERR_ABORTED en CADA pagina). En produccion
  // no se necesita y no se agrega -- ahi no hay eval() de por medio.
  `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://*.vercel.app https://www.googletagmanager.com https://www.google-analytics.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data:",
  // En dev, permitir el Supabase local (otro puerto => no es 'self').
  `connect-src 'self' https: wss: https://www.google-analytics.com${process.env.NODE_ENV === "development" ? " http://127.0.0.1:54321 ws://127.0.0.1:54321" : ""}`,
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
