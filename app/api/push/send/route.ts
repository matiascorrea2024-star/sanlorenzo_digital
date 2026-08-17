import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseCron } from "@/lib/supabase-cron";

// Disparada por un trigger de Postgres (net.http_post) cada vez que se
// inserta una fila en "notifications" -- no tiene sesión de usuario
// detrás (es la base la que llama), por eso usa supabaseCron() igual
// que las rutas de app/api/cron/*, protegida acá con su propio secreto
// en vez de CRON_SECRET (lo dispara la base, no Vercel Cron).
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.PUSH_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: "Push no configurado" }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const { notification_id } = await request.json();
  if (!notification_id) return NextResponse.json({ error: "notification_id requerido" }, { status: 400 });

  const sb = supabaseCron();
  const { data: n } = await sb.from("notifications").select("user_id, title, body, link").eq("id", notification_id).maybeSingle();
  if (!n) return NextResponse.json({ ok: true, skipped: "notification not found" });

  const { data: subs } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth_key").eq("user_id", n.user_id);
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title: n.title, body: n.body || "", link: n.link || "/" });
  let sent = 0;
  const expiredIds: string[] = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload
      );
      sent++;
    } catch (err: unknown) {
      // 404/410 = la suscripción ya no existe del lado del navegador
      // (usuario desinstaló, borró datos, etc.) -- se limpia sola.
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) expiredIds.push(s.id);
    }
  }));

  if (expiredIds.length > 0) {
    await sb.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({ ok: true, sent, expired: expiredIds.length });
}
