import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (resets cada 60s)
// Para producción usar Redis, pero esto sirve para MVP
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function getRateLimitHeader(request: NextRequest): string {
  // Intentar obtener IP real (Vercel/proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0].trim() || "unknown") as string;
  return ip;
}

export function checkRateLimit(
  ip: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const key = ip;
  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  record.count++;
  return { ok: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
