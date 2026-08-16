"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import NotificationBell from "@/components/layout/notification-bell";
import CitySwitcher from "@/components/layout/city-switcher";
import AuthButton from "./auth-button";
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
    { href: "/feed", label: "Muro" },
    { href: "/ranking", label: "Ranking" },
    { href: "/mapa", label: "Mapa" },
  ];

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 md:top-3 md:px-3 md:pt-3">
      {/* Isla flotante, no una barra pegada al borde -- el blur/sombra crece
          apenas se scrollea para que se note que "levanta" sobre el contenido. */}
      <div className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border px-3 backdrop-blur-xl transition-all duration-500 md:h-16 md:px-5 ${
        scrolled ? "border-white/15 bg-[#120d09]/90 shadow-2xl shadow-black/50" : "border-white/10 bg-[#120d09]/70 shadow-lg shadow-black/30"
      }`}>
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg shadow-orange-500/25 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:shadow-orange-500/45 group-hover:brightness-110">
              <ShoppingBag className="h-5 w-5 text-white" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-black tracking-tight text-white md:text-base">LA GRAN BARATA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Digital · San Lorenzo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-300 ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                >
                  {it.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,.9)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <CitySwitcher />
            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-label="Menú de usuario"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-black text-white transition hover:scale-105 md:h-9 md:w-9"
                >
                  {(user.email || "?")[0].toUpperCase()}
                </button>
                {open && (
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-white/10 bg-[#141018] p-2 shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="mb-1 border-b border-white/10 px-3 py-2">
                      <p className="text-xs text-white/50">Conectado como</p>
                      <p className="truncate text-sm font-bold">{user.email}</p>
                    </div>

                    <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-white/35">🏪 Mi comercio</p>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/10">Mis negocios</Link>
                    <Link href="/dashboard/ofertas/nueva" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Nueva oferta</Link>
                    <Link href="/dashboard/analytics" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Estadísticas</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-white/35">🎯 Mi actividad</p>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Favoritos</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/5">
                      <span>Mensajes</span>
                      {unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
                    </Link>
                    <Link href="/perfil#misiones" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Misiones y nivel</Link>

                    <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-white/35">👤 Cuenta</p>
                    <Link href="/perfil#cuenta" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Perfil y clave</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Ranking de vecinos</Link>
                    <Link href="/invitar" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">Invitar amigos</Link>
                    <button onClick={salir} className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5">Salir</button>

                    {role === "admin" && (
                      <>
                        <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-white/35">⚙️ Admin</p>
                        <Link href="/admin?tab=overview" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">Panel</Link>
                        <Link href="/admin?tab=moderacion" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">Moderación</Link>
                        <Link href="/admin?tab=verificacion" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">Verificación</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <AuthButton />
            )}

            <Link href="/para-negocios" className="group/cta btn-shine hidden items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 py-1.5 pl-4 pr-1.5 text-sm font-black text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-95 active:scale-[0.98] md:inline-flex">
              Publicar negocio
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover/cta:translate-x-0.5">↗</span>
            </Link>
          </div>
      </div>
    </header>
  );
}
