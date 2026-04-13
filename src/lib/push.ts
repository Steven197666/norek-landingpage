import { apiFetch } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker() {
  if (!isPushSupported()) {
    return null;
  }

  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function syncPushSubscription() {
  if (!isPushSupported()) {
    return { ok: false, reason: "PUSH_NOT_SUPPORTED" };
  }

  const keyRes = await apiFetch("/notifications/push/public-key", { method: "GET" }, true);
  if (!keyRes.ok) {
    return { ok: false, reason: "PUBLIC_KEY_FETCH_FAILED" };
  }

  const keyData = (await keyRes.json()) as { publicKey?: string | null; pushEnabled?: boolean };
  const vapidPublicKey = String(keyData.publicKey || "").trim();
  if (!vapidPublicKey) {
    return { ok: false, reason: "VAPID_PUBLIC_KEY_MISSING" };
  }

  await registerServiceWorker();

  const registration = await navigator.serviceWorker.ready;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return { ok: false, reason: "PERMISSION_DENIED" };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const data = subscription.toJSON();
  const endpoint = data.endpoint || "";
  const p256dh = data.keys?.p256dh || "";
  const auth = data.keys?.auth || "";

  if (!endpoint || !p256dh || !auth) {
    return { ok: false, reason: "INVALID_SUBSCRIPTION" };
  }

  const res = await apiFetch(
    "/notifications/subscriptions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint,
        expirationTime: data.expirationTime ?? null,
        keys: { p256dh, auth },
        userAgent: navigator.userAgent,
      }),
    },
    true
  );

  if (!res.ok) {
    return { ok: false, reason: "BACKEND_SAVE_FAILED" };
  }

  return { ok: true };
}

export async function disablePushSubscription() {
  if (!isPushSupported()) {
    return { ok: true };
  }

  await registerServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return { ok: true };
  }

  const endpoint = subscription.endpoint;

  await apiFetch(
    "/notifications/subscriptions",
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    },
    true
  ).catch(() => {
    // local unsubscribe should still proceed
  });

  await subscription.unsubscribe().catch(() => {
    // ignore local unsubscribe failure
  });

  return { ok: true };
}

export async function sendTestPush() {
  const res = await apiFetch(
    "/notifications/me/test-push",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
    true
  );

  if (!res.ok) {
    return { ok: false };
  }

  return { ok: true };
}
