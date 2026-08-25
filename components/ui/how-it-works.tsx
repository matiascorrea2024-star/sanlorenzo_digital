import { HelpCircle } from "lucide-react";

/** Plegable "¿Cómo funciona esto?" con pasos 1-2-3 en lenguaje simple.
 * <details> nativo: sin JS, accesible, cerrado por default para no
 * amontonar la pantalla. */
export default function HowItWorks({ title = "¿Cómo funciona esto?", steps }: { title?: string; steps: string[] }) {
  return (
    <details className="group mb-4 rounded-2xl border border-white/5 bg-[#161314] transition-colors open:border-[var(--accent)]/25">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 p-5 text-xs font-black uppercase tracking-widest text-[#f7f3ec]/85 marker:content-none" style={{ fontFamily: "var(--font-display)" }}>
        <HelpCircle className="h-4 w-4 shrink-0 text-[var(--accent)]" />
        {title}
        <span className="ml-auto text-[#7d6f5c] transition group-open:rotate-180">⌄</span>
      </summary>
      <ol className="space-y-2 border-t border-white/5 px-5 py-4 pl-11 text-sm leading-relaxed text-[#c4b5a5]">
        {steps.map((s, i) => (
          <li key={i} className="list-decimal marker:font-black marker:text-[var(--accent)]">{s}</li>
        ))}
      </ol>
    </details>
  );
}
