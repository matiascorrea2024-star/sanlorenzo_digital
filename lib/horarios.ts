// Horarios estructurados de negocios. Fuente de verdad: schedule_json en
// businesses (ver migración 20260826130000). El "open" booleano manual
// queda como fallback para comercios que todavía no cargaron horarios.
export type Rango = [string, string]; // ["08:00", "13:30"]
export type HorarioSemanal = Record<string, Rango[]>; // clave "0"-"6", 0 = domingo

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function esHorarioValido(h: unknown): h is HorarioSemanal {
  if (!h || typeof h !== "object") return false;
  return Object.values(h as Record<string, unknown>).every(
    (rangos) => Array.isArray(rangos) && rangos.every(
      (r) => Array.isArray(r) && r.length === 2 && typeof r[0] === "string" && typeof r[1] === "string"
    )
  );
}

function minutosDe(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Día de la semana (0=domingo) y minutos del día en Argentina. */
export function ahoraArgentina(): { dia: number; minutos: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hora = Number(partes.hour === "24" ? "0" : partes.hour);
  return { dia: dias[partes.weekday] ?? 0, minutos: hora * 60 + Number(partes.minute) };
}

/**
 * ¿Está abierto AHORA según su horario cargado?
 * - true/false si hay horario estructurado
 * - null si no hay datos → el consumidor cae al booleano manual `open`
 */
export function estaAbiertoAhora(horario: unknown): boolean | null {
  if (!esHorarioValido(horario)) return null;
  const { dia, minutos } = ahoraArgentina();
  const rangosHoy = horario[String(dia)] || [];
  if (rangosHoy.length === 0) {
    // Cerrado hoy, pero un turno nocturno puede haber arrancado ayer
    // (ej: bar abierto hasta 2am): chequear el rango de anoche.
    const ayer = horario[String((dia + 6) % 7)] || [];
    return ayer.some(([desde, hasta]) => minutosDe(hasta) <= minutosDe(desde) && minutos < minutosDe(hasta));
  }
  return rangosHoy.some(([desde, hasta]) => {
    const d = minutosDe(desde);
    const h = minutosDe(hasta);
    return h > d ? minutos >= d && minutos < h : minutos >= d || minutos < h; // turno que cruza medianoche
  });
}

/** Texto humano a partir del horario estructurado (para el campo schedule
 * legado, JSON-LD y lectura directa). "" si no hay nada cargado. */
export function formatearHorario(horario: unknown): string {
  if (!esHorarioValido(horario)) return "";
  const bloques: string[] = [];
  for (let d = 0; d < 7; d++) {
    const rangos = horario[String(d)] || [];
    if (rangos.length === 0) continue;
    const horarioDia = rangos.map(([a, b]) => `${a.replace(":00", "")} a ${b.replace(":00", "")}`).join(" y ");
    bloques.push(`${DIAS_CORTOS[d]} ${horarioDia}`);
  }
  return bloques.join(" · ");
}

/** Días cerrados, para mostrar "Cerrado los lunes" sin vueltas. */
export function diasCerrados(horario: unknown): string[] {
  if (!esHorarioValido(horario)) return [];
  const cerrados: string[] = [];
  for (let d = 0; d < 7; d++) {
    if ((horario[String(d)] || []).length === 0) cerrados.push(DIAS_CORTOS[d]);
  }
  return cerrados;
}
