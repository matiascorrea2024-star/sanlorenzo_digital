import { HelpCircle } from "lucide-react";

/** Plegable "¿Cómo funciona esto?" con pasos 1-2-3 en lenguaje simple.
 * <details> nativo: sin JS, accesible, cerrado por default para no
 * amontonar la pantalla. */
export default function HowItWorks({ title = "¿Cómo funciona esto?", steps }: { title?: string; steps: string[] }) {
  return (
    <details className="group mb-4 rounded-2xl border border-[var(--line)] bg-[var(--ov-03)] open:bg-[var(--ov-05)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-bold text-[var(--text)]/80 marker:content-none">
        <HelpCircle className="h-4 w-4 shrink-0 text-orange-400" />
        {title}
        <span className="ml-auto text-[var(--muted2)] transition group-open:rotate-180">⌄</span>
      </summary>
      <ol className="space-y-2 px-4 pb-4 pl-10 text-sm text-[var(--muted)]">
        {steps.map((s, i) => (
          <li key={i} className="list-decimal">{s}</li>
        ))}
      </ol>
    </details>
  );
}
