// "Hoy" en la fecha real de Argentina (America/Argentina/Buenos_Aires,
// UTC-3), no en UTC. new Date().toISOString().slice(0,10) da la fecha en
// UTC -- Vercel corre en UTC y el celular de un usuario puede estar en
// cualquier huso, así que entre las 21:00 y las 23:59 hora argentina,
// UTC ya cruzó la medianoche y esa expresión devuelve el día de MAÑANA.
// Efecto real: una oferta que vence hoy desaparecía de "ofertas activas"
// y del Radar tres horas antes de vencer de verdad, todos los días.
export function fechaArgentina(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function hoyArgentina(): string {
  return fechaArgentina(new Date());
}

// Para timestamps completos (created_at, etc.): ¿cae "hoy" en fecha de
// Argentina? Distinto del caso anterior -- ahí comparábamos contra una
// columna `date` (valid_until); acá hay que convertir el timestamp
// mismo a fecha de Argentina antes de comparar, no alcanza con
// recalcular "hoy" -- si no, un mensaje de las 22hs ART (01hs UTC del
// día siguiente) se comparaba contra el "hoy" de un lado y el "hoy" del
// otro con reglas distintas y podía no coincidir en ningún sentido.
export function esHoyArgentina(iso: string): boolean {
  return fechaArgentina(new Date(iso)) === hoyArgentina();
}

// Para filtros server-side tipo .gte("created_at", x) contra una columna
// timestamptz: acá no alcanza con un string "YYYY-MM-DD" (Postgres lo
// interpreta como medianoche UTC, no medianoche Argentina). Devuelve el
// instante real de la medianoche de HOY en Argentina, como ISO timestamp.
export function inicioDeHoyArgentinaISO(): string {
  // Argentina no tiene horario de verano desde 2009 -- offset fijo -03:00.
  return `${hoyArgentina()}T00:00:00-03:00`;
}
