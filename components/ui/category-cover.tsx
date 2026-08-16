import { CATEGORIES } from "@/lib/data";

// Portada de respaldo cuando el negocio todavía no subió una foto real.
// Antes esto era una misma foto de stock de Unsplash por rubro -- dos
// restaurantes sin foto se veían con la ficha idéntica, lo cual lee como
// "esto es falso" mucho más que un gradiente honesto. Cada negocio saca
// un degradé distinto (hash de su propio id/slug) + el ícono de su rubro,
// sin depender de una URL externa que puede romperse.
const GRADIENTS = [
  "from-orange-600 via-red-600 to-pink-600",
  "from-pink-600 via-fuchsia-600 to-purple-600",
  "from-cyan-600 via-sky-600 to-blue-600",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-amber-500 via-orange-600 to-red-600",
  "from-violet-600 via-purple-600 to-fuchsia-600",
  "from-rose-600 via-pink-600 to-orange-600",
  "from-blue-600 via-indigo-600 to-violet-600",
];

const CAT_ICON: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]));

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export default function CategoryCover({ category, seed, className = "" }: {
  category?: string;
  /** Algo estable y propio del negocio (id o slug) para que el degradé
   * no se repita entre negocios del mismo rubro. */
  seed: string;
  className?: string;
}) {
  const grad = GRADIENTS[hash(seed) % GRADIENTS.length];
  const icon = (category && CAT_ICON[category]) || "🏪";
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${grad} ${className}`}>
      <div className="absolute inset-0 opacity-[.15]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <span className="relative text-5xl" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,.4))" }}>{icon}</span>
    </div>
  );
}
