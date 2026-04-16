"use client";

import { useEffect, useMemo, useState } from "react";
import PublicProfileView from "@/components/profile/PublicProfileView";
import LegalFooter from "@/components/legal/LegalFooter";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import { apiFetch } from "@/lib/api";

type ChallengeLocale = "de" | "en" | "es" | "fr";

function normalizeLocale(input: string | null | undefined): ChallengeLocale {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 2);

  if (raw === "en" || raw === "es" || raw === "fr") return raw;
  return "de";
}

function getActiveChallengeLocale(): ChallengeLocale {
  if (typeof window === "undefined") return "de";

  const stored =
    window.localStorage.getItem("app_locale") ||
    window.localStorage.getItem("locale") ||
    window.localStorage.getItem("language");

  if (stored) return normalizeLocale(stored);
  return normalizeLocale(window.navigator.language);
}

export default function OwnProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(() => getActiveChallengeLocale(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/users/me", { method: "GET" }, true);

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Profil konnte nicht geladen werden.");
        }

        const data = await res.json();

        if (!cancelled) {
          setProfile(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setProfile(null);
          setError(err?.message || "Profil konnte nicht geladen werden.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#102041_0%,#071224_45%,#030914_100%)] pb-36">
      <div className="px-3 pt-5 pb-10">
        {loading && (
          <div className="py-12 text-center text-base text-slate-300">
            Profil wird geladen…
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-base text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <PublicProfileView profile={profile} locale={locale} isOwnProfile />
        )}
      </div>

      <LegalFooter />
      <MobileBottomNav />
    </div>
  );
}