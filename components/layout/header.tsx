"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import NotificationBell from "@/components/layout/notification-bell";
import CitySwitcher from "@/components/layout/city-switcher";
import MobileMenu from "@/components/layout/mobile-menu";
import AuthButton from "./auth-button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { supabase } from "@/lib/supabase";
import { useUnreadMessages } from "@/lib/hooks/use-unread-messages";
import { useAuth } from "@/components/providers/auth-provider";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // useAuth() está suscripto a onAuthStateChange (components/providers/auth-provider.tsx),
  // así que el header se actualiza solo apenas cambia la sesión -- antes
  // esto se resolvía con un getUser() de una sola vez que dejaba el menú
  // "logueado" desactualizado hasta que el usuario refrescaba a mano.
  const { user } = useAuth();
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => { document.removeEventListener("mousedown", handler); window.removeEventListener("scroll", onScroll); };
  }, []);

  const salir = async () => {
    await supabase().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/negocios", label: "Negocios" },
    { href: "/promociones", label: "Ofertas" },
    { href: "/reels", label: "Reels" },
    { href: "/feed", label: "Muro" },
    { href: "/ranking", label: "Ranking" },
    { href: "/mapa", label: "Mapa" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0a0b]" aria-label="Navegación principal">
      <div className={`site-header-inner mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 transition-colors md:h-16 md:px-6 ${
        scrolled ? "bg-[#0c0a0b]" : "bg-[#0c0a0b]"
      }`}>
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--accent)] transition group-hover:bg-[var(--accent2)]">
              <ShoppingBag className="h-5 w-5 text-white" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-black tracking-tight text-[#f7f3ec] md:text-base">LA GRAN BARATA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Digital · San Lorenzo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-2 text-sm font-semibold transition-all duration-300 ${active ? "text-[#f7f3ec]" : "text-[#a99b86] hover:text-[#f7f3ec]"}`}
                >
                  {it.label}
                  {active && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-[var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <MobileMenu />
            <ThemeToggle />
            <CitySwitcher />
            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-label="Menú de usuario"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-black text-white transition hover:scale-105 md:h-9 md:w-9"
                >
                  {(user.email || "?")[0].toUpperCase()}
                </button>
                {open && (
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-03)] p-1.5 shadow-2xl backdrop-blur-xl">
                  <div className="max-h-[80vh] overflow-y-auto rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--surface2)] p-2">
                    <div className="mb-1 border-b border-[var(--line)] px-3 py-2">
                      <p className="text-xs text-[var(--muted)]">Conectado como</p>
                      <p className="truncate text-sm font-bold text-[var(--text)]">{user.email}</p>
                    </div>

                    <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">🏪 Mi comercio</p>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10">Mis negocios</Link>
                    <Link href="/dashboard/ofertas/nueva" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Nueva oferta</Link>
                    <Link href="/dashboard/reels/nueva" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Nuevo reel</Link>
                    <Link href="/dashboard/analytics" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Estadísticas</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">🎯 Mi actividad</p>
                    <Link href="/comunidad" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Chat de la ciudad</Link>
                    <Link href="/pedidos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">¿Quién tiene esto?</Link>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Favoritos</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">
                      <span>Mensajes</span>
                      {unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
                    </Link>
                    <Link href="/perfil#misiones" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Misiones y nivel</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">👤 Cuenta</p>
                    <Link href="/perfil#cuenta" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Perfil y clave</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Ranking de vecinos</Link>
                    <Link href="/invitar" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--ov-05)]">Invitar amigos</Link>
                    <button onClick={salir} className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--bad)] hover:bg-[var(--ov-05)]">Salir</button>

                    {role === "admin" && (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">⚙️ Admin</p>
                        <Link href="/admin?tab=overview" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--bad)] hover:bg-red-500/10">Panel</Link>
                        <Link href="/admin?tab=moderacion" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--bad)] hover:bg-red-500/10">Moderación</Link>
                        <Link href="/admin?tab=verificacion" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--bad)] hover:bg-red-500/10">Verificación</Link>
                      </>
                    )}
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <AuthButton />
            )}

            <Link href="/para-negocios" className="group/cta hidden items-center gap-2 bg-[var(--accent)] px-4 py-2 text-sm font-black text-white transition hover:bg-[var(--accent2)] active:scale-[0.98] md:inline-flex">
              Publicar negocio
              <span className="transition-transform duration-300 group-hover/cta:translate-x-0.5">↗</span>
            </Link>
          </div>
      </div>
    </header>
  );
}
