"use client";
// HEADER V3 -- lenguaje de las maquetas LA GRAN BARATA: logo XL que rota
// al hover, buscador dominante, icon-nav Radar/Hot/Comunidad con label
// técnico debajo y chip de usuario. Segunda fila con el resto de las
// secciones. Toda la funcionalidad real se conserva (auth, rol, campana,
// ciudades, tema, menú mobile).
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag, Sparkles, Store, Flame, Clapperboard, Newspaper, Trophy, Map as MapIcon,
  Users, Radar, Video,
} from "lucide-react";
import SmartSearch from "@/components/ui/smart-search";
import NotificationBell from "@/components/layout/notification-bell";
import CitySwitcher from "@/components/layout/city-switcher";
import MobileMenu from "@/components/layout/mobile-menu";
import AuthButton from "./auth-button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { supabase } from "@/lib/supabase";
import { useUnreadMessages } from "@/lib/hooks/use-unread-messages";
import { useAuth } from "@/components/providers/auth-provider";

const ICON_NAV = [
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/promociones", label: "Hot", icon: Flame },
  { href: "/comunidad", label: "Comunidad", icon: Users },
];

const NAV = [
  { href: "/negocios", label: "Negocios", icon: Store },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/feed", label: "Muro", icon: Newspaper },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/en-vivo", label: "En Vivo", icon: Video },
  { href: "/mapa", label: "Mapa", icon: MapIcon },
  { href: "/asistente", label: "Asistente IA", icon: Sparkles },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // useAuth() está suscripto a onAuthStateChange (components/providers/auth-provider.tsx),
  // así que el header se actualiza solo apenas cambia la sesión.
  const { user } = useAuth();
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadMessages();

  useEffect(() => {
    if (!user) { setRole("user"); return; }
    (async () => {
      const { data: prof } = await supabase().from("user_profiles")
        .select("role").eq("user_id", user.id).maybeSingle();
      setRole(prof?.role || "user");
    })();
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const salir = async () => {
    await supabase().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const linkBase = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--ov-05)]";

  return (
    <header className="glass-dark sticky top-0 z-50" aria-label="Navegación principal">
      {/* ── Fila 1 (v3): logo XL · búsqueda · icon-nav · usuario ── */}
      <div>
        <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between gap-4 px-3 md:h-20 md:px-6 lg:h-24">
          <Link href="/" className="group flex shrink-0 items-center gap-3 md:gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 md:h-12 md:w-12">
              <ShoppingBag className="h-5 w-5 text-white md:h-6 md:w-6" />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-xl tracking-tight text-[#f7f3ec] md:text-2xl">LA GRAN BARATA</span>
              <span className="mt-1 text-[9px] font-bold uppercase leading-none tracking-[0.3em] text-[var(--accent)] md:text-[10px]" style={{ fontFamily: "var(--font-display)" }}>World Class · Digital</span>
            </span>
          </Link>

          <SmartSearch className="hidden min-w-0 max-w-3xl flex-1 lg:block" shortcutSlash />

          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-4">
            <nav className="hidden items-center gap-5 xl:flex" aria-label="Accesos destacados">
              {ICON_NAV.map((it) => {
                const active = pathname.startsWith(it.href);
                return (
                  <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                    className={`group flex flex-col items-center transition-colors ${active ? "text-[var(--accent)]" : "text-white/50 hover:text-[var(--accent)]"}`}>
                    <it.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>{it.label}</span>
                  </Link>
                );
              })}
              <div className="h-10 w-px bg-white/10" />
            </nav>

            <MobileMenu />
            <ThemeToggle />
            <CitySwitcher />
            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-label="Menú de usuario"
                  aria-expanded={open}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 py-1 pl-1 pr-2.5 transition hover:border-white/10 md:pr-4"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-black text-white md:h-10 md:w-10">
                    {(user.email || "?")[0].toUpperCase()}
                  </span>
                  <span className="hidden flex-col items-start leading-none min-[450px]:flex">
                    <span className="max-w-[120px] truncate text-sm font-black">{(user.email || "").split("@")[0]}</span>
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tighter text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Mi cuenta</span>
                  </span>
                </button>
                {open && (
                  <div className="absolute right-0 top-14 z-50 w-72 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-03)] p-1.5 shadow-2xl backdrop-blur-xl">
                  <div className="custom-scrollbar max-h-[80vh] overflow-y-auto rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--surface2)] p-2">
                    <div className="mb-1 border-b border-[var(--line)] px-3 py-2">
                      <p className="text-xs text-[var(--muted)]">Conectado como</p>
                      <p className="truncate text-sm font-bold text-[var(--text)]">{user.email}</p>
                    </div>

                    <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Mi comercio</p>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--accent)]`}><Store className="h-4 w-4 shrink-0" />Mis negocios</Link>
                    <Link href="/dashboard/ofertas/nueva" onClick={() => setOpen(false)} className={linkBase}>Nueva oferta</Link>
                    <Link href="/dashboard/reels/nueva" onClick={() => setOpen(false)} className={linkBase}>Nuevo reel</Link>
                    <Link href="/dashboard/analytics" onClick={() => setOpen(false)} className={linkBase}>Estadísticas</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Mi actividad</p>
                    <Link href="/comunidad" onClick={() => setOpen(false)} className={linkBase}>Chat de la ciudad</Link>
                    <Link href="/pedidos" onClick={() => setOpen(false)} className={linkBase}>¿Quién tiene esto?</Link>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className={linkBase}>Favoritos</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--ov-05)]">
                      <span>Mensajes</span>
                      {unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
                    </Link>
                    <Link href="/perfil#misiones" onClick={() => setOpen(false)} className={linkBase}>Misiones y nivel</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Cuenta</p>
                    <Link href="/perfil#cuenta" onClick={() => setOpen(false)} className={linkBase}>Perfil y clave</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className={linkBase}>Ranking de vecinos</Link>
                    <Link href="/invitar" onClick={() => setOpen(false)} className={linkBase}>Invitar amigos</Link>
                    <button onClick={salir} className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--bad)] hover:bg-[var(--ov-05)]">Salir</button>

                    {role === "admin" && (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Administración</p>
                        <Link href="/admin?tab=overview" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--bad)]`}>Panel</Link>
                        <Link href="/admin?tab=moderacion" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--bad)]`}>Moderación</Link>
                        <Link href="/admin?tab=verificacion" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--bad)]`}>Verificación</Link>
                      </>
                    )}
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <AuthButton />
            )}

            <Link href="/para-negocios" className="btn-hard hidden items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white xl:inline-flex" style={{ fontFamily: "var(--font-display)" }}>
              Publicar negocio
            </Link>
          </div>
        </div>
      </div>

      {/* ── Fila mobile: búsqueda siempre a mano (patrón Amazon app) ── */}
      <div className="border-b border-white/[.06] px-3 pb-2 pt-1.5 lg:hidden">
        <SmartSearch placeholder="Buscá en San Lorenzo..." />
      </div>

      {/* ── Fila 2: secciones restantes ── */}
      <nav className="hidden border-b border-white/[.06] bg-black/30 md:block" aria-label="Secciones">
        <div className="mx-auto flex max-w-[1700px] items-center gap-0.5 px-4 lg:px-6">
          {NAV.map((it) => {
            const active = pathname.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold transition-colors ${
                  active ? "text-[#f7f3ec]" : "text-[#a99b86] hover:text-[#f7f3ec]"
                }`}>
                <it.icon className={`h-3.5 w-3.5 ${active ? "text-[var(--accent)]" : "opacity-60"}`} />
                {it.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[var(--accent)]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
