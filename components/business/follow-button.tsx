"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FollowButton({ businessId }: { businessId: string }) {
  const [user, setUser] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [siguiendo, setSiguiendo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { count: c } = await supabase()
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      setCount(c || 0);
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase()
          .from("followers")
          .select("id")
          .eq("business_id", businessId)
          .eq("user_id", user.id)
          .maybeSingle();
        setSiguiendo(!!data);
      }
    })();
  }, [businessId]);

  const toggle = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    if (siguiendo) {
      await supabase().from("followers").delete().eq("business_id", businessId).eq("user_id", user.id);
      setCount((c) => c - 1);
      setSiguiendo(false);
    } else {
      await supabase().from("followers").insert({ business_id: businessId, user_id: user.id });
      setCount((c) => c + 1);
      setSiguiendo(true);
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-xl px-4 py-2 text-sm font-black transition ${
          siguiendo
            ? "bg-green-500/20 border border-green-400/50 text-green-300 hover:bg-green-500/30"
            : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
        }`}
      >
        {siguiendo ? "✓ Siguiendo" : "⭐ Seguir"}
      </button>
      <span className="text-xs text-white/60">{count} {count === 1 ? "seguidor" : "seguidores"}</span>
    </div>
  );
}
