"use client";
// HEADER -- densidad plana estilo Amazon (calcado del mockup de
// referencia aprobado): barra superior SIEMPRE oscura sin blur, logo
// chico, "Entrega en" + buscador dominante, cuenta a la derecha, fila
// de secciones en texto plano debajo. Toda la funcionalidad real se
// conserva (auth, rol, campana, ciudades, tema, menú mobile).
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag, Sparkles, Store, Flame, Clapperboard, Newspaper, Trophy, Map as MapIcon,
  Users, Radar, Video, Menu,
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
import { useToast } from "@/components/ui/toast";

const ICON_NAV = [
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/promociones", label: "Hot", icon: Flame },
  { href: "/comunidad", label: "Comunidad", icon: Users },
];

const NAV = [
  { href: "/negocios", label: "Negocios", icon: Store },
  { href: "/promociones", label: "Ofertas", icon: Flame },
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
  const { show } = useToast();
  // useAuth() está suscripto a onAuthStateChange (components/providers/auth-provider.tsx),
  // así que el header se actualiza solo apenas cambia la sesión.
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState("user");
  const [nombre, setNombre] = useState("");
  const [tieneNegocio, setTieneNegocio] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadMessages();

  useEffect(() => {
    if (!user) { setRole("user"); setNombre(""); setTieneNegocio(false); return; }
    (async () => {
      const sb = supabase();
      const [{ data: prof }, { count }] = await Promise.all([
        sb.from("user_profiles").select("role, display_name").eq("user_id", user.id).maybeSingle(),
        sb.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
      ]);
      setRole(prof?.role || "user");
      setNombre(prof?.display_name || "");
      setTieneNegocio((count || 0) > 0);
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
    const { error } = await supabase().auth.signOut();
    if (error) { show(`❌ ${error.message || "No se pudo cerrar sesión."}`, "error"); return; }
    router.push("/");
    router.refresh();
  };

  const linkBase = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--ov-05)]";

  return (
    <header className="glass-dark sticky top-0 z-50" aria-label="Navegación principal">
      {/* ── Fila 1: barra densa y plana, calcada del patrón Amazon --
          logo chico, búsqueda dominante, cuenta a la derecha. Sin
          animaciones de hover ni sombras -- utilitario, no "vidriera". ── */}
      <div>
        <div className="mx-auto flex h-14 max-w-[1700px] items-center justify-between gap-3 px-3 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)]">
              <ShoppingBag className="h-4 w-4 text-white" />
            </span>
            <span className="hidden text-base font-bold tracking-tight text-white sm:inline" style={{ fontFamily: "var(--font-tech)" }}>La Gran Barata</span>
          </Link>

          <CitySwitcher />

          <SmartSearch className="hidden min-w-0 max-w-3xl flex-1 lg:block" shortcutSlash />

          <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-3">
            <nav className="hidden items-center gap-4 xl:flex" aria-label="Accesos destacados">
              {ICON_NAV.map((it) => {
                const active = pathname.startsWith(it.href);
                return (
                  <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center transition-colors ${active ? "text-[var(--accent-ink)]" : "text-white/50 hover:text-white"}`}>
                    <it.icon className="h-4 w-4" />
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{it.label}</span>
                  </Link>
                );
              })}
              <div className="h-7 w-px bg-white/10" />
            </nav>

            <MobileMenu />
            <ThemeToggle />
            {user && <NotificationBell />}

            {authLoading ? null : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-label="Menú de usuario"
                  aria-expanded={open}
                  className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 py-1 pl-1 pr-2 transition hover:border-white/25 md:pr-3"
                >
                  <span className="grid h-6 w-6 place-items-center rounded bg-[var(--accent)] text-xs font-black text-white">
                    {(nombre || user.email || "?")[0].toUpperCase()}
                  </span>
                  <span className="hidden flex-col items-start leading-none min-[450px]:flex">
                    <span className="max-w-[110px] truncate text-[11px] font-bold text-white/70">Hola,</span>
                    <span className="max-w-[110px] truncate text-xs font-black text-white">{nombre || (user.email || "").split("@")[0]}</span>
                  </span>
                </button>
                {open && (
                  <div className="absolute right-0 top-14 z-50 w-72 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-03)] p-1.5 shadow-2xl backdrop-blur-xl">
                  <div className="custom-scrollbar max-h-[80vh] overflow-y-auto rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--surface2)] p-2">
                    {/* Un solo punto de entrada claro al perfil -- desde
                        ahí cuelgan cuenta, misiones y (si tiene negocio)
                        el acceso al panel. Nada de mostrar el email acá. */}
                    <Link href="/perfil" onClick={() => setOpen(false)} className="mb-1 flex items-center gap-3 rounded-xl border-b border-[var(--line)] px-3 py-2.5 hover:bg-[var(--ov-05)]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-black text-white">{(nombre || user.email || "?")[0].toUpperCase()}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[var(--text)]">{nombre || "Mi perfil"}</span>
                        <span className="block text-xs font-bold text-[var(--accent-ink)]">Ver mi perfil →</span>
                      </span>
                    </Link>

                    {/* Comerciante: solo aparece si el usuario tiene al
                        menos un negocio -- a un comprador puro no le
                        sirve de nada ver esto, es justo lo que generaba
                        el quilombo. */}
                    {tieneNegocio && (
                      <>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Mi comercio</p>
                        <Link href="/dashboard" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--accent-ink)]`}><Store className="h-4 w-4 shrink-0" />Panel de comerciante</Link>
                        <Link href="/dashboard/ofertas/nueva" onClick={() => setOpen(false)} className={linkBase}>Nueva oferta</Link>
                        <Link href="/dashboard/productos" onClick={() => setOpen(false)} className={linkBase}>Catálogo</Link>
                        <Link href="/dashboard/analytics" onClick={() => setOpen(false)} className={linkBase}>Estadísticas</Link>
                      </>
                    )}

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Comprando</p>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className={linkBase}>Favoritos</Link>
                    <Link href="/mi-barata" onClick={() => setOpen(false)} className={linkBase}>Mi Barata</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--ov-05)]">
                      <span>Mensajes</span>
                      {unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--bad)] px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
                    </Link>
                    <Link href="/pedidos" onClick={() => setOpen(false)} className={linkBase}>¿Quién tiene esto?</Link>
                    <Link href="/comunidad" onClick={() => setOpen(false)} className={linkBase}>Chat de la ciudad</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Tu progreso</p>
                    <Link href="/perfil#misiones" onClick={() => setOpen(false)} className={linkBase}>Misiones y nivel</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className={linkBase}>Ranking de vecinos</Link>
                    <Link href="/invitar" onClick={() => setOpen(false)} className={linkBase}>Invitar amigos</Link>

                    {!tieneNegocio && (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">¿Tenés un negocio?</p>
                        <Link href="/para-negocios" onClick={() => setOpen(false)} className={`${linkBase} text-[var(--accent-ink)]`}><Store className="h-4 w-4 shrink-0" />Publicar mi negocio</Link>
                      </>
                    )}

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Cuenta</p>
                    <Link href="/perfil#cuenta" onClick={() => setOpen(false)} className={linkBase}>Perfil y clave</Link>
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

            <Link href="/para-negocios" className="hidden items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--accent2)] xl:inline-flex">
              Publicar negocio
            </Link>
          </div>
        </div>
      </div>

      {/* ── Fila mobile: búsqueda siempre a mano (patrón Amazon app) ── */}
      <div className="border-b border-white/[.06] px-3 pb-2 pt-1.5 lg:hidden">
        <SmartSearch placeholder="Buscá en San Lorenzo..." />
      </div>

      {/* ── Fila 2: secciones, texto plano y denso (sin íconos) -- mismo
          patrón que la subnav del mockup de referencia. ── */}
      <nav className="hidden border-b border-white/[.06] bg-black/30 md:block" aria-label="Secciones">
        <div className="mx-auto flex max-w-[1700px] items-center gap-1 px-4 lg:px-6">
          <Link href="/negocios" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white">
            <Menu className="h-3.5 w-3.5" /> Todos los rubros
          </Link>
          {NAV.map((it) => {
            const active = pathname.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
                className={`relative px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active ? "text-white" : "text-white/55 hover:text-white"
                }`}>
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
