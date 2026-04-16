"use client";

import React, { useMemo } from "react";

export type PublicProfileViewProps = {
  profile: any;
  locale: string;
  isOwnProfile?: boolean;
};

type NormalizedChallenge = {
  id: string;
  title: string;
  status: string;
  amountLabel?: string;
  supportersLabel?: string;
};

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function pickFirst<T>(...values: T[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function formatCurrencyEUR(value: unknown, locale: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "€0";
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function statusPillClasses(status: string) {
  const s = String(status).toUpperCase();

  if (s === "AKTIV" || s === "ACTIVE") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
  }

  if (s === "VOTING") {
    return "border-indigo-400/20 bg-indigo-400/10 text-indigo-100";
  }

  if (s === "COMPLETED" || s === "ABGESCHLOSSEN") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  }

  if (s === "FUNDING") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-100";
  }

  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default function PublicProfileView({
  profile,
  locale,
  isOwnProfile,
}: PublicProfileViewProps) {
  const normalized = useMemo(() => {
    const stats = profile?.stats ?? {};

    const rawChallenges = Array.isArray(profile?.challenges)
      ? profile.challenges
      : Array.isArray(profile?.visibleChallenges)
      ? profile.visibleChallenges
      : Array.isArray(profile?.createdChallenges)
      ? profile.createdChallenges
      : [];

    const username = String(pickFirst(profile?.username, profile?.name, "user"));
    const level = toNumber(pickFirst(profile?.level, 7), 7);
    const totalXp = toNumber(pickFirst(profile?.totalXp, profile?.xp, 950), 950);
    const xpIntoLevel = toNumber(pickFirst(profile?.xpIntoLevel, 18), 18);
    const xpNeededForNextLevel = toNumber(
      pickFirst(profile?.xpNeededForNextLevel, 39),
      39
    );
    const progressRaw =
      xpNeededForNextLevel > 0 ? xpIntoLevel / xpNeededForNextLevel : 0;
    const progress = Math.max(0, Math.min(1, progressRaw));

    const createdChallenges = toNumber(
      pickFirst(
        stats?.created,
        profile?.createdChallengesCount,
        rawChallenges.length,
        0
      )
    );
    const wonChallenges = toNumber(
      pickFirst(stats?.completedWins, profile?.wonChallenges, profile?.wins, 0)
    );
    const voteScoreTotal = toNumber(
      pickFirst(
        stats?.voteScoreTotal,
        profile?.voteScoreTotal,
        profile?.votes,
        0
      )
    );
    const supportCount = toNumber(
      pickFirst(
        stats?.supportCount,
        profile?.supportCount,
        profile?.supports,
        0
      )
    );
    const completedChallenges = toNumber(
      pickFirst(
        stats?.completed,
        profile?.completedChallenges,
        createdChallenges,
        0
      )
    );

    const challenges: NormalizedChallenge[] = rawChallenges.map(
      (c: any, index: number) => ({
        id: String(c?.id ?? `challenge-${index}`),
        title: String(pickFirst(c?.title, c?.name, "Untitled challenge")),
        status: String(pickFirst(c?.status, "AKTIV")).toUpperCase(),
        amountLabel:
          c?.amountLabel ??
          (c?.currentAmount != null
            ? formatCurrencyEUR(c.currentAmount, locale)
            : "€4.530"),
        supportersLabel:
          c?.supportersLabel ??
          (c?.supportCount != null
            ? `${c.supportCount} Unterstützer`
            : "1.851"),
      })
    );

    const winrate =
      completedChallenges > 0
        ? Math.round((wonChallenges / completedChallenges) * 100)
        : 0;

    return {
      username,
      avatarSrc: getAvatarSrc(
        pickFirst(profile?.avatarUrl, profile?.image, null)
      ),
      level,
      totalXp,
      xpIntoLevel,
      xpNeededForNextLevel,
      progress,
      createdChallenges,
      wonChallenges,
      voteScoreTotal,
      supportCount,
      winrate,
      slogan: String(
        pickFirst(
          profile?.slogan?.trim(),
          "Ich stelle mich jeder Challenge. Keine Ausreden."
        )
      ),
      isAdultVerified: Boolean(profile?.isAdultVerified),
      role: String(pickFirst(profile?.role, "")),
      challenges,
      reputationLabel:
        locale === "de"
          ? "Reputation. Highlights. Vertrauen."
          : "Reputation. Highlights. Trust.",
    };
  }, [profile, locale]);

  function initials(username: string) {
    const clean = (username || "").trim();
    if (!clean) return "?";
    return clean.slice(0, 2).toUpperCase();
  }

  const ui = {
    overview: locale === "de" ? "Übersicht" : "Overview",
    challenges: locale === "de" ? "Challenges" : "Challenges",
    achievements: locale === "de" ? "Einreichungen" : "Achievements",
    successes: locale === "de" ? "Erfolge" : "Successes",
    activeChallenges:
      locale === "de" ? "Aktive Challenges" : "Active Challenges",
    seeAll: locale === "de" ? "Alle ansehen" : "See all",
    recentActivities:
      locale === "de" ? "Letzte Aktivitäten" : "Recent Activities",
    noChallenges:
      locale === "de"
        ? "Noch keine Challenges vorhanden."
        : "No challenges yet.",
    challengesStat: locale === "de" ? "Challenges" : "Challenges",
    winsStat: locale === "de" ? "Siege" : "Wins",
    votesStat: locale === "de" ? "Votes" : "Votes",
    earnedStat: locale === "de" ? "Verdient" : "Earned",
    levelLabel: locale === "de" ? "Level" : "Level",
    highlights: locale === "de" ? "Highlights" : "Highlights",
    profile: locale === "de" ? "Public Profile" : "Public Profile",
  };

  const topBadges = [
    "Top Performer",
    normalized.isAdultVerified ? "18+" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),linear-gradient(135deg,#050B17_0%,#09101D_55%,#0B1322_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/5">
        <div className="px-4 pb-8 pt-4">
          <div className="mb-4 text-center text-[11px] font-medium tracking-wide text-slate-500">
            {normalized.reputationLabel}
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#0B1322] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">
                {ui.profile}
              </span>

              {topBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-lg">
                {normalized.avatarSrc ? (
                  <img
                    src={normalized.avatarSrc}
                    alt={normalized.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-white">
                    {initials(normalized.username)}
                  </div>
                )}

                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#0B1322] bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[30px] font-black leading-none tracking-tight text-white">
                  {normalized.username}
                </div>
                <div className="mt-1 text-xs text-blue-300">
                  @{normalized.username.toLowerCase()}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-200">
                    {ui.levelLabel} {normalized.level}
                  </span>

                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
                    {normalized.totalXp} XP
                  </span>
                </div>

                <p className="mt-4 text-[13px] leading-6 text-slate-300">
                  {normalized.slogan}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[
                { value: normalized.createdChallenges, label: ui.challengesStat },
                { value: normalized.wonChallenges, label: ui.winsStat },
                { value: normalized.voteScoreTotal, label: ui.votesStat },
                { value: normalized.supportCount, label: ui.earnedStat },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] px-3 py-4 text-center"
                >
                  <div className="text-2xl font-extrabold tracking-tight text-white">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-base font-bold text-white">
                  {ui.levelLabel} {normalized.level}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Winrate</div>
                  <div className="text-base font-bold text-white">
                    {normalized.winrate}%
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-[#2F7BFF]"
                  style={{ width: `${normalized.progress * 100}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {normalized.xpIntoLevel} / {normalized.xpNeededForNextLevel} XP
                </span>
                <span>
                  {Math.max(
                    0,
                    normalized.xpNeededForNextLevel - normalized.xpIntoLevel
                  )}{" "}
                  XP
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-bold text-white">
                {ui.highlights}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]"
                  >
                    <div className="aspect-[0.95] w-full bg-[linear-gradient(135deg,#1c2740_0%,#0d1728_100%)]" />
                    <div className="px-2 py-2.5">
                      <div className="line-clamp-1 text-[10px] font-semibold text-white">
                        {i === 0
                          ? "Heißester Sieg"
                          : i === 1
                          ? "4 Wins in Folge"
                          : "Live Überraschung"}
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-400">
                        {i === 0
                          ? "€1.250"
                          : i === 1
                          ? "4x Siege"
                          : "2.3M Views"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-5 overflow-x-auto border-b border-white/10 pb-3 text-[12px]">
                <button className="shrink-0 border-b-2 border-blue-400 pb-2 font-semibold text-blue-300">
                  {ui.overview}
                </button>
                <button className="shrink-0 pb-2 text-slate-400">
                  {ui.challenges}
                </button>
                <button className="shrink-0 pb-2 text-slate-400">
                  {ui.achievements}
                </button>
                <button className="shrink-0 pb-2 text-slate-400">
                  {ui.successes}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-white">
                  {ui.activeChallenges}
                </div>
                <button className="text-[11px] font-semibold text-blue-300">
                  {ui.seeAll}
                </button>
              </div>

              {normalized.challenges.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                  {ui.noChallenges}
                </div>
              ) : (
                <div className="space-y-3">
                  {normalized.challenges.slice(0, 3).map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                        {challenge.title.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-bold text-white">
                          {challenge.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{challenge.amountLabel}</span>
                          <span>•</span>
                          <span>{challenge.supportersLabel}</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                          statusPillClasses(challenge.status)
                        )}
                      >
                        {challenge.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-white">
                  {ui.recentActivities}
                </div>
                <button className="text-[11px] font-semibold text-blue-300">
                  {ui.seeAll}
                </button>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                    {initials(normalized.username)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] text-white">
                      Hat eine neue Challenge erstellt
                    </div>
                    <div className="text-[10px] text-slate-400">Vor 2h</div>
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div className="mt-6 rounded-[22px] border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3 text-[12px] text-blue-100">
                Dein eigenes Profil wird genauso dargestellt wie die öffentliche
                Ansicht.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}