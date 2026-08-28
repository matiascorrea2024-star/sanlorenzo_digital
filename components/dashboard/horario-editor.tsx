"use client";
// Editor de horarios por día: abierto/cerrado + hasta 2 rangos por día
// (turno partido 8-13 y 17-21). Escribe schedule_json (fuente de verdad
// para "Abierto ahora") y el texto schedule se autocompleta en el form.
import { Rango, HorarioSemanal } from "@/lib/horarios";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// Índice visual (Lun primero) → clave real (0=domingo)
const CLAVE_POR_FILA = ["1", "2", "3", "4", "5", "6", "0"];

export default function HorarioEditor({ value, onChange }: {
  value: HorarioSemanal | null;
  onChange: (next: HorarioSemanal | null) => void;
}) {
  const horario: HorarioSemanal = value || {};

  const rangosDe = (clave: string): Rango[] => horario[clave] || [];

  const setDia = (clave: string, rangos: Rango[]) => {
    const next: HorarioSemanal = { ...horario, [clave]: rangos };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {DIAS.map((dia, fila) => {
        const clave = CLAVE_POR_FILA[fila];
        const rangos = rangosDe(clave);
        const abierto = rangos.length > 0;
        return (
          <div key={clave} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--ov-02)] px-3 py-2">
            <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={abierto}
                onChange={(e) => setDia(clave, e.target.checked ? [["09:00", "13:00"], ["17:00", "21:00"]] : [])}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {dia}
            </label>
            {abierto ? (
              <>
                {rangos.map(([desde, hasta], i) => (
                  <span key={i} className="flex items-center gap-1">
                    <input
                      type="time"
                      value={desde}
                      onChange={(e) => {
                        const next = rangos.map((r, j): Rango => (j === i ? [e.target.value || "00:00", r[1]] : r));
                        setDia(clave, next);
                      }}
                      className="rounded-lg border border-[var(--line)] bg-[var(--ov-05)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                      aria-label={`${dia} abre a las`}
                    />
                    <span className="text-xs text-[var(--muted)]">a</span>
                    <input
                      type="time"
                      value={hasta}
                      onChange={(e) => {
                        const next = rangos.map((r, j): Rango => (j === i ? [r[0], e.target.value || "00:00"] : r));
                        setDia(clave, next);
                      }}
                      className="rounded-lg border border-[var(--line)] bg-[var(--ov-05)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                      aria-label={`${dia} cierra a las`}
                    />
                    {rangos.length < 2 && (
                      <button
                        type="button"
                        onClick={() => setDia(clave, [...rangos, ["17:00", "21:00"]] as Rango[])}
                        className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs font-bold text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                        title="Agregar segundo turno"
                      >
                        + turno
                      </button>
                    )}
                  </span>
                ))}
                {rangos.length === 2 && (
                  <button
                    type="button"
                    onClick={() => setDia(clave, [rangos[0]])}
                    className="text-xs font-bold text-[var(--muted)] underline hover:text-[var(--accent-ink)]"
                  >
                    un solo turno
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted2)]">Cerrado</span>
            )}
          </div>
        );
      })}
      <p className="text-xs text-[var(--muted2)]">
        Con esto el badge “Abierto ahora” se calcula solo, en horario argentino. Ya no tenés que avisar manualmente.
      </p>
    </div>
  );
}
