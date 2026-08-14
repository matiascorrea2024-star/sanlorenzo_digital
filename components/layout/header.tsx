import Link from "next/link";
import NotificationBell from "@/components/layout/notification-bell";
import AuthButton from "./auth-button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0a12]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight text-white">LA GRAN BARATA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Digital · San Lorenzo</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
            <Link href="/negocios" className="hover:text-white">Negocios</Link>
            <Link href="/promociones" className="hover:text-white">Ofertas</Link>
            <Link href="/mapa" className="hover:text-white">Mapa</Link>
            <Link href="/ranking" className="hover:text-white">Ranking</Link>
            <Link href="/para-negocios" className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 font-black text-white hover:opacity-90">Publicar negocio</Link>
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
