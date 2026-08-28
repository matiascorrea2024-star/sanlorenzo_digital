// Título de sección canónico -- mismas clases en toda la Home (y
// reutilizable en el resto del sitio) en vez de que cada sección
// invente su propia combinación de tamaños/pesos/tracking.
export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.35em] text-[var(--accent-ink)]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
