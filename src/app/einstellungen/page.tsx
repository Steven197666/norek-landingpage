"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  disablePushSubscription,
  isPushSupported,
  sendTestPush,
  syncPushSubscription,
} from "@/lib/push";

type ChallengeLocale = "de" | "en" | "es" | "fr";

type MeResponse = {
  id: string;
  email: string;
  username: string;
  role?: string;
  avatarUrl?: string | null;
  slogan?: string | null;
  isAdultVerified?: boolean;
  dateOfBirth?: string | null;
  notifyEmailChallengeUpdates?: boolean;
  notifyEmailPayoutUpdates?: boolean;
  notifyPushLiveEvents?: boolean;
  notifyMarketingNews?: boolean;
  stripeAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  stripeOnboardingCompletedAt?: string | null;
  stripePayoutsEnabled?: boolean;
};

type WalletOverview = {
  availableBalance?: number;
  pendingBalance?: number;
};

type NotificationSettings = {
  emailChallengeUpdates: boolean;
  emailPayoutUpdates: boolean;
  pushLiveEvents: boolean;
  marketingNews: boolean;
};

type PushStatusResponse = {
  pushEnabled?: boolean;
  activeSubscriptions?: number;
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

function getUnknownErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}

async function getApiErrorMessage(res: Response, fallback: string) {
  try {
    const clone = res.clone();
    const data = await clone.json();

    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    //
  }

  try {
    const txt = await res.text();
    if (txt?.trim()) return txt;
  } catch {
    //
  }

  return fallback;
}

function getBackendBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001/api";

  return raw.endsWith("/api") ? raw.slice(0, -4) : raw;
}

function getAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
  return `${getBackendBaseUrl()}${avatarUrl}`;
}

function isAtLeast18(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) return false;

  const dob = new Date(dateOfBirth);
  if (!Number.isFinite(dob.getTime())) return false;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();

  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 18;
}

function formatMoney(value: number | undefined) {
  const safe = Number(value ?? 0);
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(safe) ? safe : 0);
}

