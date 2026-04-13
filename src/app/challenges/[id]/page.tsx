"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Comments from "@/components/Comments";
import VoteButtons from "@/components/VoteButtons";
import UserLink from "@/components/UserLink";
import VideoPlayer from "@/components/VideoPlayer";
import MuxVideoPlayer from "@/components/MuxVideoPlayer";
import RecordedAttemptRecorder from "@/components/RecordedAttemptRecorder";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CheckoutConsent from "@/components/legal/CheckoutConsent";

type VoteValue = -1 | 0 | 1;

type Viewer = {
  id: string;
  username?: string;
  role?: string;
  isAdultVerified?: boolean;
  dateOfBirth?: string | null;
};

type Attempt = {
  id: string;
  challengeId: string;
  userId: string;
  username?: string | null;
  status: string;
  isLive: boolean;
  hasStreamed: boolean;
  playbackId: string | null;
  livePlaybackId: string | null;
  assetPlaybackId: string | null;
  upVotes: number;
  downVotes: number;
  score: number;
  myVote?: VoteValue;
  submittedAt: string | null;
  liveSeconds?: number | null;
  minLiveSecondsRequired?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type LiveStartResponse = {
  playbackId: string | null;
  isLive: boolean;
  isPrepared?: boolean;
  status?: string | null;
  streamKey: string | null;
  rtmpUrl: string | null;
};

type LiveStatusResponse = {
  isPrepared: boolean;
  isLive: boolean;
  status: string;
  playbackId: string | null;
  playbackUrl?: string | null;
  streamId?: string | null;
};

type Owner = {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  avatarUrl?: string | null;
};

type FundUser = {
  id: string;
  username?: string;
  avatarUrl?: string | null;
};

type Fund = {
  id: string;
  amount: number;
  createdAt?: string;
  user?: FundUser;
};

type Winner = {
  attemptId: string;
  userId: string | null;
  username: string | null;
  playbackId: string | null;
  score: number;
  submittedAt: string | null;
};

type ChallengeLocale = "de" | "en" | "es" | "fr";
type TranslationMap = Partial<Record<ChallengeLocale, string>>;

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  originalLanguage?: string | null;
  titleTranslations?: TranslationMap | null;
  descriptionTranslations?: TranslationMap | null;
  thumbnailUrl?: string | null;
  minAmount: number | null;
  currentAmount: number | null;
  status: "funding" | "active" | "completed" | "voting" | string;
  owner: Owner;
  votingEndsAt?: string | null;
  requiredSeconds?: string | number | null;
  riskLevel?: number | null;
  is18Plus?: boolean | null;
  verificationMode?: string | null;
  requiresLive?: boolean | null;
  allowRecordedAttempt?: boolean | null;
  funds?: Fund[];
  liveVideoUrl?: string | null;
  playbackId?: string | null;
  isLive?: boolean;
  winnerAttemptId?: string | null;
  winnerUserId?: string | null;
  winnerPlaybackId?: string | null;
  winner?: Winner | null;
  result?: string | null;
};

type CheckoutSessionResponse = {
  paymentTransactionId?: string;
  checkoutSessionId?: string;
  checkoutUrl?: string | null;
};

type AdminPayout = {
  id: string;
  challengeId: string;
  winnerUserId: string;
  grossAmount: string;
  platformFeeAmount: string;
  netAmount: string;
  currency: string;
  provider: string;
  status: string;
  providerTransferId?: string | null;
  providerPayoutId?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
  compact = false,
  id,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-[28px] border border-white/10 bg-[#0B1322] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5 ${
        compact ? "p-5" : "p-6"
      } ${className}`}
    >
      {(title || subtitle) && (
        <div className={compact ? "mb-4" : "mb-5"}>
          {title ? (
            <div
              className={`${
                compact ? "text-[17px]" : "text-xl"
              } font-extrabold tracking-tight text-white`}
            >
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div className="mt-1.5 text-sm leading-6 text-slate-400">
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/12 text-amber-200"
        : tone === "danger"
          ? "border-red-500/25 bg-red-500/12 text-red-200"
          : tone === "info"
            ? "border-blue-400/25 bg-blue-500/12 text-blue-200"
            : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <div className={`rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}>
      {children}
    </div>
  );
}

function EmptyHint({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-slate-400">{text}</div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "success" | "danger" | "info" | "warning";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/15 bg-emerald-500/[0.06]"
      : tone === "danger"
        ? "border-red-500/15 bg-red-500/[0.06]"
        : tone === "warning"
          ? "border-amber-400/15 bg-amber-400/[0.06]"
          : tone === "info"
            ? "border-blue-400/15 bg-blue-500/[0.06]"
            : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-2xl border px-3 py-2 ${cls}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function QuickAmountButton({
  value,
  active,
  onClick,
  locale = "de",
}: {
  value: number;
  active: boolean;
  onClick: (value: number) => void;
  locale?: ChallengeLocale;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-[18px] border px-4 py-2.5 text-sm font-extrabold transition ${
        active
          ? "border-blue-400/25 bg-blue-500/15 text-blue-100 ring-4 ring-blue-500/10"
          : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
      }`}
    >
      {formatMoneyEUR(value, locale)}
    </button>
  );
}

function StatusMessage({
  title,
  text,
  tone = "neutral",
  compact = false,
}: {
  title: string;
  text: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  compact?: boolean;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-100"
        : tone === "danger"
          ? "border-red-500/20 bg-red-500/[0.08] text-red-100"
          : tone === "info"
            ? "border-blue-400/20 bg-blue-500/[0.08] text-blue-100"
            : "border-white/10 bg-white/[0.03] text-slate-300";

  return (
    <div className={`rounded-2xl border ${compact ? "p-3.5" : "p-4"} ${cls}`}>
      <div className="text-sm font-extrabold">{title}</div>
      <div className={`text-sm leading-6 ${compact ? "mt-1" : "mt-1.5"} text-slate-300`}>
        {text}
      </div>
    </div>
  );
}

function SidebarBlock({
  title,
  children,
  emphasis = false,
}: {
  title: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        emphasis
          ? "border-slate-300 bg-white shadow-sm"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-3 text-sm font-extrabold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function RankBadge({
  rank,
  isWinner = false,
  isLeader = false,
  locale = "de",
}: {
  rank: number;
  isWinner?: boolean;
  isLeader?: boolean;
  locale?: ChallengeLocale;
}) {
  const winnerLabel =
    locale === "en"
      ? "🏆 Winner"
      : locale === "es"
        ? "🏆 Ganador"
        : locale === "fr"
          ? "🏆 Gagnant"
          : "🏆 Sieger";

  const leaderLabel =
    locale === "en"
      ? "👑 Currently leading"
      : locale === "es"
        ? "👑 Va ganando"
        : locale === "fr"
          ? "👑 Mène actuellement"
          : "👑 Führt aktuell";

  if (isWinner) {
    return (
      <span className="inline-flex items-center rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
        {winnerLabel}
      </span>
    );
  }

  if (isLeader) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
        {leaderLabel}
      </span>
    );
  }

  if (rank === 1) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
        #1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-800">
        #2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-900">
        #3
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-700">
      #{rank}
    </span>
  );
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

  if (stored) {
    return normalizeLocale(stored);
  }

  return normalizeLocale(window.navigator.language);
}

function getLocalizedChallengeText(
  original: string | null | undefined,
  translations: TranslationMap | null | undefined,
  locale: ChallengeLocale
) {
  const translated = translations?.[locale];
  if (typeof translated === "string" && translated.trim()) {
    return translated.trim();
  }
  return String(original ?? "").trim();
}

function getIntlLocale(locale: ChallengeLocale) {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es-ES";
  if (locale === "fr") return "fr-FR";
  return "de-DE";
}

function formatMoneyEUR(value: number, locale: ChallengeLocale = "de") {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      style: "currency",
      currency: "EUR",
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

function formatDateTime(value: string | number | Date, locale: ChallengeLocale) {
  return new Date(value).toLocaleString(getIntlLocale(locale));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function resolvePlaybackUrl(idOrUrl: string | null | undefined): string | null {
  const v = (idOrUrl ?? "").trim();
  if (!v) return null;

  if (v.startsWith("http://") || v.startsWith("https://")) {
    return v;
  }

  if (v.startsWith("/")) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
    if (!apiBase) return v;
    return `${apiBase}${v}`;
  }

  if (v.includes(".m3u8")) return v;

  return `https://stream.mux.com/${v}.m3u8`;
}

function resolveImageUrl(url: string | null | undefined): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;

  if (v.startsWith("http://") || v.startsWith("https://")) {
    return v;
  }

  if (v.startsWith("/")) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
    if (!apiBase) return v;
    return `${apiBase}${v}`;
  }

  return v;
}

function isAtLeast18(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) return false;

  const dob = new Date(dateOfBirth);
  if (!Number.isFinite(dob.getTime())) return false;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();

  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 18;
}

function shortId(value?: string | null) {
  const v = String(value ?? "").trim();
  if (!v) return "—";
  if (v.length <= 12) return v;
  return `${v.slice(0, 8)}…${v.slice(-4)}`;
}

function displayAttemptName(
  attempt: { userId: string; username?: string | null },
  myId: string | null,
  locale: ChallengeLocale
) {
  if (myId && String(attempt.userId) === String(myId)) {
    if (locale === "en") return "You";
    if (locale === "es") return "Tú";
    if (locale === "fr") return "Toi";
    return "Du";
  }

  if (attempt.username?.trim()) return attempt.username.trim();
  return shortId(attempt.userId);
}

function displayWinnerName(
  winner: Winner | null | undefined,
  myId: string | null,
  locale: ChallengeLocale
) {
  if (!winner) return "—";

  if (winner.userId && myId && String(winner.userId) === String(myId)) {
    if (locale === "en") return "You";
    if (locale === "es") return "Tú";
    if (locale === "fr") return "Toi";
    return "Du";
  }

  if (winner.username?.trim()) return winner.username.trim();
  if (winner.userId) return shortId(winner.userId);
  return shortId(winner.attemptId);
}

function getDetailStatusMeta(challenge: Challenge, ui: DetailUi) {
  const result = String(challenge.result ?? "").trim().toLowerCase();
  const hasWinner = !!challenge.winner;

  if (challenge.status === "funding") {
    return { label: ui.funding, tone: "neutral" as const };
  }

  if (challenge.status === "active") {
    return { label: ui.active, tone: "info" as const };
  }

  if (challenge.status === "voting") {
    return { label: ui.voting, tone: "warning" as const };
  }

  if (challenge.status === "completed" && result === "failed") {
    return { label: ui.ended, tone: "danger" as const };
  }

  if (challenge.status === "completed" && hasWinner) {
    return { label: ui.completed, tone: "success" as const };
  }

  if (challenge.status === "completed") {
    return { label: ui.completed, tone: "success" as const };
  }

  return { label: challenge.status, tone: "neutral" as const };
}

function getFundingState(
  challenge: Challenge | null,
  votingOver: boolean = false,
  ui: DetailUi,
  locale: ChallengeLocale
) {
  const status = String(challenge?.status ?? "").toLowerCase();
  const result = String(challenge?.result ?? "").trim().toLowerCase();
  const hasWinner = !!challenge?.winner;

  if (status === "funding") {
    return {
      canFund: true,
      buttonLabel: ui.support,
      infoTone: "neutral" as const,
      infoTitle: "",
      infoText: "",
    };
  }

  if (status === "active") {
    return {
      canFund: true,
      buttonLabel: ui.continueSupporting,
      infoTone: "success" as const,
      infoTitle: "",
      infoText: "",
    };
  }

  if (status === "voting") {
    if (votingOver) {
      return {
        canFund: false,
        buttonLabel: "",
        infoTone: "warning" as const,
        infoTitle: ui.votingEnded,
        infoText:
          locale === "en"
            ? "Voting is over. New support is no longer possible."
            : locale === "es"
              ? "La votación ha terminado. Ya no es posible hacer nuevos apoyos."
              : locale === "fr"
                ? "Le vote est terminé. Les nouveaux soutiens ne sont plus possibles."
                : "Das Voting ist vorbei. Neue Unterstützungen sind nicht mehr möglich.",
      };
    }

    return {
      canFund: true,
      buttonLabel: ui.support,
      infoTone: "info" as const,
      infoTitle: "",
      infoText: "",
    };
  }

  if (status === "completed" && result === "failed") {
    return {
      canFund: false,
      buttonLabel: "",
      infoTone: "danger" as const,
      infoTitle: ui.challengeEnded,
      infoText:
        locale === "en"
          ? "This challenge ended without a winner. New support is no longer possible."
          : locale === "es"
            ? "Este reto terminó sin ganador. Ya no se puede apoyar."
            : locale === "fr"
              ? "Ce défi s’est terminé sans gagnant. Les nouveaux soutiens ne sont plus possibles."
              : "Diese Challenge wurde ohne Gewinner beendet. Neue Unterstützungen sind nicht mehr möglich.",
    };
  }
  if (status === "completed" && hasWinner) {
    return {
      canFund: false,
      buttonLabel: "",
      infoTone: "success" as const,
      infoTitle: ui.challengeCompleted,
      infoText:
        locale === "en"
          ? "Voting is over and a winner has been determined. New support is no longer possible."
          : locale === "es"
            ? "La votación ha terminado y ya hay un ganador. Ya no se puede apoyar."
            : locale === "fr"
              ? "Le vote est terminé et un gagnant a été déterminé. Les nouveaux soutiens ne sont plus possibles."
              : "Das Voting ist beendet und ein Gewinner wurde festgelegt. Neue Unterstützungen sind nicht mehr möglich.",
    };
  }

  if (status === "completed") {
    return {
      canFund: false,
      buttonLabel: "",
      infoTone: "neutral" as const,
      infoTitle: ui.challengeCompleted,
      infoText:
        locale === "en"
          ? "This challenge has ended. New support is no longer possible."
          : locale === "es"
            ? "Este reto ha terminado. Ya no se puede apoyar."
            : locale === "fr"
              ? "Ce défi est terminé. Les nouveaux soutiens ne sont plus possibles."
              : "Diese Challenge ist beendet. Neue Unterstützungen sind nicht mehr möglich.",
    };
  }

  return {
    canFund: false,
    buttonLabel: "",
    infoTone: "neutral" as const,
    infoTitle: ui.supportUnavailable,
    infoText:
      locale === "en"
        ? "New support is currently not possible for this challenge."
        : locale === "es"
          ? "Actualmente no es posible apoyar este reto."
          : locale === "fr"
            ? "Le soutien n’est actuellement pas possible pour ce défi."
            : "Für diese Challenge sind aktuell keine neuen Unterstützungen möglich.",
  };
}

function getAttemptStatusLabel(status: string | undefined, locale: ChallengeLocale) {
  const s = String(status ?? "").trim().toLowerCase();

  if (locale === "en") {
    if (s === "draft") return "Ready";
    if (s === "live") return "Live";
    if (s === "processing") return "Processing…";
    if (s === "submitted") return "Valid submission";
    if (s === "too_short") return "Too short";
    if (s === "invalid") return "Invalid";
    if (s === "disqualified") return "Disqualified";
    if (s === "prepared") return "Prepared";
    return s || "—";
  }

  if (locale === "es") {
    if (s === "draft") return "Listo";
    if (s === "live") return "En vivo";
    if (s === "processing") return "Procesando…";
    if (s === "submitted") return "Enviado válidamente";
    if (s === "too_short") return "Demasiado corto";
    if (s === "invalid") return "Inválido";
    if (s === "disqualified") return "Descalificado";
    if (s === "prepared") return "Preparado";
    return s || "—";
  }

  if (locale === "fr") {
    if (s === "draft") return "Prêt";
    if (s === "live") return "Live";
    if (s === "processing") return "Traitement…";
    if (s === "submitted") return "Soumis valablement";
    if (s === "too_short") return "Trop court";
    if (s === "invalid") return "Invalide";
    if (s === "disqualified") return "Disqualifié";
    if (s === "prepared") return "Préparé";
    return s || "—";
  }

  if (s === "draft") return "Bereit";
  if (s === "live") return "Live";
  if (s === "processing") return "Wird verarbeitet…";
  if (s === "submitted") return "Gültig eingereicht";
  if (s === "too_short") return "Zu kurz";
  if (s === "invalid") return "Ungültig";
  if (s === "disqualified") return "Disqualifiziert";
  if (s === "prepared") return "Vorbereitet";

  return s || "—";
}

