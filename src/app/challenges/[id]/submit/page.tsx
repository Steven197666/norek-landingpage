"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";
import RecordedAttemptRecorder from "@/components/RecordedAttemptRecorder";

type ChallengeLocale = "de" | "en" | "es" | "fr";

type ChallengeInfo = {
  id: string;
  title: string;
  titleTranslations: Record<string, string> | null;
  status: string;
  requiredSeconds: number;
  requiresLive: boolean;
  is18Plus: boolean;
  riskLevel: number;
  thumbnailUrl?: string | null;
  owner?: {
    id?: string;
    username?: string | null;
    avatarUrl?: string | null;
  } | null;
};

type ViewerInfo = {
  id: string;
  isAdultVerified: boolean;
  dateOfBirth: string | null;
};

type AttemptLite = {
  id: string;
  status: string;
  isLive: boolean;
  assetPlaybackId?: string | null;
};

type LiveInfo = {
  streamKey: string | null;
  rtmpUrl: string | null;
  isLive: boolean;
  isPrepared: boolean;
};

function normalizeLocale(input: string | null | undefined): ChallengeLocale {
  const raw = String(input ?? "").trim().toLowerCase().slice(0, 2);
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

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload));
    const id = json.sub ?? json.id ?? json.userId ?? json.user?.id ?? null;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