function initials(username: string) {
  const clean = (username || "").trim();
  if (!clean) return "?";
  return clean.slice(0, 2).toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [me, setMe] = useState<MeResponse | null>(null);
  const [wallet, setWallet] = useState<WalletOverview | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [slogan, setSlogan] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [activeLocale, setActiveLocale] = useState<ChallengeLocale>("de");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailChallengeUpdates: true,
    emailPayoutUpdates: true,
    pushLiveEvents: true,
    marketingNews: false,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pushStatusText, setPushStatusText] = useState("Push wird geprüft...");
  const [sendingTestPush, setSendingTestPush] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [payoutAmount, setPayoutAmount] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const avatarSrc = useMemo(() => getAvatarSrc(me?.avatarUrl), [me?.avatarUrl]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("dp_username");
    localStorage.removeItem("dp_avatar_url");
    localStorage.removeItem("dp_role");
    router.replace("/auth/login");
  }, [router]);

  const refreshPushStatus = useCallback(async () => {
    if (!isPushSupported()) {
      setPushStatusText("Push auf diesem Gerät/Browser nicht verfügbar");
      return;
    }

    try {
      const statusRes = await apiFetch(
        "/notifications/push/status",
        { method: "GET" },
        true
      );
      if (!statusRes.ok) {
        setPushStatusText(`Push verfügbar (${Notification.permission})`);
        return;
      }

      const data = (await statusRes.json()) as PushStatusResponse;
      const active = Number(data.activeSubscriptions ?? 0);
      const enabled = data.pushEnabled !== false;

      if (!enabled) {
        setPushStatusText("Push-Server nicht konfiguriert");
        return;
      }

      setPushStatusText(
        `Push verfügbar (${Notification.permission}) · aktive Geräte: ${active}`
      );
    } catch {
      setPushStatusText(`Push verfügbar (${Notification.permission})`);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [meRes, walletRes] = await Promise.all([
        apiFetch("/users/me", { method: "GET" }, true),
        apiFetch("/wallet/me", { method: "GET" }, true),
      ]);

      if (!meRes.ok) {
        setError(
          await getApiErrorMessage(meRes, "Profil konnte nicht geladen werden.")
        );
        return;
      }

      const meData: MeResponse = await meRes.json();
      setMe(meData);
      setUsername(meData.username ?? "");
      setEmail(meData.email ?? "");
      setSlogan(meData.slogan ?? "");
      setDateOfBirth(meData.dateOfBirth ?? "");
      setNotifications({
        emailChallengeUpdates: meData.notifyEmailChallengeUpdates ?? true,
        emailPayoutUpdates: meData.notifyEmailPayoutUpdates ?? true,
        pushLiveEvents: meData.notifyPushLiveEvents ?? true,
        marketingNews: meData.notifyMarketingNews ?? false,
      });

      if (walletRes.ok) {
        const walletData = (await walletRes.json()) as WalletOverview;
        setWallet(walletData);
      }

      localStorage.setItem("dp_username", meData.username ?? "");
      if (meData.avatarUrl) {
        localStorage.setItem("dp_avatar_url", meData.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
      if (meData.role) {
        localStorage.setItem("dp_role", meData.role);
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Profil konnte nicht geladen werden."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    setActiveLocale(getActiveChallengeLocale());
    loadData();
    refreshPushStatus();
  }, [loadData, refreshPushStatus]);

  async function saveProfileSettings() {
    try {
      setSavingProfile(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/users/me",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            slogan: slogan.trim() ? slogan.trim() : null,
            dateOfBirth: dateOfBirth.trim() ? dateOfBirth.trim() : null,
          }),
        },
        true
      );

      if (!res.ok) {
        setError(
          await getApiErrorMessage(
            res,
            "Einstellungen konnten nicht gespeichert werden."
          )
        );
        return;
      }

      const data: MeResponse = await res.json();
      setMe(data);
      setUsername(data.username ?? "");
      setEmail(data.email ?? "");
      setSlogan(data.slogan ?? "");
      setDateOfBirth(data.dateOfBirth ?? "");
      setSuccess(
        "Profil, Slogan, Benutzername, E-Mail und Geburtsdatum gespeichert."
      );

      localStorage.setItem("dp_username", data.username ?? "");
      if (data.avatarUrl) {
        localStorage.setItem("dp_avatar_url", data.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
      if (data.role) {
        localStorage.setItem("dp_role", data.role);
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Einstellungen konnten nicht gespeichert werden."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarChange(file?: File | null) {
    if (!file) return;

    const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
      file.type
    );
    if (!isAllowed) {
      setError("Nur JPG, PNG oder WEBP erlaubt.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Bild ist zu groß (max. 5 MB).");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await apiFetch(
        "/users/me/avatar",
        {
          method: "PATCH",
          body: formData,
        },
        true
      );

      if (!res.ok) {
        setError(
          await getApiErrorMessage(
            res,
            "Profilbild konnte nicht gespeichert werden."
          )
        );
        return;
      }

      const data: MeResponse = await res.json();
      setMe(data);
      setSuccess("Profilbild aktualisiert.");

      if (data.avatarUrl) {
        localStorage.setItem("dp_avatar_url", data.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Profilbild konnte nicht gespeichert werden."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveLanguage() {
    setSavingLanguage(true);
    setError("");
    setSuccess("");

    localStorage.setItem("app_locale", activeLocale);
    localStorage.setItem("locale", activeLocale);
    localStorage.setItem("language", activeLocale);

    setSuccess("Sprache gespeichert.");
    setSavingLanguage(false);
  }

  async function saveNotifications() {
    try {
      setSavingNotifications(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/users/me",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifyEmailChallengeUpdates: notifications.emailChallengeUpdates,
            notifyEmailPayoutUpdates: notifications.emailPayoutUpdates,
            notifyPushLiveEvents: notifications.pushLiveEvents,
            notifyMarketingNews: notifications.marketingNews,
          }),
        },
        true
      );

      if (!res.ok) {
        setError(
          await getApiErrorMessage(
            res,
            "Benachrichtigungseinstellungen konnten nicht gespeichert werden."
          )
        );
        return;
      }

      const data: MeResponse = await res.json();
      setMe(data);
      const nextSettings = {
        emailChallengeUpdates: data.notifyEmailChallengeUpdates ?? true,
        emailPayoutUpdates: data.notifyEmailPayoutUpdates ?? true,
        pushLiveEvents: data.notifyPushLiveEvents ?? true,
        marketingNews: data.notifyMarketingNews ?? false,
      };
      setNotifications(nextSettings);

      if (nextSettings.pushLiveEvents) {
        const pushResult = await syncPushSubscription();

        if (pushResult.ok) {
          await refreshPushStatus();
          setSuccess(
            "Benachrichtigungseinstellungen gespeichert und Push aktiviert."
          );
        } else if (pushResult.reason === "PERMISSION_DENIED") {
          setPushStatusText("Push-Berechtigung verweigert");
          setSuccess(
            "Benachrichtigungseinstellungen gespeichert. Für Push bitte Browser-Berechtigung erlauben."
          );
        } else {
          setPushStatusText(
            `Push nicht aktiv (${pushResult.reason || "unknown"})`
          );
          setSuccess(
            "Benachrichtigungseinstellungen gespeichert. Push konnte auf diesem Gerät noch nicht aktiviert werden."
          );
        }
      } else {
        await disablePushSubscription();
        setPushStatusText("Push auf diesem Gerät deaktiviert");
        setSuccess("Benachrichtigungseinstellungen gespeichert.");
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Benachrichtigungseinstellungen konnten nicht gespeichert werden."
      );

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(msg);
    } finally {
      setSavingNotifications(false);
    }
  }

  async function handleTestPush() {
    try {
      setSendingTestPush(true);
      setError("");
      setSuccess("");

      const subResult = await syncPushSubscription();
      if (!subResult.ok) {
        setError(
          "Push-Test nicht möglich. Bitte Push erlauben und Einstellungen erneut speichern."
        );
        return;
      }

      const testResult = await sendTestPush();
      if (!testResult.ok) {
        setError("Push-Test konnte nicht gesendet werden.");
        return;
      }

      await refreshPushStatus();
      setSuccess("Push-Test gesendet. Bitte Benachrichtigung am Handy prüfen.");
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, "Push-Test fehlgeschlagen.");
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setSendingTestPush(false);
    }
  }

  async function changePassword() {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      setError("Bitte alle Passwort-Felder ausfüllen.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Neues Passwort und Wiederholung stimmen nicht überein.");
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/users/me/password",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
        true
      );

      if (!res.ok) {
        setError(
          await getApiErrorMessage(res, "Passwort konnte nicht geändert werden.")
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Passwort geändert.");
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Passwort konnte nicht geändert werden."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setChangingPassword(false);
    }
  }

  async function requestPayout() {
    const parsed = Number(payoutAmount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Bitte einen gültigen Auszahlungsbetrag eingeben.");
      return;
    }

    try {
      setRequestingPayout(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/wallet/payout-requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parsed }),
        },
        true
      );

      if (!res.ok) {
        setError(
          await getApiErrorMessage(res, "Auszahlungsanfrage fehlgeschlagen.")
        );
        return;
      }

      setPayoutAmount("");
      setSuccess("Auszahlungsanfrage erstellt.");

      const walletRes = await apiFetch("/wallet/me", { method: "GET" }, true);
      if (walletRes.ok) {
        const walletData = (await walletRes.json()) as WalletOverview;
        setWallet(walletData);
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Auszahlungsanfrage fehlgeschlagen."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setRequestingPayout(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmInput.trim() !== "DELETE") {
      setError('Bitte zur Bestätigung exakt "DELETE" eingeben.');
      return;
    }

    try {
      setDeletingAccount(true);
      setError("");
      setSuccess("");

      const res = await apiFetch("/users/me", { method: "DELETE" }, true);

      if (!res.ok) {
        setError(
          await getApiErrorMessage(res, "Account konnte nicht gelöscht werden.")
        );
        return;
      }

      logout();
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(
        e,
        "Account konnte nicht gelöscht werden."
      );
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }
      setError(msg);
    } finally {
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6">
          Einstellungen werden geladen...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050d1a] px-4 pb-24 pt-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Einstellungen
          </h1>
          <Link
            href="/profile"
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
          >
            Zum Profil
          </Link>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">Profilbild</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-white/20 bg-slate-700">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={me?.username || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                  {initials(me?.username || "")}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15 disabled:opacity-60"
              >
                {uploadingAvatar ? "Lädt..." : "Bild ändern"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">
            Benutzername, E-Mail, Slogan, Geburtsdatum / 18+ Status
          </h2>
          <div className="mt-3 grid gap-3">
            <label className="text-xs text-slate-300">Benutzername</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />

            <label className="text-xs text-slate-300">E-Mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="mb-2 block text-sm font-semibold text-white">
                Profil-Slogan
              </label>

              <textarea
                value={slogan}
                onChange={(e) => setSlogan(e.target.value.slice(0, 120))}
                placeholder="Zum Beispiel: Keine Ausreden. Nur Ergebnisse."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Ein kurzer Satz, der in deinem Profil angezeigt wird.</span>
                <span>{slogan.length}/120</span>
              </div>
            </div>

            <label className="text-xs text-slate-300">Geburtsdatum</label>
            <input
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              type="date"
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />

            <div className="text-xs text-slate-400">
              18+ Status:{" "}
              {me?.isAdultVerified || isAtLeast18(dateOfBirth)
                ? "Freigeschaltet"
                : "Nicht freigeschaltet"}
            </div>

            <button
              type="button"
              onClick={saveProfileSettings}
              disabled={savingProfile}
              className="mt-1 h-10 rounded-xl bg-[#2F78FF] text-sm font-bold text-white disabled:opacity-60"
            >
              {savingProfile ? "Speichert..." : "Profil speichern"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">Passwort ändern</h2>
          <div className="mt-3 grid gap-3">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Aktuelles Passwort"
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Neues Passwort"
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />
            <input
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              type="password"
              placeholder="Neues Passwort bestätigen"
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={changePassword}
              disabled={changingPassword}
              className="h-10 rounded-xl border border-white/20 bg-white/[0.08] text-sm font-bold text-white disabled:opacity-60"
            >
              {changingPassword ? "Speichert..." : "Passwort speichern"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">Sprache</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={activeLocale}
              onChange={(e) => setActiveLocale(e.target.value as ChallengeLocale)}
              className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <button
              type="button"
              onClick={saveLanguage}
              disabled={savingLanguage}
              className="h-10 rounded-xl border border-white/20 bg-white/[0.08] px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingLanguage ? "Speichert..." : "Sprache speichern"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">Benachrichtigungen</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-200">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifications.emailChallengeUpdates}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    emailChallengeUpdates: e.target.checked,
                  }))
                }
              />
              E-Mail: Challenge-Updates
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifications.emailPayoutUpdates}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    emailPayoutUpdates: e.target.checked,
                  }))
                }
              />
              E-Mail: Auszahlungs-Status
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifications.pushLiveEvents}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    pushLiveEvents: e.target.checked,
                  }))
                }
              />
              Push: Live-Ereignisse
            </label>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
              {pushStatusText}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifications.marketingNews}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    marketingNews: e.target.checked,
                  }))
                }
              />
              Marketing-News
            </label>

            <button
              type="button"
              onClick={saveNotifications}
              disabled={savingNotifications}
              className="mt-2 h-10 rounded-xl border border-white/20 bg-white/[0.08] text-sm font-bold text-white disabled:opacity-60"
            >
              {savingNotifications
                ? "Speichert..."
                : "Benachrichtigungen speichern"}
            </button>

            <button
              type="button"
              onClick={handleTestPush}
              disabled={sendingTestPush}
              className="h-10 rounded-xl border border-sky-300/25 bg-sky-500/15 text-sm font-bold text-sky-100 disabled:opacity-60"
            >
              {sendingTestPush ? "Sendet Test..." : "Push testen"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h2 className="text-lg font-bold text-white">Wallet / Auszahlung</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-200">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div>Verfügbar: {formatMoney(wallet?.availableBalance)}</div>
              <div>Ausstehend: {formatMoney(wallet?.pendingBalance)}</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Auszahlungsbetrag in EUR"
                inputMode="decimal"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={requestPayout}
                disabled={requestingPayout}
                className="h-10 rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-4 text-sm font-bold text-emerald-100 disabled:opacity-60"
              >
                {requestingPayout ? "Sendet..." : "Auszahlung anfordern"}
              </button>
            </div>

            <Link
              href="/wallet"
              className="inline-flex rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
            >
              Wallet-Detailseite öffnen
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-300/30 bg-amber-500/10 p-4 md:p-5">
          <h2 className="text-lg font-bold text-amber-100">Ausloggen</h2>
          <p className="mt-2 text-sm text-amber-100/85">
            Du wirst von diesem Gerät abgemeldet und zur Login-Seite weitergeleitet.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={logout}
              className="h-10 rounded-xl border border-amber-300/40 bg-amber-500/20 px-4 text-sm font-bold text-amber-100"
            >
              Jetzt ausloggen
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-300/30 bg-rose-500/10 p-4 md:p-5">
          <h2 className="text-lg font-bold text-rose-100">Account löschen</h2>
          <p className="mt-2 text-sm text-rose-100/85">
            Gib zur Bestätigung DELETE ein. Diese Aktion kann nicht rückgängig
            gemacht werden.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="h-10 rounded-xl border border-rose-300/30 bg-rose-950/30 px-3 text-sm text-rose-50 outline-none"
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deletingAccount}
              className="h-10 rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 text-sm font-bold text-rose-100 disabled:opacity-60"
            >
              {deletingAccount ? "Löscht..." : "Account löschen"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}