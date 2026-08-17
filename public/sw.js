const CACHE = "granbarata-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Push real: la ruta app/api/push/send manda un payload JSON
// {title, body, link} -- esto lo muestra como notificación del sistema
// aunque la app esté cerrada, y al tocarla abre (o enfoca) esa página.
self.addEventListener("push", (e) => {
  let data = { title: "La Gran Barata Digital", body: "Tenés una novedad.", link: "/" };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { link: data.link },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = e.notification.data?.link || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const url = new URL(link, self.location.origin).href;
      const existing = clientsArr.find((c) => c.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(e.request);
        if (fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(e.request);
        return cached || Response.error();
      }
    })
  );
});
