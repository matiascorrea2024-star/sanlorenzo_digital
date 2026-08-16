import { Shield } from "lucide-react";

// Avatar distintivo del equipo de San Lorenzo Digital -- en vez de la
// inicial genérica que le toca a cualquier usuario, un ícono propio
// sobre fondo oscuro dorado, para que se reconozca de un vistazo antes
// incluso de mirar el marco (AdminFrame) que lo rodea.
export default function StaffAvatar({ size = 44, online }: { size?: number; online?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex h-full w-full items-center justify-center rounded-full"
        style={{ background: "radial-gradient(circle at 35% 28%, #4a2e05 0%, #120d09 75%)" }}>
        <Shield className="text-yellow-300" style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.2} />
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#120d09] bg-green-500" />
      )}
    </div>
  );
}
