"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import { Heart } from "lucide-react";

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("user");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú automáticamente al navegar (evita overlay trabado)
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase().from("user_profiles").select("display_name, role").eq("user_id", user.id).maybeSingle();
        if (data?.role) setRole(data.role);
        setName(data?.display_name || (user.email || "").split("@")[0]);
      }
    })();
    const { data: { subscription } } = supabase().auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10">Ingresar</Link>
        <Link href="/registro" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-orange-600 hover:bg-orange-100">Crear cuenta</Link>
      </div>
    );
  }

  const salir = async () => { await supabase().auth.signOut(); setOpen(false); router.push("/"); };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl bg-white/10 p-1.5 pr-3 hover:bg-white/20">
        <Avatar name={name} size={30} />
        <span className="hidden max-w-[100px] truncate text-sm font-bold md:block">{name}</span>
      </button>
      {open && (
        <div className="fixed left-4 right-4 top-20 z-[60] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-96 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1a1420] p-2 shadow-2xl">
          <p className="px-4 py-2 text-xs text-white/40">{user.email}</p>
          <Link href="/dashboard" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">📊 Mi Panel</Link>
          {role === "admin" && <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold bg-red-500/10 text-red-300 hover:bg-red-500/20">🛡️ Admin Panel</Link>}
          <Link href="/mensajes" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">💬 Mensajes</Link>
          <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">
            <Heart className="h-4 w-4" /> Mis Favoritos
          </Link>
          <Link href="/perfil" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">👤 Mi Perfil</Link>
          <Link href="/feed" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">📰 Muro</Link>
          <Link href="/vecinos" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">👥 Vecinos</Link>
          <Link href="/ofertas-finalizadas" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10">⏳ Finalizadas</Link>
          <button onClick={salir} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold text-red-300 hover:bg-red-500/10">🚪 Salir</button>
        </div>
      )}
    </div>
  );
}
