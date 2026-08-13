"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
export default function AuthButton() {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    supabase().auth.getSession().then(({ data }: { data: { session: Session | null } }) => setLogged(!!data.session));
    const { data: { subscription } } = supabase().auth.onAuthStateChange((_e: string, s: Session | null) => setLogged(!!s));
    return () => subscription.unsubscribe();
  }, []);
  return logged ? (
    <a href="/dashboard/mis-negocios" className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white">Mi panel</a>
  ) : (
    <a href="/login" className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white">Ingresar</a>
  );
}
