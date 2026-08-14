"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { postActivity } from "@/lib/activity";

export default function FollowButton({ businessId }: { businessId: string }) {
  const [user, setUser] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [siguiendo, setSiguiendo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase()
        .from("followers").select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      setCount(c || 0);
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase().from("followers").select("id")
          .eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
        setSiguiendo(!!data);
      }
    })();
  }, [businessId]);

  const toggle = async () => {
    if (!user) { window.location.href = "/login"; return; }
    setBusy(true);
    if (siguiendo) {
      await supabase().from("followers").delete().eq("business_id", businessId).eq("user_id", user.id);
      setCount(c => c - 1); setSiguiendo(false);
    } else {
      await supabase().from("followers").insert({ business_id: businessId, user_id: user.id });
      setCount(c => c + 1); setSiguiendo(true);
      await postActivity({ type: "new_follower", businessId, title: "👥 Nuevo seguidor" });
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black transition ${
        siguiendo ? "border-orange-400/60 bg-orange-500/15 text-orange-300" : "border-white/20 bg-white/5 text-white hover:border-orange-400"
      }`}>
      {siguiendo ? "★ Siguiendo" : "☆ Seguir"} · {count}
    </button>
  );
}