async function getErrorMessageFromResponse(res: Response): Promise<string> {
  const fallback = `Request fehlgeschlagen (${res.status})`;

  try {
    const clone = res.clone();
    const data = await clone.json();

    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {}

  try {
    const txt = await res.text();
    if (txt?.trim()) return txt.trim();
  } catch {}

  return fallback;
}

async function readApi(resOrJson: unknown) {
  const maybeResponse = resOrJson as { ok?: unknown } | null;
  if (resOrJson && typeof resOrJson === "object" && typeof maybeResponse?.ok === "boolean") {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeChallenge(input: any): Challenge {
  const raw = input?.data ?? input;

  const rawOwner = raw?.owner ?? raw?.Owner ?? null;
  const rawFunds = raw?.funds ?? raw?.Funds ?? [];

  const funds: Fund[] = Array.isArray(rawFunds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? rawFunds.map((f: any) => ({
        id: String(f?.id),
        amount: Number(f?.amount ?? 0),
        createdAt: f?.createdAt ?? f?.created_at,
        user: f?.user
          ? {
              id: String(f.user.id),
              username: f.user.username,
              avatarUrl: f.user.avatarUrl ?? null,
            }
          : f?.userId
            ? { id: String(f.userId) }
            : undefined,
      }))
    : [];

  const riskLevel =
    raw?.riskLevel != null
      ? Number(raw.riskLevel)
      : raw?.risk_level != null
        ? Number(raw.risk_level)
        : null;

  const is18Plus =
    raw?.is18Plus != null
      ? !!raw.is18Plus
      : raw?.is18_plus != null
        ? !!raw.is18_plus
        : raw?.is_18_plus != null
          ? !!raw.is_18_plus
          : null;

  const winnerRaw = raw?.winner ?? null;
  const winner: Winner | null = winnerRaw
    ? {
        attemptId: String(winnerRaw.attemptId ?? winnerRaw.attempt_id ?? ""),
        userId:
          winnerRaw.userId != null || winnerRaw.user_id != null
            ? String(winnerRaw.userId ?? winnerRaw.user_id)
            : null,
        username: winnerRaw.username ?? null,
        playbackId: winnerRaw.playbackId ?? winnerRaw.playback_id ?? null,
        score: Number(winnerRaw.score ?? 0),
        submittedAt: winnerRaw.submittedAt ?? winnerRaw.submitted_at ?? null,
      }
    : null;

  return {
    id: String(raw?.id),
    title: raw?.title ?? "",
    description: raw?.description ?? null,
    originalLanguage: raw?.originalLanguage ?? raw?.original_language ?? "de",
    titleTranslations: raw?.titleTranslations ?? raw?.title_translations ?? null,
    descriptionTranslations:
      raw?.descriptionTranslations ?? raw?.description_translations ?? null,
    thumbnailUrl: raw?.thumbnailUrl ?? raw?.thumbnail_url ?? null,
    status: raw?.status ?? "funding",

    owner: rawOwner
      ? {
          id: String(rawOwner.id),
          email: rawOwner.email,
          username: rawOwner.username,
          role: rawOwner.role,
          avatarUrl: rawOwner.avatarUrl ?? null,
        }
      : raw?.ownerId
        ? { id: String(raw.ownerId) }
        : { id: "" },

    minAmount: raw?.minAmount != null ? Number(raw.minAmount) : null,
    currentAmount: raw?.currentAmount != null ? Number(raw.currentAmount) : null,

    votingEndsAt: raw?.votingEndsAt ?? raw?.voting_ends_at ?? null,

    requiredSeconds:
      raw?.requiredSeconds != null
        ? Number(raw.requiredSeconds)
        : raw?.required_seconds != null
          ? Number(raw.required_seconds)
          : null,

    riskLevel,
    is18Plus,

    verificationMode:
      raw?.verificationMode ??
      raw?.verification_mode ??
      "live_or_recorded",

    requiresLive:
      raw?.requiresLive != null
        ? !!raw.requiresLive
        : raw?.requires_live != null
          ? !!raw.requires_live
          : false,

    allowRecordedAttempt:
      raw?.allowRecordedAttempt != null
        ? !!raw.allowRecordedAttempt
        : raw?.allow_recorded_attempt != null
          ? !!raw.allow_recorded_attempt
          : true,

    funds,

    liveVideoUrl: raw?.liveVideoUrl ?? raw?.live_video_url ?? null,
    playbackId: raw?.playbackId ?? raw?.playback_id ?? null,
    isLive: raw?.isLive ?? raw?.is_live ?? undefined,

    winnerAttemptId: raw?.winnerAttemptId ?? raw?.winner_attempt_id ?? null,
    winnerUserId: raw?.winnerUserId ?? raw?.winner_user_id ?? null,
    winnerPlaybackId: raw?.winnerPlaybackId ?? raw?.winner_playback_id ?? null,
    winner,
    result: raw?.result ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAttempts(input: any): Attempt[] {
  const raw = input?.data ?? input;
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return arr.map((a: any) => ({
    id: String(a?.id),
    challengeId: String(a?.challengeId ?? a?.challenge_id ?? ""),
    userId: String(a?.userId ?? a?.user_id ?? ""),
    username: a?.username ?? a?.user?.username ?? null,
    status: String(a?.status ?? ""),
    isLive: !!(a?.isLive ?? a?.is_live),
    hasStreamed: !!(a?.hasStreamed ?? a?.has_streamed),
    playbackId: a?.playbackId ?? a?.playback_id ?? null,
    livePlaybackId: a?.livePlaybackId ?? a?.live_playback_id ?? null,
    assetPlaybackId: a?.assetPlaybackId ?? a?.asset_playback_id ?? null,
    upVotes: Number(a?.upVotes ?? 0),
    downVotes: Number(a?.downVotes ?? 0),
    score: Number(a?.score ?? 0),
    myVote: (a?.myVote === 1 || a?.myVote === -1 || a?.myVote === 0 ? a.myVote : undefined) as
      | VoteValue
      | undefined,
    submittedAt: a?.submittedAt ?? a?.submitted_at ?? null,
    liveSeconds: a?.liveSeconds ?? a?.live_seconds ?? null,
    minLiveSecondsRequired:
      a?.minLiveSecondsRequired ?? a?.min_live_seconds_required ?? null,
    createdAt: a?.createdAt ?? a?.created_at,
    updatedAt: a?.updatedAt ?? a?.updated_at,
  }));
}

function pickMyAttempt(attempts: Attempt[], myId: string | null) {
  if (!myId) return null;
  return attempts.find((a) => String(a.userId) === String(myId)) ?? null;
}

function pickAttemptPlayback(a: Attempt): { playbackId: string | null; isLive: boolean } {
  const isLive = a.status === "live" || a.isLive === true;
  const pb = isLive ? a.livePlaybackId ?? a.playbackId : a.assetPlaybackId ?? a.playbackId;
  return { playbackId: pb ?? null, isLive };
}

function formatRemaining(ms: number, locale: ChallengeLocale) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (locale === "es" || locale === "fr") {
    return `${h} h ${pad(m)} min ${pad(s)} s`;
  }

  return `${h}h ${pad(m)}m ${pad(s)}s`;
}

function getParticipationModeMeta(
  challenge: Challenge | null,
  locale: ChallengeLocale
) {
  const riskLevel = clampInt(challenge?.riskLevel ?? 0, 0, 2, 0);
  const requiresLive = !!challenge?.requiresLive;
  const minAmount = Number(challenge?.minAmount ?? 0);

  if (requiresLive) {
    if (locale === "en") {
      return {
        shortLabel: "Live required",
        shortTone: "danger" as const,
        title: "Live required",
        text: "For this challenge, a live attempt is mandatory.",
      };
    }

    if (locale === "es") {
      return {
        shortLabel: "Directo obligatorio",
        shortTone: "danger" as const,
        title: "Directo obligatorio",
        text: "Para este reto, el intento en directo es obligatorio.",
      };
    }

    if (locale === "fr") {
      return {
        shortLabel: "Live requis",
        shortTone: "danger" as const,
        title: "Live requis",
        text: "Pour ce défi, une tentative en direct est obligatoire.",
      };
    }

    return {
      shortLabel: "Live erforderlich",
      shortTone: "danger" as const,
      title: "Live erforderlich",
      text: "Für diese Challenge ist ein Live-Versuch verpflichtend.",
    };
  }

  if (riskLevel >= 2 && minAmount < 500) {
    if (locale === "en") {
      return {
        shortLabel: "Verified recording",
        shortTone: "info" as const,
        title: "Verified recording",
        text: "At this risk level, a verified in-app recording is currently enough.",
      };
    }

    if (locale === "es") {
      return {
        shortLabel: "Grabacion verificada",
        shortTone: "info" as const,
        title: "Grabacion verificada",
        text: "En este nivel de riesgo, por ahora basta con una grabacion verificada en la app.",
      };
    }

    if (locale === "fr") {
      return {
        shortLabel: "Enregistrement verifie",
        shortTone: "info" as const,
        title: "Enregistrement verifie",
        text: "A ce niveau de risque, un enregistrement verifie dans l'application suffit pour le moment.",
      };
    }

    return {
      shortLabel: "Verifizierte Aufnahme",
      shortTone: "info" as const,
      title: "Verifizierte Aufnahme",
      text: "Bei diesem Risiko-Level reicht aktuell eine verifizierte In-App-Aufnahme.",
    };
  }

  if (locale === "en") {
    return {
      shortLabel: "Verified recording",
      shortTone: "info" as const,
      title: "Verified recording",
      text: "Submit a verified in-app recording for valid participation.",
    };
  }

  if (locale === "es") {
    return {
      shortLabel: "Grabacion verificada",
      shortTone: "info" as const,
      title: "Grabacion verificada",
      text: "Envia una grabacion verificada en la app para participar de forma valida.",
    };
  }

  if (locale === "fr") {
    return {
      shortLabel: "Enregistrement verifie",
      shortTone: "info" as const,
      title: "Enregistrement verifie",
      text: "Soumets un enregistrement verifie dans l'application pour une participation valide.",
    };
  }

  return {
    shortLabel: "Verifizierte Aufnahme",
    shortTone: "info" as const,
    title: "Verifizierte Aufnahme",
    text: "Reiche eine verifizierte In-App-Aufnahme fuer eine gueltige Teilnahme ein.",
  };
}

type DetailUi = {
  backToList: string;
  refresh: string;
  challengeId: string;
  missingChallengeId: string;
  loading: string;
  challenge: string;
  noData: string;
  createdBy: string;
  description: string;
  noDescription: string;

  funding: string;
  active: string;
  voting: string;
  ended: string;
  completed: string;

  winner: string;
  currentlyLeading: string;
  highRisk: string;
  adultsOnly: string;

  currentAmount: string;
  fundingGoal: string;
  noGoal: string;
  supporters: string;
  minDurationLive: string;
  minDurationRecording: string;
  progress: string;
  goalReached: string;
  leftToGoal: string;

  boostOpen: string;
  boostClosed: string;
  support: string;
  continueSupporting: string;
  votingEnded: string;
  challengeEnded: string;
  challengeCompleted: string;
  supportUnavailable: string;

  contributionNowWorks: string;
  chooseContribution: string;
  customAmountPlaceholder: string;
  loginAndIncreasePot: string;
  increasePotNow: string;
  pushFinale: string;
  securePayment: string;

  noPlayback: string;
  noPlaybackText: string;

  comments: string;
  commentsSubtitle: string;

  yourParticipation: string;
  loginRequired: string;
  login: string;
  prepared: string;
  ready: string;
  unavailable: string;
  recordingPending: string;

  submittedVideos: string;
  noVideoYet: string;
  thisWillDecideLater: string;

  live: string;
  currentActivity: string;

  ranking: string;
  score: string;
  likes: string;
  dislikes: string;
  status: string;
};

const DETAIL_UI_TEXT: Record<ChallengeLocale, DetailUi> = {
  de: {
    backToList: "← Liste",
    refresh: "Aktualisieren",
    challengeId: "Challenge-ID",
    missingChallengeId: "Fehlende Challenge-ID",
    loading: "Lade…",
    challenge: "Challenge",
    noData: "Keine Daten",
    createdBy: "Erstellt von",
    description: "Beschreibung",
    noDescription: "Für diese Challenge wurde noch keine Beschreibung hinterlegt.",

    funding: "Funding",
    active: "Aktiv",
    voting: "Voting",
    ended: "Beendet",
    completed: "Abgeschlossen",

    winner: "Gewinner",
    currentlyLeading: "Führt aktuell",
    highRisk: "⚠️ Hohes Risiko",
    adultsOnly: "🔞 Ab 18",

    currentAmount: "Aktueller Stand",
    fundingGoal: "Ziel",
    noGoal: "Kein Ziel",
    supporters: "Unterstützer",
    minDurationLive: "Mindestdauer live",
    minDurationRecording: "Mindestdauer Aufnahme",
    progress: "Fortschritt",
    goalReached: "✅ Ziel erreicht",
    leftToGoal: "🎯 Noch {amount} bis zum Ziel",

    boostOpen: "Push ist offen",
    boostClosed: "Push ist beendet",
    support: "Unterstützen",
    continueSupporting: "Weiter unterstützen",
    votingEnded: "Voting beendet",
    challengeEnded: "Challenge beendet",
    challengeCompleted: "Challenge abgeschlossen",
    supportUnavailable: "Unterstützung aktuell nicht verfügbar",

    contributionNowWorks: "Warum das jetzt wirkt",
    chooseContribution: "Beitrag wählen",
    customAmountPlaceholder: "Oder eigenen Betrag eingeben (mind. 5 EUR)",
    loginAndIncreasePot: "Einloggen und Pot erhöhen",
    increasePotNow: "Pot jetzt erhöhen",
    pushFinale: "Finale pushen",
    securePayment: "Sichere Zahlung über Stripe",

    noPlayback: "Kein Playback vorhanden",
    noPlaybackText: "Dieses Video hat aktuell kein abspielbares Playback.",

    comments: "Kommentare",
    commentsSubtitle: "Diskussion zur Challenge und zu den eingereichten Videos.",

    yourParticipation: "Deine Teilnahme",
    loginRequired: "Login erforderlich",
    login: "Login",
    prepared: "Vorbereitet",
    ready: "Bereit",
    unavailable: "Nicht verfügbar",
    recordingPending: "Aufnahme folgt",

    submittedVideos: "Eingereichte Videos",
    noVideoYet: "Noch kein Video im Rennen",
    thisWillDecideLater: "Hier entscheidet sich später die Challenge",

    live: "Live",
    currentActivity: "Aktuelle Beiträge",

    ranking: "Rang",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",
    status: "Status",
  },

  en: {
    backToList: "← List",
    refresh: "Refresh",
    challengeId: "Challenge ID",
    missingChallengeId: "Missing challenge ID",
    loading: "Loading…",
    challenge: "Challenge",
    noData: "No data",
    createdBy: "Created by",
    description: "Description",
    noDescription: "No description has been added for this challenge yet.",

    funding: "Funding",
    active: "Active",
    voting: "Voting",
    ended: "Ended",
    completed: "Completed",

    winner: "Winner",
    currentlyLeading: "Currently leading",
    highRisk: "⚠️ High risk",
    adultsOnly: "🔞 18+",

    currentAmount: "Current amount",
    fundingGoal: "Funding goal",
    noGoal: "No goal",
    supporters: "Supporters",
    minDurationLive: "Minimum live duration",
    minDurationRecording: "Minimum recording duration",
    progress: "Progress",
    goalReached: "✅ Goal reached",
    leftToGoal: "🎯 {amount} left to goal",

    boostOpen: "Boost open",
    boostClosed: "Boost closed",
    support: "Support",
    continueSupporting: "Continue supporting",
    votingEnded: "Voting ended",
    challengeEnded: "Challenge ended",
    challengeCompleted: "Challenge completed",
    supportUnavailable: "Support currently unavailable",

    contributionNowWorks: "Why this matters right now",
    chooseContribution: "Choose contribution",
    customAmountPlaceholder: "Or enter your own amount (min. 5 EUR)",
    loginAndIncreasePot: "Log in and increase pot",
    increasePotNow: "Increase pot now",
    pushFinale: "Push finale",
    securePayment: "Secure payment via Stripe",

    noPlayback: "No playback available",
    noPlaybackText: "This video currently has no playable playback.",

    comments: "Comments",
    commentsSubtitle: "Discussion about the challenge and submitted videos.",

    yourParticipation: "Your participation",
    loginRequired: "Login required",
    login: "Login",
    prepared: "Prepared",
    ready: "Ready",
    unavailable: "Unavailable",
    recordingPending: "Recording pending",

    submittedVideos: "Submitted videos",
    noVideoYet: "No video in the race yet",
    thisWillDecideLater: "This is where the challenge will be decided later",

    live: "Live",
    currentActivity: "Current activity",

    ranking: "Rank",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",
    status: "Status",
  },

  es: {
    backToList: "← Lista",
    refresh: "Actualizar",
    challengeId: "ID del reto",
    missingChallengeId: "Falta el ID del reto",
    loading: "Cargando…",
    challenge: "Reto",
    noData: "Sin datos",
    createdBy: "Creado por",
    description: "Descripción",
    noDescription: "Todavía no se ha añadido una descripción para este reto.",

    funding: "Financiación",
    active: "Activo",
    voting: "Votación",
    ended: "Finalizado",
    completed: "Completado",

    winner: "Ganador",
    currentlyLeading: "Va ganando",
    highRisk: "⚠️ Alto riesgo",
    adultsOnly: "🔞 +18",

    currentAmount: "Cantidad actual",
    fundingGoal: "Objetivo",
    noGoal: "Sin objetivo",
    supporters: "Patrocinadores",
    minDurationLive: "Duración mínima en vivo",
    minDurationRecording: "Duración mínima de grabación",
    progress: "Progreso",
    goalReached: "✅ Objetivo alcanzado",
    leftToGoal: "🎯 Faltan {amount} para el objetivo",

    boostOpen: "Impulso abierto",
    boostClosed: "Impulso cerrado",
    support: "Apoyar",
    continueSupporting: "Seguir apoyando",
    votingEnded: "La votación terminó",
    challengeEnded: "Reto finalizado",
    challengeCompleted: "Reto completado",
    supportUnavailable: "El apoyo no está disponible ahora",

    contributionNowWorks: "Por qué esto importa ahora",
    chooseContribution: "Elegir aporte",
    customAmountPlaceholder: "O introduce tu propia cantidad (mín. 5 EUR)",
    loginAndIncreasePot: "Inicia sesión y aumenta el bote",
    increasePotNow: "Aumentar bote",
    pushFinale: "Impulsar final",
    securePayment: "Pago seguro con Stripe",

    noPlayback: "No hay reproducción",
    noPlaybackText: "Este vídeo no tiene una reproducción disponible.",

    comments: "Comentarios",
    commentsSubtitle: "Discusión sobre el reto y los vídeos enviados.",

    yourParticipation: "Tu participación",
    loginRequired: "Inicio de sesión requerido",
    login: "Login",
    prepared: "Preparado",
    ready: "Listo",
    unavailable: "No disponible",
    recordingPending: "Grabación pendiente",

    submittedVideos: "Vídeos enviados",
    noVideoYet: "Todavía no hay vídeos en carrera",
    thisWillDecideLater: "Aquí se decidirá el reto más adelante",

    live: "En vivo",
    currentActivity: "Actividad actual",

    ranking: "Puesto",
    score: "Puntuación",
    likes: "Likes",
    dislikes: "Dislikes",
    status: "Estado",
  },

  fr: {
    backToList: "← Liste",
    refresh: "Actualiser",
    challengeId: "ID du défi",
    missingChallengeId: "ID du défi manquant",
    loading: "Chargement…",
    challenge: "Défi",
    noData: "Aucune donnée",
    createdBy: "Créé par",
    description: "Description",
    noDescription: "Aucune description n’a encore été ajoutée pour ce défi.",

    funding: "Financement",
    active: "Actif",
    voting: "Vote",
    ended: "Terminé",
    completed: "Complété",

    winner: "Gagnant",
    currentlyLeading: "Mène actuellement",
    highRisk: "⚠️ Risque élevé",
    adultsOnly: "🔞 18+",

    currentAmount: "Montant actuel",
    fundingGoal: "Objectif",
    noGoal: "Aucun objectif",
    supporters: "Soutiens",
    minDurationLive: "Durée minimum en direct",
    minDurationRecording: "Durée minimum d’enregistrement",
    progress: "Progression",
    goalReached: "✅ Objectif atteint",
    leftToGoal: "🎯 Il reste {amount} avant l’objectif",

    boostOpen: "Boost ouvert",
    boostClosed: "Boost fermé",
    support: "Soutenir",
    continueSupporting: "Continuer à soutenir",
    votingEnded: "Vote terminé",
    challengeEnded: "Défi terminé",
    challengeCompleted: "Défi complété",
    supportUnavailable: "Le soutien n’est pas disponible actuellement",

    contributionNowWorks: "Pourquoi cela compte maintenant",
    chooseContribution: "Choisir une contribution",
    customAmountPlaceholder: "Ou saisis ton propre montant (min. 5 EUR)",
    loginAndIncreasePot: "Connecte-toi et augmente la cagnotte",
    increasePotNow: "Augmenter la cagnotte",
    pushFinale: "Booster la finale",
    securePayment: "Paiement sécurisé via Stripe",

    noPlayback: "Aucun playback disponible",
    noPlaybackText: "Cette vidéo n’a actuellement aucun playback lisible.",

    comments: "Commentaires",
    commentsSubtitle: "Discussion autour du défi et des vidéos soumises.",

    yourParticipation: "Ta participation",
    loginRequired: "Connexion requise",
    login: "Login",
    prepared: "Prêt",
    ready: "Prêt",
    unavailable: "Indisponible",
    recordingPending: "Enregistrement en attente",

    submittedVideos: "Vidéos soumises",
    noVideoYet: "Aucune vidéo en course pour le moment",
    thisWillDecideLater: "C’est ici que le défi se décidera plus tard",

    live: "Live",
    currentActivity: "Activité en cours",

    ranking: "Rang",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",
    status: "Statut",
  },
};

type DetailExtraUi = {
  paymentStatus: string;
  noThumbnailAvailable: string;
  momentum: string;
  whatYourContributionDoes: string;
  whyRightNow: string;
  potRisesImmediately: string;
  moreAttention: string;
  morePressureToDeliver: string;
  supportEntriesNone: string;
  supportExpandable: string;
  newestFirst: string;
  showSupport: string;
  noSupportYet: string;
  noVisibleSupport: string;
  anonymous: string;
  participationNotice: string;
  riskNotice: string;
  showDetails: string;
  ageRestriction: string;
  iReadAndAccept: string;
  manageChallenge: string;
  visibleOnlyToCreator: string;
  edit: string;
  delete: string;
  deleting: string;
  place1: string;
  place2: string;
  place3: string;
  castVotes: string;
  ownVideo: string;
  yourOwnVideoCannotBeRated: string;
  video: string;
  rankingLabel: string;
  decision: string;
  whatWillAppearHereLater: string;
  validSubmissionFromParticipant: string;
  placementScoreVotingStatus: string;
  thisIsWhereRealDeliveryBecomesVisible: string;
  noVideoInRaceYet: string;
  thisIsWhereChallengeWillBeDecidedLater: string;
  validVideoAppearsHereText: string;
  noSubmissionYet: string;
  potStillOpen: string;
  supportClosed: string;
  streamBy: string;
  submittedOn: string;
  videoBy: string;
  yourVideo: string;
  gapToFirst: string;
  leading: string;
  chasing: string;
  didNotWin: string;
  currentlyPlace: string;
  streamSetup: string;
  streamKey: string;
  obsSetupHelp: string;
  adminPayout: string;
  preparePayout: string;
  goToPayouts: string;
  gross: string;
  platformFee: string;
  winnerNet: string;
  result: string;
  finalStatus: string;
  challengeClosed: string;
  supportSectionTitle: string;
  votingWindow: string;
  currentLeader: string;
  scorePlace1: string;
  gapToPlace2: string;
  noGap: string;
  error: string;
  success: string;
  info: string;
  attemptLabel: string;
  creatingAttempt: string;
  supportVerb: string;
  attemptsWord: string;
  proofWordingWinner: string;
  verifiedRecordingTitle: string;
  verifiedRecordingText: string;
  participationClosed: string;
  noRecordingYet: string;
  readyRecording: string;
  minimumDuration10: string;
  startRecording: string;
  commentsPlaceholder: string;
  send: string;
  noCommentsEyebrow: string;
  noCommentsTitle: string;
  noCommentsText: string;
  noReactionsYet: string;
  communityArea: string;
};

const DETAIL_EXTRA_UI_TEXT: Record<ChallengeLocale, DetailExtraUi> = {
  de: {
    paymentStatus: "Zahlungsstatus",
    noThumbnailAvailable: "Kein Thumbnail vorhanden",
    momentum: "Momentum",
    whatYourContributionDoes: "Dein Beitrag bewirkt",
    whyRightNow: "Warum gerade jetzt?",
    potRisesImmediately: "Pot steigt sofort",
    moreAttention: "Mehr Aufmerksamkeit",
    morePressureToDeliver: "Mehr Druck aufs Liefern",
    supportEntriesNone: "Noch keine Einträge.",
    supportExpandable: "Optional aufklappen.",
    newestFirst: "Neueste zuerst.",
    showSupport: "Unterstützungen anzeigen",
    noSupportYet: "Noch keine Unterstützungen",
    noVisibleSupport: "Keine Unterstützungen sichtbar",
    anonymous: "Anonym",
    participationNotice: "Teilnahme-Hinweis",
    riskNotice: "Risikohinweis",
    showDetails: "Details anzeigen",
    ageRestriction: "Altersfreigabe",
    iReadAndAccept: "Ich habe den Hinweis gelesen und akzeptiere die Bedingungen.",
    manageChallenge: "Challenge verwalten",
    visibleOnlyToCreator: "Nur für den Ersteller sichtbar",
    edit: "Bearbeiten",
    delete: "Löschen",
    deleting: "Löscht…",
    place1: "Platz 1",
    place2: "Platz 2",
    place3: "Platz 3",
    castVotes: "Stimmen abgeben",
    ownVideo: "Eigenes Video",
    yourOwnVideoCannotBeRated: "Dein eigenes Video kannst du nicht bewerten.",
    video: "Video",
    rankingLabel: "Ranking",
    decision: "Entscheidung",
    whatWillAppearHereLater: "Was hier später erscheint",
    validSubmissionFromParticipant: "Gültige Einreichung eines Teilnehmers",
    placementScoreVotingStatus: "Platzierung, Score und Voting-Status",
    thisIsWhereRealDeliveryBecomesVisible: "Hier wird später sichtbar, wer wirklich geliefert hat",
    noVideoInRaceYet: "Noch kein Video im Rennen",
    thisIsWhereChallengeWillBeDecidedLater: "Hier entscheidet sich später die Challenge",
    validVideoAppearsHereText: "Sobald ein gültiges Video eingereicht wurde, erscheint es genau hier. Ab dann wird sichtbar, wer liefert, wer vorne liegt und worüber die Community abstimmt.",
    noSubmissionYet: "Noch keine Einreichung",
    potStillOpen: "Pot weiter offen",
    supportClosed: "Unterstützung geschlossen",
    streamBy: "Stream von ",
    submittedOn: "Eingereicht am ",
    videoBy: "Video von ",
    yourVideo: "Dein Video",
    gapToFirst: "Abstand zu Platz 1",
    leading: "Führt",
    chasing: "Verfolger",
    didNotWin: "Nicht gewonnen",
    currentlyPlace: "Aktuell Platz",
    streamSetup: "OBS / Stream-Setup",
    streamKey: "Stream-Key:",
    obsSetupHelp: "OBS → Service: Custom → URL + Stream-Key eintragen → Start Streaming.",
    adminPayout: "Admin-Auszahlung",
    preparePayout: "Payout vorbereiten",
    goToPayouts: "Zu den Payouts",
    gross: "Brutto",
    platformFee: "Plattformgebühr",
    winnerNet: "Netto Gewinner",
    result: "Ergebnis",
    finalStatus: "Endstatus",
    challengeClosed: "Challenge ist geschlossen",
    supportSectionTitle: "Unterstützungen",
    votingWindow: "Voting-Fenster",
    currentLeader: "Führt aktuell",
    scorePlace1: "Score Platz 1",
    gapToPlace2: "Abstand zu Platz 2",
    noGap: "Kein Abstand",
    error: "Fehler",
    success: "Erfolg",
    info: "Info",
    attemptLabel: "Versuch",
    creatingAttempt: "Erstelle Versuch…",
    supportVerb: "unterstützen",
    attemptsWord: "Versuche",
    proofWordingWinner: "Support und Teilnahme sind beendet. Unten bleibt das Gewinner-Video als klarer Nachweis sichtbar.",
    verifiedRecordingTitle: "Verifizierte Aufnahme",
    verifiedRecordingText: "Nimm dein Video direkt in der App auf, prüfe die Vorschau und reiche es anschließend ein. Mindestdauer: 10s.",
    participationClosed: "Teilnahme ist aktuell nicht offen.",
    noRecordingYet: "Noch keine Aufnahme vorhanden.",
    readyRecording: "Bereit",
    minimumDuration10: "Mindestdauer 10s",
    startRecording: "Aufnahme starten",
    commentsPlaceholder: "Schreibe einen Kommentar…",
    send: "Senden",
    noCommentsEyebrow: "NOCH KEINE KOMMENTARE",
    noCommentsTitle: "Hier startet später die Diskussion",
    noCommentsText: "Sobald jemand reagiert, Fragen stellt oder die ersten Einschätzungen zur Challenge teilt, erscheinen die Kommentare genau hier.",
    noReactionsYet: "Noch keine Reaktionen",
    communityArea: "Community-Bereich",
  },
  en: {
    paymentStatus: "Payment status",
    noThumbnailAvailable: "No thumbnail available",
    momentum: "Momentum",
    whatYourContributionDoes: "What your contribution does",
    whyRightNow: "Why right now?",
    potRisesImmediately: "Pot rises immediately",
    moreAttention: "More attention",
    morePressureToDeliver: "More pressure to deliver",
    supportEntriesNone: "No entries yet.",
    supportExpandable: "Expandable if needed.",
    newestFirst: "Newest first.",
    showSupport: "Show support",
    noSupportYet: "No support yet",
    noVisibleSupport: "No visible support",
    anonymous: "Anonymous",
    participationNotice: "Participation notice",
    riskNotice: "Risk notice",
    showDetails: "Show details",
    ageRestriction: "Age restriction",
    iReadAndAccept: "I have read the notice and accept the conditions.",
    manageChallenge: "Manage challenge",
    visibleOnlyToCreator: "Visible only to the creator",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting…",
    place1: "Place 1",
    place2: "Place 2",
    place3: "Place 3",
    castVotes: "Cast votes",
    ownVideo: "Own video",
    yourOwnVideoCannotBeRated: "You cannot rate your own video.",
    video: "Video",
    rankingLabel: "Ranking",
    decision: "Decision",
    whatWillAppearHereLater: "What will appear here later",
    validSubmissionFromParticipant: "Valid submission from a participant",
    placementScoreVotingStatus: "Placement, score and voting status",
    thisIsWhereRealDeliveryBecomesVisible: "This is where it becomes visible who really delivered",
    noVideoInRaceYet: "No video in the race yet",
    thisIsWhereChallengeWillBeDecidedLater: "This is where the challenge will be decided later",
    validVideoAppearsHereText: "As soon as a valid video is submitted, it will appear exactly here. From then on you will see who delivers, who is ahead and what the community is voting on.",
    noSubmissionYet: "No submission yet",
    potStillOpen: "Pot still open",
    supportClosed: "Support closed",
    streamBy: "Stream by ",
    submittedOn: "Submitted on ",
    videoBy: "Video by ",
    yourVideo: "Your video",
    gapToFirst: "Gap to #1",
    leading: "Leading",
    chasing: "Chasing",
    didNotWin: "Did not win",
    currentlyPlace: "Currently place",
    streamSetup: "OBS / stream setup",
    streamKey: "Stream key:",
    obsSetupHelp: "OBS → Service: Custom → enter URL + stream key → Start Streaming.",
    adminPayout: "Admin payout",
    preparePayout: "Prepare payout",
    goToPayouts: "Go to payouts",
    gross: "Gross",
    platformFee: "Platform fee",
    winnerNet: "Winner net",
    result: "Result",
    finalStatus: "Final status",
    challengeClosed: "Challenge is closed",
    supportSectionTitle: "Support",
    votingWindow: "Voting window",
    currentLeader: "Currently leading",
    scorePlace1: "Score #1",
    gapToPlace2: "Gap to #2",
    noGap: "No gap",
    error: "Error",
    success: "Success",
    info: "Info",
    attemptLabel: "Attempt",
    creatingAttempt: "Creating attempt…",
    supportVerb: "support",
    attemptsWord: "attempts",
    proofWordingWinner: "Support and participation are over. The winning video remains visible below as clear proof.",
    verifiedRecordingTitle: "Verified recording",
    verifiedRecordingText: "Record your video directly in the app, review the preview and submit it afterwards.\nMinimum duration: 10s.",
    participationClosed: "Participation is currently not open.",
    noRecordingYet: "No recording available yet.",
    readyRecording: "Ready",
    minimumDuration10: "Minimum duration 10s",
    startRecording: "Start recording",
    commentsPlaceholder: "Write a comment…",
    send: "Send",
    noCommentsEyebrow: "NO COMMENTS YET",
    noCommentsTitle: "This is where the discussion will start later",
    noCommentsText: "As soon as someone reacts, asks questions or shares their first thoughts about the challenge, the comments will appear here.",
    noReactionsYet: "No reactions yet",
    communityArea: "Community area",
  },
  es: {
    paymentStatus: "Estado del pago",
    noThumbnailAvailable: "No hay miniatura disponible",
    momentum: "Impulso",
    whatYourContributionDoes: "Lo que consigue tu aporte",
    whyRightNow: "¿Por qué justo ahora?",
    potRisesImmediately: "El bote sube al instante",
    moreAttention: "Más atención",
    morePressureToDeliver: "Más presión por cumplir",
    supportEntriesNone: "Todavía no hay entradas.",
    supportExpandable: "Se puede desplegar si hace falta.",
    newestFirst: "Más recientes primero.",
    showSupport: "Mostrar apoyos",
    noSupportYet: "Todavía no hay apoyos",
    noVisibleSupport: "No hay apoyos visibles",
    anonymous: "Anónimo",
    participationNotice: "Aviso de participación",
    riskNotice: "Aviso de riesgo",
    showDetails: "Mostrar detalles",
    ageRestriction: "Restricción de edad",
    iReadAndAccept: "He leído el aviso y acepto las condiciones.",
    manageChallenge: "Gestionar reto",
    visibleOnlyToCreator: "Visible solo para el creador",
    edit: "Editar",
    delete: "Eliminar",
    deleting: "Eliminando…",
    place1: "Puesto 1",
    place2: "Puesto 2",
    place3: "Puesto 3",
    castVotes: "Emitir votos",
    ownVideo: "Tu propio vídeo",
    yourOwnVideoCannotBeRated: "No puedes valorar tu propio vídeo.",
    video: "Vídeo",
    rankingLabel: "Clasificación",
    decision: "Decisión",
    whatWillAppearHereLater: "Lo que aparecerá aquí más adelante",
    validSubmissionFromParticipant: "Envío válido de un participante",
    placementScoreVotingStatus: "Posición, puntuación y estado de la votación",
    thisIsWhereRealDeliveryBecomesVisible: "Aquí se verá quién realmente cumplió",
    noVideoInRaceYet: "Todavía no hay vídeo en carrera",
    thisIsWhereChallengeWillBeDecidedLater: "Aquí se decidirá el reto más adelante",
    validVideoAppearsHereText: "En cuanto se envíe un vídeo válido, aparecerá exactamente aquí. A partir de ese momento se verá quién cumple, quién va por delante y sobre qué vota la comunidad.",
    noSubmissionYet: "Todavía no hay envío",
    potStillOpen: "El bote sigue abierto",
    supportClosed: "Apoyo cerrado",
    streamBy: "Stream de ",
    submittedOn: "Enviado el ",
    videoBy: "Vídeo de ",
    yourVideo: "Tu vídeo",
    gapToFirst: "Distancia al #1",
    leading: "Lidera",
    chasing: "Persiguiendo",
    didNotWin: "No ganó",
    currentlyPlace: "Actualmente puesto",
    streamSetup: "OBS / configuración del stream",
    streamKey: "Clave de stream:",
    obsSetupHelp: "OBS → Servicio: Personalizado → introduce URL + clave de stream → Iniciar transmisión.",
    adminPayout: "Pago admin",
    preparePayout: "Preparar pago",
    goToPayouts: "Ir a pagos",
    gross: "Bruto",
    platformFee: "Comisión de plataforma",
    winnerNet: "Neto ganador",
    result: "Resultado",
    finalStatus: "Estado final",
    challengeClosed: "El reto está cerrado",
    supportSectionTitle: "Apoyos",
    votingWindow: "Ventana de votación",
    currentLeader: "Va ganando",
    scorePlace1: "Puntuación #1",
    gapToPlace2: "Distancia al #2",
    noGap: "Sin distancia",
    error: "Error",
    success: "Éxito",
    info: "Información",
    attemptLabel: "Intento",
    creatingAttempt: "Creando intento…",
    supportVerb: "apoyar",
    attemptsWord: "intentos",
    proofWordingWinner: "El apoyo y la participación han terminado. El vídeo ganador sigue visible abajo como prueba clara.",
    verifiedRecordingTitle: "Grabación verificada",
    verifiedRecordingText: "Graba tu vídeo directamente en la app, revisa la vista previa y envíalo después.\nDuración mínima: 10s.",
    participationClosed: "La participación no está abierta en este momento.",
    noRecordingYet: "Todavía no hay ninguna grabación.",
    readyRecording: "Listo",
    minimumDuration10: "Duración mínima 10s",
    startRecording: "Iniciar grabación",
    commentsPlaceholder: "Escribe un comentario…",
    send: "Enviar",
    noCommentsEyebrow: "TODAVÍA NO HAY COMENTARIOS",
    noCommentsTitle: "Aquí empezará la discusión más adelante",
    noCommentsText: "En cuanto alguien reaccione, haga preguntas o comparta sus primeras impresiones sobre el reto, los comentarios aparecerán aquí.",
    noReactionsYet: "Todavía no hay reacciones",
    communityArea: "Área de la comunidad",
  },
  fr: {
    paymentStatus: "Statut du paiement",
    noThumbnailAvailable: "Aucune miniature disponible",
    momentum: "Dynamique",
    whatYourContributionDoes: "Ce que ta contribution provoque",
    whyRightNow: "Pourquoi maintenant ?",
    potRisesImmediately: "La cagnotte augmente immédiatement",
    moreAttention: "Plus d'attention",
    morePressureToDeliver: "Plus de pression pour livrer",
    supportEntriesNone: "Aucune entrée pour le moment.",
    supportExpandable: "Peut être déplié si nécessaire.",
    newestFirst: "Les plus récents d’abord.",
    showSupport: "Afficher les soutiens",
    noSupportYet: "Aucun soutien pour le moment",
    noVisibleSupport: "Aucun soutien visible",
    anonymous: "Anonyme",
    participationNotice: "Avis de participation",
    riskNotice: "Avertissement de risque",
    showDetails: "Afficher les détails",
    ageRestriction: "Restriction d'âge",
    iReadAndAccept: "J'ai lu l'avis et j'accepte les conditions.",
    manageChallenge: "Gérer le défi",
    visibleOnlyToCreator: "Visible uniquement pour le créateur",
    edit: "Modifier",
    delete: "Supprimer",
    deleting: "Suppression…",
    place1: "Place 1",
    place2: "Place 2",
    place3: "Place 3",
    castVotes: "Voter",
    ownVideo: "Ta propre vidéo",
    yourOwnVideoCannotBeRated: "Tu ne peux pas évaluer ta propre vidéo.",
    video: "Vidéo",
    rankingLabel: "Classement",
    decision: "Décision",
    whatWillAppearHereLater: "Ce qui apparaîtra ici plus tard",
    validSubmissionFromParticipant: "Soumission valide d'un participant",
    placementScoreVotingStatus: "Position, score et statut du vote",
    thisIsWhereRealDeliveryBecomesVisible: "C'est ici qu'on verra qui a vraiment livré",
    noVideoInRaceYet: "Aucune vidéo en course pour le moment",
    thisIsWhereChallengeWillBeDecidedLater: "C'est ici que le défi se décidera plus tard",
    validVideoAppearsHereText: "Dès qu'une vidéo valide est soumise, elle apparaîtra exactement ici. À partir de là, on verra qui livre, qui mène et sur quoi la communauté vote.",
    noSubmissionYet: "Aucune soumission pour le moment",
    potStillOpen: "La cagnotte reste ouverte",
    supportClosed: "Soutien fermé",
    streamBy: "Stream de ",
    submittedOn: "Soumis le ",
    videoBy: "Vidéo de ",
    yourVideo: "Ta vidéo",
    gapToFirst: "Écart avec le #1",
    leading: "En tête",
    chasing: "Poursuit",
    didNotWin: "N'a pas gagné",
    currentlyPlace: "Actuellement place",
    streamSetup: "OBS / configuration du stream",
    streamKey: "Clé de stream :",
    obsSetupHelp: "OBS → Service : Custom → saisis l'URL + la clé de stream → Start Streaming.",
    adminPayout: "Paiement admin",
    preparePayout: "Préparer le paiement",
    goToPayouts: "Voir les paiements",
    gross: "Brut",
    platformFee: "Frais de plateforme",
    winnerNet: "Net gagnant",
    result: "Résultat",
    finalStatus: "Statut final",
    challengeClosed: "Le défi est fermé",
    supportSectionTitle: "Soutiens",
    votingWindow: "Fenêtre de vote",
    currentLeader: "Mène actuellement",
    scorePlace1: "Score #1",
    gapToPlace2: "Écart avec le #2",
    noGap: "Aucun écart",
    error: "Erreur",
    success: "Succès",
    info: "Info",
    attemptLabel: "Tentative",
    creatingAttempt: "Création de la tentative…",
    supportVerb: "soutenir",
    attemptsWord: "tentatives",
    proofWordingWinner: "Le soutien et la participation sont terminés. La vidéo gagnante reste visible ci-dessous comme preuve claire.",
    verifiedRecordingTitle: "Enregistrement vérifié",
    verifiedRecordingText: "Enregistre ta vidéo directement dans l'application, vérifie l'aperçu puis envoie-la ensuite.\nDurée minimale : 10s.",
    participationClosed: "La participation n'est actuellement pas ouverte.",
    noRecordingYet: "Aucun enregistrement disponible pour le moment.",
    readyRecording: "Prêt",
    minimumDuration10: "Durée minimale 10s",
    startRecording: "Démarrer l'enregistrement",
    commentsPlaceholder: "Écris un commentaire…",
    send: "Envoyer",
    noCommentsEyebrow: "AUCUN COMMENTAIRE POUR LE MOMENT",
    noCommentsTitle: "C'est ici que la discussion commencera plus tard",
    noCommentsText: "Dès que quelqu'un réagit, pose une question ou partage ses premières impressions sur le défi, les commentaires apparaîtront ici.",
    noReactionsYet: "Aucune réaction pour le moment",
    communityArea: "Espace communauté",
  },
};

function pickDetailText(
  locale: ChallengeLocale,
  de: string,
  en: string,
  es: string,
  fr: string
) {
  if (locale === "en") return en;
  if (locale === "es") return es;
  if (locale === "fr") return fr;
  return de;
}

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attemptsError, setAttemptsError] = useState("");

  const [votingAttempts, setVotingAttempts] = useState<Attempt[]>([]);
  const [votingError, setVotingError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [funding, setFunding] = useState(false);

  const [myAttempt, setMyAttempt] = useState<Attempt | null>(null);
  const [takingAttempt, setTakingAttempt] = useState(false);

  const [startingAttemptLive, setStartingAttemptLive] = useState(false);
  const [stoppingAttemptLive, setStoppingAttemptLive] = useState(false);
  const [attemptLiveError, setAttemptLiveError] = useState("");
  const [attemptActionInfo, setAttemptActionInfo] = useState("");

  const [attemptLiveInfo, setAttemptLiveInfo] = useState<LiveStartResponse | null>(null);

  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [fundConsentChecked, setFundConsentChecked] = useState(false);
  const [fundConsentError, setFundConsentError] = useState("");

  const [existingPayout, setExistingPayout] = useState<AdminPayout | null>(null);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [preparingPayout, setPreparingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  const [token, setToken] = useState<string | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [riskAck, setRiskAck] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"details" | "entries" | "votes">("details");

  const myAttemptRef = useRef<Attempt | null>(null);

  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => DETAIL_UI_TEXT[activeLocale], [activeLocale]);
  const extraUi = useMemo(() => DETAIL_EXTRA_UI_TEXT[activeLocale], [activeLocale]);
  const commentsUi = useMemo(
    () => ({
      placeholderText: extraUi.commentsPlaceholder,
      sendText: extraUi.send,
      noCommentsEyebrow: extraUi.noCommentsEyebrow,
      noCommentsTitle: extraUi.noCommentsTitle,
      noCommentsText: extraUi.noCommentsText,
      noReactionsYet: extraUi.noReactionsYet,
      communityArea: extraUi.communityArea,
    }),
    [extraUi]
  );
  const recorderUi = useMemo(
    () => ({
      verifiedRecordingTitle: extraUi.verifiedRecordingTitle,
      verifiedRecordingText: extraUi.verifiedRecordingText,
      participationClosed: extraUi.participationClosed,
      noRecordingYet: extraUi.noRecordingYet,
      ready: extraUi.readyRecording,
      minimumDuration10: extraUi.minimumDuration10,
      startRecording: extraUi.startRecording,
    }),
    [extraUi]
  );
  const localizedChallengeTitle = useMemo(
    () =>
      getLocalizedChallengeText(
        challenge?.title,
        challenge?.titleTranslations,
        activeLocale
      ),
    [challenge?.title, challenge?.titleTranslations, activeLocale]
  );

  const localizedChallengeDescription = useMemo(
    () =>
      getLocalizedChallengeText(
        challenge?.description,
        challenge?.descriptionTranslations,
        activeLocale
      ),
    [challenge?.description, challenge?.descriptionTranslations, activeLocale]
  );

  useEffect(() => {
    myAttemptRef.current = myAttempt;
  }, [myAttempt]);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    setToken(t);
  }, []);

  useEffect(() => {
    const payment = searchParams.get("payment");

    if (payment === "success") {
      setPaymentInfo(
        activeLocale === "en"
          ? "Payment successful. The challenge is now being refreshed automatically."
          : activeLocale === "es"
            ? "Pago realizado con éxito. El reto se está actualizando automáticamente."
            : activeLocale === "fr"
              ? "Paiement réussi. Le défi est en cours d'actualisation automatique."
              : "Zahlung erfolgreich. Die Challenge wird jetzt automatisch aktualisiert."
      );
    } else if (payment === "cancel") {
      setPaymentInfo(
        activeLocale === "en"
          ? "Payment cancelled."
          : activeLocale === "es"
            ? "Pago cancelado."
            : activeLocale === "fr"
              ? "Paiement annulé."
              : "Zahlung abgebrochen."
      );
    } else {
      setPaymentInfo("");
    }
  }, [searchParams, activeLocale]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!token) {
      setViewer(null);
      return;
    }

    (async () => {
      try {
        const resOrJson = await apiFetch(`/users/me`, { method: "GET" }, true);
        const parsed = await readApi(resOrJson);

        if (!parsed.ok) {
          setViewer(null);
          return;
        }

        const raw = parsed.json?.data ?? parsed.json;

        setViewer({
          id: String(raw?.id ?? ""),
          username: raw?.username,
          role: raw?.role ?? "user",
          isAdultVerified: !!raw?.isAdultVerified,
          dateOfBirth: raw?.dateOfBirth ?? null,
        });
      } catch {
        setViewer(null);
      }
    })();
  }, [token]);
  const myId = useMemo(() => getUserIdFromToken(token), [token]);
  const isLoggedIn = !!token;
  const isCreator = !!(
    myId &&
    challenge?.owner?.id &&
    String(challenge.owner.id) === String(myId)
  );

  const isAdmin = viewer?.role === "admin";
    const payoutPreview = useMemo(() => {
    const gross = Number(challenge?.currentAmount ?? 0);
    const fee = Number((gross * 0.2).toFixed(2));
    const net = Number((gross - fee).toFixed(2));

    return {
      gross,
      fee,
      net,
    };
  }, [challenge?.currentAmount]);

  const canPreparePayout =
    isAdmin &&
    !!challenge &&
    String(challenge.status).toLowerCase() === "completed" &&
    !!challenge.winnerUserId &&
    !existingPayout;

  const requiredSeconds = useMemo(
    () => clampInt(challenge?.requiredSeconds ?? 10, 3, 300, 10),
    [challenge?.requiredSeconds]
  );

  const riskLevel = useMemo(
    () => clampInt(challenge?.riskLevel ?? 0, 0, 2, 0),
    [challenge?.riskLevel]
  );

  const adultOnly = useMemo(() => !!challenge?.is18Plus, [challenge?.is18Plus]);

  const isAdultAllowed = useMemo(() => {
    if (!adultOnly) return true;
    if (viewer?.isAdultVerified) return true;
    if (isAtLeast18(viewer?.dateOfBirth)) return true;
    return false;
  }, [adultOnly, viewer]);

  const verificationMode = useMemo(
    () => String(challenge?.verificationMode ?? "live_or_recorded").toLowerCase(),
    [challenge?.verificationMode]
  );

  const requiresLive = useMemo(() => {
    if (!challenge) return false;
    if (challenge.requiresLive != null) return !!challenge.requiresLive;
    return verificationMode === "live_only";
  }, [challenge, verificationMode]);

  const participationModeMeta = useMemo(
    () => getParticipationModeMeta(challenge, activeLocale),
    [challenge, activeLocale]
  );

  const quickSupportAmounts = [5, 10, 25, 50];

  useEffect(() => {
    setRiskAck(false);
  }, [id, riskLevel, adultOnly, requiresLive]);

  useEffect(() => {
    if (!myAttempt) return;

    const s = String(myAttempt.status ?? "").toLowerCase();
    if (s === "processing") {
      setAttemptActionInfo(
        activeLocale === "en"
          ? "Live stream stopped. Your replay is now being processed."
          : activeLocale === "es"
            ? "El directo se ha detenido. Tu repetición se está procesando."
            : activeLocale === "fr"
              ? "Le live a été arrêté. Ton replay est en cours de traitement."
              : "Live-Stream beendet. Dein Replay wird jetzt verarbeitet."
      );
    } else if (s === "submitted") {
      setAttemptActionInfo(
        activeLocale === "en"
          ? "Your video was submitted successfully."
          : activeLocale === "es"
            ? "Tu vídeo se ha enviado correctamente."
            : activeLocale === "fr"
              ? "Ta vidéo a été soumise avec succès."
              : "Dein Video wurde erfolgreich eingereicht."
      );
    }
  }, [myAttempt, activeLocale]);

  const gatingNeeded = useMemo(() => {
    if (!isLoggedIn) return false;
    return riskLevel >= 2 || adultOnly === true;
  }, [isLoggedIn, riskLevel, adultOnly]);

  const gatingOk = useMemo(() => {
    const okRisk = riskLevel >= 2 ? riskAck : true;
    return okRisk;
  }, [riskLevel, riskAck]);

  const votingEndsAtMs = useMemo(() => {
    const v = challenge?.votingEndsAt ? new Date(challenge.votingEndsAt).getTime() : null;
    return v && Number.isFinite(v) ? v : null;
  }, [challenge?.votingEndsAt]);

  const votingOver = useMemo(() => {
    if (!votingEndsAtMs) return false;
    return nowTick > votingEndsAtMs;
  }, [nowTick, votingEndsAtMs]);

  useEffect(() => {
    if (!challenge) return;
    if (String(challenge.status).toLowerCase() !== "voting") return;
    if (!votingEndsAtMs) return;

    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [challenge, votingEndsAtMs]);

  const mergeAttemptLiveState = useCallback(
    (attemptId: string, raw: LiveStatusResponse | LiveStartResponse) => {
      const nextStatus = String(raw?.status ?? "").trim().toLowerCase();
      const nextIsLive = !!raw?.isLive;
      const nextPlaybackId = raw?.playbackId ?? null;

      setMyAttempt((prev) => {
        if (!prev || prev.id !== attemptId) return prev;

        const next = {
          ...prev,
          status: nextStatus || prev.status,
          isLive: nextIsLive,
          livePlaybackId:
            nextPlaybackId !== prev.livePlaybackId ? nextPlaybackId : prev.livePlaybackId,
          playbackId: nextIsLive ? nextPlaybackId ?? prev.playbackId : prev.playbackId,
        };

        const changed =
          next.status !== prev.status ||
          next.isLive !== prev.isLive ||
          next.livePlaybackId !== prev.livePlaybackId ||
          next.playbackId !== prev.playbackId;

        return changed ? next : prev;
      });

      setAttempts((prev) =>
        prev.map((a) => {
          if (a.id !== attemptId) return a;

          const next = {
            ...a,
            status: nextStatus || a.status,
            isLive: nextIsLive,
            livePlaybackId:
              nextPlaybackId !== a.livePlaybackId ? nextPlaybackId : a.livePlaybackId,
            playbackId: nextIsLive ? nextPlaybackId ?? a.playbackId : a.playbackId,
          };

          const changed =
            next.status !== a.status ||
            next.isLive !== a.isLive ||
            next.livePlaybackId !== a.livePlaybackId ||
            next.playbackId !== a.playbackId;

          return changed ? next : a;
        })
      );
    },
    []
  );

  const refreshChallengeData = useCallback(async () => {
    if (!id) return;

    const resOrJson = await apiFetch(`/challenges/${id}`, { method: "GET" });
    const parsed = await readApi(resOrJson);
    if (!parsed.ok) throw new Error(parsed.errorText || "Challenge konnte nicht geladen werden");

    const c = normalizeChallenge(parsed.json);
    setChallenge(c);
    setFunds(c.funds ?? []);
  }, [id]);

  const refreshAttemptsData = useCallback(async () => {
    if (!id) return;

    setAttemptsError("");
    setVotingError("");

    const loadPublicAttempts = async () => {
      const resAttempts = await apiFetch(`/challenges/${id}/attempts`, { method: "GET" });
      const parsedPublic = await readApi(resAttempts);

      if (parsedPublic.ok) {
        const list = normalizeAttempts(parsedPublic.json);
        setAttempts(list);
        return list;
      }

      setAttempts([]);
      setAttemptsError(parsedPublic.errorText || "Attempts konnten nicht geladen werden");
      return [];
    };

    const loadPublicVoting = async () => {
      const resPublic = await apiFetch(`/challenges/${id}/attempts`, { method: "GET" });
      const parsedPublic = await readApi(resPublic);

      if (parsedPublic.ok) {
        const list = normalizeAttempts(parsedPublic.json);
        setVotingAttempts(list);
        return list;
      }

      setVotingAttempts([]);
      setVotingError(parsedPublic.errorText || "Voting Attempts konnten nicht geladen werden");
      return [];
    };

    if (isLoggedIn) {
      try {
        const resAttemptsAll = await apiFetch(
          `/challenges/${id}/attempts/all`,
          { method: "GET" },
          true
        );
        const parsedAll = await readApi(resAttemptsAll);

        if (parsedAll.ok) {
          const list = normalizeAttempts(parsedAll.json);
          setAttempts(list);
          setMyAttempt(pickMyAttempt(list, myId));
        } else {
          const list = await loadPublicAttempts();
          setMyAttempt(pickMyAttempt(list, myId));
        }
      } catch {
        const list = await loadPublicAttempts();
        setMyAttempt(pickMyAttempt(list, myId));
      }

      try {
        const resMe = await apiFetch(`/challenges/${id}/attempts/me`, { method: "GET" }, true);
        const parsedMe = await readApi(resMe);

        if (parsedMe.ok) {
          setVotingAttempts(normalizeAttempts(parsedMe.json));
        } else {
          await loadPublicVoting();
        }
      } catch {
        await loadPublicVoting();
      }

      return;
    }

    const publicAttempts = await loadPublicAttempts();
    setMyAttempt(pickMyAttempt(publicAttempts, myId));
    await loadPublicVoting();
  }, [id, isLoggedIn, myId]);

  const loadAll = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!id) return;

      const silent = !!opts?.silent;

      try {
        if (!silent) setLoading(true);

        setError("");
        setAttemptsError("");
        setVotingError("");

        await refreshChallengeData();
        await refreshAttemptsData();
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Unbekannter Fehler"));
        setChallenge(null);
        setFunds([]);
        setAttempts([]);
        setVotingAttempts([]);
        setMyAttempt(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, refreshChallengeData, refreshAttemptsData]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment !== "success" || !id) return;

    let cancelled = false;
    const timeouts: number[] = [];

    const run = async () => {
      if (cancelled) return;
      try {
        await loadAll({ silent: false });
      } catch {}
    };

    run();

    [1500, 3500, 6000].forEach((ms) => {
      const t = window.setTimeout(() => {
        if (!cancelled) {
          loadAll({ silent: true }).catch(() => {});
        }
      }, ms);
      timeouts.push(t);
    });

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [id, searchParams, loadAll]);

  useEffect(() => {
    if (!myAttempt) return;
    if (myAttempt.status !== "processing") return;

    const run = async () => {
      try {
        await refreshAttemptsData();
        await refreshChallengeData();
      } catch {}
    };

    run();
    const t = setInterval(run, 2500);
    return () => clearInterval(t);
  }, [myAttempt, refreshAttemptsData, refreshChallengeData]);

  useEffect(() => {
    if (!token) return;
    if (!myAttempt?.id) return;
    if (!requiresLive) return;

    const shouldPoll =
      !!attemptLiveInfo?.streamKey ||
      !!attemptLiveInfo?.isPrepared ||
      myAttempt.status === "live" ||
      myAttempt.isLive === true ||
      !!myAttempt.livePlaybackId;

    if (!shouldPoll) return;

    const attemptId = myAttempt.id;

    const run = async () => {
      try {
        const currentAttempt = myAttemptRef.current;
        if (!currentAttempt || currentAttempt.id !== attemptId) return;

        const resOrJson = await apiFetch(
          `/attempts/${attemptId}/live/status`,
          { method: "GET" },
          true
        );
        const parsed = await readApi(resOrJson);
        if (!parsed.ok) return;

        const raw = (parsed.json?.data ?? parsed.json) as LiveStatusResponse;
        const nextStatus = String(raw?.status ?? "").trim().toLowerCase();

        setAttemptLiveInfo((prev) => {
          if (!prev) {
            return raw?.isPrepared
              ? {
                  playbackId: raw?.playbackId ?? null,
                  isLive: !!raw?.isLive,
                  isPrepared: !!raw?.isPrepared,
                  status: raw?.status ?? null,
                  streamKey: null,
                  rtmpUrl: null,
                }
              : prev;
          }

          const next = {
            ...prev,
            playbackId: raw?.playbackId ?? prev.playbackId ?? null,
            isLive: !!raw?.isLive,
            isPrepared: !!raw?.isPrepared,
            status: raw?.status ?? prev.status ?? null,
          };

          const changed =
            next.playbackId !== prev.playbackId ||
            next.isLive !== prev.isLive ||
            next.isPrepared !== prev.isPrepared ||
            next.status !== prev.status;

          return changed ? next : prev;
        });

        mergeAttemptLiveState(attemptId, raw);

        if (raw?.isLive || raw?.playbackId) {
          await refreshAttemptsData();
        }

        if (!raw?.isPrepared && nextStatus !== "live") {
          setAttemptLiveInfo(null);
        }

        if (nextStatus === "processing" || nextStatus === "submitted") {
          setAttemptLiveInfo(null);
          await refreshAttemptsData();
          await refreshChallengeData();
        }
      } catch {}
    };

    run();
    const t = setInterval(run, 1200);
    return () => clearInterval(t);
  }, [
    token,
    myAttempt?.id,
    myAttempt?.status,
    myAttempt?.isLive,
    myAttempt?.livePlaybackId,
    attemptLiveInfo?.streamKey,
    attemptLiveInfo?.isPrepared,
    mergeAttemptLiveState,
    refreshAttemptsData,
    refreshChallengeData,
    requiresLive,
  ]);

  useEffect(() => {
    if (!token) return;
    if (!myAttempt?.id) return;
    if (!requiresLive) return;

    const shouldRefreshLists =
      !!attemptLiveInfo?.isPrepared ||
      !!attemptLiveInfo?.streamKey ||
      myAttempt.status === "live" ||
      myAttempt.isLive === true;

    if (!shouldRefreshLists) return;

    const run = async () => {
      try {
        await refreshAttemptsData();
      } catch {}
    };

    run();
    const t = setInterval(run, 1800);
    return () => clearInterval(t);
  }, [
    token,
    myAttempt?.id,
    myAttempt?.status,
    myAttempt?.isLive,
    attemptLiveInfo?.isPrepared,
    attemptLiveInfo?.streamKey,
    refreshAttemptsData,
    requiresLive,
  ]);

  useEffect(() => {
    if (!token || !id || !viewer || viewer.role !== "admin") {
      setExistingPayout(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoadingPayout(true);
        setPayoutError("");

        const q = encodeURIComponent(id);
        const resOrJson = await apiFetch(`/payments/admin/payouts?q=${q}`, { method: "GET" }, true);
        const parsed = await readApi(resOrJson);

        if (!parsed.ok) {
          if (!cancelled) {
            setExistingPayout(null);
          }
          return;
        }

        const arr = Array.isArray(parsed.json) ? (parsed.json as AdminPayout[]) : [];
        const match = arr.find((p) => String(p?.challengeId) === String(id)) ?? null;

        if (!cancelled) {
          setExistingPayout(match);
        }
      } catch {
        if (!cancelled) {
          setExistingPayout(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPayout(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [token, id, viewer]);

  const handleStopAttemptLive = async () => {
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    if (!myAttempt?.id) return;

    const ok = confirm(
      activeLocale === "en"
        ? "Do you really want to stop the live attempt?"
        : activeLocale === "es"
          ? "¿De verdad quieres detener el intento en directo?"
          : activeLocale === "fr"
            ? "Veux-tu vraiment arrêter la tentative en direct ?"
            : "Live-Versuch wirklich stoppen?"
    );
    if (!ok) return;

    try {
      setStoppingAttemptLive(true);
      setAttemptLiveError("");
      setAttemptActionInfo("");

      const resOrJson = await apiFetch(
        `/attempts/${myAttempt.id}/live/stop`,
        { method: "POST" },
        true
      );
      const parsed = await readApi(resOrJson);

      if (!parsed.ok) {
        setAttemptLiveError(
          parsed.errorText ||
            (activeLocale === "en"
              ? "Failed to stop live attempt"
              : activeLocale === "es"
                ? "No se pudo detener el intento en directo"
                : activeLocale === "fr"
                  ? "Impossible d'arrêter la tentative en direct"
                  : "Live-Versuch stoppen fehlgeschlagen")
        );
        return;
      }

      setAttemptLiveInfo(null);
      setAttemptActionInfo(
        activeLocale === "en"
          ? "Live stream stopped. Your replay is now being processed."
          : activeLocale === "es"
            ? "El directo se ha detenido. Tu repetición se está procesando."
            : activeLocale === "fr"
              ? "Le live a été arrêté. Ton replay est en cours de traitement."
              : "Live-Stream beendet. Dein Replay wird jetzt verarbeitet."
      );
      await refreshAttemptsData();
      await refreshChallengeData();
    } catch (e: unknown) {
      setAttemptLiveError(
        getErrorMessage(
          e,
          (activeLocale === "en"
            ? "Failed to stop live attempt"
            : activeLocale === "es"
              ? "No se pudo detener el intento en directo"
              : activeLocale === "fr"
                ? "Impossible d'arrêter la tentative en direct"
                : "Live-Versuch stoppen fehlgeschlagen")
        )
      );
    } finally {
      setStoppingAttemptLive(false);
    }
  };
  const handleDelete = async () => {
    if (!id) return;
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    const ok = confirm(
      activeLocale === "en"
        ? "Do you really want to delete this challenge?"
        : activeLocale === "es"
          ? "¿De verdad quieres eliminar este reto?"
          : activeLocale === "fr"
            ? "Veux-tu vraiment supprimer ce défi ?"
            : "Willst du diese Challenge wirklich löschen?"
    );
    if (!ok) return;
    try {
      setDeleting(true);
      setError("");
      const resOrJson = await apiFetch(`/challenges/${id}`, { method: "DELETE" }, true);
      const parsed = await readApi(resOrJson);
      if (!parsed.ok) throw new Error(parsed.errorText || "Löschen fehlgeschlagen");
      router.push("/challenges");
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Unbekannter Fehler");
      if (message === "NO_TOKEN") router.replace("/auth/login");
      else setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const fundingState = useMemo(
    () => getFundingState(challenge, votingOver, ui, activeLocale),
    [challenge, votingOver, ui, activeLocale]
  );
  const canFundByStatus = fundingState.canFund;

  const parsedAmount = Number(amountInput.replace(",", "."));
  const isFundAmountValid =
    amountInput.trim().length > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 5;

  const handleFund = async () => {
    if (!fundConsentChecked) {
      setFundConsentError(
        activeLocale === "en"
          ? "Please confirm the legal notice first."
          : activeLocale === "es"
            ? "Primero confirma el aviso legal."
            : activeLocale === "fr"
              ? "Merci de confirmer d'abord l'avis légal."
              : "Bitte bestätige zuerst die rechtlichen Hinweise."
      );
      return;
    }

    if (!id) return;

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    if (!canFundByStatus) {
      setAmountError(
        activeLocale === "en"
          ? "No new support is possible in this status."
          : activeLocale === "es"
            ? "En este estado no es posible hacer nuevos apoyos."
            : activeLocale === "fr"
              ? "Aucun nouveau soutien n'est possible dans cet état."
              : "In diesem Status sind keine neuen Unterstützungen möglich."
      );
      return;
    }

    const raw = amountInput.trim();
    const amount = Number(raw.replace(",", "."));

    if (!raw) {
      setAmountError(
        activeLocale === "en"
          ? "Please enter an amount."
          : activeLocale === "es"
            ? "Introduce una cantidad."
            : activeLocale === "fr"
              ? "Merci de saisir un montant."
              : "Bitte Betrag eingeben."
      );
      return;
    }

    if (!Number.isFinite(amount) || amount < 5) {
      setAmountError(
        activeLocale === "en"
          ? "Please enter at least €5."
          : activeLocale === "es"
            ? "Introduce al menos 5 €."
            : activeLocale === "fr"
              ? "Merci de saisir au moins 5 €."
              : "Bitte mindestens 5 € eingeben."
      );
      return;
    }

    try {
      setFunding(true);
      setAmountError("");
      setError("");

      const resOrJson = await apiFetch(
        `/challenges/${id}/fund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        },
        true
      );

      const parsed = await readApi(resOrJson);
      if (!parsed.ok) {
        throw new Error(parsed.errorText || "Checkout konnte nicht gestartet werden.");
      }

      const json = (parsed.json?.data ?? parsed.json) as CheckoutSessionResponse;
      const checkoutUrl = String(json?.checkoutUrl ?? "").trim();

      if (!checkoutUrl) {
        throw new Error("Keine Checkout-URL vom Server erhalten.");
      }

      setFundConsentChecked(false);
      window.location.assign(checkoutUrl);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Checkout konnte nicht gestartet werden.");
      if (message === "NO_TOKEN") {
        router.replace("/auth/login");
        return;
      }

      setAmountError(message);
    } finally {
      setFunding(false);
    }
  };

  const handleTakeAttempt = async () => {
    if (!id) return null;

    if (!token) {
      router.replace("/auth/login");
      return null;
    }

    if (adultOnly && !isAdultAllowed) {
      setAttemptLiveError(
        activeLocale === "en"
          ? "This challenge is 18+. Please add your date of birth in your profile."
          : activeLocale === "es"
            ? "Este reto es para mayores de 18. Añade tu fecha de nacimiento en tu perfil."
            : activeLocale === "fr"
              ? "Ce défi est réservé aux 18+. Merci d'ajouter ta date de naissance dans ton profil."
              : "Diese Challenge ist ab 18. Bitte hinterlege dein Geburtsdatum im Profil."
      );
      return null;
    }

    if (gatingNeeded && !gatingOk) {
      setAttemptLiveError(
        requiresLive
          ? activeLocale === "en"
            ? "Please confirm the notice first to start the attempt."
            : activeLocale === "es"
              ? "Confirma primero el aviso para iniciar el intento."
              : activeLocale === "fr"
                ? "Merci de confirmer d'abord l'avis pour démarrer la tentative."
                : "Bitte bestätige zuerst die Hinweise, um den Versuch zu starten."
          : activeLocale === "en"
            ? "Please confirm the notice first to start the verified recording."
            : activeLocale === "es"
              ? "Confirma primero el aviso para iniciar la grabación verificada."
              : activeLocale === "fr"
                ? "Merci de confirmer d'abord l'avis pour démarrer l'enregistrement vérifié."
                : "Bitte bestätige zuerst die Hinweise, um die verifizierte Aufnahme zu starten."
      );
      return null;
    }

    try {
      setTakingAttempt(true);
      setAttemptLiveError("");
      setAttemptActionInfo("");

      const resOrJson = await apiFetch(`/challenges/${id}/attempts`, { method: "POST" }, true);
      const parsed = await readApi(resOrJson);
      if (!parsed.ok) {
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en"
              ? "Failed to create attempt"
              : activeLocale === "es"
                ? "No se pudo crear el intento"
                : activeLocale === "fr"
                  ? "Impossible de créer la tentative"
                  : "Attempt anlegen fehlgeschlagen")
        );
      }

      await refreshAttemptsData();

      const resAll = await apiFetch(`/challenges/${id}/attempts/all`, { method: "GET" }, true);
      const parsedAll = await readApi(resAll);
      if (parsedAll.ok) {
        const list = normalizeAttempts(parsedAll.json);
        const mine = pickMyAttempt(list, myId);
        if (mine) return mine;
      }

      return null;
    } catch (e: unknown) {
      setAttemptLiveError(
        getErrorMessage(
          e,
          (activeLocale === "en"
            ? "Failed to create attempt"
            : activeLocale === "es"
              ? "No se pudo crear el intento"
              : activeLocale === "fr"
                ? "Impossible de créer la tentative"
                : "Attempt anlegen fehlgeschlagen")
        )
      );
      return null;
    } finally {
      setTakingAttempt(false);
    }
  };

  const handleStartAttemptLive = async () => {
    if (!requiresLive) {
      setAttemptLiveError(
        activeLocale === "en"
          ? "This challenge does not require a live start. A verified recording must be started instead."
          : activeLocale === "es"
            ? "Este reto no requiere empezar en directo. En su lugar debe iniciarse una grabación verificada."
            : activeLocale === "fr"
              ? "Ce défi ne nécessite pas de démarrage en direct. Il faut lancer un enregistrement vérifié à la place."
              : "Diese Challenge verlangt keinen Live-Start. Hier muss stattdessen die verifizierte Aufnahme gestartet werden."
      );
      return;
    }

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    if (adultOnly && !isAdultAllowed) {
      setAttemptLiveError(
        activeLocale === "en"
          ? "This challenge is 18+. Please add your date of birth in your profile."
          : activeLocale === "es"
            ? "Este reto es para mayores de 18. Añade tu fecha de nacimiento en tu perfil."
            : activeLocale === "fr"
              ? "Ce défi est réservé aux 18+. Merci d'ajouter ta date de naissance dans ton profil."
              : "Diese Challenge ist ab 18. Bitte hinterlege dein Geburtsdatum im Profil."
      );
      return;
    }

    if (gatingNeeded && !gatingOk) {
      setAttemptLiveError(
        activeLocale === "en"
          ? "Please confirm the notice first before starting."
          : activeLocale === "es"
            ? "Confirma primero el aviso antes de empezar."
            : activeLocale === "fr"
              ? "Merci de confirmer d'abord l'avis avant de démarrer."
              : "Bitte bestätige zuerst die Hinweise, um zu starten."
      );
      return;
    }

    try {
      setStartingAttemptLive(true);
      setAttemptLiveError("");
      setAttemptActionInfo("");

      let activeAttempt = myAttempt;

      if (!activeAttempt?.id) {
        activeAttempt = await handleTakeAttempt();
        if (!activeAttempt?.id) {
          throw new Error(
            activeLocale === "en"
              ? "Attempt could not be created."
              : activeLocale === "es"
                ? "No se pudo crear el intento."
                : activeLocale === "fr"
                  ? "Impossible de créer la tentative."
                  : "Attempt konnte nicht angelegt werden."
          );
        }
      }

      if (activeAttempt.status === "submitted") {
        setAttemptLiveError(
          activeLocale === "en"
            ? "✅ Already submitted. Only 1 valid video is allowed per challenge."
            : activeLocale === "es"
              ? "✅ Ya enviado. Solo se permite 1 vídeo válido por reto."
              : activeLocale === "fr"
                ? "✅ Déjà soumis. Une seule vidéo valide est autorisée par défi."
                : "✅ Bereits eingereicht. Pro Challenge ist nur 1 gültiges Video erlaubt."
        );
        return;
      }

      const resOrJson = await apiFetch(
        `/attempts/${activeAttempt.id}/live/start`,
        { method: "POST" },
        true
      );
      const parsed = await readApi(resOrJson);
      if (!parsed.ok) {
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en"
              ? "Failed to start live attempt"
              : activeLocale === "es"
                ? "No se pudo iniciar el intento en directo"
                : activeLocale === "fr"
                  ? "Impossible de démarrer la tentative en direct"
                  : "Live-Versuch starten fehlgeschlagen")
        );
      }

      const json = parsed.json?.data ?? parsed.json;

      setAttemptLiveInfo({
        playbackId: json?.playbackId ?? null,
        isLive: !!json?.isLive,
        isPrepared: json?.isPrepared ?? true,
        status: json?.status ?? null,
        streamKey: json?.streamKey ?? null,
        rtmpUrl: json?.rtmpUrl ?? null,
      });

      mergeAttemptLiveState(activeAttempt.id, {
        isPrepared: !!json?.isPrepared,
        isLive: !!json?.isLive,
        status: String(json?.status ?? "draft"),
        playbackId: json?.playbackId ?? null,
      });

      setAttemptActionInfo(
        json?.isLive
          ? activeLocale === "en"
            ? "Live stream is running."
            : activeLocale === "es"
              ? "El directo está en marcha."
              : activeLocale === "fr"
                ? "Le live est en cours."
                : "Live-Stream läuft."
          : activeLocale === "en"
            ? "Live stream prepared. Start OBS now with RTMP URL and stream key."
            : activeLocale === "es"
              ? "Directo preparado. Inicia ahora OBS con la URL RTMP y la clave de transmisión."
              : activeLocale === "fr"
                ? "Live préparé. Lance maintenant OBS avec l'URL RTMP et la clé de stream."
                : "Live-Stream vorbereitet. Starte jetzt OBS mit RTMP-URL und Stream-Key."
      );

      await refreshAttemptsData();
      await refreshChallengeData();
    } catch (e: unknown) {
      setAttemptLiveError(
        getErrorMessage(
          e,
          (activeLocale === "en"
            ? "Failed to start live attempt"
            : activeLocale === "es"
              ? "No se pudo iniciar el intento en directo"
              : activeLocale === "fr"
                ? "Impossible de démarrer la tentative en direct"
                : "Live-Versuch starten fehlgeschlagen")
        )
      );
    } finally {
      setStartingAttemptLive(false);
    }
  };

  const handlePreparePayout = async () => {
    if (!id) return;
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    if (!viewer || viewer.role !== "admin") return;

    const ok = confirm(
      activeLocale === "en"
        ? "Prepare payout for this challenge?"
        : activeLocale === "es"
          ? "¿Preparar el pago para este reto?"
          : activeLocale === "fr"
            ? "Préparer le paiement pour ce défi ?"
            : "Payout für diese Challenge vorbereiten?"
    );
    if (!ok) return;

    try {
      setPreparingPayout(true);
      setPayoutError("");
      setPayoutSuccess("");

      const resOrJson = await apiFetch(
        `/payments/admin/challenges/${id}/prepare-payout`,
        { method: "POST" },
        true
      );

      const parsed = await readApi(resOrJson);

      if (!parsed.ok) {
        throw new Error(
          parsed.errorText ||
            (activeLocale === "en"
              ? "Payout could not be prepared."
              : activeLocale === "es"
                ? "No se pudo preparar el pago."
                : activeLocale === "fr"
                  ? "Le paiement n’a pas pu être préparé."
                  : "Payout konnte nicht vorbereitet werden.")
        );
      }

      setPayoutSuccess(
        activeLocale === "en"
          ? "Payout has been prepared."
          : activeLocale === "es"
            ? "El pago ha sido preparado."
            : activeLocale === "fr"
              ? "Le paiement a été préparé."
              : "Payout wurde vorbereitet."
      );

      const q = encodeURIComponent(id);
      const reloadRes = await apiFetch(`/payments/admin/payouts?q=${q}`, { method: "GET" }, true);
      const reloadParsed = await readApi(reloadRes);

      if (reloadParsed.ok) {
        const arr = Array.isArray(reloadParsed.json) ? (reloadParsed.json as AdminPayout[]) : [];
        const match = arr.find((p) => String(p?.challengeId) === String(id)) ?? null;
        setExistingPayout(match);
      }
    } catch (e: unknown) {
      setPayoutError(
        getErrorMessage(
          e,
          activeLocale === "en"
            ? "Payout could not be prepared."
            : activeLocale === "es"
              ? "No se pudo preparar el pago."
              : activeLocale === "fr"
                ? "Le paiement n’a pas pu être préparé."
                : "Payout konnte nicht vorbereitet werden."
        )
      );
    } finally {
      setPreparingPayout(false);
    }
  };

  if (!id) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          {ui.missingChallengeId}
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-950">
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl">
            <div className="text-slate-700">{ui.loading}</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-950">
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="text-lg font-extrabold text-slate-900">{ui.challenge}</div>
            <div className="mt-2 font-semibold text-red-700">{error}</div>
            <div className="mt-4">
              <Link href="/challenges">
                <PrimaryButton variant="secondary">{ui.backToList}</PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!challenge) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          {ui.noData}
        </div>
      </main>
    );
  }

  const current = challenge.currentAmount ?? 0;
  const min = challenge.minAmount ?? 0;
  const hasGoal = (challenge.minAmount ?? 0) > 0;
  const isGoalReached = !hasGoal || current >= min;
  const submitBlockedByGoal = !isGoalReached;
  const goalRemaining = hasGoal ? Math.max(0, min - current) : 0;
  const pct = hasGoal ? clamp((current / min) * 100, 0, 100) : 0;

  const thumbnailSrc = resolveImageUrl(challenge.thumbnailUrl);

  const statusLower = String(challenge.status).toLowerCase();
  const isVoting = statusLower === "voting";
  const isCompleted = statusLower === "completed";
  const isFunding = statusLower === "funding";
  const isActive = statusLower === "active";

  const resultLower = String(challenge.result ?? "").trim().toLowerCase();
  const isFailedCompleted = isCompleted && resultLower === "failed";
  const isAttemptWindowOpen =
    statusLower === "active" || (isVoting && !votingOver);

  const uniqueSupporters = new Set(
    funds.map((f) => f.user?.id).filter(Boolean) as string[]
  ).size;

  const selectedPresetAmount = (() => {
    const n = Number(amountInput.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return quickSupportAmounts.includes(n) ? n : null;
  })();

  const liveAttempts = attempts.filter((a) => {
    const hasLivePlayback = !!(a.livePlaybackId ?? a.playbackId);
    return a.isLive === true && String(a.status).toLowerCase() === "live" && hasLivePlayback;
  });

  const submittedAttempts = attempts
    .filter((a) => a.status === "submitted")
    .sort((a, b) => {
      if (challenge.winnerAttemptId && a.id === challenge.winnerAttemptId) return -1;
      if (challenge.winnerAttemptId && b.id === challenge.winnerAttemptId) return 1;
      if (b.score !== a.score) return b.score - a.score;
      if (b.upVotes !== a.upVotes) return b.upVotes - a.upVotes;

      const ta = a.submittedAt
        ? new Date(a.submittedAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const tb = b.submittedAt
        ? new Date(b.submittedAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });

  const winnerAttemptId = challenge.winnerAttemptId ?? null;
  const winnerName = displayWinnerName(challenge.winner, myId, activeLocale);
  const statusMeta = getDetailStatusMeta(challenge, ui);

  const hasAnyFunding =
    Number(challenge.currentAmount ?? 0) > 0 || (funds?.length ?? 0) > 0;

  const creatorActionsAllowed = isCreator && !!token && !isCompleted;
  const canDeleteChallenge = creatorActionsAllowed && !hasAnyFunding;

  const leadingAttempt = submittedAttempts[0] ?? null;
  const secondAttempt = submittedAttempts[1] ?? null;
  const mobileHeroAttempt =
    (challenge.winnerAttemptId
      ? submittedAttempts.find((a) => String(a.id) === String(challenge.winnerAttemptId))
      : null) ??
    submittedAttempts[0] ??
    null;

  const mobileHeroFallbackAttempt = attempts.find((a) => {
    const { playbackId } = pickAttemptPlayback(a);
    return !!resolvePlaybackUrl(playbackId ?? null);
  });

  const mobileHeroBaseAttempt = mobileHeroAttempt ?? mobileHeroFallbackAttempt ?? null;

  const mobileHeroPlayback = mobileHeroBaseAttempt
    ? resolvePlaybackUrl(
        pickAttemptPlayback(mobileHeroBaseAttempt).playbackId ??
          challenge.winnerPlaybackId ??
          challenge.playbackId ??
          challenge.liveVideoUrl ??
          null
      )
    : resolvePlaybackUrl(
        challenge.winnerPlaybackId ?? challenge.playbackId ?? challenge.liveVideoUrl ?? null
      );

  const mobileHeroIsLive = mobileHeroBaseAttempt
    ? pickAttemptPlayback(mobileHeroBaseAttempt).isLive
    : false;

  const mobileTopThree = submittedAttempts.slice(0, 3);
  const mobileEntriesCount = submittedAttempts.length;
  const mobileVotesCount = submittedAttempts.reduce(
    (sum, a) => sum + Number(a.upVotes ?? 0) + Number(a.downVotes ?? 0),
    0
  );

  const mobileSubtitle =
    localizedChallengeDescription?.trim() ||
    (activeLocale === "en"
      ? "Show your style and control."
      : activeLocale === "es"
        ? "Muestra tu estilo y control."
        : activeLocale === "fr"
          ? "Montre ton style et ton contrôle."
          : "Zeig deine Style & Kontrolle.");

  const mobileTaskText =
    localizedChallengeDescription?.trim() ||
    (activeLocale === "en"
      ? "Complete the challenge with a valid attempt and convince the community."
      : activeLocale === "es"
        ? "Completa el reto con un intento válido y convence a la comunidad."
        : activeLocale === "fr"
          ? "Réalise le défi avec une tentative valide et convaincs la communauté."
          : "Zeig deine Aufgabe mit einem gültigen Versuch und überzeuge die Community.");

  const leadingName = leadingAttempt
    ? displayAttemptName(leadingAttempt, myId, activeLocale)
    : "—";

  const leadingGap = (() => {
    if (!leadingAttempt || !secondAttempt) return null;
    return leadingAttempt.score - secondAttempt.score;
  })();

  const isAttemptPrepared =
    !myAttempt?.isLive &&
    myAttempt?.status !== "live" &&
    (!!attemptLiveInfo?.streamKey ||
      (!!attemptLiveInfo?.isPrepared &&
        !attemptLiveInfo?.isLive &&
        myAttempt?.status !== "processing"));

  const handleVotedUpdate = (
    attemptId: string,
    next: { upVotes: number; downVotes: number; score: number; myVote: VoteValue }
  ) => {
    setVotingAttempts((prev) =>
      prev.map((a) => (a.id === attemptId ? { ...a, ...next } : a))
    );

    setAttempts((prev) =>
      prev.map((a) =>
        a.id === attemptId
          ? { ...a, upVotes: next.upVotes, downVotes: next.downVotes, score: next.score }
          : a
      )
    );
  };


  const votingInfo = (() => {
    if (!isVoting && !isCompleted) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Voting starts automatically"
              : activeLocale === "es"
                ? "La votación empieza automáticamente"
                : activeLocale === "fr"
                  ? "Le vote démarre automatiquement"
                  : "Voting startet automatisch"
          }
          text={
            activeLocale === "en"
              ? "As soon as the first valid video is submitted, the voting window opens automatically for 24 hours."
              : activeLocale === "es"
                ? "En cuanto se envíe el primer vídeo válido, la ventana de votación se abrirá automáticamente durante 24 horas."
                : activeLocale === "fr"
                  ? "Dès que la première vidéo valide est soumise, la fenêtre de vote s’ouvre automatiquement pendant 24 heures."
                  : "Sobald das erste gültige Video eingereicht wurde, öffnet sich das Voting-Fenster automatisch für 24 Stunden."
          }
          tone="neutral"
        />
      );
    }

    if (isCompleted && challenge.winner) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? `🏆 Winner: ${winnerName}`
              : activeLocale === "es"
                ? `🏆 Ganador: ${winnerName}`
                : activeLocale === "fr"
                  ? `🏆 Gagnant : ${winnerName}`
                  : `🏆 Gewinner: ${winnerName}`
          }
          text={
            activeLocale === "en"
              ? "Voting is complete. The winning video is clearly marked below."
              : activeLocale === "es"
                ? "La votación ha terminado. El vídeo ganador está claramente marcado abajo."
                : activeLocale === "fr"
                  ? "Le vote est terminé. La vidéo gagnante est clairement marquée ci-dessous."
                  : "Das Voting ist abgeschlossen. Das Gewinner-Video ist unten klar markiert."
          }
        />
      );
    }

    if (isFailedCompleted) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "❌ Ended without a winner"
              : activeLocale === "es"
                ? "❌ Terminó sin ganador"
                : activeLocale === "fr"
                  ? "❌ Terminé sans gagnant"
                  : "❌ Ohne Gewinner beendet"
          }
          text={
            activeLocale === "en"
              ? "No valid video was submitted. That is why no winner could be determined."
              : activeLocale === "es"
                ? "No se envió ningún vídeo válido. Por eso no se pudo determinar un ganador."
                : activeLocale === "fr"
                  ? "Aucune vidéo valide n’a été soumise. C’est pourquoi aucun gagnant n’a pu être déterminé."
                  : "Es wurde kein gültiges Video eingereicht. Deshalb konnte kein Gewinner bestimmt werden."
          }
          tone="danger"
        />
      );
    }

    if (isCompleted && !winnerAttemptId) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Voting completed"
              : activeLocale === "es"
                ? "Votación completada"
                : activeLocale === "fr"
                  ? "Vote terminé"
                  : "Voting abgeschlossen"
          }
          text={
            activeLocale === "en"
              ? "No winner could be determined."
              : activeLocale === "es"
                ? "No se pudo determinar un ganador."
                : activeLocale === "fr"
                  ? "Aucun gagnant n’a pu être déterminé."
                  : "Es konnte kein Gewinner bestimmt werden."
          }
          tone="neutral"
        />
      );
    }

    if (!votingEndsAtMs) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Voting is live"
              : activeLocale === "es"
                ? "La votación está en marcha"
                : activeLocale === "fr"
                  ? "Le vote est en cours"
                  : "Voting läuft"
          }
          text={
            activeLocale === "en"
              ? "The deadline has not been set yet. If it stays like this, votingEndsAt should be checked in the backend."
              : activeLocale === "es"
                ? "La fecha límite aún no está definida. Si esto sigue así, hay que revisar votingEndsAt en el backend."
                : activeLocale === "fr"
                  ? "La date limite n’a pas encore été définie. Si cela reste ainsi, il faut vérifier votingEndsAt dans le backend."
                  : "Die Deadline wird noch gesetzt. Falls das so bleibt, muss votingEndsAt im Backend geprüft werden."
          }
          tone="warning"
        />
      );
    }

    if (votingOver) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "⏱ Voting has expired"
              : activeLocale === "es"
                ? "⏱ La votación ha expirado"
                : activeLocale === "fr"
                  ? "⏱ Le vote a expiré"
                  : "⏱ Voting ist abgelaufen"
          }
          text={
            activeLocale === "en"
              ? "The challenge will be finalized shortly. No new attempts are possible."
              : activeLocale === "es"
                ? "El reto se finalizará en breve. Ya no se permiten nuevos intentos."
                : activeLocale === "fr"
                  ? "Le défi sera finalisé sous peu. Aucune nouvelle tentative n’est possible."
                  : `Die Challenge wird gleich finalisiert. Neue ${extraUi.attemptsWord} sind nicht mehr möglich.`
          }
          tone="warning"
        />
      );
    }

    const msLeft = votingEndsAtMs - nowTick;

    return (
      <StatusMessage
        title={
          activeLocale === "en"
            ? `⏳ ${formatRemaining(msLeft, activeLocale)} left`
            : activeLocale === "es"
              ? `⏳ Quedan ${formatRemaining(msLeft, activeLocale)}`
              : activeLocale === "fr"
                ? `⏳ Il reste ${formatRemaining(msLeft, activeLocale)}`
                : `⏳ Noch ${formatRemaining(msLeft, activeLocale)} Zeit`
        }
        text={
          activeLocale === "en"
            ? `New attempts possible until: ${formatDateTime(votingEndsAtMs, activeLocale)}`
            : activeLocale === "es"
              ? `Nuevos intentos posibles hasta: ${formatDateTime(votingEndsAtMs, activeLocale)}`
              : activeLocale === "fr"
                ? `Nouvelles tentatives possibles jusqu’à : ${formatDateTime(votingEndsAtMs, activeLocale)}`
                : `Neue ${extraUi.attemptsWord} möglich bis: ${formatDateTime(votingEndsAtMs, activeLocale)}`
        }
        tone="info"
      />
    );
  })();

  const canStartAttempt =
    !!token &&
    isAttemptWindowOpen &&
    requiresLive &&
    (!myAttempt ||
      (myAttempt.status !== "submitted" &&
        myAttempt.status !== "live" &&
        myAttempt.isLive !== true)) &&
    !isAttemptPrepared &&
    (!gatingNeeded || gatingOk) &&
    isAdultAllowed &&
    !startingAttemptLive &&
    !takingAttempt;

  const attemptUnavailableReason = (() => {
    if (!token) {
      return pickDetailText(
        activeLocale,
        "Bitte logge dich ein, um an dieser Challenge teilzunehmen.",
        "Please log in to participate in this challenge.",
        "Inicia sesión para participar en este reto.",
        "Connecte-toi pour participer à ce défi."
      );
    }
    if (isFailedCompleted) {
      return pickDetailText(
        activeLocale,
        "Diese Challenge wurde ohne Gewinner beendet. Eine Teilnahme ist nicht mehr möglich.",
        "This challenge ended without a winner. Participation is no longer possible.",
        "Este reto terminó sin ganador. Ya no es posible participar.",
        "Ce défi s’est terminé sans gagnant. La participation n’est plus possible."
      );
    }
    if (!isAttemptWindowOpen) {
      return pickDetailText(
        activeLocale,
        "Teilnahme ist aktuell nicht offen. Entweder ist die Challenge nicht aktiv oder das Voting-Fenster ist bereits abgelaufen.",
        "Participation is currently not open. Either the challenge is not active or the voting window has already expired.",
        "La participación no está abierta ahora mismo. O bien el reto no está activo o la ventana de votación ya ha expirado.",
        "La participation n’est pas ouverte actuellement. Soit le défi n’est pas actif, soit la fenêtre de vote a déjà expiré."
      );
    }
    if (adultOnly && !isAdultAllowed) {
      return pickDetailText(
        activeLocale,
        "Diese Challenge ist ab 18. Hinterlege zuerst dein Geburtsdatum im Profil.",
        "This challenge is 18+. Add your date of birth in your profile first.",
        "Este reto es para mayores de 18. Añade primero tu fecha de nacimiento en tu perfil.",
        "Ce défi est réservé aux 18+. Ajoute d’abord ta date de naissance dans ton profil."
      );
    }
    if (gatingNeeded && !gatingOk) {
      if (requiresLive) {
        return pickDetailText(
          activeLocale,
          "Bestätige zuerst den Teilnahme-Hinweis, dann kannst du starten.",
          "Confirm the participation notice first, then you can start.",
          "Confirma primero el aviso de participación y luego podrás empezar.",
          "Confirme d’abord l’avis de participation, puis tu pourras démarrer."
        );
      }

      return pickDetailText(
        activeLocale,
        "Bestätige zuerst den Teilnahme-Hinweis, dann kannst du aufnehmen.",
        "Confirm the participation notice first, then you can record.",
        "Confirma primero el aviso de participación y luego podrás grabar.",
        "Confirme d’abord l’avis de participation, puis tu pourras enregistrer."
      );
    }
    if (!requiresLive) {
      return pickDetailText(
        activeLocale,
        "Für diese Challenge ist kein Live-Start vorgeschrieben.",
        "No live start is required for this challenge.",
        "Este reto no requiere empezar en directo.",
        "Aucun démarrage en direct n’est requis pour ce défi."
      );
    }
    return pickDetailText(
      activeLocale,
      "Du kannst teilnehmen, sobald die Bedingungen erfüllt sind.",
      "You can participate as soon as the conditions are met.",
      "Puedes participar en cuanto se cumplan las condiciones.",
      "Tu peux participer dès que les conditions sont remplies."
    );
  })();

  const attemptStatusTone = (() => {
    if (!token) return "neutral" as const;
    if (!myAttempt) return canStartAttempt ? ("info" as const) : ("neutral" as const);

    const s = String(myAttempt.status ?? "").toLowerCase();
    if (s === "live" || myAttempt.isLive) return "danger" as const;
    if (s === "processing") return "warning" as const;
    if (s === "submitted") return "success" as const;
    if (s === "too_short") return "warning" as const;
    if (s === "disqualified") return "danger" as const;
    if (isAttemptPrepared) return "info" as const;
    return "neutral" as const;
  })();

  const attemptPanelMeta = (() => {
    if (!token) {
      return {
        headline:
          activeLocale === "en"
            ? "Login required"
            : activeLocale === "es"
              ? "Inicio de sesión requerido"
              : activeLocale === "fr"
                ? "Connexion requise"
                : "Login erforderlich",
        text: requiresLive
          ? activeLocale === "en"
            ? "Log in to start your live attempt."
            : activeLocale === "es"
              ? "Inicia sesión para comenzar tu intento en vivo."
              : activeLocale === "fr"
                ? "Connecte-toi pour démarrer ta tentative en direct."
                : "Melde dich an, damit du deinen Live-Versuch starten kannst."
          : activeLocale === "en"
            ? "Log in to participate with a verified recording."
            : activeLocale === "es"
              ? "Inicia sesión para participar con una grabación verificada."
              : activeLocale === "fr"
                ? "Connecte-toi pour participer avec un enregistrement vérifié."
                : "Melde dich an, damit du per verifizierter Aufnahme teilnehmen kannst.",
      };
    }

    if (!requiresLive) {
      return {
        headline:
          activeLocale === "en"
            ? "Participation via verified recording"
            : activeLocale === "es"
              ? "Participación mediante grabación verificada"
              : activeLocale === "fr"
                ? "Participation via enregistrement vérifié"
                : "Teilnahme per verifizierter Aufnahme",
        text:
          riskLevel >= 2
            ? activeLocale === "en"
              ? "For this challenge, a verified in-app recording is currently enough. Live only becomes mandatory once the funding goal is high enough at risk level 2."
              : activeLocale === "es"
                ? "Para este reto, por ahora basta con una grabación verificada dentro de la app. El directo solo será obligatorio cuando el objetivo de financiación sea lo bastante alto en nivel de riesgo 2."
                : activeLocale === "fr"
                  ? "Pour ce défi, un enregistrement vérifié dans l’application suffit actuellement. Le direct ne devient obligatoire que lorsque l’objectif de financement est suffisamment élevé au niveau de risque 2."
                  : "Für diese Challenge reicht aktuell eine verifizierte In-App-Aufnahme. Live wird erst verpflichtend, wenn bei Risk Level 2 auch das Funding-Ziel hoch genug ist."
            : activeLocale === "en"
              ? "You do not need a live start for this challenge. You can record your attempt directly in the app and submit it as verified."
              : activeLocale === "es"
                ? "No necesitas iniciar en directo para este reto. Puedes grabar tu intento directamente en la app y enviarlo como verificado."
                : activeLocale === "fr"
                  ? "Tu n’as pas besoin de démarrer en direct pour ce défi. Tu peux enregistrer ta tentative directement dans l’application et l’envoyer comme vérifiée."
                  : "Für diese Challenge brauchst du keinen Live-Start. Du kannst deinen Versuch direkt in der App aufnehmen und verifiziert einreichen.",
      };
    }

    if (!myAttempt) {
      if (canStartAttempt) {
        return {
          headline:
            activeLocale === "en"
              ? "Ready for your live start"
              : activeLocale === "es"
                ? "Listo para empezar en vivo"
                : activeLocale === "fr"
                  ? "Prêt pour ton démarrage en direct"
                  : "Bereit für deinen Live-Start",
          text:
            activeLocale === "en"
              ? "If you are going to do this, do it now. The attempt will be created automatically in the background."
              : activeLocale === "es"
                ? "Si vas a hacerlo, hazlo ahora. El intento se creará automáticamente en segundo plano."
                : activeLocale === "fr"
                  ? "Si tu veux le faire, fais-le maintenant. La tentative sera créée automatiquement en arrière-plan."
                : "Wenn du mitmachst, dann jetzt. Der Versuch wird automatisch im Hintergrund angelegt.",
        };
      }

      return {
        headline:
          activeLocale === "en"
            ? "No personal attempt right now"
            : activeLocale === "es"
              ? "Ahora mismo no tienes un intento propio"
              : activeLocale === "fr"
                ? "Aucune tentative personnelle pour le moment"
                : "Aktuell kein eigener Versuch",
        text: attemptUnavailableReason,
      };
    }

    const status = String(myAttempt.status ?? "").toLowerCase();

    if (status === "live" || myAttempt.isLive) {
      return {
        headline:
          activeLocale === "en"
            ? "Your attempt is currently live"
            : activeLocale === "es"
              ? "Tu intento está en vivo ahora mismo"
              : activeLocale === "fr"
                ? "Ta tentative est actuellement en direct"
                : "Dein Versuch läuft gerade live",
        text:
          activeLocale === "en"
            ? "Deliver now. Do not stop the stream until you are really done."
            : activeLocale === "es"
              ? "Ahora toca cumplir. No detengas el stream hasta que hayas terminado de verdad."
              : activeLocale === "fr"
                ? "C’est le moment de livrer. N’arrête pas le stream avant d’avoir vraiment terminé."
                : "Jetzt liefern. Stoppe den Stream erst, wenn du wirklich fertig bist.",
      };
    }

    if (status === "processing") {
      return {
        headline:
          activeLocale === "en"
            ? "Your replay is being processed"
            : activeLocale === "es"
              ? "Tu repetición se está procesando"
              : activeLocale === "fr"
                ? "Ton replay est en cours de traitement"
                : "Dein Replay wird verarbeitet",
        text:
          activeLocale === "en"
            ? "Wait a moment. After that, it will be clear whether your attempt counts as valid."
            : activeLocale === "es"
              ? "Espera un momento. Después quedará claro si tu intento cuenta como válido."
              : activeLocale === "fr"
                ? "Attends un instant. Ensuite, il sera clair si ta tentative est valide."
                : "Warte kurz. Danach entscheidet sich, ob dein Versuch gültig im System landet.",
      };
    }

    if (status === "submitted") {
      return {
        headline:
          activeLocale === "en"
            ? "Your attempt is in the race"
            : activeLocale === "es"
              ? "Tu intento está en carrera"
              : activeLocale === "fr"
                ? "Ta tentative est en course"
                : "Dein Versuch ist im Rennen",
        text: isVoting
          ? activeLocale === "en"
            ? "Your video has been validly submitted. From here on, only the vote decides."
            : activeLocale === "es"
              ? "Tu vídeo se ha enviado correctamente. A partir de aquí, solo decide la votación."
              : activeLocale === "fr"
                ? "Ta vidéo a été valablement soumise. À partir de maintenant, seul le vote décide."
                : "Dein Video ist gültig eingereicht. Jetzt entscheidet nur noch das Voting."
          : activeLocale === "en"
            ? "Your video is in the race. From here on, only its performance in voting matters."
            : activeLocale === "es"
              ? "Tu vídeo está en carrera. A partir de ahora, solo importa cómo rinda en la votación."
              : activeLocale === "fr"
                ? "Ta vidéo est en course. À partir d’ici, seule sa performance dans le vote compte."
                : "Dein Video ist im Rennen. Jetzt zählt nur noch, wie es im Voting performt.",
      };
    }

    if (status === "too_short") {
      const lived = Number(myAttempt.liveSeconds ?? 0);
      const needed = clampInt(
        myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
        3,
        300,
        requiredSeconds
      );

      return {
        headline:
          activeLocale === "en"
            ? "Your last attempt was too short"
            : activeLocale === "es"
              ? "Tu último intento fue demasiado corto"
              : activeLocale === "fr"
                ? "Ta dernière tentative était trop courte"
                : "Dein letzter Versuch war zu kurz",
        text:
          activeLocale === "en"
            ? `You managed ${lived}s. At least ${needed}s are required.`
            : activeLocale === "es"
              ? `Has logrado ${lived}s. Se requieren al menos ${needed}s.`
              : activeLocale === "fr"
                ? `Tu as tenu ${lived}s. Il faut au moins ${needed}s.`
                : `Du hast ${lived}s geschafft, erforderlich sind mindestens ${needed}s.`,
      };
    }

    if (status === "invalid") {
      return {
        headline:
          activeLocale === "en"
            ? "Your last attempt was invalid"
            : activeLocale === "es"
              ? "Tu último intento fue inválido"
              : activeLocale === "fr"
                ? "Ta dernière tentative était invalide"
                : "Dein letzter Versuch war ungültig",
        text:
          activeLocale === "en"
            ? "This attempt does not count. If you start again, do it properly."
            : activeLocale === "es"
              ? "Este intento no cuenta. Si vuelves a empezar, hazlo bien."
              : activeLocale === "fr"
                ? "Cette tentative ne compte pas. Si tu recommences, fais-le proprement."
                : "Dieser Versuch zählt nicht. Wenn du nochmal startest, dann sauber.",
      };
    }

    if (status === "disqualified") {
      return {
        headline:
          activeLocale === "en"
            ? "Your attempt was disqualified"
            : activeLocale === "es"
              ? "Tu intento fue descalificado"
              : activeLocale === "fr"
                ? "Ta tentative a été disqualifiée"
                : "Dein Versuch wurde disqualifiziert",
        text:
          activeLocale === "en"
            ? "This attempt is out. Check the rules before you risk starting again."
            : activeLocale === "es"
              ? "Este intento queda fuera. Revisa las reglas antes de arriesgarte a empezar de nuevo."
              : activeLocale === "fr"
                ? "Cette tentative est éliminée. Vérifie les règles avant de risquer un nouveau départ."
                : "Dieser Versuch ist raus. Prüfe die Regeln, bevor du nochmal riskierst zu starten.",
      };
    }

    if (isAttemptPrepared) {
      return {
        headline:
          activeLocale === "en"
            ? "Your stream is prepared"
            : activeLocale === "es"
              ? "Tu stream está preparado"
              : activeLocale === "fr"
                ? "Ton stream est prêt"
                : "Dein Stream ist vorbereitet",
        text:
          activeLocale === "en"
            ? "Your setup is ready. It only becomes a real livestream once OBS actually starts sending."
            : activeLocale === "es"
              ? "Tu configuración está lista. Solo se convertirá en un stream real cuando OBS empiece a emitir."
              : activeLocale === "fr"
                ? "Ta configuration est prête. Cela ne devient un vrai livestream que lorsque OBS commence réellement à émettre."
                : "Dein Setup steht. Erst wenn OBS wirklich sendet, wird daraus ein echter Livestream.",
      };
    }

    return {
      headline:
        activeLocale === "en"
          ? "Your attempt is ready"
          : activeLocale === "es"
            ? "Tu intento está listo"
            : activeLocale === "fr"
              ? "Ta tentative est prête"
              : "Dein Versuch ist bereit",
      text:
        activeLocale === "en"
          ? "You can start your live attempt now."
          : activeLocale === "es"
            ? "Ya puedes empezar tu intento en vivo."
            : activeLocale === "fr"
              ? "Tu peux démarrer ta tentative en direct maintenant."
              : "Du kannst jetzt deinen Live-Versuch starten.",
    };
  })();

  const attemptStatusPillLabel = !token
    ? ui.loginRequired
    : myAttempt
      ? isAttemptPrepared && myAttempt.status === "draft"
        ? ui.prepared
        : getAttemptStatusLabel(myAttempt.status, activeLocale)
      : requiresLive && canStartAttempt
        ? ui.ready
        : requiresLive
          ? ui.unavailable
          : ui.recordingPending;

  const isAttemptActionAvailable =
    (!!token && !isCompleted && (!requiresLive || canStartAttempt || !!myAttempt)) ||
    (!token && !isCompleted);

  const shouldShowAttemptMetaTiles =
    !!token &&
    !!myAttempt &&
    (myAttempt.status === "submitted" ||
      myAttempt.status === "processing" ||
      myAttempt.status === "too_short" ||
      isAttemptPrepared);

  const sidebarMode = (() => {
    if (isCompleted && challenge.winner) return "completed_winner";
    if (isFailedCompleted) return "completed_failed";
    if (isVoting) return "voting";
    if (isFunding || isActive) return "live_phase";
    return "default";
  })();

  const attemptPrimaryStatusBox = (() => {
    if (!token) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Login required"
              : activeLocale === "es"
                ? "Inicio de sesión requerido"
                : activeLocale === "fr"
                  ? "Connexion requise"
                  : "Login erforderlich"
          }
          text={
            activeLocale === "en"
              ? "Log in to participate or submit your own video."
              : activeLocale === "es"
                ? "Inicia sesión para participar o enviar tu propio vídeo."
                : activeLocale === "fr"
                  ? "Connecte-toi pour participer ou soumettre ta propre vidéo."
                  : "Melde dich an, damit du teilnehmen oder dein eigenes Video einreichen kannst."
          }
          tone="neutral"
        />
      );
    }

    if (adultOnly && !isAdultAllowed) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "18+ required"
              : activeLocale === "es"
                ? "Se requiere ser mayor de 18"
                : activeLocale === "fr"
                  ? "18+ requis"
                  : "Ab 18 erforderlich"
          }
          text={
            activeLocale === "en"
              ? "This challenge is 18+. Add your date of birth in your profile first."
              : activeLocale === "es"
                ? "Este reto es para mayores de 18. Añade primero tu fecha de nacimiento en tu perfil."
                : activeLocale === "fr"
                  ? "Ce défi est réservé aux 18+. Ajoute d’abord ta date de naissance dans ton profil."
                  : "Diese Challenge ist ab 18. Hinterlege zuerst dein Geburtsdatum im Profil."
          }
          tone="danger"
        />
      );
    }

    if (isVoting && votingOver) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "⛔ No new attempts"
              : activeLocale === "es"
                ? "⛔ No se permiten nuevos intentos"
                : activeLocale === "fr"
                  ? "⛔ Aucune nouvelle tentative"
                  : `⛔ Keine neuen ${extraUi.attemptsWord} mehr`
          }
          text={
            activeLocale === "en"
              ? "The voting window has expired. No new attempts are possible."
              : activeLocale === "es"
                ? "La ventana de votación ha terminado. Ya no se permiten nuevos intentos."
                : activeLocale === "fr"
                  ? "La fenêtre de vote a expiré. Aucune nouvelle tentative n’est possible."
                  : `Das Voting-Fenster ist abgelaufen. Neue ${extraUi.attemptsWord} sind nicht mehr möglich.`
          }
          tone="warning"
        />
      );
    }

    if (myAttempt?.status === "submitted") {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "✅ Validly submitted"
              : activeLocale === "es"
                ? "✅ Enviado correctamente"
                : activeLocale === "fr"
                  ? "✅ Valablement soumis"
                  : "✅ Gültig eingereicht"
          }
          text={
            activeLocale === "en"
              ? "Your video is in the system and in the race. Voting decides now."
              : activeLocale === "es"
                ? "Tu vídeo está en el sistema y en carrera. Ahora decide la votación."
                : activeLocale === "fr"
                  ? "Ta vidéo est dans le système et dans la course. Le vote décide maintenant."
                  : "Dein Video ist im System und im Rennen. Jetzt entscheidet das Voting."
          }
        />
      );
    }

    if (myAttempt?.status === "processing") {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Processing"
              : activeLocale === "es"
                ? "Procesando"
                : activeLocale === "fr"
                  ? "Traitement"
                  : "Verarbeitung läuft"
          }
          text={
            activeLocale === "en"
              ? "Your replay is currently being processed. Then it will be clear whether your video counts."
              : activeLocale === "es"
                ? "Tu repetición se está procesando. Después quedará claro si tu vídeo cuenta."
                : activeLocale === "fr"
                  ? "Ton replay est en cours de traitement. Ensuite, on saura si ta vidéo compte."
                  : "Dein Replay wird gerade verarbeitet. Danach ist klar, ob dein Video zählt."
          }
          tone="warning"
        />
      );
    }

    if (myAttempt?.status === "too_short") {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "⚠️ Attempt too short"
              : activeLocale === "es"
                ? "⚠️ Intento demasiado corto"
                : activeLocale === "fr"
                  ? "⚠️ Tentative trop courte"
                  : "⚠️ Versuch zu kurz"
          }
          text={
            activeLocale === "en"
              ? `Your video was only ${Number(myAttempt.liveSeconds ?? 0)}s long. At least ${clampInt(
                  myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
                  3,
                  300,
                  requiredSeconds
                )}s are required.`
              : activeLocale === "es"
                ? `Tu vídeo solo duró ${Number(myAttempt.liveSeconds ?? 0)}s. Se requieren al menos ${clampInt(
                    myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
                    3,
                    300,
                    requiredSeconds
                  )}s.`
                : activeLocale === "fr"
                  ? `Ta vidéo n’a duré que ${Number(myAttempt.liveSeconds ?? 0)}s. Il faut au moins ${clampInt(
                      myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
                      3,
                      300,
                      requiredSeconds
                    )}s.`
                  : `Dein Video war nur ${Number(
                      myAttempt.liveSeconds ?? 0
                    )}s lang. Erforderlich sind mindestens ${clampInt(
                      myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
                      3,
                      300,
                      requiredSeconds
                    )}s.`
          }
          tone="warning"
        />
      );
    }

    if (myAttempt?.status === "disqualified") {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Disqualified"
              : activeLocale === "es"
                ? "Descalificado"
                : activeLocale === "fr"
                  ? "Disqualifié"
                  : "Disqualifiziert"
          }
          text={
            activeLocale === "en"
              ? "This attempt was disqualified. Check the rules before starting again."
              : activeLocale === "es"
                ? "Este intento fue descalificado. Revisa las reglas antes de volver a empezar."
                : activeLocale === "fr"
                  ? "Cette tentative a été disqualifiée. Vérifie les règles avant de recommencer."
                  : "Dieser Versuch wurde disqualifiziert. Prüfe die Regeln, bevor du erneut startest."
          }
          tone="danger"
        />
      );
    }

    if (myAttempt?.status === "invalid") {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Invalid attempt"
              : activeLocale === "es"
                ? "Intento inválido"
                : activeLocale === "fr"
                  ? "Tentative invalide"
                  : "Ungültiger Versuch"
          }
          text={
            activeLocale === "en"
              ? "This attempt was invalid. If you start again, do it properly."
              : activeLocale === "es"
                ? "Este intento fue inválido. Si vuelves a empezar, hazlo bien."
                : activeLocale === "fr"
                  ? "Cette tentative était invalide. Si tu recommences, fais-le correctement."
                  : "Dieser Versuch war ungültig. Wenn du neu startest, dann sauber."
          }
          tone="neutral"
        />
      );
    }

    if (requiresLive && isAttemptPrepared) {
      return (
        <StatusMessage
          title={
            activeLocale === "en"
              ? "Stream prepared"
              : activeLocale === "es"
                ? "Stream preparado"
                : activeLocale === "fr"
                  ? "Stream prêt"
                  : "Stream vorbereitet"
          }
          text={
            activeLocale === "en"
              ? "Your RTMP setup is ready. It only becomes a real livestream once OBS actually starts sending."
              : activeLocale === "es"
                ? "Tu configuración RTMP está lista. Solo se convierte en un stream real cuando OBS empieza a emitir."
                : activeLocale === "fr"
                  ? "Ta configuration RTMP est prête. Cela ne devient un vrai livestream que lorsque OBS commence réellement à émettre."
                  : "Dein RTMP-Setup ist bereit. Erst wenn OBS wirklich sendet, wird daraus ein echter Livestream."
          }
          tone="info"
        />
      );
    }

    return null;
  })();

  const shouldShowLiveSection = requiresLive || liveAttempts.length > 0 || !!attemptsError;

  const mainFocusTitle = (() => {
    if (isCompleted && challenge.winner) {
      if (activeLocale === "en") return "Final result";
      if (activeLocale === "es") return "Resultado final";
      if (activeLocale === "fr") return "Résultat final";
      return "Finales Ergebnis";
    }

    if (isVoting) {
      if (activeLocale === "en") return "What decides the race now";
      if (activeLocale === "es") return "Qué decide ahora la carrera";
      if (activeLocale === "fr") return "Ce qui décide la course maintenant";
      return "Was jetzt das Rennen entscheidet";
    }

    if (activeLocale === "en") return "What really matters here";
    if (activeLocale === "es") return "Lo que realmente importa aquí";
    if (activeLocale === "fr") return "Ce qui compte vraiment ici";
    return "Was hier wirklich zählt";
  })();

  if (isMobile) {
    const handleMobilePrimaryAction = async () => {
      if (!id) return;

      if (!isLoggedIn) {
        router.replace("/auth/login");
        return;
      }

      if (isCompleted) return;
      if (submitBlockedByGoal) return;

      router.push(`/challenges/${id}/submit`);
    };

    const handleMobileSecondaryAction = async () => {
      if (!id) return;

      if (!isLoggedIn) {
        router.replace("/auth/login");
        return;
      }

      if (!canFundByStatus) return;

      router.push(`/challenges/${id}/support`);
    };

    const mobileDetailTabs: Array<{
      key: "details" | "entries" | "votes";
      label: string;
    }> = [
      {
        key: "details",
        label:
          activeLocale === "en"
            ? "Details"
            : activeLocale === "es"
              ? "Detalles"
              : activeLocale === "fr"
                ? "Détails"
                : "Details",
      },
      {
        key: "entries",
        label:
          activeLocale === "en"
            ? "Entries"
            : activeLocale === "es"
              ? "Envíos"
              : activeLocale === "fr"
                ? "Soumissions"
                : "Einreichungen",
      },
      {
        key: "votes",
        label: "Votes",
      },
    ];

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.10),transparent_35%),linear-gradient(180deg,#040A14_0%,#071120_58%,#091423_100%)]">
        <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-3">
          <div className="mb-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/challenges")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-sm text-slate-200"
            >
              ←
            </button>

            <div className="max-w-[225px] truncate text-[12px] font-medium text-slate-300">
              {localizedChallengeTitle || challenge.title}
            </div>

            <button
              type="button"
              onClick={() => loadAll()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-sm text-slate-200"
            >
              ↻
            </button>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0A1424]/92 shadow-[0_20px_48px_rgba(0,0,0,0.36)]">
            <div className="relative h-[248px] overflow-hidden rounded-t-[22px] bg-slate-950">
              <div className="absolute inset-0">
                {mobileHeroPlayback ? (
                  mobileHeroPlayback.includes("stream.mux.com") ? (
                    <MuxVideoPlayer
                      playbackId={mobileHeroPlayback
                        .replace("https://stream.mux.com/", "")
                        .replace(".m3u8", "")}
                      title={localizedChallengeTitle || challenge.title}
                      streamType={mobileHeroIsLive ? "live" : "on-demand"}
                    />
                  ) : (
                    <VideoPlayer
                      src={mobileHeroPlayback}
                      mode={mobileHeroIsLive ? "live" : "vod"}
                    />
                  )
                ) : (
                  <div
                    className={`relative h-full w-full ${
                      thumbnailSrc ? "bg-slate-950" : "bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#0A1323_0%,#101B2E_55%,#0A1222_100%)]"
                    }`}
                  >
                    {thumbnailSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailSrc}
                          alt={localizedChallengeTitle || challenge.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/26 to-black/6" />
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-blue-500/16 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-200">
                  {statusMeta.label}
                </span>
                {adultOnly ? <InfoPill tone="danger">{ui.adultsOnly}</InfoPill> : null}
                {challenge.votingEndsAt && isVoting && !votingOver ? (
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(challenge.votingEndsAt, activeLocale)}
                  </span>
                ) : null}
              </div>

              <h1 className="text-[24px] font-bold leading-[1.03] tracking-tight text-white">
                {localizedChallengeTitle || challenge.title}
              </h1>

              <p className="mt-1 line-clamp-2 text-[12px] leading-[1.45] text-slate-300/95">
                {mobileSubtitle}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                {challenge.owner?.username ? (
                  <>
                    <span className="text-slate-300">@{challenge.owner.username}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500" />
                  </>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400">
                  {requiresLive
                    ? pickDetailText(activeLocale, "Live", "Live", "Live", "Live")
                    : pickDetailText(activeLocale, "Video", "Video", "Video", "Vidéo")}
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.025]">
                <div className="grid grid-cols-4 divide-x divide-white/8">
                  <div className="px-3 py-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {activeLocale === "en"
                        ? "Pot"
                        : activeLocale === "es"
                          ? "Bote"
                          : activeLocale === "fr"
                            ? "Cagnotte"
                            : "€"}
                    </div>
                    <div className="mt-1 text-[14px] font-extrabold text-white">
                      {formatMoneyEUR(current, activeLocale)}
                    </div>
                    <div className="mt-1 text-[10px] font-medium text-slate-400">
                      {ui.fundingGoal}: {hasGoal ? formatMoneyEUR(min, activeLocale) : ui.noGoal}
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {activeLocale === "en"
                        ? "Participants"
                        : activeLocale === "es"
                          ? "Participantes"
                          : activeLocale === "fr"
                            ? "Participants"
                            : "Teilnehmer"}
                    </div>
                    <div className="mt-1 text-[14px] font-extrabold text-white">
                      {submittedAttempts.length}
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {activeLocale === "en"
                        ? "Entry"
                        : activeLocale === "es"
                          ? "Modus"
                          : activeLocale === "fr"
                            ? "Entrée"
                            : "Teilnahme"}
                    </div>
                    <div className="mt-1 text-[13px] font-extrabold text-white">
                      {requiresLive
                        ? pickDetailText(activeLocale, "Live", "Live", "En vivo", "Live")
                        : pickDetailText(activeLocale, "Video", "Video", "Video", "Vidéo")}
                    </div>
                  </div>

                  <div className="px-3 py-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {activeLocale === "en"
                        ? "Min. duration"
                        : activeLocale === "es"
                          ? "Duración mín."
                          : activeLocale === "fr"
                            ? "Durée min."
                            : "Min. Dauer"}
                    </div>
                    <div className="mt-1 text-[13px] font-extrabold text-white">
                      {requiredSeconds}s
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            </div>
          </div>

          <div className="mt-2.5 border-b border-white/8">
            <div className="flex items-center gap-5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mobileDetailTabs.map((tab) => {
                const active = mobileTab === tab.key;
                const badgeValue =
                  tab.key === "entries"
                    ? mobileEntriesCount
                    : tab.key === "votes"
                      ? mobileVotesCount > 0
                        ? mobileVotesCount
                        : undefined
                      : undefined;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMobileTab(tab.key)}
                    className={`relative pb-3 pt-1 text-[13px] font-medium whitespace-nowrap transition ${
                      active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{tab.label}</span>

                      {typeof badgeValue === "number" ? (
                        <span
                          className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-[1px] text-[10px] font-bold ${
                            active
                              ? "bg-blue-500/18 text-blue-200"
                              : "bg-white/[0.06] text-slate-300"
                          }`}
                        >
                          {badgeValue}
                        </span>
                      ) : null}
                    </span>

                    {active ? (
                      <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-blue-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {mobileTab === "details" ? (
            <>
              <div
                className={`rounded-[14px] px-2.5 py-2.5 ${
                  isCompleted
                    ? "border border-emerald-400/14 bg-emerald-500/[0.06]"
                    : "bg-white/[0.015]"
                }`}
              >
                <div
                  className={`text-[11px] font-medium ${
                    isCompleted ? "text-emerald-200" : "text-slate-300/95"
                  }`}
                >
                  {mainFocusTitle}
                </div>
                <div
                  className={`mt-0.5 line-clamp-1 text-[11px] leading-5 ${
                    isCompleted ? "text-emerald-100/80" : "text-slate-500"
                  }`}
                >
                  {mobileTaskText}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-400">
                    Votes: <span className="font-semibold text-white">{mobileVotesCount}</span>
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-slate-400">
                    {ui.supporters}: <span className="font-semibold text-white">{uniqueSupporters}</span>
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/8 px-2 py-1 text-emerald-200">
                    {attemptStatusPillLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-[18px] border border-white/9 bg-[rgba(11,21,38,0.76)] p-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.24)]">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="text-[18px] font-bold tracking-tight text-white">Leaderboard</div>
                  <div className="text-[11px] font-medium text-slate-400">Top {Math.min(3, mobileTopThree.length || 3)}</div>
                </div>

                {mobileTopThree.length === 0 ? (
                  <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    {activeLocale === "en"
                      ? "No ranking yet."
                      : activeLocale === "es"
                        ? "Todavía no hay ranking."
                        : activeLocale === "fr"
                          ? "Pas encore de classement."
                          : "Noch kein Ranking."}
                  </div>
                ) : (
                    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
                    {mobileTopThree.map((a, index) => {
                      const name = displayAttemptName(a, myId, activeLocale);
                      const place = index + 1;

                      return (
                        <div
                          key={a.id}
                          className="min-w-[220px] snap-start rounded-[13px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.015)_100%)] p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-500/14 px-2 text-[10px] font-bold text-blue-200">
                              #{place}
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {a.score} pts
                            </div>
                          </div>

                          <div className="truncate text-[14px] font-semibold text-white">{name}</div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span>{a.upVotes} Likes</span>
                            <span className="font-semibold text-emerald-300">
                              {formatMoneyEUR(min || current || 0, activeLocale)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {mobileTab === "entries" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {submittedAttempts.map((a, index) => {
                  const voteState = votingAttempts.find((v) => v.id === a.id) ?? a;
                  const { playbackId, isLive } = pickAttemptPlayback(a);
                  const src = resolvePlaybackUrl(playbackId);
                  const isMine = !!myId && String(a.userId) === String(myId);

                  return (
                    <div
                      key={a.id}
                      className="overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,#071427_0%,#08111F_100%)] p-2"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-500/18 px-2 text-[11px] font-bold text-blue-200">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          className="text-slate-400"
                        >
                          ⋯
                        </button>
                      </div>

                      <div className="overflow-hidden rounded-[14px] bg-slate-950">
                        {src ? (
                          <VideoPlayer src={src} mode={isLive ? "live" : "vod"} />
                        ) : (
                          <div className="aspect-[16/11] bg-white/[0.03]" />
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="truncate text-[14px] font-semibold text-white">
                          {displayAttemptName(a, myId, activeLocale)}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[12px] text-slate-400">
                          <span>{voteState.upVotes} Likes</span>
                          <span className="rounded-full bg-blue-500/18 px-2 py-0.5 font-bold text-blue-200">
                            {voteState.score}
                          </span>
                        </div>

                        {isMine ? (
                          <div className="mt-2 rounded-full bg-white/[0.05] px-2 py-1 text-center text-[11px] font-semibold text-slate-300">
                            {activeLocale === "en"
                              ? "You"
                              : activeLocale === "es"
                                ? "Tú"
                                : activeLocale === "fr"
                                  ? "Toi"
                                  : "Du"}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-white/10 bg-transparent text-[15px] font-semibold text-blue-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
              >
                {activeLocale === "en"
                  ? "Show more entries"
                  : activeLocale === "es"
                    ? "Mostrar más envíos"
                    : activeLocale === "fr"
                      ? "Afficher plus de soumissions"
                      : "Mehr Einreichungen anzeigen"}
              </button>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#071427_0%,#08111F_100%)] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
                <div className="mb-4 text-[22px] font-extrabold text-white">
                  {ui.comments}
                </div>

                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                  <Comments
                    challengeId={challenge.id}
                    placeholderText={commentsUi.placeholderText}
                    sendText={commentsUi.sendText}
                    noCommentsEyebrow={commentsUi.noCommentsEyebrow}
                    noCommentsTitle={commentsUi.noCommentsTitle}
                    noCommentsText={commentsUi.noCommentsText}
                    noReactionsYet={commentsUi.noReactionsYet}
                    communityArea={commentsUi.communityArea}
                  />
                </div>
              </div>
            </>
          ) : null}

          {mobileTab === "votes" ? (
            <div className="space-y-4">
              {submittedAttempts.map((a) => {
                const voteState = votingAttempts.find((v) => v.id === a.id) ?? a;
                const { playbackId, isLive } = pickAttemptPlayback(a);
                const src = resolvePlaybackUrl(playbackId);
                const isMine = !!myId && String(a.userId) === String(myId);

                return (
                  <div
                    key={a.id}
                    className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,#071427_0%,#08111F_100%)] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[17px] font-bold text-white">
                          {displayAttemptName(a, myId, activeLocale)}
                        </div>
                        <div className="text-[13px] text-slate-400">
                          Score {voteState.score}
                        </div>
                      </div>

                      <div className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] font-semibold text-slate-300">
                        {voteState.upVotes} / {voteState.downVotes}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[16px] bg-slate-950">
                      {src ? (
                        <VideoPlayer src={src} mode={isLive ? "live" : "vod"} />
                      ) : (
                        <div className="aspect-[16/10] bg-white/[0.03]" />
                      )}
                    </div>

                    <div className="mt-3">
                      {isMine ? (
                        <StatusMessage
                          title={extraUi.ownVideo}
                          text={extraUi.yourOwnVideoCannotBeRated}
                          tone="neutral"
                          compact
                        />
                      ) : (
                        <VoteButtons
                          attemptId={a.id}
                          status={challenge.status}
                          votingOver={votingOver}
                          upVotes={voteState.upVotes}
                          downVotes={voteState.downVotes}
                          score={voteState.score}
                          myVote={(voteState.myVote ?? 0) as VoteValue}
                          onVoted={(next) => handleVotedUpdate(a.id, next)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {submitBlockedByGoal && !isCompleted ? (
            <div className="mx-1 mt-3 rounded-[14px] border border-amber-400/25 bg-amber-500/10 px-3 py-2.5 text-[12px] leading-5 text-amber-100">
              {pickDetailText(
                activeLocale,
                `Einreichung noch nicht möglich. Ziel noch nicht erreicht (${formatMoneyEUR(goalRemaining, activeLocale)} fehlen).`,
                `Submission not available yet. Goal not reached (${formatMoneyEUR(goalRemaining, activeLocale)} missing).`,
                `El envío aún no está disponible. Meta no alcanzada (faltan ${formatMoneyEUR(goalRemaining, activeLocale)}).`,
                `Soumission pas encore disponible. Objectif non atteint (il manque ${formatMoneyEUR(goalRemaining, activeLocale)}).`
              )}
            </div>
          ) : null}

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-22 bg-gradient-to-t from-[#07111D] via-[#07111D]/88 to-transparent" />

          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-[calc(100%-20px)] max-w-[430px] px-0 pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="rounded-[20px] border border-white/10 bg-[rgba(7,14,24,0.80)] p-2 shadow-[0_14px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleMobilePrimaryAction}
                  disabled={
                    isCompleted ||
                    submitBlockedByGoal ||
                    startingAttemptLive ||
                    takingAttempt ||
                    stoppingAttemptLive ||
                    (!!requiresLive && myAttempt?.status === "submitted")
                  }
                  className="inline-flex h-10.5 items-center justify-center rounded-[12px] border border-blue-300/24 bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.26)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-75"
                >
                  {startingAttemptLive || takingAttempt || stoppingAttemptLive
                    ? pickDetailText(
                        activeLocale,
                        "Lädt…",
                        "Loading…",
                        "Cargando…",
                        "Chargement…"
                      )
                    : pickDetailText(
                        activeLocale,
                        "Einreichen",
                        "Submit",
                        "Enviar",
                        "Soumettre"
                      )}
                </button>

                <button
                  type="button"
                  onClick={handleMobileSecondaryAction}
                  disabled={!canFundByStatus || funding}
                  className="inline-flex h-10.5 items-center justify-center rounded-[12px] border border-blue-300/24 bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.26)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-75"
                >
                  {funding
                    ? pickDetailText(
                        activeLocale,
                        "Lädt…",
                        "Loading…",
                        "Cargando…",
                        "Chargement…"
                      )
                    : pickDetailText(
                        activeLocale,
                        "Unterstützen",
                        "Support",
                        "Apoyar",
                        "Soutenir"
                      )}
                </button>
              </div>
            </div>
          </div>

          <style jsx global>{`
            @media (max-width: 767px) {
              footer {
                display: none !important;
              }
            }
          `}</style>

        </div>
      </main>
    );
  }



  return (
    <main className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#040914_0%,#08101B_52%,#09111D_100%)]">
      <div className="w-full px-3 pb-24 md:mx-auto md:max-w-7xl md:px-6 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-4 flex items-center justify-between md:hidden">
            <Link href="/challenges">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white"
                aria-label={ui.backToList}
              >
                ←
              </button>
            </Link>

            <div className="text-sm font-semibold text-white">{ui.challenge}</div>

            <button
              type="button"
              onClick={() => loadAll()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white"
              aria-label={ui.refresh}
            >
              ⋯
            </button>
          </div>

          <div className="mb-4 hidden items-center justify-between gap-3 md:flex">
            <div className="flex items-center gap-2">
              <Link href="/challenges">
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08]">
                  ←
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <PrimaryButton type="button" variant="secondary" onClick={() => loadAll()}>
                {ui.refresh}
              </PrimaryButton>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard className="overflow-hidden shadow-2xl">
              <div
                className={`relative overflow-hidden rounded-[28px] border border-white/10 ${
                  thumbnailSrc
                    ? "aspect-[16/9.8] bg-slate-950"
                    : "min-h-[150px] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),linear-gradient(135deg,#0A1323_0%,#101B2E_55%,#0A1222_100%)]"
                }`}
              >
                {thumbnailSrc ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailSrc}
                      alt={localizedChallengeTitle || challenge.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />
                  </>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <InfoPill tone={statusMeta.tone}>{statusMeta.label}</InfoPill>
                    <InfoPill tone={participationModeMeta.shortTone}>
                      {participationModeMeta.shortLabel}
                    </InfoPill>
                    {adultOnly && <InfoPill tone="danger">{ui.adultsOnly}</InfoPill>}
                  </div>

                  <h1 className="max-w-[92%] break-words text-[30px] font-black leading-[1.02] tracking-tight text-white sm:text-3xl">
                    {localizedChallengeTitle || challenge.title}
                  </h1>

                  <div className="mt-2 text-sm font-medium text-slate-300">
                    {challenge.owner?.username ? (
                      <span>@{challenge.owner.username}</span>
                    ) : (
                      <span>{ui.createdBy}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm leading-7 text-slate-300">
                  {localizedChallengeDescription || ui.noDescription}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {ui.currentAmount}
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-white">
                    {formatMoneyEUR(current, activeLocale)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {ui.fundingGoal}
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-white">
                    {hasGoal ? formatMoneyEUR(min, activeLocale) : ui.noGoal}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {ui.supporters}
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-white">
                    {uniqueSupporters}
                  </div>
                </div>
              </div>

              {hasGoal ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-300">{ui.progress}</span>
                    <span className="font-semibold text-slate-400">{Math.round(pct)}%</span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-2.5 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </SectionCard>

            {paymentInfo ? (
              <StatusMessage
                title={extraUi.paymentStatus}
                text={paymentInfo}
                tone="info"
              />
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="order-2 space-y-5 xl:order-1"
              >
                <SectionCard title={mainFocusTitle} className="shadow-xl">
                  {!isVoting ? (
                    <StatusMessage
                      title={
                        requiresLive
                          ? activeLocale === "en"
                            ? "Now your live attempt matters"
                            : activeLocale === "es"
                              ? "Ahora importa tu intento en directo"
                              : activeLocale === "fr"
                                ? "Maintenant, c'est ta tentative en direct qui compte"
                                : "Jetzt zählt dein Live-Versuch"
                          : activeLocale === "en"
                            ? "Now your valid recording matters"
                            : activeLocale === "es"
                              ? "Ahora importa tu grabación válida"
                              : activeLocale === "fr"
                                ? "Maintenant, c'est ton enregistrement valide qui compte"
                                : "Jetzt zählt deine gültige Aufnahme"
                      }
                      text={
                        requiresLive
                          ? activeLocale === "en"
                            ? `Your attempt must last at least ${requiredSeconds}s to count as valid.`
                            : activeLocale === "es"
                              ? `Tu intento debe durar al menos ${requiredSeconds}s para contar como válido.`
                              : activeLocale === "fr"
                                ? `Ta tentative doit durer au moins ${requiredSeconds}s pour être considérée comme valide.`
                                : `Dein Versuch muss mindestens ${requiredSeconds}s dauern, damit er gültig zählt.`
                          : activeLocale === "en"
                            ? `A verified in-app recording is enough. Minimum duration: ${requiredSeconds}s.`
                            : activeLocale === "es"
                              ? `Basta con una grabación verificada en la app. Duración mínima: ${requiredSeconds}s.`
                              : activeLocale === "fr"
                                ? `Un enregistrement vérifié dans l'application suffit. Durée minimale : ${requiredSeconds}s.`
                                : `Eine verifizierte In-App-Aufnahme reicht aus. Mindestdauer: ${requiredSeconds}s.`
                      }
                      tone={requiresLive ? "danger" : "info"}
                      compact
                    />
                  ) : null}

                  {creatorActionsAllowed ? (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-extrabold text-slate-900">
                          {extraUi.manageChallenge}
                        </div>
                        <div className="text-xs font-medium text-slate-400">
                          {extraUi.visibleOnlyToCreator}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/challenges/${challenge.id}/edit`}>
                          <PrimaryButton variant="secondary">
                            {extraUi.edit}
                          </PrimaryButton>
                        </Link>

                        {canDeleteChallenge ? (
                          <PrimaryButton
                            type="button"
                            variant="danger"
                            onClick={handleDelete}
                            disabled={deleting}
                            loading={deleting}
                            loadingText={
                              extraUi.deleting
                            }
                          >
                            {extraUi.delete}
                          </PrimaryButton>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </SectionCard>

                <SectionCard
                  id="submitted-videos"
                  title={ui.submittedVideos}
                  className="shadow-2xl"
                >
                  {votingError && !submittedAttempts.length ? (
                    <StatusMessage
                      title={
                        activeLocale === "en"
                          ? "Error while loading"
                          : activeLocale === "es"
                            ? "Error al cargar"
                            : activeLocale === "fr"
                              ? "Erreur lors du chargement"
                              : "Fehler beim Laden"
                      }
                      text={votingError}
                      tone="danger"
                    />
                  ) : submittedAttempts.length === 0 ? (
                    <EmptyHint
                      title={
                        activeLocale === "en"
                          ? "No submitted video yet"
                          : activeLocale === "es"
                            ? "Todavía no hay vídeo enviado"
                            : activeLocale === "fr"
                              ? "Aucune vidéo soumise pour le moment"
                              : "Noch kein eingereichtes Video"
                      }
                      text={
                        activeLocale === "en"
                          ? "As soon as the first valid video is submitted, it will appear here."
                          : activeLocale === "es"
                            ? "En cuanto se envíe el primer vídeo válido, aparecerá aquí."
                            : activeLocale === "fr"
                              ? "Dès que la première vidéo valide sera soumise, elle apparaîtra ici."
                              : "Sobald das erste gültige Video eingereicht wurde, erscheint es hier."
                      }
                    />
                  ) : (
                    <div className="grid gap-5">
                      {submittedAttempts.map((a, index) => {
                        const { playbackId, isLive } = pickAttemptPlayback(a);
                        const src = resolvePlaybackUrl(playbackId);
                        const voteState = votingAttempts.find((v) => v.id === a.id) ?? a;
                        const isWinner = !!winnerAttemptId && String(a.id) === String(winnerAttemptId);
                        const isLeader = !isWinner && !isCompleted && index === 0;
                        const isMine = !!myId && String(a.userId) === String(myId);
                        const submitLabel = a.submittedAt
                          ? formatDateTime(a.submittedAt, activeLocale)
                          : "—";
                        const rank = index + 1;
                        const gapToLeader =
                          index === 0
                            ? null
                            : Math.max(0, (leadingAttempt?.score ?? 0) - voteState.score);

                        return (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              boxShadow: isWinner
                                ? [
                                    "0 0 0 rgba(34,197,94,0)",
                                    "0 0 0 8px rgba(34,197,94,0.10)",
                                    "0 0 0 rgba(34,197,94,0)",
                                  ]
                                : "0 0 0 rgba(0,0,0,0)",
                            }}
                            transition={{
                              duration: 0.35,
                              delay: Math.min(index * 0.04, 0.18),
                              boxShadow: isWinner
                                ? {
                                    duration: 2.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : undefined,
                            }}
                            className={`overflow-hidden rounded-[26px] border shadow-[0_20px_45px_rgba(0,0,0,0.28)] ${
                              isWinner
                                ? "border-emerald-500/20 bg-[linear-gradient(180deg,#0B1523_0%,#0A1220_100%)] ring-1 ring-emerald-500/12"
                                : isLeader
                                  ? "border-blue-500/20 bg-[linear-gradient(180deg,#0B1523_0%,#0A1220_100%)] ring-1 ring-blue-500/12"
                                  : "border-white/10 bg-[linear-gradient(180deg,#0B1523_0%,#0A1220_100%)]"
                            }`}
                          >
                            <div className="border-b border-white/6 px-4 py-4 sm:px-5">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <RankBadge
                                      rank={rank}
                                      isWinner={isWinner}
                                      isLeader={isLeader}
                                      locale={activeLocale}
                                    />
                                    {isMine && (
                                      <InfoPill tone="info">
                                        {activeLocale === "en"
                                          ? "You"
                                          : activeLocale === "es"
                                            ? "Tú"
                                            : activeLocale === "fr"
                                              ? "Toi"
                                              : "Du"}
                                      </InfoPill>
                                    )}
                                  </div>

                                  <div className="mt-3 text-lg font-extrabold tracking-tight text-white">
                                    {isMine ? (
                                      <span>
                                        {extraUi.yourVideo}
                                      </span>
                                    ) : a.username?.trim() ? (
                                      <span>
                                        {extraUi.videoBy}
                                        <span className="text-white">@{a.username.trim()}</span>
                                      </span>
                                    ) : (
                                      <span>
                                        {extraUi.videoBy}
                                        {displayAttemptName(a, myId, activeLocale)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1 text-sm text-slate-400">
                                    {extraUi.submittedOn}
                                    <span className="font-semibold text-slate-300">{submitLabel}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 sm:min-w-[360px]">
                                  <SmallStat
                                    label={ui.ranking}
                                    value={`#${rank}`}
                                    tone={
                                      isWinner
                                        ? "success"
                                        : isLeader
                                          ? "warning"
                                          : "neutral"
                                    }
                                  />
                                  <SmallStat
                                    label={ui.score}
                                    value={voteState.score}
                                    tone={
                                      isWinner
                                        ? "success"
                                        : isLeader
                                          ? "warning"
                                          : "neutral"
                                    }
                                  />
                                  <SmallStat
                                    label={ui.likes}
                                    value={voteState.upVotes}
                                  />
                                  <SmallStat
                                    label={ui.dislikes}
                                    value={voteState.downVotes}
                                    tone="danger"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-4 sm:p-5">
                              {src ? (
                                <VideoPlayer src={src} mode={isLive ? "live" : "vod"} />
                              ) : (
                                <EmptyHint
                                  title={ui.noPlayback}
                                  text={ui.noPlaybackText}
                                />
                              )}

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <SmallStat
                                  label={
                                    extraUi.gapToFirst
                                  }
                                  value={
                                    rank === 1
                                      ? extraUi.leading
                                      : `${gapToLeader ?? 0}`
                                  }
                                  tone={
                                    rank === 1
                                      ? "success"
                                      : gapToLeader === 0
                                        ? "warning"
                                        : "neutral"
                                  }
                                />
                                <SmallStat
                                  label={ui.status}
                                  value={
                                    isWinner
                                      ? activeLocale === "en"
                                        ? "Winner"
                                        : activeLocale === "es"
                                          ? "Ganador"
                                          : activeLocale === "fr"
                                            ? "Gagnant"
                                            : "Sieger"
                                      : isLeader
                                        ? extraUi.leading
                                        : extraUi.chasing
                                  }
                                  tone={
                                    isWinner
                                      ? "success"
                                      : isLeader
                                        ? "warning"
                                        : "info"
                                  }
                                />
                              </div>

                              {isWinner && isCompleted ? (
                                <div className="mt-4">
                                  <StatusMessage
                                    title={
                                      activeLocale === "en"
                                        ? "🏆 This video has won"
                                        : activeLocale === "es"
                                          ? "🏆 Este vídeo ha ganado"
                                          : activeLocale === "fr"
                                            ? "🏆 Cette vidéo a gagné"
                                            : "🏆 Dieses Video hat gewonnen"
                                    }
                                    text={
                                      activeLocale === "en"
                                        ? `Winner: ${winnerName}. Voting is complete and this submitted video was declared the winner.`
                                        : activeLocale === "es"
                                          ? `Ganador: ${winnerName}. La votación ha terminado y este vídeo enviado fue declarado ganador.`
                                          : activeLocale === "fr"
                                            ? `Gagnant : ${winnerName}. Le vote est terminé et cette vidéo soumise a été déclarée gagnante.`
                                            : `Gewinner: ${winnerName}. Das Voting ist abgeschlossen und dieses eingereichte Video wurde als Gewinner festgelegt.`
                                    }
                                  />
                                </div>
                              ) : null}

                              {!isWinner && isLeader && isVoting ? (
                                <div className="mt-4">
                                  <StatusMessage
                                    title={
                                      activeLocale === "en"
                                        ? "Currently leading"
                                        : activeLocale === "es"
                                          ? "Va ganando"
                                          : activeLocale === "fr"
                                            ? "Mène actuellement"
                                            : "Aktuell vorne"
                                    }
                                    text={
                                      activeLocale === "en"
                                        ? "This video is currently in first place. The race is not decided yet."
                                        : activeLocale === "es"
                                          ? "Este vídeo va actualmente en primera posición. La carrera aún no está decidida."
                                          : activeLocale === "fr"
                                            ? "Cette vidéo est actuellement en première position. La course n'est pas encore décidée."
                                            : "Dieses Video liegt im Moment vorne. Noch ist das Rennen aber nicht entschieden."
                                    }
                                    tone="warning"
                                  />
                                </div>
                              ) : null}

                              {!isWinner && isCompleted && !!winnerAttemptId ? (
                                <div className="mt-4">
                                  <StatusMessage
                                    title={extraUi.didNotWin}
                                    text={
                                      activeLocale === "en"
                                        ? "This video was part of the voting, but it was not chosen as the winner."
                                        : activeLocale === "es"
                                          ? "Este vídeo formó parte de la votación, pero no fue elegido como ganador."
                                          : activeLocale === "fr"
                                            ? "Cette vidéo faisait partie du vote, mais elle n'a pas été choisie comme gagnante."
                                            : "Dieses Video war im Voting, wurde aber nicht als Gewinner gewählt."
                                    }
                                    tone="neutral"
                                  />
                                </div>
                              ) : null}

                              {!isWinner && isVoting && rank > 1 ? (
                                <div className="mt-4">
                                  <StatusMessage
                                    title={`${extraUi.currentlyPlace} ${rank}`}
                                    text={
                                      gapToLeader === 0
                                        ? activeLocale === "en"
                                          ? "This video is tied for the lead or very close to it."
                                          : activeLocale === "es"
                                            ? "Este vídeo está empatado en cabeza o muy cerca de ella."
                                            : activeLocale === "fr"
                                              ? "Cette vidéo est à égalité en tête ou tout près."
                                              : "Dieses Video ist punktgleich vorne oder direkt dran."
                                        : activeLocale === "en"
                                          ? `This video is currently ${gapToLeader} points behind #1.`
                                          : activeLocale === "es"
                                            ? `Este vídeo está actualmente a ${gapToLeader} puntos del puesto #1.`
                                            : activeLocale === "fr"
                                              ? `Cette vidéo est actuellement à ${gapToLeader} points de la place #1.`
                                              : `Dieses Video liegt aktuell ${gapToLeader} Punkte hinter Platz 1.`
                                    }
                                    tone={gapToLeader === 0 ? "warning" : "info"}
                                  />
                                </div>
                              ) : null}

                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <div className="text-sm font-extrabold text-slate-900">
                                    {extraUi.castVotes}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {ui.score} = {ui.likes} − {ui.dislikes}
                                  </div>
                                </div>

                                {isMine ? (
                                  <StatusMessage
                                    title={extraUi.ownVideo}
                                    text={
                                      extraUi.yourOwnVideoCannotBeRated
                                    }
                                    tone="neutral"
                                    compact
                                  />
                                ) : (
                                  <VoteButtons
                                    attemptId={a.id}
                                    status={challenge.status}
                                    votingOver={votingOver}
                                    upVotes={voteState.upVotes}
                                    downVotes={voteState.downVotes}
                                    score={voteState.score}
                                    myVote={(voteState.myVote ?? 0) as VoteValue}
                                    onVoted={(next) => handleVotedUpdate(a.id, next)}
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>

                {shouldShowLiveSection ? (
                  <SectionCard
                    title={requiresLive ? ui.live : ui.currentActivity}
                    subtitle={
                      requiresLive
                        ? activeLocale === "en"
                          ? "Here you can see currently running streams for this challenge."
                          : activeLocale === "es"
                            ? "Aquí puedes ver los directos que están ocurriendo ahora mismo para este reto."
                            : activeLocale === "fr"
                              ? "Ici, tu peux voir les streams actuellement en cours pour ce défi."
                              : "Hier siehst du aktuell laufende Streams zu dieser Challenge."
                        : activeLocale === "en"
                          ? "Live activity only appears here when something is actually happening."
                          : activeLocale === "es"
                            ? "La actividad en directo solo aparecerá aquí cuando realmente esté ocurriendo algo."
                            : activeLocale === "fr"
                              ? "L'activité live n'apparaît ici que lorsqu'il se passe réellement quelque chose."
                              : "Laufende Lives erscheinen hier nur dann, wenn gerade wirklich etwas passiert."
                    }
                  >
                    {attemptsError && attempts.length === 0 ? (
                      <StatusMessage
                        title={
                          activeLocale === "en"
                            ? "Error while loading"
                            : activeLocale === "es"
                              ? "Error al cargar"
                              : activeLocale === "fr"
                                ? "Erreur lors du chargement"
                                : "Fehler beim Laden"
                        }
                        text={attemptsError}
                        tone="danger"
                      />
                    ) : liveAttempts.length === 0 ? (
                      <EmptyHint
                        title={
                          requiresLive
                            ? activeLocale === "en"
                              ? "Nothing is live right now"
                              : activeLocale === "es"
                                ? "Ahora mismo no hay nada en directo"
                                : activeLocale === "fr"
                                  ? "Rien n'est en direct pour le moment"
                                  : "Aktuell ist nichts live"
                            : activeLocale === "en"
                              ? "Nothing is live right now"
                              : activeLocale === "es"
                                ? "Ahora mismo no hay nada en directo"
                                : activeLocale === "fr"
                                  ? "Rien n'est en direct pour le moment"
                                  : "Gerade läuft nichts live"
                        }
                        text={
                          requiresLive
                            ? activeLocale === "en"
                              ? "As soon as a participant starts streaming, the livestream will appear here directly."
                              : activeLocale === "es"
                                ? "En cuanto un participante empiece a emitir, el directo aparecerá aquí."
                                : activeLocale === "fr"
                                  ? "Dès qu'un participant commence à streamer, le direct apparaîtra ici."
                                  : "Sobald ein Teilnehmer streamt, erscheint der Livestream hier direkt im Live-Bereich."
                            : activeLocale === "en"
                              ? "As soon as participants go live, they will appear here. Empty space is intentionally kept small."
                              : activeLocale === "es"
                                ? "En cuanto los participantes entren en directo, aparecerán aquí. El espacio vacío se mantiene pequeño a propósito."
                                : activeLocale === "fr"
                                  ? "Dès que des participants passent en direct, ils apparaîtront ici. L'espace vide est volontairement réduit."
                                  : "Sobald Teilnehmer live gehen, tauchen sie hier auf. Leere Fläche wird bewusst klein gehalten."
                        }
                      />
                    ) : (
                      <div className="grid gap-4">
                        {liveAttempts.map((a) => {
                          const playbackId = a.livePlaybackId ?? a.playbackId;

                          return (
                            <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <InfoPill tone="danger">
                                    🔴 {ui.live}
                                  </InfoPill>

                                  {myId && String(a.userId) === String(myId) && (
                                    <InfoPill tone="info">
                                      {activeLocale === "en"
                                        ? "You"
                                        : activeLocale === "es"
                                          ? "Tú"
                                          : activeLocale === "fr"
                                            ? "Toi"
                                            : "Du"}
                                    </InfoPill>
                                  )}

                                  <div className="text-sm font-bold text-slate-900">
                                    {extraUi.streamBy}
                                    <span className="font-mono">
                                      {displayAttemptName(a, myId, activeLocale)}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs text-slate-500">
                                  {a.updatedAt ? formatDateTime(a.updatedAt, activeLocale) : ""}
                                </div>
                              </div>

                              {playbackId ? (
                                <MuxVideoPlayer
                                  playbackId={playbackId}
                                  title={`${
                                    ui.live
                                  } ${displayAttemptName(a, myId, activeLocale)}`}
                                  streamType="live"
                                />
                              ) : (
                                <EmptyHint
                                  title={
                                    ui.noPlayback
                                  }
                                  text={
                                    activeLocale === "en"
                                      ? "This stream is marked as live, but there is no playback yet."
                                      : activeLocale === "es"
                                        ? "Este stream está marcado como directo, pero todavía no hay reproducción."
                                        : activeLocale === "fr"
                                          ? "Ce stream est marqué comme live, mais aucun playback n'est encore disponible."
                                          : "Live ist markiert, aber es gibt noch kein Playback."
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                ) : null}

                <SectionCard
                  title={ui.comments}
                  subtitle={ui.commentsSubtitle}
                  className="shadow-xl border border-white/10 bg-[#0B1322]"
                >
                  <Comments
                    challengeId={challenge.id}
                    placeholderText={commentsUi.placeholderText}
                    sendText={commentsUi.sendText}
                    noCommentsEyebrow={commentsUi.noCommentsEyebrow}
                    noCommentsTitle={commentsUi.noCommentsTitle}
                    noCommentsText={commentsUi.noCommentsText}
                    noReactionsYet={commentsUi.noReactionsYet}
                    communityArea={commentsUi.communityArea}
                  />
                </SectionCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="order-1 space-y-3 xl:order-2 xl:self-start xl:sticky xl:top-24"
              >
                {(sidebarMode === "live_phase" || sidebarMode === "default") && (
                  <>

                    {canFundByStatus ? (
                      <SectionCard
                        title={
                          isVoting
                            ? activeLocale === "en"
                              ? "Increase pot"
                              : activeLocale === "es"
                                ? "Aumentar bote"
                                : activeLocale === "fr"
                                  ? "Augmenter la cagnotte"
                                  : "Pot erhöhen"
                            : activeLocale === "en"
                              ? "Support challenge"
                              : activeLocale === "es"
                                ? "Apoyar reto"
                                : activeLocale === "fr"
                                  ? "Soutenir le défi"
                                  : "Challenge unterstützen"
                        }
                        subtitle={
                          isVoting
                            ? activeLocale === "en"
                              ? "Your contribution still raises the visible stake."
                              : activeLocale === "es"
                                ? "Tu aporte sigue aumentando lo que está en juego."
                                : activeLocale === "fr"
                                  ? "Ta contribution augmente encore la mise visible."
                                  : "Dein Beitrag erhöht weiterhin den sichtbaren Einsatz."
                            : activeLocale === "en"
                              ? "Increase the visible pot directly."
                              : activeLocale === "es"
                                ? "Aumenta el bote visible directamente."
                                : activeLocale === "fr"
                                  ? "Augmente directement la cagnotte visible."
                                  : "Erhöhe direkt den sichtbaren Pot."
                        }
                        compact
                        className="shadow-xl"
                      >
                        <div className="grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            {quickSupportAmounts.map((value) => (
                              <QuickAmountButton
                                key={value}
                                value={value}
                                locale={activeLocale}
                                active={selectedPresetAmount === value}
                                onClick={(nextValue) => {
                                  setAmountInput(String(nextValue));
                                  setAmountError("");
                                }}
                              />
                            ))}
                          </div>

                          <input
                            value={amountInput}
                            onChange={(e) => {
                              setAmountInput(e.target.value);
                              setAmountError("");
                            }}
                            placeholder={ui.customAmountPlaceholder}
                            inputMode="decimal"
                            className={`h-12 w-full rounded-2xl border px-4 outline-none transition bg-white/[0.04] text-white placeholder:text-slate-500 ${
                              amountError
                                ? "border-red-400/30 focus:border-red-400/40 focus:ring-4 focus:ring-red-500/10"
                                : "border-white/10 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                            }`}
                          />

                          {amountError ? (
                            <div className="text-xs font-semibold text-red-600">{amountError}</div>
                          ) : null}

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                            <CheckoutConsent
                              checked={fundConsentChecked}
                              onChange={(value) => {
                                setFundConsentChecked(value);
                                setFundConsentError("");
                              }}
                            />
                          </div>

                          {fundConsentError ? (
                            <div className="text-xs font-semibold text-red-600">{fundConsentError}</div>
                          ) : null}

                          {!token ? (
                            <Link href="/auth/login">
                              <PrimaryButton variant="dark" className="w-full">
                                {ui.loginAndIncreasePot}
                              </PrimaryButton>
                            </Link>
                          ) : (
                            <PrimaryButton
                              type="button"
                              variant="dark"
                              onClick={handleFund}
                              disabled={funding || !fundConsentChecked || !isFundAmountValid}
                              loading={funding}
                              loadingText={
                                activeLocale === "en"
                                  ? "Continue to Stripe…"
                                  : activeLocale === "es"
                                    ? "Continuar a Stripe…"
                                    : activeLocale === "fr"
                                      ? "Continuer vers Stripe…"
                                      : "Weiter zu Stripe…"
                              }
                              className="w-full"
                            >
                              {ui.increasePotNow}
                            </PrimaryButton>
                          )}

                          <div className="text-xs text-slate-500">
                            {ui.securePayment}
                          </div>
                        </div>
                      </SectionCard>
                    ) : null}

                    <SectionCard
                      title={ui.yourParticipation}
                      subtitle={
                        requiresLive
                          ? activeLocale === "en"
                            ? "Only one thing matters here: start your live attempt cleanly and finish it cleanly."
                            : activeLocale === "es"
                              ? "Aquí solo importa una cosa: empezar tu intento en directo de forma limpia y completarlo bien."
                              : activeLocale === "fr"
                                ? "Une seule chose compte ici : démarrer proprement ta tentative en direct et aller jusqu'au bout proprement."
                                : "Hier zählt eine Sache: deinen Live-Versuch sauber starten und sauber durchziehen."
                          : activeLocale === "en"
                            ? "Only one thing matters here: submit a valid verified recording."
                            : activeLocale === "es"
                              ? "Aquí solo importa una cosa: enviar una grabación verificada válida."
                              : activeLocale === "fr"
                                ? "Une seule chose compte ici : soumettre un enregistrement vérifié valide."
                                : "Hier zählt eine Sache: eine gültige verifizierte Aufnahme einreichen."
                      }
                      compact
                      className="shadow-lg"
                    >
                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <InfoPill tone={attemptStatusTone}>{attemptStatusPillLabel}</InfoPill>
                            <InfoPill tone={participationModeMeta.shortTone}>
                              {participationModeMeta.shortLabel}
                            </InfoPill>
                            {myAttempt?.id ? (
                              <InfoPill>
                                {extraUi.attemptLabel}: {shortId(myAttempt.id)}
                              </InfoPill>
                            ) : null}
                          </div>

                          <div className="text-base font-extrabold text-slate-900">
                            {attemptPanelMeta.headline}
                          </div>
                          <div className="mt-1.5 text-sm leading-6 text-slate-600">
                            {attemptPanelMeta.text}
                          </div>

                          {isAttemptActionAvailable ? (
                            <div className="mt-4">
                              {!token ? (
                                <Link href="/auth/login">
                                  <PrimaryButton variant="secondary">{ui.login}</PrimaryButton>
                                </Link>
                              ) : requiresLive ? (
                                myAttempt ? (
                                  myAttempt.status === "processing" ? (
                                    <PrimaryButton type="button" variant="secondary" disabled>
                                      {activeLocale === "en"
                                        ? "⏳ Processing"
                                        : activeLocale === "es"
                                          ? "⏳ Procesando"
                                          : activeLocale === "fr"
                                            ? "⏳ Traitement"
                                            : "⏳ Verarbeitung läuft"}
                                    </PrimaryButton>
                                  ) : myAttempt.status === "live" || myAttempt.isLive ? (
                                    <PrimaryButton
                                      type="button"
                                      variant="secondary"
                                      onClick={handleStopAttemptLive}
                                      disabled={stoppingAttemptLive}
                                      loading={stoppingAttemptLive}
                                      loadingText={
                                        activeLocale === "en"
                                          ? "Stopping…"
                                          : activeLocale === "es"
                                            ? "Deteniendo…"
                                            : activeLocale === "fr"
                                              ? "Arrêt…"
                                              : "Stoppe…"
                                      }
                                    >
                                      {activeLocale === "en"
                                        ? "⏹ Stop live attempt"
                                        : activeLocale === "es"
                                          ? "⏹ Detener intento en directo"
                                          : activeLocale === "fr"
                                            ? "⏹ Arrêter la tentative en direct"
                                            : "⏹ Live-Versuch stoppen"}
                                    </PrimaryButton>
                                  ) : myAttempt.status === "submitted" ? (
                                    <PrimaryButton type="button" variant="secondary" disabled>
                                      {activeLocale === "en"
                                        ? "✅ Already submitted"
                                        : activeLocale === "es"
                                          ? "✅ Ya enviado"
                                          : activeLocale === "fr"
                                            ? "✅ Déjà soumis"
                                            : "✅ Bereits eingereicht"}
                                    </PrimaryButton>
                                  ) : isAttemptPrepared ? (
                                    <PrimaryButton
                                      type="button"
                                      variant="secondary"
                                      onClick={handleStopAttemptLive}
                                      disabled={stoppingAttemptLive}
                                      loading={stoppingAttemptLive}
                                      loadingText={
                                        activeLocale === "en"
                                          ? "Stopping…"
                                          : activeLocale === "es"
                                            ? "Deteniendo…"
                                            : activeLocale === "fr"
                                              ? "Arrêt…"
                                              : "Stoppe…"
                                      }
                                    >
                                      {activeLocale === "en"
                                        ? "Cancel preparation"
                                        : activeLocale === "es"
                                          ? "Cancelar preparación"
                                          : activeLocale === "fr"
                                            ? "Annuler la préparation"
                                            : "Vorbereitung abbrechen"}
                                    </PrimaryButton>
                                  ) : (
                                    <PrimaryButton
                                      type="button"
                                      variant="dark"
                                      onClick={handleStartAttemptLive}
                                      disabled={!canStartAttempt}
                                      loading={startingAttemptLive || takingAttempt}
                                      loadingText={
                                        takingAttempt
                                          ? activeLocale === "en"
                                            ? "Creating attempt…"
                                            : activeLocale === "es"
                                              ? "Creando intento…"
                                              : activeLocale === "fr"
                                                ? "Création de la tentative…"
                                                  : extraUi.creatingAttempt
                                          : activeLocale === "en"
                                            ? "Starting…"
                                            : activeLocale === "es"
                                              ? "Iniciando…"
                                              : activeLocale === "fr"
                                                ? "Démarrage…"
                                                : "Starte…"
                                      }
                                      title={
                                        !isAttemptWindowOpen
                                          ? activeLocale === "en"
                                            ? "Not open (voting expired or challenge not active)"
                                            : activeLocale === "es"
                                              ? "No está abierto (la votación expiró o el reto no está activo)"
                                              : activeLocale === "fr"
                                                ? "Non ouvert (vote expiré ou défi inactif)"
                                                : "Nicht offen (Voting abgelaufen oder Challenge nicht aktiv)"
                                          : adultOnly && !isAdultAllowed
                                            ? activeLocale === "en"
                                              ? "18+ – date of birth required in profile"
                                              : activeLocale === "es"
                                                ? "18+ – fecha de nacimiento obligatoria en el perfil"
                                                : activeLocale === "fr"
                                                  ? "18+ – date de naissance requise dans le profil"
                                                  : "Ab 18 – Geburtsdatum im Profil erforderlich"
                                            : gatingNeeded && !gatingOk
                                              ? activeLocale === "en"
                                                ? "Please confirm the risk notice first"
                                                : activeLocale === "es"
                                                  ? "Confirma primero el aviso de riesgo"
                                                  : activeLocale === "fr"
                                                    ? "Merci de confirmer d’abord l’avis de risque"
                                                    : "Bitte zuerst Risiko bestätigen"
                                              : undefined
                                      }
                                    >
                                      {activeLocale === "en"
                                        ? "🔴 Start live attempt"
                                        : activeLocale === "es"
                                          ? "🔴 Iniciar intento en directo"
                                          : activeLocale === "fr"
                                            ? "🔴 Démarrer la tentative en direct"
                                            : "🔴 Live-Versuch starten"}
                                    </PrimaryButton>
                                  )
                                ) : canStartAttempt ? (
                                  <PrimaryButton
                                    type="button"
                                    variant="dark"
                                    onClick={handleStartAttemptLive}
                                    disabled={!canStartAttempt}
                                    loading={startingAttemptLive || takingAttempt}
                                    loadingText={
                                      takingAttempt
                                        ? activeLocale === "en"
                                          ? "Creating attempt…"
                                          : activeLocale === "es"
                                            ? "Creando intento…"
                                            : activeLocale === "fr"
                                              ? "Création de la tentative…"
                                              : extraUi.creatingAttempt
                                        : activeLocale === "en"
                                          ? "Starting…"
                                          : activeLocale === "es"
                                            ? "Iniciando…"
                                            : activeLocale === "fr"
                                              ? "Démarrage…"
                                              : "Starte…"
                                    }
                                  >
                                    {activeLocale === "en"
                                      ? "🔴 Start live attempt"
                                      : activeLocale === "es"
                                        ? "🔴 Iniciar intento en directo"
                                        : activeLocale === "fr"
                                          ? "🔴 Démarrer la tentative en direct"
                                          : "🔴 Live-Versuch starten"}
                                  </PrimaryButton>
                                ) : null
                              ) : (
                                <RecordedAttemptRecorder
                                  token={token}
                                  attemptWindowOpen={isAttemptWindowOpen}
                                  adultOnly={adultOnly}
                                  isAdultAllowed={isAdultAllowed}
                                  gatingNeeded={gatingNeeded}
                                  gatingOk={gatingOk}
                                  requiredSeconds={requiredSeconds}
                                  myAttempt={
                                    myAttempt
                                      ? {
                                          id: myAttempt.id,
                                          status: myAttempt.status,
                                        }
                                      : null
                                  }
                                  onEnsureAttempt={handleTakeAttempt}
                                  onUploaded={async () => {
                                    await refreshAttemptsData();
                                    await refreshChallengeData();
                                  }}
                                  onError={(msg) => setAttemptLiveError(msg)}
                                  onInfo={(msg) => setAttemptActionInfo(msg)}
                                  texts={recorderUi}
                                />
                              )}
                            </div>
                          ) : null}
                        </div>

                        {shouldShowAttemptMetaTiles ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <SmallStat
                              label={ui.status}
                              value={
                                isAttemptPrepared && myAttempt?.status === "draft"
                                  ? ui.prepared
                                  : getAttemptStatusLabel(myAttempt?.status, activeLocale)
                              }
                              tone={
                                myAttempt?.status === "submitted"
                                  ? "success"
                                  : myAttempt?.status === "processing"
                                    ? "warning"
                                    : isAttemptPrepared
                                      ? "info"
                                      : "neutral"
                              }
                            />
                            <SmallStat
                              label={
                                activeLocale === "en"
                                  ? "Minimum duration"
                                  : activeLocale === "es"
                                    ? "Duración mínima"
                                    : activeLocale === "fr"
                                      ? "Durée minimale"
                                      : "Mindestdauer"
                              }
                              value={`${clampInt(
                                myAttempt?.minLiveSecondsRequired ?? requiredSeconds,
                                3,
                                300,
                                requiredSeconds
                              )}s`}
                              tone="info"
                            />
                          </div>
                        ) : null}

                        {attemptPrimaryStatusBox}

                        {attemptActionInfo ? (
                          <StatusMessage
                            title={extraUi.info}
                            text={attemptActionInfo}
                            tone="info"
                          />
                        ) : null}

                        {requiresLive && attemptLiveInfo?.streamKey ? (
                          <SidebarBlock title={extraUi.streamSetup} emphasis>
                            <div className="grid gap-2 text-sm text-slate-700">
                              <div>
                                <span className="font-semibold">RTMP URL:</span>{" "}
                                <span className="break-all">
                                  {attemptLiveInfo.rtmpUrl ?? "rtmps://global-live.mux.com:443/app"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold">
                                  {extraUi.streamKey}
                                </span>{" "}
                                <span className="break-all">{attemptLiveInfo.streamKey}</span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {extraUi.obsSetupHelp}
                              </div>
                            </div>
                          </SidebarBlock>
                        ) : null}

                        {attemptLiveError ? (
                          <StatusMessage
                            title={extraUi.error}
                            text={attemptLiveError}
                            tone="danger"
                          />
                        ) : null}
                      </div>
                    </SectionCard>
                  </>
                )}

                {sidebarMode === "voting" && (
                  <>

                    <SectionCard
                      title={extraUi.votingWindow}
                      subtitle={
                        activeLocale === "en"
                          ? "Only the decision matters now."
                          : activeLocale === "es"
                            ? "Ahora solo importa la decisión."
                            : activeLocale === "fr"
                              ? "Seule la décision compte maintenant."
                              : "Jetzt zählt nur noch die Entscheidung."
                      }
                      compact
                      className="shadow-lg"
                    >
                      {votingInfo}
                    </SectionCard>

                    <SectionCard compact className="shadow-2xl">
                      <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                          {extraUi.currentLeader}
                        </div>
                        <div className="mt-1.5 text-2xl font-extrabold text-slate-950">
                          {leadingAttempt
                            ? leadingName
                            : activeLocale === "en"
                              ? "Still open"
                              : activeLocale === "es"
                                ? "Aún abierto"
                                : activeLocale === "fr"
                                  ? "Encore ouvert"
                                  : "Noch offen"}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">
                          {leadingAttempt
                            ? activeLocale === "en"
                              ? "This is currently the video in first place. Nothing has been decided yet."
                              : activeLocale === "es"
                                ? "Este es actualmente el vídeo en primera posición. Todavía no hay decisión."
                                : activeLocale === "fr"
                                  ? "C'est actuellement la vidéo en première position. Rien n'est encore décidé."
                                  : "Das ist aktuell das Video auf Platz 1. Noch ist nichts entschieden."
                            : activeLocale === "en"
                              ? "There is no clear leader yet."
                              : activeLocale === "es"
                                ? "Todavía no hay un líder claro."
                                : activeLocale === "fr"
                                  ? "Il n'y a pas encore de leader clair."
                                  : "Noch gibt es keinen klaren Führenden."}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <SmallStat
                          label={
                            extraUi.scorePlace1
                          }
                          value={leadingAttempt ? leadingAttempt.score : "—"}
                          tone="warning"
                        />
                        <SmallStat
                          label={
                            extraUi.gapToPlace2
                          }
                          value={
                            leadingGap != null
                              ? `${leadingGap}`
                              : extraUi.noGap
                          }
                          tone={leadingGap && leadingGap > 0 ? "success" : "neutral"}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title={ui.yourParticipation}
                      subtitle={
                        activeLocale === "en"
                          ? "Your current status in the race."
                          : activeLocale === "es"
                            ? "Tu estado actual en la competición."
                            : activeLocale === "fr"
                              ? "Ton statut actuel dans la course."
                              : "Dein Status im Rennen."
                      }
                      compact
                      className="shadow-lg"
                    >
                      <div className="grid gap-4">
                        <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <InfoPill tone={attemptStatusTone}>{attemptStatusPillLabel}</InfoPill>
                            {myAttempt?.id ? (
                              <InfoPill>
                                {extraUi.attemptLabel}: {shortId(myAttempt.id)}
                              </InfoPill>
                            ) : null}
                          </div>

                          <div className="text-base font-extrabold text-slate-900">
                            {attemptPanelMeta.headline}
                          </div>
                          <div className="mt-1.5 text-sm leading-6 text-slate-600">
                            {attemptPanelMeta.text}
                          </div>
                        </div>

                        {attemptPrimaryStatusBox}

                        {attemptLiveError ? (
                          <StatusMessage
                            title={extraUi.error}
                            text={attemptLiveError}
                            tone="danger"
                          />
                        ) : null}
                      </div>
                    </SectionCard>

                    <SectionCard
                      title={extraUi.supportSectionTitle}
                      subtitle={
                        funds.length === 0
                          ? extraUi.supportEntriesNone
                          : extraUi.supportExpandable
                      }
                      compact
                      className="shadow-lg"
                    >
                      {funds.length === 0 ? (
                        <EmptyHint
                          title={
                            extraUi.noSupportYet
                          }
                          text={
                            activeLocale === "en"
                              ? "As soon as someone supports this challenge, the entries will appear here."
                              : activeLocale === "es"
                                ? "En cuanto alguien apoye este reto, las entradas aparecerán aquí."
                                : activeLocale === "fr"
                                  ? "Dès que quelqu'un soutient ce défi, les entrées apparaîtront ici."
                                  : "Sobald jemand diese Challenge unterstützt, erscheinen die Einträge hier."
                          }
                        />
                      ) : (
                        <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <summary className="cursor-pointer list-none text-sm font-extrabold text-slate-900">
                            {`${extraUi.showSupport} (${funds.length})`}
                          </summary>

                          <div className="mt-3 grid gap-2.5">
                            {[...funds]
                              .sort((a, b) => {
                                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                return tb - ta;
                              })
                              .map((f) => (
                                <div
                                  key={f.id}
                                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
                                >
                                  <div className="font-extrabold text-slate-900">
                                    {f.user?.username ? (
                                      <UserLink
                                        username={f.user.username}
                                        avatarUrl={f.user.avatarUrl}
                                        avatarSize={28}
                                      />
                                    ) : (
                                      <span>
                                        {extraUi.anonymous}
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {f.createdAt ? formatDateTime(f.createdAt, activeLocale) : ""}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
                    </SectionCard>
                  </>
                )}

                {sidebarMode === "completed_winner" && (
                  <>
                    <SectionCard compact className="shadow-2xl">
                      <div className="rounded-[22px] border border-green-200 bg-green-50 px-4 py-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-700">
                          {activeLocale === "en"
                            ? "Winner"
                            : activeLocale === "es"
                              ? "Ganador"
                              : activeLocale === "fr"
                                ? "Gagnant"
                                : "Gewinner"}
                        </div>
                        <div className="mt-1.5 text-2xl font-extrabold text-slate-950">
                          {winnerName}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">
                          {activeLocale === "en"
                            ? "Voting is complete. This challenge has a winner."
                            : activeLocale === "es"
                              ? "La votación ha terminado. Este reto ya tiene un ganador."
                              : activeLocale === "fr"
                                ? "Le vote est terminé. Ce défi a un gagnant."
                                : "Das Voting ist abgeschlossen. Diese Challenge hat einen Gewinner."}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <SmallStat
                          label={
                            activeLocale === "en"
                              ? "Winner score"
                              : activeLocale === "es"
                                ? "Puntuación del ganador"
                                : activeLocale === "fr"
                                  ? "Score du gagnant"
                                  : "Gewinner-Score"
                          }
                          value={challenge.winner?.score ?? 0}
                        />
                        <SmallStat
                          label={
                            activeLocale === "en"
                              ? "Videos in final"
                              : activeLocale === "es"
                                ? "Vídeos en la final"
                                : activeLocale === "fr"
                                  ? "Vidéos en finale"
                                  : "Videos im Finale"
                          }
                          value={submittedAttempts.length}
                          tone="info"
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title={extraUi.result}
                      subtitle={
                        activeLocale === "en"
                          ? "The decision has been made."
                          : activeLocale === "es"
                            ? "La decisión ya está tomada."
                            : activeLocale === "fr"
                              ? "La décision est prise."
                              : "Die Entscheidung ist gefallen."
                      }
                      compact
                      className="shadow-lg"
                    >
                      <StatusMessage
                        title={
                          activeLocale === "en"
                            ? `🏆 ${winnerName} has won`
                            : activeLocale === "es"
                              ? `🏆 ${winnerName} ha ganado`
                              : activeLocale === "fr"
                                ? `🏆 ${winnerName} a gagné`
                                : `🏆 ${winnerName} hat gewonnen`
                        }
                        text={
                          activeLocale === "en"
                            ? "Support and participation are over. The winning video remains visible below as clear proof."
                            : activeLocale === "es"
                              ? "El apoyo y la participación han terminado. El vídeo ganador sigue visible abajo como prueba clara."
                              : activeLocale === "fr"
                                ? "Le soutien et la participation sont terminés. La vidéo gagnante reste visible ci-dessous comme preuve claire."
                                : extraUi.proofWordingWinner
                        }
                      />
                    </SectionCard>

                    {isAdmin ? (
                      <SectionCard
                        title={extraUi.adminPayout}
                        subtitle={
                          activeLocale === "en"
                            ? "Prepare and review the payout for the winner."
                            : activeLocale === "es"
                              ? "Preparar y revisar el pago del ganador."
                              : activeLocale === "fr"
                                ? "Préparer et vérifier le paiement du gagnant."
                                : "Auszahlung für den Gewinner vorbereiten und prüfen."
                        }
                        compact
                        className="shadow-xl"
                      >
                        <div className="grid gap-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <SmallStat
                              label={
                                extraUi.gross
                              }
                              value={formatMoneyEUR(payoutPreview.gross, activeLocale)}
                              tone="info"
                            />
                            <SmallStat
                              label={
                                extraUi.platformFee
                              }
                              value={formatMoneyEUR(payoutPreview.fee, activeLocale)}
                              tone="warning"
                            />
                            <SmallStat
                              label={
                                extraUi.winnerNet
                              }
                              value={formatMoneyEUR(payoutPreview.net, activeLocale)}
                            />
                          </div>

                          {loadingPayout ? (
                            <StatusMessage
                              title={
                                activeLocale === "en"
                                  ? "Checking payout"
                                  : activeLocale === "es"
                                    ? "Comprobando pago"
                                    : activeLocale === "fr"
                                      ? "Vérification du paiement"
                                      : "Payout wird geprüft"
                              }
                              text={
                                activeLocale === "en"
                                  ? "Checking whether a payout already exists for this challenge."
                                  : activeLocale === "es"
                                    ? "Se está comprobando si ya existe un pago para este reto."
                                    : activeLocale === "fr"
                                      ? "Vérification de l’existence d’un paiement pour ce défi."
                                      : "Es wird gerade geprüft, ob für diese Challenge bereits ein Payout existiert."
                              }
                              tone="neutral"
                              compact
                            />
                          ) : existingPayout ? (
                            <StatusMessage
                              title={
                                activeLocale === "en"
                                  ? `Payout already exists (${existingPayout.status})`
                                  : activeLocale === "es"
                                    ? `El pago ya existe (${existingPayout.status})`
                                    : activeLocale === "fr"
                                      ? `Le paiement existe déjà (${existingPayout.status})`
                                      : `Payout bereits vorhanden (${existingPayout.status})`
                              }
                              text={
                                activeLocale === "en"
                                  ? "A payout record has already been created for this challenge. You can review it in the payout admin."
                                  : activeLocale === "es"
                                    ? "Ya se ha creado un registro de pago para este reto. Puedes revisarlo en el panel de pagos."
                                    : activeLocale === "fr"
                                      ? "Un enregistrement de paiement existe déjà pour ce défi. Tu peux le vérifier dans l’admin payout."
                                      : "Für diese Challenge wurde bereits ein Payout-Datensatz angelegt. Du kannst ihn im Payout-Admin prüfen."
                              }
                              compact
                            />
                          ) : canPreparePayout ? (
                            <StatusMessage
                              title={
                                activeLocale === "en"
                                  ? "Payout not prepared yet"
                                  : activeLocale === "es"
                                    ? "El pago aún no está preparado"
                                    : activeLocale === "fr"
                                      ? "Le paiement n’est pas encore préparé"
                                      : "Payout noch nicht vorbereitet"
                              }
                              text={
                                activeLocale === "en"
                                  ? "This challenge is completed and has a winner. You can create the payout record now."
                                  : activeLocale === "es"
                                    ? "Este reto está completado y tiene un ganador. Ahora puedes crear el registro de pago."
                                    : activeLocale === "fr"
                                      ? "Ce défi est terminé et a un gagnant. Tu peux maintenant créer l’enregistrement de paiement."
                                      : "Diese Challenge ist abgeschlossen und hat einen Gewinner. Du kannst jetzt den Payout-Datensatz erzeugen."
                              }
                              tone="warning"
                              compact
                            />
                          ) : (
                            <StatusMessage
                              title={
                                activeLocale === "en"
                                  ? "No payout possible"
                                  : activeLocale === "es"
                                    ? "No es posible preparar el pago"
                                    : activeLocale === "fr"
                                      ? "Aucun paiement possible"
                                      : "Kein Payout möglich"
                              }
                              text={
                                activeLocale === "en"
                                  ? "A payout can only be prepared once the challenge is completed and a winner exists."
                                  : activeLocale === "es"
                                    ? "El pago solo puede prepararse cuando el reto esté completado y exista un ganador."
                                    : activeLocale === "fr"
                                      ? "Le paiement ne peut être préparé que lorsque le défi est terminé et qu’un gagnant existe."
                                      : "Ein Payout kann erst vorbereitet werden, wenn die Challenge abgeschlossen ist und ein Gewinner feststeht."
                              }
                              tone="neutral"
                              compact
                            />
                          )}

                          {payoutError ? (
                            <StatusMessage
                              title={extraUi.error}
                              text={payoutError}
                              tone="danger"
                              compact
                            />
                          ) : null}

                          {payoutSuccess ? (
                            <StatusMessage
                              title={extraUi.success}
                              text={payoutSuccess}
                              tone="success"
                              compact
                            />
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            {canPreparePayout ? (
                              <PrimaryButton
                                type="button"
                                variant="dark"
                                onClick={handlePreparePayout}
                                disabled={preparingPayout}
                                loading={preparingPayout}
                                loadingText={
                                  activeLocale === "en"
                                    ? "Preparing…"
                                    : activeLocale === "es"
                                      ? "Preparando…"
                                      : activeLocale === "fr"
                                        ? "Préparation…"
                                        : "Bereite vor…"
                                }
                              >
                                {extraUi.preparePayout}
                              </PrimaryButton>
                            ) : null}

                            {existingPayout ? (
                              <Link href="/admin/payouts">
                                <PrimaryButton variant="secondary">
                                  {extraUi.goToPayouts}
                                </PrimaryButton>
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </SectionCard>
                    ) : null}

                    <SectionCard
                      title={extraUi.supportSectionTitle}
                      subtitle={
                        funds.length === 0
                          ? extraUi.supportEntriesNone
                          : extraUi.newestFirst
                      }
                      compact
                      className="shadow-lg"
                    >
                      {funds.length === 0 ? (
                        <EmptyHint
                          title={
                            extraUi.noVisibleSupport
                          }
                          text={
                            activeLocale === "en"
                              ? "No support entries were loaded for this challenge."
                              : activeLocale === "es"
                                ? "No se cargaron apoyos para este reto."
                                : activeLocale === "fr"
                                  ? "Aucun soutien n’a été chargé pour ce défi."
                                  : "Für diese Challenge wurden keine Unterstützungen geladen."
                          }
                        />
                      ) : (
                        <div className="grid gap-2.5">
                          {[...funds]
                            .sort((a, b) => {
                              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                              return tb - ta;
                            })
                            .map((f) => (
                              <div
                                key={f.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                              >
                                <div className="font-extrabold text-slate-900">
                                  {f.user?.username ? (
                                    <UserLink
                                      username={f.user.username}
                                      avatarUrl={f.user.avatarUrl}
                                      avatarSize={28}
                                    />
                                  ) : (
                                    <span>
                                        {extraUi.anonymous}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500">
                                  {f.createdAt ? formatDateTime(f.createdAt, activeLocale) : ""}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </SectionCard>
                  </>
                )}

                {sidebarMode === "completed_failed" && (
                  <>
                    <SectionCard compact className="shadow-2xl">
                      <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">
                          {activeLocale === "en"
                            ? "Result"
                            : activeLocale === "es"
                              ? "Resultado"
                              : activeLocale === "fr"
                                ? "Résultat"
                                : "Ergebnis"}
                        </div>
                        <div className="mt-1.5 text-2xl font-extrabold text-slate-950">
                          {activeLocale === "en"
                            ? "Ended without a winner"
                            : activeLocale === "es"
                              ? "Terminó sin ganador"
                              : activeLocale === "fr"
                                ? "Terminé sans gagnant"
                                : "Ohne Gewinner beendet"}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">
                          {activeLocale === "en"
                            ? "No valid video was submitted. This challenge is finally over."
                            : activeLocale === "es"
                              ? "No se envió ningún vídeo válido. Este reto ha terminado definitivamente."
                              : activeLocale === "fr"
                                ? "Aucune vidéo valide n'a été soumise. Ce défi est définitivement terminé."
                                : "Es wurde kein gültiges Video eingereicht. Die Challenge ist endgültig vorbei."}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <SmallStat
                          label={
                            activeLocale === "en"
                              ? "Valid videos"
                              : activeLocale === "es"
                                ? "Vídeos válidos"
                                : activeLocale === "fr"
                                  ? "Vidéos valides"
                                  : "Gültige Videos"
                          }
                          value={submittedAttempts.length}
                          tone="danger"
                        />
                        <SmallStat
                          label={ui.status}
                          value={
                            activeLocale === "en"
                              ? "Ended"
                              : activeLocale === "es"
                                ? "Finalizado"
                                : activeLocale === "fr"
                                  ? "Terminé"
                                  : "Beendet"
                          }
                          tone="danger"
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title={extraUi.finalStatus}
                      subtitle={
                        activeLocale === "en"
                          ? "No further actions possible."
                          : activeLocale === "es"
                            ? "No son posibles más acciones."
                            : activeLocale === "fr"
                              ? "Aucune autre action possible."
                              : "Keine weiteren Aktionen möglich."
                      }
                      compact
                      className="shadow-lg"
                    >
                      <StatusMessage
                        title={extraUi.challengeClosed}
                        text={
                          activeLocale === "en"
                            ? "Support, participation and voting are over. There is nothing left to push here."
                            : activeLocale === "es"
                              ? "El apoyo, la participación y la votación han terminado. Aquí ya no queda nada que impulsar."
                              : activeLocale === "fr"
                                ? "Le soutien, la participation et le vote sont terminés. Il n'y a plus rien à pousser ici."
                                : "Support, Teilnahme und Voting sind beendet. Hier gibt es nichts mehr zu pushen."
                        }
                        tone="danger"
                      />
                    </SectionCard>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}