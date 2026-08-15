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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-space)" }}>
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
