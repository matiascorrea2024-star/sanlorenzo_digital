// JSON.stringify no escapa "</script>" -- si un campo de usuario (nombre,
// descripción de negocio/oferta) contiene ese string, corta el <script>
// y permite inyectar JS arbitrario para cualquier visitante de la ficha.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
