self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "DarePay",
      body: event.data.text(),
    };
  }

  const title = payload.title || "DarePay";
  const options = {
    body: payload.body || "Neue Benachrichtigung",
    icon: payload.icon || "/icon-192.svg",
    badge: payload.badge || "/badge-72.svg",
    data: {
      url: payload?.data?.url || "/activity",
      notificationId: payload?.data?.notificationId || null,
      notificationType: payload?.data?.notificationType || null,
    },
    renotify: false,
    requireInteraction: false,
    tag: payload?.data?.notificationId || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event?.notification?.data?.url || "/activity";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
