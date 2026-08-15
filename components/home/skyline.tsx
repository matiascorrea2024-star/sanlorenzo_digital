// Silueta plana del perfil real de San Lorenzo: silos de grano, una grúa
// portuaria y una barcaza sobre la línea del Paraná. Es la pieza central de
// identidad del hero -- reemplaza los blobs/gradientes genéricos por algo
// que remite al lugar real (puerto + cordón industrial), no a una plantilla
// de SaaS. Un solo tono plano (currentColor), pensada para vivir de fondo
// a baja opacidad.
export default function Skyline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {/* silos, grupo izquierdo */}
      <rect x="40" y="96" width="30" height="104" rx="6" />
      <rect x="76" y="70" width="30" height="130" rx="6" />
      <rect x="112" y="86" width="30" height="114" rx="6" />
      <rect x="148" y="58" width="30" height="142" rx="6" />
      <rect x="184" y="82" width="30" height="118" rx="6" />

      {/* grúa portuaria, centro */}
      <rect x="560" y="40" width="10" height="160" />
      <rect x="700" y="40" width="10" height="160" />
      <rect x="555" y="34" width="160" height="10" />
      <polygon points="715,39 800,39 715,60" />
      <rect x="712" y="60" width="4" height="60" />
      <rect x="700" y="118" width="30" height="14" rx="2" />

      {/* silos, grupo derecho */}
      <rect x="940" y="88" width="28" height="112" rx="6" />
      <rect x="974" y="64" width="28" height="136" rx="6" />
      <rect x="1008" y="100" width="28" height="100" rx="6" />

      {/* barcaza sobre la línea de agua */}
      <polygon points="1180,200 1200,168 1360,168 1380,200" />
      <rect x="1230" y="146" width="60" height="26" rx="3" />
      <rect x="1248" y="128" width="10" height="20" />

      {/* línea del río */}
      <rect x="0" y="200" width="1440" height="2" opacity=".7" />
    </svg>
  );
}
