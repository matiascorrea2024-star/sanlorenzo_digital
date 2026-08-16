"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";

// Mensajes no leídos, como cliente y (si tiene negocio propio) como dueño.
// Compartido entre la nav inferior y el menú del header para no duplicar
// la lógica de conteo en dos lugares.
export function useUnreadMessages() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    (async () => {
      const sb = supabase();

      const { count: asCustomer } = await sb.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id).eq("sender_role", "business").eq("read_by_customer", false);

      let asOwner = 0;
      const { data: biz } = await sb.from("businesses").select("id").eq("owner_id", user.id);
      if (biz && biz.length) {
        const { count } = await sb.from("messages")
          .select("*", { count: "exact", head: true })
          .in("business_id", biz.map((b: any) => b.id))
          .eq("sender_role", "customer").eq("read_by_business", false);
        asOwner = count || 0;
      }
      setUnread((asCustomer || 0) + asOwner);
    })();
  }, [pathname, user]);

  return unread;
}
