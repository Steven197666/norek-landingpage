"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/push";

export default function PushNotificationsBootstrap() {
  useEffect(() => {
    registerServiceWorker().catch(() => {
      // best-effort only
    });
  }, []);

  return null;
}
