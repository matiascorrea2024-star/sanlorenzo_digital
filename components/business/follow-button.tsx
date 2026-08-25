"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { postActivity } from "@/lib/activity";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function FollowButton({ businessId }: { businessId: string }) {
  const { show } = useToast();
  const [user, setUser] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [siguiendo, setSiguiendo] = useState(false);
  const [busy, setBusy] = useState(false);
  const { trackFollow } = useAnalytics();

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
      const { error } = await supabase().from("followers").delete().eq("business_id", businessId).eq("user_id", user.id);
      if (error) { show(`❌ ${friendlyError(error, "No se pudo dejar de seguir.")}`, "error"); setBusy(false); return; }
      setCount(c => c - 1); setSiguiendo(false);
    } else {
      const { error } = await supabase().from("followers").insert({ business_id: businessId, user_id: user.id });
      if (error) { show(`❌ ${friendlyError(error, "No se pudo seguir el negocio.")}`, "error"); setBusy(false); return; }
      setCount(c => c + 1); setSiguiendo(true);
      trackFollow(businessId);
      await postActivity({ type: "new_follower", businessId, title: "👥 Nuevo seguidor" });
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black transition ${
        siguiendo ? "border-[var(--accent)]/60 bg-[var(--accent)]/15 text-[var(--accent)]" : "border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--text)] hover:border-[var(--accent)]"
      }`}>
      {siguiendo ? "★ Siguiendo" : "☆ Seguir"} · {count}
    </button>
  );
}