function isAtLeast18(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (!Number.isFinite(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 18;
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

async function getErrorMessageFromResponse(res: Response): Promise<string> {
  const fallback = `Request fehlgeschlagen (${res.status})`;
  try {
    const data = await res.clone().json();
    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }
    if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
    if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  } catch {}
  try {
    const txt = await res.text();
    if (txt?.trim()) return txt.trim();
  } catch {}
  return fallback;
}

async function readApi(resOrJson: unknown) {
  if (
    resOrJson &&
    typeof resOrJson === "object" &&
    typeof (resOrJson as { ok: boolean }).ok === "boolean"
  ) {
    const res = resOrJson as Response;
    if (!res.ok) {
      const msg = await getErrorMessageFromResponse(res);
      return { ok: false, status: res.status, json: null, errorText: msg };
    }
    const json = await res.json().catch(() => null);
    return { ok: true, status: res.status, json };
  }
  return { ok: true, status: 200, json: resOrJson };
}

function resolveImageUrl(url: string | null | undefined): string | null {
  const value = String(url ?? "").trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
    return apiBase ? `${apiBase}${value}` : value;
  }
  return value;
}

function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function SubmitPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [myAttempt, setMyAttempt] = useState<AttemptLite | null>(null);

  const [riskAck, setRiskAck] = useState(false);
  const [startingLive, setStartingLive] = useState(false);
  const [stoppingLive, setStoppingLive] = useState(false);
  const [takingAttempt, setTakingAttempt] = useState(false);
  const [liveInfo, setLiveInfo] = useState<LiveInfo | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionInfo, setActionInfo] = useState("");

  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const myId = useMemo(() => getUserIdFromToken(token), [token]);
  const loginHref = useMemo(() => {
    if (!id) return "/auth/login";
    return `/auth/login?redirect=${encodeURIComponent(`/challenges/${id}/submit`)}`;
  }, [id]);

  const redirectToLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
    }
    setToken(null);
    setViewer(null);
    router.replace(loginHref);
  }, [router, loginHref]);

  useEffect(() => {
    const nextToken = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
    setToken(nextToken);
    if (!nextToken) {
      router.replace(loginHref);
    }
  }, [router, loginHref]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await apiFetch("/users/me", { method: "GET" }, true);
        const parsed = await readApi(res);
        if (!parsed.ok) {
          if (parsed.status === 401) redirectToLogin();
          return;
        }
        const raw = parsed.json?.data ?? parsed.json;
        setViewer({
          id: String(raw?.id ?? ""),
          isAdultVerified: !!raw?.isAdultVerified,
          dateOfBirth: raw?.dateOfBirth ?? null,
        });
      } catch (error) {
        const message = getErrorMessage(error, "");
        if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
          redirectToLogin();
        }
      }
    })();
  }, [token, redirectToLogin]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingChallenge(true);
        setLoadError("");
        const res = await apiFetch(`/challenges/${id}`, { method: "GET" });
        const parsed = await readApi(res);
        if (!parsed.ok) throw new Error(parsed.errorText || "Challenge nicht gefunden");
        const raw = parsed.json?.data ?? parsed.json;
        setChallenge({
          id: String(raw.id),
          title: raw.title ?? "",
          titleTranslations: raw.titleTranslations ?? raw.title_translations ?? null,
          status: String(raw.status ?? ""),
          requiredSeconds: clampInt(raw.requiredSeconds ?? raw.required_seconds ?? 10, 3, 300, 10),
          requiresLive: !!(raw.requiresLive ?? raw.requires_live ?? false),
          is18Plus: !!(raw.is18Plus ?? raw.is_18_plus ?? raw.is18_plus ?? false),
          riskLevel: clampInt(raw.riskLevel ?? raw.risk_level ?? 0, 0, 2, 0),
          thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail_url ?? null,
          owner: raw.owner
            ? {
                id: raw.owner.id ? String(raw.owner.id) : undefined,
                username: raw.owner.username ?? null,
                avatarUrl: raw.owner.avatarUrl ?? null,
              }
            : null,
        });
      } catch (error) {
        setLoadError(getErrorMessage(error, "Challenge konnte nicht geladen werden."));
      } finally {
        setLoadingChallenge(false);
      }
    })();
  }, [id]);

  const refreshMyAttempt = useCallback(async () => {
    if (!id || !myId || !token) return;
    try {
      const res = await apiFetch(`/challenges/${id}/attempts/all`, { method: "GET" }, true);
      const parsed = await readApi(res);

      if (!parsed.ok) {
        if (parsed.status === 401) {
          redirectToLogin();
          return;
        }
      } else {
        const raw = parsed.json?.data ?? parsed.json;
        const arr = Array.isArray(raw) ? raw : [];
        const mine = arr.find((a: { userId: unknown }) => String(a.userId) === String(myId));
        if (mine) {
          setMyAttempt({
            id: String(mine.id),
            status: String(mine.status),
            isLive: !!(mine.isLive ?? mine.is_live),
            assetPlaybackId: mine.assetPlaybackId ?? mine.asset_playback_id ?? null,
          });
          return;
        }
      }
    } catch (error) {
      const message = getErrorMessage(error, "");
      if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
        redirectToLogin();
        return;
      }
    }

    try {
      const res = await apiFetch(`/challenges/${id}/attempts`, { method: "GET" });
      const parsed = await readApi(res);
      if (parsed.ok) {
        const raw = parsed.json?.data ?? parsed.json;
        const arr = Array.isArray(raw) ? raw : [];
        const mine = arr.find((a: { userId: unknown }) => String(a.userId) === String(myId));
        if (mine) {
          setMyAttempt({
            id: String(mine.id),
            status: String(mine.status),
            isLive: !!(mine.isLive ?? mine.is_live),
            assetPlaybackId: mine.assetPlaybackId ?? mine.asset_playback_id ?? null,
          });
          return;
        }
      }
      setMyAttempt(null);
    } catch {}
  }, [id, myId, token, redirectToLogin]);

  useEffect(() => {
    if (myId && token) {
      refreshMyAttempt();
    }
  }, [myId, token, refreshMyAttempt]);

  useEffect(() => {
    if (myAttempt?.status !== "live") return;
    const interval = setInterval(refreshMyAttempt, 3000);
    return () => clearInterval(interval);
  }, [myAttempt?.status, refreshMyAttempt]);

  const isCompleted = useMemo(() => {
    const status = String(challenge?.status ?? "").toLowerCase();
    return status === "completed" || status === "voting";
  }, [challenge]);

  const isAttemptWindowOpen = useMemo(() => {
    const status = String(challenge?.status ?? "").toLowerCase();
    return status === "active";
  }, [challenge]);

  const adultOnly = useMemo(() => !!challenge?.is18Plus, [challenge]);

  const isAdultAllowed = useMemo(() => {
    if (!adultOnly) return true;
    if (viewer?.isAdultVerified) return true;
    if (isAtLeast18(viewer?.dateOfBirth)) return true;
    return false;
  }, [adultOnly, viewer]);

  const riskLevel = useMemo(() => challenge?.riskLevel ?? 0, [challenge]);
  const gatingNeeded = useMemo(() => !!token && (riskLevel >= 2 || adultOnly), [token, riskLevel, adultOnly]);
  const gatingOk = useMemo(() => {
    if (riskLevel >= 2) return riskAck;
    return true;
  }, [riskLevel, riskAck]);
  const requiresLive = useMemo(() => !!challenge?.requiresLive, [challenge]);

  const title = useMemo(() => {
    if (!challenge) return "";
    const translated = challenge.titleTranslations?.[activeLocale];
    if (translated && translated.trim()) return translated.trim();
    return challenge.title;
  }, [challenge, activeLocale]);

  const thumbnailSrc = useMemo(() => resolveImageUrl(challenge?.thumbnailUrl), [challenge?.thumbnailUrl]);
  const isLiveActive = myAttempt?.status === "live" || myAttempt?.isLive;
  const isSubmitted = myAttempt?.status === "submitted";
  const isProcessing = myAttempt?.status === "processing";
  const hasSubmittedVideo = useMemo(
    () =>
      myAttempt?.status === "submitted" ||
      myAttempt?.status === "processing" ||
      !!myAttempt?.assetPlaybackId,
    [myAttempt?.assetPlaybackId, myAttempt?.status]
  );
  const stageTimer = formatTimer(isLiveActive ? challenge?.requiredSeconds ?? 0 : 0);

  const activeStep = useMemo(() => {
    if (hasSubmittedVideo) return 3;
    if (isLiveActive || !!liveInfo?.isPrepared) return 2;
    return 1;
  }, [hasSubmittedVideo, isLiveActive, liveInfo?.isPrepared]);

  const handleTakeAttempt = useCallback(async (): Promise<AttemptLite | null> => {
    if (!token) {
      router.replace(loginHref);
      return null;
    }
    if (!id) return null;
    try {
      setTakingAttempt(true);
      setActionError("");
      const res = await apiFetch(`/challenges/${id}/attempts`, { method: "POST" }, true);
      const parsed = await readApi(res);
      if (!parsed.ok) {
        if (parsed.status === 401) {
          redirectToLogin();
          return null;
        }
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en" ? "Failed to create attempt" : "Attempt anlegen fehlgeschlagen")
        );
      }

      const res2 = await apiFetch(`/challenges/${id}/attempts/all`, { method: "GET" }, true);
      const parsed2 = await readApi(res2);
      if (!parsed2.ok) {
        if (parsed2.status === 401) {
          redirectToLogin();
          return null;
        }
        return null;
      }

      const raw = parsed2.json?.data ?? parsed2.json;
      const arr = Array.isArray(raw) ? raw : [];
      const mine = arr.find((a: { userId: unknown }) => String(a.userId) === String(myId));
      if (mine) {
        const lite: AttemptLite = {
          id: String(mine.id),
          status: String(mine.status),
          isLive: !!(mine.isLive ?? mine.is_live),
          assetPlaybackId: mine.assetPlaybackId ?? mine.asset_playback_id ?? null,
        };
        setMyAttempt(lite);
        return lite;
      }

      return null;
    } catch (error) {
      const message = getErrorMessage(
        error,
        activeLocale === "en" ? "Failed to create attempt" : "Attempt anlegen fehlgeschlagen"
      );
      if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
        redirectToLogin();
        return null;
      }
      setActionError(message);
      return null;
    } finally {
      setTakingAttempt(false);
    }
  }, [token, id, router, loginHref, activeLocale, myId, redirectToLogin]);

  const handleStartLive = useCallback(async () => {
    if (!token) {
      router.replace(loginHref);
      return;
    }
    try {
      setStartingLive(true);
      setActionError("");
      setActionInfo("");

      let attempt = myAttempt;
      if (!attempt?.id) {
        attempt = await handleTakeAttempt();
        if (!attempt?.id) return;
      }

      if (attempt.status === "submitted") {
        setActionError(activeLocale === "en" ? "Already submitted." : "Bereits eingereicht.");
        return;
      }

      if (hasSubmittedVideo) {
        setActionInfo(
          activeLocale === "en"
            ? "Your video has already been validly submitted. No further recording is possible."
            : "Dein Video wurde bereits gueltig eingereicht. Pro Teilnehmer ist in dieser Challenge nur eine gueltige Einreichung moeglich."
        );
        return;
      }

      const res = await apiFetch(`/attempts/${attempt.id}/live/start`, { method: "POST" }, true);
      const parsed = await readApi(res);
      if (!parsed.ok) {
        if (parsed.status === 401) {
          redirectToLogin();
          return;
        }
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en" ? "Failed to start live" : "Live starten fehlgeschlagen")
        );
      }

      const json = parsed.json?.data ?? parsed.json;
      setLiveInfo({
        streamKey: json?.streamKey ?? null,
        rtmpUrl: json?.rtmpUrl ?? null,
        isLive: !!json?.isLive,
        isPrepared: !!json?.isPrepared,
      });
      setMyAttempt((prev) =>
        prev ? { ...prev, status: json?.isLive ? "live" : "draft", isLive: !!json?.isLive } : prev
      );
      setActionInfo(
        json?.isLive
          ? activeLocale === "en"
            ? "Live stream is running."
            : "Live-Stream läuft."
          : activeLocale === "en"
            ? "Stream prepared. Start OBS with RTMP URL and stream key."
            : "Stream vorbereitet. Starte OBS mit RTMP-URL und Stream Key."
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        activeLocale === "en" ? "Failed to start live" : "Live starten fehlgeschlagen"
      );
      if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
        redirectToLogin();
        return;
      }
      setActionError(message);
    } finally {
      setStartingLive(false);
    }
  }, [token, router, loginHref, myAttempt, handleTakeAttempt, activeLocale, redirectToLogin, hasSubmittedVideo]);

  const handleStopLive = useCallback(async () => {
    if (!token) {
      router.replace(loginHref);
      return;
    }
    if (!myAttempt?.id) return;

    const ok = confirm(activeLocale === "en" ? "Stop the live attempt?" : "Live-Versuch wirklich stoppen?");
    if (!ok) return;

    try {
      setStoppingLive(true);
      setActionError("");

      const res = await apiFetch(`/attempts/${myAttempt.id}/live/stop`, { method: "POST" }, true);
      const parsed = await readApi(res);
      if (!parsed.ok) {
        if (parsed.status === 401) {
          redirectToLogin();
          return;
        }
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en" ? "Failed to stop live" : "Live stoppen fehlgeschlagen")
        );
      }

      setLiveInfo(null);
      setMyAttempt((prev) => (prev ? { ...prev, status: "processing", isLive: false } : prev));
      setActionInfo(
        activeLocale === "en"
          ? "Live stopped. Replay is being processed."
          : "Live beendet. Replay wird verarbeitet."
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        activeLocale === "en" ? "Failed to stop live" : "Live stoppen fehlgeschlagen"
      );
      if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
        redirectToLogin();
        return;
      }
      setActionError(message);
    } finally {
      setStoppingLive(false);
    }
  }, [token, router, loginHref, myAttempt, activeLocale, redirectToLogin]);

  const qualityChecks = useMemo(
    () => [
      {
        label:
          activeLocale === "en"
            ? "Minimum duration"
            : activeLocale === "es"
              ? "Duración mínima"
              : activeLocale === "fr"
                ? "Durée minimale"
                : "Mindestdauer",
        ok: !!challenge,
        value: challenge ? `${challenge.requiredSeconds}s` : "",
      },
      {
        label:
          activeLocale === "en"
            ? "Good visibility"
            : activeLocale === "es"
              ? "Buena visibilidad"
              : activeLocale === "fr"
                ? "Bonne visibilité"
                : "Gute Belichtung",
        ok: true,
        value: "",
      },
      {
        label:
          activeLocale === "en"
            ? "No cuts or edits"
            : activeLocale === "es"
              ? "Sin cortes ni edición"
              : activeLocale === "fr"
                ? "Sans coupe ni montage"
                : "Kein Schnitt",
        ok: true,
        value: "",
      },
      {
        label:
          activeLocale === "en"
            ? "Participation requirements"
            : activeLocale === "es"
              ? "Requisitos de participación"
              : activeLocale === "fr"
                ? "Conditions de participation"
                : "Teilnahmevoraussetzungen",
        ok: !gatingNeeded || gatingOk,
        value:
          gatingNeeded && !gatingOk
            ? activeLocale === "en"
              ? "Please confirm"
              : activeLocale === "es"
                ? "Confirma primero"
                : activeLocale === "fr"
                  ? "Merci de confirmer"
                  : "Bitte bestätigen"
            : "",
      },
      {
        label:
          activeLocale === "en"
            ? "Video processing"
            : activeLocale === "es"
              ? "Procesamiento del video"
              : activeLocale === "fr"
                ? "Traitement de la vidéo"
                : "Video wird verarbeitet",
        ok: isSubmitted || !isProcessing,
        value:
          isProcessing
            ? activeLocale === "en"
              ? "Running"
              : activeLocale === "es"
                ? "En curso"
                : activeLocale === "fr"
                  ? "En cours"
                  : "Läuft"
            : activeLocale === "en"
              ? "Ready"
              : "Bereit",
      },
    ],
    [activeLocale, challenge, gatingNeeded, gatingOk, isSubmitted, isProcessing]
  );

  const footerAction = useMemo(() => {
    if (isCompleted || !isAttemptWindowOpen) {
      return {
        label: activeLocale === "en" ? "Back to challenge" : "Zurück zur Challenge",
        onClick: () => router.push(`/challenges/${id}`),
        disabled: false,
      };
    }

    if (requiresLive) {
      if (hasSubmittedVideo) {
        return {
          label: activeLocale === "en" ? "Already submitted" : "Bereits eingereicht",
          onClick: () => {},
          disabled: true,
        };
      }

      if (isLiveActive) {
        return {
          label: activeLocale === "en" ? "Stop live attempt" : "Live-Versuch stoppen",
          onClick: handleStopLive,
          disabled: stoppingLive,
        };
      }

      return {
        label: activeLocale === "en" ? "Start live attempt" : "Live-Versuch starten",
        onClick: handleStartLive,
        disabled: (gatingNeeded && !gatingOk) || startingLive || takingAttempt,
      };
    }

    return {
      label: hasSubmittedVideo
        ? activeLocale === "en"
          ? "Already submitted"
          : "Bereits eingereicht"
        : activeLocale === "en"
          ? "Go to recorder"
          : "Zum Recorder",
      onClick: () => {
        if (hasSubmittedVideo) return;
        const node = document.getElementById("submit-recorder-stage");
        node?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      disabled: hasSubmittedVideo,
    };
  }, [
    isCompleted,
    isAttemptWindowOpen,
    requiresLive,
    isLiveActive,
    activeLocale,
    router,
    id,
    handleStopLive,
    stoppingLive,
    handleStartLive,
    gatingNeeded,
    gatingOk,
    startingLive,
    takingAttempt,
    hasSubmittedVideo,
  ]);

  if (loadingChallenge) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_24%),linear-gradient(180deg,#050A12_0%,#09111D_100%)] px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-[430px] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
        </div>
      </main>
    );
  }

  if (loadError || !challenge) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#050A12_0%,#09111D_100%)] px-4 py-6 text-white">
        <div className="mx-auto w-full max-w-[430px]">
          <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {loadError || "Challenge nicht gefunden."}
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-sm font-medium text-cyan-300 underline"
          >
            {activeLocale === "en" ? "Back" : "Zurück"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_18%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_20%),linear-gradient(180deg,#040913_0%,#07111D_100%)] text-white">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-32 pt-4">
        <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,32,0.96)_0%,rgba(8,14,25,0.92)_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/challenges/${id}`)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-lg text-white"
            >
              ←
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[20px] font-black tracking-[-0.03em] text-white">
                {activeLocale === "en"
                  ? "Create submission"
                  : activeLocale === "es"
                    ? "Crear envío"
                    : activeLocale === "fr"
                      ? "Créer une soumission"
                      : "Einreichung erstellen"}
              </div>
              <div className="mt-1 text-[12px] leading-5 text-slate-400">
                {activeLocale === "en"
                  ? "Record cleanly, review the result and submit it once."
                  : activeLocale === "es"
                    ? "Graba con claridad, revisa el resultado y envíalo una sola vez."
                    : activeLocale === "fr"
                      ? "Enregistre proprement, vérifie le résultat puis soumets-le une seule fois."
                      : "Sauber aufnehmen, Ergebnis prüfen und einmal sauber einreichen."}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#071427_0%,#09101C_100%)] p-3 shadow-[0_18px_44px_rgba(0,0,0,0.30)]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                {thumbnailSrc ? (
                  <Image
                    src={thumbnailSrc}
                    alt={title}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-500">
                    DP
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-white">{title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-400">
                  <span>{challenge.owner?.username ? `@${challenge.owner.username}` : "Challenge"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>{requiresLive ? "Live" : "Video"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.04] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            {[
              { step: 1, label: activeLocale === "en" ? "Record" : "Aufnehmen" },
              { step: 2, label: activeLocale === "en" ? "Review" : "Prüfen" },
              { step: 3, label: activeLocale === "en" ? "Submit" : "Absenden" },
            ].map((item, index) => (
              <div key={item.step} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    item.step <= activeStep
                      ? "bg-cyan-500 text-slate-950"
                      : "bg-white/[0.08] text-slate-300"
                  }`}
                >
                  {item.step}
                </div>
                <span
                  className={`truncate text-[12px] font-semibold ${
                    item.step <= activeStep ? "text-white" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
                {index < 2 ? <div className="h-px flex-1 bg-white/10" /> : null}
              </div>
            ))}
          </div>
        </section>

        {(actionInfo || actionError) && (
          <div
            className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
              actionError
                ? "border-red-400/20 bg-red-500/[0.08] text-red-200"
                : "border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-200"
            }`}
          >
            {actionError || actionInfo}
          </div>
        )}

        {hasSubmittedVideo ? (
          <section className="mt-4 rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="text-[15px] font-bold text-emerald-200">
              {activeLocale === "en" ? "Already submitted" : "Du hast bereits eingereicht"}
            </div>
            <div className="mt-2 text-[14px] leading-6 text-emerald-100/90">
              {activeLocale === "en"
                ? "Your video has already been validly submitted. A further recording for this challenge is no longer possible."
                : "Dein Video wurde bereits gueltig eingereicht. Pro Teilnehmer ist in dieser Challenge nur eine gueltige Einreichung moeglich."}
            </div>
          </section>
        ) : null}

        {!isCompleted && gatingNeeded && !gatingOk && (
          <section className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-400/[0.07] p-4">
            <div className="flex items-start gap-3">
              <input
                id="submit-risk-ack"
                type="checkbox"
                checked={riskAck}
                onChange={(e) => setRiskAck(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 accent-cyan-500"
              />
              <label htmlFor="submit-risk-ack" className="text-[13px] leading-5 text-amber-100/90">
                {activeLocale === "en"
                  ? "I understand the participation rules and confirm I am allowed to upload this attempt."
                  : activeLocale === "es"
                    ? "Entiendo las reglas de participación y confirmo que puedo subir este intento."
                    : activeLocale === "fr"
                      ? "Je comprends les règles de participation et je confirme pouvoir envoyer cette tentative."
                      : "Ich verstehe die Teilnahmebedingungen und bestätige, dass ich diesen Versuch hochladen darf."}
              </label>
            </div>
          </section>
        )}

        {isCompleted && !hasSubmittedVideo && (
          <section className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-400/[0.07] p-4">
            <div className="text-sm font-bold text-amber-200">
              {activeLocale === "en" ? "Submission closed" : "Einreichung geschlossen"}
            </div>
            <div className="mt-1 text-[13px] text-amber-100/75">
              {activeLocale === "en"
                ? "This challenge is no longer accepting submissions."
                : "Diese Challenge nimmt keine neuen Einreichungen mehr an."}
            </div>
          </section>
        )}

        {!isCompleted && !isAttemptWindowOpen && (
          <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-bold text-white">
              {activeLocale === "en" ? "Not open yet" : "Noch nicht geöffnet"}
            </div>
            <div className="mt-1 text-[13px] text-slate-400">
              {activeLocale === "en"
                ? "This challenge does not accept submissions yet."
                : "Diese Challenge nimmt noch keine Einreichungen an."}
            </div>
          </section>
        )}

        {!isCompleted && isAttemptWindowOpen && (
          <section
            id="submit-recorder-stage"
            className="mt-4 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#071427_0%,#08111F_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.38)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-500/12 px-3 py-1 text-[12px] font-black text-red-200">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                REC
              </div>
              <div className="text-[12px] font-semibold text-slate-400">
                {stageTimer} / {challenge.requiredSeconds}s
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950">
              <div className="aspect-[4/5] w-full bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),linear-gradient(135deg,#091221_0%,#0F1B2E_50%,#08111F_100%)] p-5">
                <div className="flex h-full flex-col justify-between rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300/90">
                      {requiresLive ? "Live Capture" : "Verified Recorder"}
                    </div>
                    <div className="mt-2 text-[24px] font-black tracking-[-0.03em] text-white">
                      {requiresLive
                        ? activeLocale === "en"
                          ? "Capture the attempt in one clean live run."
                          : "Erfasse den Versuch in einem sauberen Live-Durchlauf."
                        : activeLocale === "en"
                          ? "Record your full attempt directly on this screen."
                          : "Nimm deinen kompletten Versuch direkt auf diesem Screen auf."}
                    </div>
                    <div className="mt-2 text-[13px] leading-6 text-slate-300">
                      {requiresLive
                        ? activeLocale === "en"
                          ? "Use the live workflow, then stop cleanly so the replay can be processed."
                          : "Nutze den Live-Workflow und beende ihn sauber, damit das Replay verarbeitet werden kann."
                        : activeLocale === "en"
                          ? "Keep the camera stable, visible and uncut. After recording, review and submit once."
                          : "Halte Kamera und Motiv stabil, gut sichtbar und ohne Schnitt. Nach der Aufnahme prüfen und einmal einreichen."}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[12px] font-bold text-white">
                        {requiresLive ? "LIVE" : "VIDEO"}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[12px] font-bold text-slate-300">
                        {activeLocale === "en"
                          ? `Minimum ${challenge.requiredSeconds}s`
                          : `Mindestens ${challenge.requiredSeconds}s`}
                      </span>
                      {isSubmitted ? (
                        <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[12px] font-bold text-emerald-200">
                          {activeLocale === "en" ? "Submitted" : "Eingereicht"}
                        </span>
                      ) : isProcessing ? (
                        <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[12px] font-bold text-amber-200">
                          {activeLocale === "en" ? "Processing" : "Verarbeitung"}
                        </span>
                      ) : null}
                    </div>

                    {requiresLive ? (
                      <div className="grid gap-3">
                        <PrimaryButton
                          type="button"
                          variant={isLiveActive ? "secondary" : "dark"}
                          onClick={isLiveActive ? handleStopLive : handleStartLive}
                          disabled={hasSubmittedVideo || (gatingNeeded && !gatingOk)}
                          loading={isLiveActive ? stoppingLive : startingLive || takingAttempt}
                          loadingText={isLiveActive ? "Stoppe..." : "Starte..."}
                          className="w-full"
                        >
                          {hasSubmittedVideo
                            ? activeLocale === "en"
                              ? "Already submitted"
                              : "Bereits eingereicht"
                            : isLiveActive
                              ? activeLocale === "en"
                                ? "Stop live attempt"
                                : "Live-Versuch stoppen"
                              : activeLocale === "en"
                                ? "Start live attempt"
                                : "Live-Versuch starten"}
                        </PrimaryButton>

                        {(liveInfo?.rtmpUrl || liveInfo?.streamKey) && (
                          <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3 text-[12px] text-slate-300">
                            {liveInfo?.rtmpUrl ? (
                              <div>
                                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  RTMP URL
                                </div>
                                <div className="break-all font-mono">{liveInfo.rtmpUrl}</div>
                              </div>
                            ) : null}
                            {liveInfo?.streamKey ? (
                              <div className={liveInfo?.rtmpUrl ? "mt-3" : ""}>
                                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                  Stream Key
                                </div>
                                <div className="break-all font-mono">{liveInfo.streamKey}</div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {!requiresLive && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <RecordedAttemptRecorder
                  token={token}
                  alreadySubmitted={hasSubmittedVideo}
                  attemptWindowOpen={isAttemptWindowOpen}
                  adultOnly={adultOnly}
                  isAdultAllowed={isAdultAllowed}
                  gatingNeeded={gatingNeeded}
                  gatingOk={gatingOk}
                  requiredSeconds={challenge.requiredSeconds}
                  myAttempt={myAttempt ? { id: myAttempt.id, status: myAttempt.status } : null}
                  onEnsureAttempt={handleTakeAttempt}
                  onUploaded={async () => {
                    await refreshMyAttempt();
                    setActionInfo(
                      activeLocale === "en"
                        ? "Video recorded and submitted for processing."
                        : "Video aufgenommen und zur Verarbeitung eingereicht."
                    );
                    setActionError("");
                  }}
                  onError={(msg) => {
                    setActionError(msg);
                    setActionInfo("");
                  }}
                  onInfo={(msg) => {
                    setActionInfo(msg);
                    setActionError("");
                  }}
                  texts={{
                    verifiedRecordingTitle:
                      activeLocale === "en" ? "Verified recording" : "Verifizierte Aufnahme",
                    verifiedRecordingText:
                      activeLocale === "en"
                        ? `Record your attempt directly in the app, review the preview and submit it afterwards. Minimum duration: ${challenge.requiredSeconds}s.`
                        : `Nimm deinen Versuch direkt in der App auf, prüfe die Vorschau und reiche ihn danach ein. Mindestdauer: ${challenge.requiredSeconds}s.`,
                    participationClosed:
                      activeLocale === "en"
                        ? "Participation is not open right now."
                        : "Teilnahme ist aktuell nicht offen.",
                    noRecordingYet:
                      activeLocale === "en"
                        ? "No recording yet. Start when your framing is ready."
                        : "Noch keine Aufnahme vorhanden. Starte erst, wenn dein Bild sauber sitzt.",
                    ready: activeLocale === "en" ? "Ready" : "Bereit",
                    minimumDuration10:
                      activeLocale === "en"
                        ? `Minimum duration ${challenge.requiredSeconds}s`
                        : `Mindestdauer ${challenge.requiredSeconds}s`,
                    startRecording:
                      activeLocale === "en" ? "Start recording" : "Aufnahme starten",
                  }}
                />
              </div>
            )}
          </section>
        )}

        <section className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[14px] font-black tracking-[-0.02em] text-white">
            {activeLocale === "en" ? "Quality checks" : "Qualitätschecks"}
          </div>
          <div className="mt-3 space-y-2">
            {qualityChecks.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-black ${
                      item.ok
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-white/[0.06] text-slate-400"
                    }`}
                  >
                    {item.ok ? "✓" : "•"}
                  </span>
                  <span className="text-[14px] text-slate-200">{item.label}</span>
                </div>
                {item.value ? (
                  <span className={`text-[13px] font-semibold ${item.ok ? "text-emerald-300" : "text-amber-200"}`}>
                    {item.value}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 text-center">
          <Link href={`/challenges/${id}`} className="text-[14px] font-medium text-slate-400 underline-offset-4 hover:underline">
            {activeLocale === "en" ? "Back to challenge" : "Zurück zur Challenge"}
          </Link>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[linear-gradient(180deg,rgba(5,10,18,0.72)_0%,rgba(5,10,18,0.96)_35%)] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[430px]">
          <PrimaryButton
            type="button"
            variant="dark"
            onClick={footerAction.onClick}
            disabled={footerAction.disabled}
            className="h-12 w-full"
          >
            {footerAction.label}
          </PrimaryButton>
        </div>
      </div>
    </main>
  );
}
