"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/layout/notification-bell";
import AuthButton from "./auth-button";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
    })();
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0a12]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🛍️</span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight text-white">LA GRAN BARATA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Digital · San Lorenzo</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((it) => (
              <Link key={it.href} href={it.href} className={linkCls(it.href)}>
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Menú de usuario si está logueado */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-sm font-black text-white hover:scale-105 transition"
                >
                  {(user.email || "?")[0].toUpperCase()}
                </button>
                {open && (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#141018] p-2 shadow-2xl">
                    <div className="border-b border-white/10 px-3 py-2 mb-1">
                      <p className="text-xs text-white/50">Conectado como</p>
                      <p className="text-sm font-bold truncate">{user.email}</p>
                    </div>
                    <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">🎖 Mi perfil</Link>
                    <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">❤️ Favoritos</Link>
                    <Link href="/mensajes" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">💬 Mensajes</Link>
                    <Link href="/vecinos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">👥 Ranking de vecinos</Link>
                    <Link href="/panel" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5">🏪 Mis negocios</Link>
                    <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5 text-red-300">🛡️ Admin</Link>
                    <div className="border-t border-white/10 mt-1 pt-1">
                      <AuthButton />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="hidden md:block">
                <AuthButton />
              </div>
            )}

            <Link href="/para-negocios" className="hidden rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-black text-white hover:opacity-90 md:inline-block">
              Publicar negocio
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
