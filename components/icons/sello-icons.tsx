// Sistema de íconos propios "Sellos de Vecindario" -- reemplaza el
// ThumbsUp/ThumbsDown/MessageSquare/Share2 genéricos de lucide-react en
// los componentes de votación, interés y compartir. Nada de esto depende
// de una librería de íconos externa: son paths SVG propios.
//
// - SelloIcon / SelloDudaIcon: reemplazan ThumbsUp/ThumbsDown en
//   OpinionVote e InterestButton. Un sello de aprobación real, inclinado
//   como si lo hubieran estampado a mano.
// - NotaIcon: reemplaza MessageSquare. Una hoja con la esquina doblada,
//   como la nota que se deja en el mostrador.
// - PostaIcon: reemplaza Share2. Un ticket con su perforación, pasando
//   de una mano a otra.

type IconProps = { className?: string };

export function SelloIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-7 32 32)">
        <rect x="7" y="7" width="50" height="50" rx="11" stroke="currentColor" strokeWidth="5" />
        <path d="M19 33 L28 42 L46 21" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function SelloDudaIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(6 32 32)">
        <rect x="7" y="7" width="50" height="50" rx="11" stroke="currentColor" strokeWidth="5" />
        <path d="M18 34 Q25 24 32 34 T46 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function NotaIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M13 9 H49 V42 L37 53 H13 Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M37 42 V53 L49 42 Z" fill="currentColor" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
      <line x1="20" y1="21" x2="42" y2="21" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function PostaIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="18" width="28" height="26" rx="6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="20" y1="18" x2="20" y2="44" stroke="currentColor" strokeWidth="3" strokeDasharray="2 5" />
      <path d="M40 31 H57 M57 31 L49 23 M57 31 L49 39" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
