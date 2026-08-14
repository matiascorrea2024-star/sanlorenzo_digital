"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/layout/notification-bell";
import AuthButton from "./auth-button";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase().from("user_profiles")
          .select("role").eq("user_id", user.id).maybeSingle();
        setRole(prof?.role || "user");
      }
    })();
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

  const linkCls = (href: string) =>
    `text-sm font-semibold transition ${pathname === href ? "text-orange-400" : "text-white/70 hover:text-white"}`;

  const navItems = [
    { href: "/negocios", label: "Negocios" },
    { href: "/promociones", label: "Ofertas" },
    { href: "/feed", label: "Muro" },
    { href: "/ranking", label: "Ranking" },
    { href: "/mapa", label: "Mapa" },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${scrolled ? "border-white/10 bg-[#0d0a12]/95 shadow-lg shadow-black/40" : "border-transparent bg-[#0d0a12]/70"}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-14" : "h-16"}`}>
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl md:text-2xl">🛍️</span>
            <span className="leading-tight">
              <span className="block text-sm md:text-base font-black tracking-tight text-white">LA GRAN BARATA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Digital · San Lorenzo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((it) => (
              <Link key={it.href} href={it.href} className={linkCls(it.href)}>{it.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-black text-white transition hover:scale-105"
                >
                  {(user.email || "?")[0].toUpperCase()}
                </button>
                {open && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#141018] p-2 shadow-2xl">
                    <div className="mb-1 border-b border-white/10 px-3 py-2">
                      <p className="text-xs text-white/50">Conectado como</p>
                      <p className="truncate text-sm font-bold">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/10">🏪 Mis negocios (editar rápido)</Link>
                    <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">🎖 Mi perfil y misiones</Link>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">❤️ Favoritos</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">💬 Mensajes</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">👥 Ranking de vecinos</Link>
                    {role === "admin" && (
                      <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 hover:bg-white/5">🛡️ Admin</Link>
                    )}
                    <div className="mt-1 border-t border-white/10 pt-1">
                      <button onClick={salir} className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-white/5">🚪 Salir</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AuthButton />
            )}

            <Link href="/para-negocios" className="btn-shine hidden rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-black text-white hover:opacity-90 md:inline-block">
              Publicar negocio
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
