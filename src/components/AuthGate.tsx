"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/agb",
  "/datenschutz",
  "/impressum",
  "/hilfe",
  "/preise",
  "/widerruf",
  "/auszahlungsrichtlinie",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isAuthPage(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/register";
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const publicPath = isPublicPath(pathname);

    // Nicht eingeloggt + private route => login
    if (!token && !publicPath) {
      setChecked(false);
      router.replace("/auth/login");
      return;
    }

    // Eingeloggt + auth pages => challenges
    if (token && isAuthPage(pathname)) {
      setChecked(false);
      router.replace("/challenges");
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) return null;
  return <>{children}</>;
}