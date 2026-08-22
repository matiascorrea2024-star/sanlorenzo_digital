/**
 * Sanitización de inputs para prevenir XSS y otras vulnerabilidades
 */

export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";

  return (
    String(input)
      // Remover caracteres nulos
      .replace(/\x00/g, "")
      // Remover etiquetas HTML/scripts
      .replace(/<[^>]*>/g, "")
      // Codificar caracteres especiales que podrían ser usados en ataques
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      // Limitar longitud
      .substring(0, 500)
      .trim()
  );
}

export function sanitizeSearchQuery(q: string | null | undefined): string {
  if (!q) return "";

  const sanitized = sanitizeInput(q);

  // Para búsquedas, remover caracteres especiales de regex
  return sanitized
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .trim();
}

export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return "";

  const sanitized = sanitizeInput(email);
  // Validar formato básico de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return "";
  }
  return sanitized.toLowerCase();
}

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    // Intentar parsear como URL
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Solo permitir protocolos seguros
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    // Si no es URL válida, retornar string vacío
    return "";
  }
}

export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return "";

  return String(filename)
    // Remover path traversal
    .replace(/\.\./g, "")
    .replace(/\\/g, "")
    .replace(/\//g, "")
    // Remover caracteres especiales
    .replace(/[<>:"|?*\x00-\x1F]/g, "")
    // Limitar longitud
    .substring(0, 255)
    .trim();
}

export function sanitizeJSON(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null;

  if (typeof obj === "string") return sanitizeInput(obj);
  if (typeof obj === "number") return obj;
  if (typeof obj === "boolean") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeJSON(item));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeJSON(value);
    }
    return sanitized;
  }

  return null;
}
