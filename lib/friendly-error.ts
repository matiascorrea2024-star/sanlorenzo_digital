// Traduce errores técnicos (Postgres/Supabase/fetch) a mensajes que un
// usuario puede entender. Nunca se muestra un mensaje crudo por defecto
// -- section 24 del brief de diseño: "nunca Error, undefined, 500,
// Failed to fetch". Para casos puntuales conocidos (código de Postgres,
// mensaje de Supabase Auth) se da una respuesta específica; para todo
// lo demás, un mensaje genérico honesto.

const AUTH_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "Email not confirmed": "Todavía no confirmaste tu email. Revisá tu bandeja de entrada.",
  "User already registered": "Ya existe una cuenta con ese email.",
};

export function friendlyError(err: unknown, fallback = "No se pudo completar la acción. Probá de nuevo."): string {
  if (!err || typeof err !== "object") return fallback;
  const e = err as { code?: string; message?: string };

  if (e.code === "23505") return "Ya existe un registro igual a este.";
  if ((e.message || "").includes("MENSAJE_INAPROPIADO")) return "Ese mensaje tiene lenguaje que no permitimos acá. Reformulalo, por favor.";
  if ((e.message || "").includes("CHAT_MUY_SEGUIDO")) return "Vas muy rápido -- esperá unos segundos antes de mandar otro mensaje.";
  if ((e.message || "").includes("LIMITE_NEGOCIOS_GRATIS")) return "Ya tenés un negocio en plan gratis. Para sumar otro, mejorá alguno de tus negocios actuales a un plan pago.";
  if ((e.message || "").includes("offers_meta_participantes_check")) return "El cupo de una oferta grupal tiene que ser entre 2 y 500 personas.";
  if (e.code === "42501" || (e.message || "").toLowerCase().includes("row-level security")) {
    return "No tenés permiso para hacer esta acción.";
  }
  if (e.message && AUTH_MESSAGES[e.message]) return AUTH_MESSAGES[e.message];
  if ((e.message || "").toLowerCase().includes("failed to fetch") || (e.message || "").toLowerCase().includes("network")) {
    return "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.";
  }
  return fallback;
}
