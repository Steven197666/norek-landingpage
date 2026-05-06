"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

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

type NormalizedSubmission = {
  id: string;
  title: string;
  subtitle?: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  status?: string;
};

type StatCard = {
  title: string;
  value: string;
};

type ProfileTab = "overview" | "challenges" | "achievements" | "successes";

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

function absolutizeUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBackendBaseUrl()}${url}`;
}

function getAvatarSrc(avatarUrl?: string | null) {
  return absolutizeUrl(avatarUrl);
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

  if (s === "SUBMITTED" || s === "EINGEREICHT") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-100";
  }

  if (s === "PROCESSING" || s === "VERARBEITUNG") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-100";
  }

  if (s === "DRAFT" || s === "ENTWURF") {
    return "border-white/10 bg-white/[0.04] text-slate-300";
  }

  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default function PublicProfileView({
  profile,
  locale,
  isOwnProfile,
}: PublicProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const normalized = useMemo(() => {
    const stats = profile?.stats ?? {};

    const rawChallenges = Array.isArray(profile?.challenges)
      ? profile.challenges
      : Array.isArray(profile?.visibleChallenges)
        ? profile.visibleChallenges
        : Array.isArray(profile?.createdChallenges)
          ? profile.createdChallenges
          : [];

    const rawSubmissions = Array.isArray(profile?.submissions)
      ? profile.submissions
      : Array.isArray(profile?.attempts)
        ? profile.attempts
        : Array.isArray(profile?.videos)
          ? profile.videos
          : Array.isArray(profile?.highlights)
            ? profile.highlights
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
            ? locale === "de"
              ? `${c.supportCount} Unterstützer`
              : `${c.supportCount} supporters`
            : locale === "de"
              ? "1.851 Unterstützer"
              : "1,851 supporters"),
      })
    );

    const submissions: NormalizedSubmission[] = rawSubmissions.map(
      (item: any, index: number) => ({
        id: String(item?.id ?? `submission-${index}`),
        title: String(
          pickFirst(
            item?.title,
            item?.challengeTitle,
            item?.challenge?.title,
            locale === "de" ? "Einreichung" : "Submission"
          )
        ),
        subtitle: String(
          pickFirst(
            item?.subtitle,
            item?.status,
            item?.challenge?.status,
            locale === "de" ? "Video-Einreichung" : "Video submission"
          )
        ),
        videoUrl: absolutizeUrl(
          pickFirst(
            item?.videoUrl,
            item?.playbackUrl,
            item?.playbackId
              ? `https://stream.mux.com/${item.playbackId}.m3u8`
              : null,
            item?.assetPlaybackId
              ? `https://stream.mux.com/${item.assetPlaybackId}.m3u8`
              : null
          )
        ),
        thumbnailUrl: absolutizeUrl(
          pickFirst(
            item?.thumbnailUrl,
            item?.posterUrl,
            item?.coverUrl,
            item?.playbackId
              ? `https://image.mux.com/${item.playbackId}/thumbnail.webp?time=1`
              : null,
            item?.assetPlaybackId
              ? `https://image.mux.com/${item.assetPlaybackId}/thumbnail.webp?time=1`
              : null
          )
        ),
        status: String(
          pickFirst(item?.status, item?.challenge?.status, "SUBMITTED")
        ).toUpperCase(),
      })
    );

    const activeChallenges = challenges.filter((c) => {
      const s = String(c.status).toUpperCase();
      return (
        s === "AKTIV" || s === "ACTIVE" || s === "FUNDING" || s === "VOTING"
      );
    });

    const completedOrSuccessfulChallenges = challenges.filter((c) => {
      const s = String(c.status).toUpperCase();
      return s === "COMPLETED" || s === "ABGESCHLOSSEN";
    });

    const statCards: StatCard[] = [];

    if (wonChallenges > 0) {
      statCards.push({
        title: locale === "de" ? "Gewonnene Challenges" : "Challenges Won",
        value:
          locale === "de"
            ? `${wonChallenges} Siege`
            : `${wonChallenges} wins`,
      });
    }

    if (createdChallenges > 0) {
      statCards.push({
        title: locale === "de" ? "Erstellte Challenges" : "Created Challenges",
        value: String(createdChallenges),
      });
    }

    if (supportCount > 0) {
      statCards.push({
        title: locale === "de" ? "Unterstützungen" : "Supports",
        value: String(supportCount),
      });
    }

    if (voteScoreTotal > 0) {
      statCards.push({
        title: locale === "de" ? "Votes erhalten" : "Votes Received",
        value: String(voteScoreTotal),
      });
    }

    const recentActivities = [
      {
        title:
          locale === "de"
            ? "Hat eine neue Challenge erstellt"
            : "Created a new challenge",
        time: locale === "de" ? "Vor 2h" : "2h ago",
      },
      {
        title:
          locale === "de"
            ? "Ein neues Video wurde eingereicht"
            : "A new video was submitted",
        time: locale === "de" ? "Vor 1d" : "1d ago",
      },
    ];

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
      challenges,
      submissions,
      activeChallenges,
      completedOrSuccessfulChallenges,
      statCards,
      recentActivities,
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
    challenges: "Challenges",
    achievements: locale === "de" ? "Einreichungen" : "Submissions",
    successes: locale === "de" ? "Erfolge" : "Successes",
    activeChallenges:
      locale === "de" ? "Aktive Challenges" : "Active Challenges",
    allChallenges: locale === "de" ? "Alle Challenges" : "All Challenges",
    submissions: locale === "de" ? "Einreichungen" : "Submissions",
    successesTitle: locale === "de" ? "Erfolge / Statistiken" : "Successes / Stats",
    seeAll: locale === "de" ? "Alle ansehen" : "See all",
    recentActivities:
      locale === "de" ? "Letzte Aktivitäten" : "Recent Activities",
    noChallenges:
      locale === "de"
        ? "Noch keine Challenges vorhanden."
        : "No challenges yet.",
    noAchievements:
      locale === "de"
        ? "Noch keine hochgeladenen Videos vorhanden."
        : "No uploaded videos yet.",
    noSuccesses:
      locale === "de"
        ? "Noch keine Erfolge vorhanden."
        : "No successes yet.",
    noHighlights:
      locale === "de" ? "Noch keine Highlights." : "No highlights yet.",
    challengesStat: locale === "de" ? "Challenges" : "Challenges",
    winsStat: locale === "de" ? "Siege" : "Wins",
    votesStat: "Votes",
    earnedStat: locale === "de" ? "Verdient" : "Earned",
    levelLabel: locale === "de" ? "Level" : "Level",
    highlights: locale === "de" ? "Highlights" : "Highlights",
    profile: "Public Profile",
    myChallenges:
      locale === "de" ? "Zu meinen Challenges" : "Go to my challenges",
    play: locale === "de" ? "Abspielen" : "Play",
  };

  const topBadges = [
    "Top Performer",
    normalized.isAdultVerified ? "18+" : null,
  ].filter(Boolean) as string[];

  const renderChallengeList = (items: NormalizedChallenge[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-3"
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
    );
  };

  const renderSubmissionList = (
    items: NormalizedSubmission[],
    emptyText: string
  ) => {
    if (items.length === 0) {
      return (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]"
          >
            {item.thumbnailUrl ? (
              <div className="relative h-40 w-full overflow-hidden bg-[linear-gradient(135deg,#1c2740_0%,#0d1728_100%)]">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061126]/90 via-transparent to-transparent" />
                <div className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">
                  {ui.play}
                </div>
              </div>
            ) : (
              <div className="h-40 w-full bg-[linear-gradient(135deg,#1c2740_0%,#0d1728_100%)]" />
            )}

            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-semibold text-white">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.subtitle}
                  </div>
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold",
                    statusPillClasses(item.status || "SUBMITTED")
                  )}
                >
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatCards = (items: StatCard[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3">
        {items.map((card, index) => (
          <div
            key={`${card.title}-${index}`}
            className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]"
          >
            <div className="h-28 w-full bg-[linear-gradient(135deg,#1c2740_0%,#0d1728_100%)]" />
            <div className="px-4 py-3">
              <div className="text-sm font-semibold text-white">
                {card.title}
              </div>
              <div className="mt-1 text-xs text-slate-400">{card.value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <>
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-white">
                {ui.activeChallenges}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("challenges")}
                className="text-[11px] font-semibold text-blue-300"
              >
                {ui.seeAll}
              </button>
            </div>

            {renderChallengeList(
              normalized.activeChallenges.slice(0, 3),
              ui.noChallenges
            )}
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-white">
                {ui.recentActivities}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("achievements")}
                className="text-[11px] font-semibold text-blue-300"
              >
                {ui.seeAll}
              </button>
            </div>

            <div className="space-y-3">
              {normalized.recentActivities.map((activity, index) => (
                <div
                  key={`${activity.title}-${index}`}
                  className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {initials(normalized.username)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-white">
                        {activity.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      );
    }

    if (activeTab === "challenges") {
      return (
        <section className="mt-6">
          <div className="mb-3 text-sm font-bold text-white">
            {ui.allChallenges}
          </div>
          {renderChallengeList(normalized.challenges, ui.noChallenges)}
        </section>
      );
    }

    if (activeTab === "achievements") {
      return (
        <section className="mt-6">
          <div className="mb-3 text-sm font-bold text-white">
            {ui.submissions}
          </div>
          {renderSubmissionList(normalized.submissions, ui.noAchievements)}
        </section>
      );
    }

    return (
      <section className="mt-6">
        <div className="mb-3 text-sm font-bold text-white">
          {ui.successesTitle}
        </div>

        <div className="space-y-6">
          {renderStatCards(normalized.statCards, ui.noSuccesses)}

          {normalized.completedOrSuccessfulChallenges.length > 0 ? (
            <div>
              <div className="mb-3 text-sm font-bold text-white">
                {locale === "de"
                  ? "Abgeschlossene Challenges"
                  : "Completed Challenges"}
              </div>
              {renderChallengeList(
                normalized.completedOrSuccessfulChallenges,
                ui.noSuccesses
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="px-4 pb-8 pt-4">
        <div className="mb-4 text-center text-[11px] font-medium tracking-wide text-slate-500">
          {normalized.reputationLabel}
        </div>

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

        <section className="mt-5">
          <div className="flex items-start gap-4">
            <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[26px] border border-white/10 bg-white/10">
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

              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#07101f] bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
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
        </section>

        <section className="mt-5 grid grid-cols-4 gap-2">
          {[
            { value: normalized.createdChallenges, label: ui.challengesStat },
            { value: normalized.wonChallenges, label: ui.winsStat },
            { value: normalized.voteScoreTotal, label: ui.votesStat },
            { value: normalized.supportCount, label: ui.earnedStat },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-white/10 bg-white/[0.03] px-3 py-4 text-center"
            >
              <div className="text-2xl font-extrabold tracking-tight text-white">
                {item.value}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {item.label}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
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
        </section>

        {isOwnProfile ? (
          <section className="mt-5">
            <Link
              href="/challenges/me"
              className="inline-flex w-full items-center justify-center rounded-[18px] border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/15"
            >
              {ui.myChallenges}
            </Link>
          </section>
        ) : null}

        <section className="mt-6">
          <div className="mb-3 text-sm font-bold text-white">
            {ui.highlights}
          </div>

          {normalized.statCards.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {normalized.statCards.map((card, i) => (
                <button
                  key={`${card.title}-${i}`}
                  type="button"
                  onClick={() => setActiveTab("successes")}
                  className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] text-left transition hover:bg-white/[0.05]"
                >
                  <div className="aspect-[0.95] w-full bg-[linear-gradient(135deg,#1c2740_0%,#0d1728_100%)]" />
                  <div className="px-2 py-2.5">
                    <div className="line-clamp-1 text-[10px] font-semibold text-white">
                      {card.title}
                    </div>
                    <div className="mt-0.5 text-[9px] text-slate-400">
                      {card.value}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
              {ui.noHighlights}
            </div>
          )}
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-5 overflow-x-auto border-b border-white/10 pb-3 text-[12px]">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "shrink-0 border-b-2 pb-2 font-semibold transition",
                activeTab === "overview"
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-slate-400 hover:text-white"
              )}
            >
              {ui.overview}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("challenges")}
              className={cn(
                "shrink-0 border-b-2 pb-2 font-semibold transition",
                activeTab === "challenges"
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-slate-400 hover:text-white"
              )}
            >
              {ui.challenges}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("achievements")}
              className={cn(
                "shrink-0 border-b-2 pb-2 font-semibold transition",
                activeTab === "achievements"
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-slate-400 hover:text-white"
              )}
            >
              {ui.achievements}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("successes")}
              className={cn(
                "shrink-0 border-b-2 pb-2 font-semibold transition",
                activeTab === "successes"
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-slate-400 hover:text-white"
              )}
            >
              {ui.successes}
            </button>
          </div>
        </section>

        {renderTabContent()}
      </div>
    </div>
  );
}
