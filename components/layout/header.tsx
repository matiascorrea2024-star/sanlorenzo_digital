"use client";
import { useState } from "react";
import AuthButton from "./auth-button";

export default function Header(){
  const [open,setOpen]=useState(false);
  return <>
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(7,8,13,.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-xs font-black text-white shadow-lg shadow-violet-900/30">SL</span>
          <span className="hidden sm:block"><span className="block text-[10px] font-semibold uppercase tracking-[.24em] text-[var(--muted)]">Directorio local</span><span className="block text-base font-bold tracking-tight" style={{fontFamily:"var(--font-space)"}}>SAN LORENZO <span className="text-[var(--accent)]">DIGITAL</span></span></span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] lg:flex">
          <a href="/" className="hover:text-white">Inicio</a><a href="/negocios" className="hover:text-white">Negocios</a><a href="/#categorias" className="hover:text-white">Categorías</a><a href="/mapa" className="hover:text-white">Mapa</a><a href="/para-negocios" className="hover:text-white">Para negocios</a>
        </nav>
        <div className="flex items-center gap-2"><div className="hidden sm:block"><AuthButton/></div><a href="/para-negocios" className="hidden rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black hover:scale-[1.02] sm:block">Sumá tu negocio</a><button onClick={()=>setOpen(!open)} aria-label="Abrir menú" className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-lg lg:hidden">{open?"×":"☰"}</button></div>
      </div>
      {open&&<div className="border-t border-[var(--line)] bg-[rgba(7,8,13,.97)] px-4 py-4 lg:hidden"><div className="mx-auto grid max-w-7xl gap-2 text-sm"><a onClick={()=>setOpen(false)} href="/" className="rounded-xl px-4 py-3 hover:bg-[var(--surface)]">Inicio</a><a onClick={()=>setOpen(false)} href="/negocios" className="rounded-xl px-4 py-3 hover:bg-[var(--surface)]">Negocios</a><a onClick={()=>setOpen(false)} href="/#categorias" className="rounded-xl px-4 py-3 hover:bg-[var(--surface)]">Categorías</a><a onClick={()=>setOpen(false)} href="/mapa" className="rounded-xl px-4 py-3 hover:bg-[var(--surface)]">Mapa</a><a onClick={()=>setOpen(false)} href="/para-negocios" className="rounded-xl px-4 py-3 hover:bg-[var(--surface)]">Para negocios</a><div className="pt-2"><AuthButton/></div></div></div>}
    </header>
  </>;
}
