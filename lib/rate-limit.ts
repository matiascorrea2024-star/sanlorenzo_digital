import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiter con soporte para múltiples límites
const requestCounts = new Map<
  string,
  {
    count: number;
    resetAt: number;
    failedAttempts?: number;
    failedResetAt?: number;
  }
>();

// Configuración de límites
export const RATE_LIMITS = {
  API_PUBLIC: { maxRequests: 30, windowSeconds: 60 },
  API_AUTH: { maxRequests: 100, windowSeconds: 60 },
  LOGIN_ATTEMPTS: { maxRequests: 10, windowSeconds: 900 }, // 15 min
};

export function getRateLimitHeader(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0].trim() || "unknown") as string;
  return ip;
}

export function checkRateLimit(
  ip: string,
  maxRequests: number = 30,
  windowSeconds: number = 60,
  type: "standard" | "login" = "standard"
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const key = type === "login" ? `login_${ip}` : ip;
  const record = requestCounts.get(key);

  // Usar campo 'failedAttempts' para login, 'count' para requests normales
  const countField = type === "login" ? "failedAttempts" : "count";
  const currentCount = record?.[countField as keyof typeof record] || 0;
  const resetAt = type === "login" ? record?.failedResetAt : record?.resetAt;

  if (!record || !resetAt || now > resetAt) {
    const newRecord = {
      count: type === "login" ? 0 : 1,
      resetAt: type === "login" ? now + windowSeconds * 1000 : now + windowSeconds * 1000,
      failedAttempts: type === "login" ? 1 : 0,
      failedResetAt: type === "login" ? now + windowSeconds * 1000 : undefined,
    };
    requestCounts.set(key, newRecord);
    return {
      ok: true,
      remaining: maxRequests - (type === "login" ? 1 : 1),
      retryAfter: 0,
    };
  }

  if (currentCount >= maxRequests) {
    const retryAfter = Math.ceil(((resetAt as number) - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  if (type === "login") {
    record.failedAttempts = (record.failedAttempts || 0) + 1;
  } else {
    record.count++;
  }

  const remaining = maxRequests - (currentCount + 1);
  return { ok: true, remaining, retryAfter: 0 };
}

export function trackFailedLogin(ip: string): {
  ok: boolean;
  remaining: number;
  retryAfter: number;
} {
  return checkRateLimit(ip, RATE_LIMITS.LOGIN_ATTEMPTS.maxRequests, RATE_LIMITS.LOGIN_ATTEMPTS.windowSeconds, "login");
}

export function resetLoginAttempts(ip: string): void {
  const key = `login_${ip}`;
  requestCounts.delete(key);
}

export function rateLimitResponse(
  retryAfter: number,
  limit: number = 5,
  remaining: number = 0
) {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + retryAfter),
      },
    }
  );
}
