"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import NotificationsBell from "@/components/NotificationsBell";

type ChallengeLocale = "de" | "en" | "es" | "fr";
type LeaderboardType = "creators" | "challenges" | "supporters";
type Tab = "total" | "wins" | "votes";

type CreatorRow = {
  username: string;
  created: number;
  completed: number;
};

type ChallengeRow = {
  id: string;
  title: string;
  creator: string;
  score: number;
  upVotes: number;
  downVotes: number;
};

type SupporterRow = {
  username: string;
  supportCount: number;
  supportedChallenges: number;
};

type RankEntry = {
  id: string;
  name: string;
  subtitle: string;
  points: number;
  delta: number;
  accent: string;
  avatarText: string;
};

type LeaderboardApiRow = CreatorRow | ChallengeRow | SupporterRow;

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

function initials(value: string) {
  const clean = (value || "").trim();
  if (!clean) return "?";
  return clean.slice(0, 2).toUpperCase();
}

function getIntlLocale(locale: ChallengeLocale) {
  if (locale === "de") return "de-DE";
  if (locale === "es") return "es-ES";
  if (locale === "fr") return "fr-FR";
  return "en-GB";
}

function getWinsMetricLabel(locale: ChallengeLocale) {
  if (locale === "es") return "victorias";
  if (locale === "fr") return "victoires";
  if (locale === "en") return "wins";
  return "Siege";
}

function getUpvotesMetricLabel(locale: ChallengeLocale) {
  if (locale === "es") return "upvotes";
  if (locale === "fr") return "upvotes";
  if (locale === "en") return "upvotes";
  return "Upvotes";
}

function formatCompact(value: number, locale: ChallengeLocale) {
  try {
    return new Intl.NumberFormat(
      getIntlLocale(locale),
      {
        notation: "compact",
        maximumFractionDigits: 1,
      }
    ).format(value);
  } catch {
    return String(value);
  }
}

function formatPrimaryMetric(value: number, locale: ChallengeLocale, tab: Tab) {
  if (tab === "wins") {
    const wins = Math.max(0, Math.round(Number(value) || 0));
    const formatted = new Intl.NumberFormat(getIntlLocale(locale)).format(wins);
    return `${formatted} ${getWinsMetricLabel(locale)}`;
  }

  if (tab === "votes") {
    const upvotes = Math.max(0, Math.round(Number(value) || 0));
    const formatted = new Intl.NumberFormat(getIntlLocale(locale)).format(upvotes);
    return `${formatted} ${getUpvotesMetricLabel(locale)}`;
  }

  return `${formatCompact(value, locale)} XP`;
}

function getLeaderboardType(tab: Tab): LeaderboardType {
  if (tab === "votes") return "challenges";
  return "creators";
}

async function fetchLeaderboard(type: LeaderboardType, limit = 20) {
  const res = await apiFetch(
    `/leaderboard?type=${type}&limit=${limit}`,
    { method: "GET" },
    false
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Leaderboard failed (${res.status})`);
  }

  return res.json();
}

function getUi(locale: ChallengeLocale) {
  if (locale === "en") {
    return {
      title: "Leaderboard",
      total: "Overall",
      wins: "Wins",
      votes: "Votes",
      invites: "Invites",
      live: "Live",
      loading: "Loading leaderboard…",
      error: "Failed to load leaderboard",
      empty: "No leaderboard data yet.",
      yourRank: "Your rank",
      rank: "Rank",
      points: "pts",
      updated: "Updated",
      back: "Back",
    };
  }

  if (locale === "es") {
    return {
      title: "Leaderboard",
      total: "Total",
      wins: "Victorias",
      votes: "Votos",
      invites: "Invitar",
      live: "Live",
      loading: "Cargando leaderboard…",
      error: "Error al cargar el leaderboard",
      empty: "Todavía no hay datos del leaderboard.",
      yourRank: "Tu rango",
      rank: "Puesto",
      points: "pts",
      updated: "Actualizado",
      back: "Atrás",
    };
  }

  if (locale === "fr") {
    return {
      title: "Leaderboard",
      total: "Global",
      wins: "Victoires",
      votes: "Votes",
      invites: "Inviter",
      live: "Live",
      loading: "Chargement du leaderboard…",
      error: "Erreur lors du chargement du leaderboard",
      empty: "Pas encore de données de leaderboard.",
      yourRank: "Ton rang",
      rank: "Place",
      points: "pts",
      updated: "Mis à jour",
      back: "Retour",
    };
  }

  return {
    title: "Leaderboard",
    total: "Gesamt",
    wins: "Siege",
    votes: "Votes",
    invites: "Einladen",
    live: "Live",
    loading: "Lade Leaderboard…",
    error: "Fehler beim Laden des Leaderboards",
    empty: "Noch keine Leaderboard-Daten.",
    yourRank: "Dein Rang",
    rank: "Platz",
    points: "pts",
    updated: "Aktualisiert",
    back: "Zurück",
  };
}

function mapRowsToEntries(
  tab: Tab,
  rows: Array<CreatorRow | ChallengeRow | SupporterRow>,
  locale: ChallengeLocale
): RankEntry[] {
  if (tab === "total" || tab === "wins") {
    const winsLabel =
      locale === "de"
        ? "Siege"
        : locale === "es"
          ? "victorias"
          : locale === "fr"
            ? "victoires"
            : "wins";

    return (rows as CreatorRow[])
      .map((row, index) => {
        const username = String(row.username || "").trim();
        if (!username) return null;

        const completed = Number(row.completed || 0);
        const created = Number(row.created || 0);

        return {
          id: `creator-${username}-${index}`,
          name: username,
          subtitle:
            tab === "wins"
              ? `${completed} ${winsLabel}`
              : `${created} erstellt`,
          points: tab === "wins" ? completed : completed * 100 + created * 10,
          delta: completed,
          accent: "from-sky-400/25 to-blue-500/10",
          avatarText: initials(username),
        } as RankEntry;
      })
      .filter((entry): entry is RankEntry => entry !== null);
  }

  if (tab === "votes") {
    const byUser = new Map<
      string,
      { upVotes: number; downVotes: number; challengeCount: number }
    >();

    for (const row of rows as ChallengeRow[]) {
      const username = String(row.creator || "").trim();
      if (!username) continue;

      const current = byUser.get(username) ?? {
        upVotes: 0,
        downVotes: 0,
        challengeCount: 0,
      };

      current.upVotes += Number(row.upVotes || 0);
      current.downVotes += Number(row.downVotes || 0);
      current.challengeCount += 1;
      byUser.set(username, current);
    }

    return [...byUser.entries()]
      .sort((a, b) => b[1].upVotes - a[1].upVotes)
      .map(([username, value], index) => ({
        id: `votes-${username}-${index}`,
        name: username,
        subtitle:
          locale === "de"
            ? `${value.challengeCount} Challenges bewertet`
            : `${value.challengeCount} rated challenges`,
        points: value.upVotes,
        delta: value.upVotes - value.downVotes,
        accent: "from-amber-300/20 to-orange-500/10",
        avatarText: initials(username),
      }));
  }

  return [];
}

function TopPodiumCard({
  entry,
  place,
  center = false,
  locale,
  tab,
}: {
  entry: RankEntry;
  place: number;
  center?: boolean;
  locale: ChallengeLocale;
  tab: Tab;
}) {
  const badge = place === 1 ? "👑" : place === 2 ? "🥈" : "🥉";
  const avatarSize = center ? "h-[82px] w-[82px] text-[1.85rem]" : "h-[64px] w-[64px] text-xl";
  const nameSize = center ? "text-sm" : "text-[12px]";
  const pointsSize = center ? "text-[13px]" : "text-[12px]";

  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center text-center ${center ? "-mt-2" : "mt-4"}`}>
      <div className="mb-1.5 text-base leading-none">{badge}</div>
      <div className="flex flex-col items-center text-center">
        <div
          className={`relative flex ${avatarSize} items-center justify-center rounded-full border border-[#2b71cf] bg-[radial-gradient(circle_at_30%_20%,#163f66_0%,#0e2745_70%,#0b1f35_100%)] font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
        >
          {entry.avatarText}
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#061127] bg-[#2f80ff] text-[11px] font-black text-white">
            {place}
          </div>
        </div>

        <div className={`mt-2.5 w-full truncate font-bold text-white ${nameSize}`}>{entry.name}</div>
        <div className={`mt-0.5 font-extrabold text-white ${pointsSize}`}>
          {formatPrimaryMetric(entry.points, locale, tab)}
        </div>
      </div>
    </div>
  );
}

function ListRow({
  entry,
  rank,
  locale,
  tab,
}: {
  entry: RankEntry;
  rank: number;
  locale: ChallengeLocale;
  tab: Tab;
}) {
  const positive = entry.delta >= 0;

  return (
    <div className="grid grid-cols-[24px_30px_minmax(0,1fr)_74px_32px] items-center gap-2 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] px-2.5 py-2.5">
      <div className="text-center text-[12px] font-bold text-slate-400">{rank}</div>

      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#2b71cf] bg-gradient-to-br ${entry.accent} text-[10px] font-extrabold text-white`}
      >
        {entry.avatarText}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-slate-100">{entry.name}</div>
      </div>

      <div className="text-right">
        <div className="text-[12px] font-bold text-slate-200">
          {formatPrimaryMetric(entry.points, locale, tab)}
        </div>
      </div>

      <div
        className={`text-right text-[12px] font-bold ${
          positive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {positive ? `+${entry.delta}` : entry.delta}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => getUi(locale), [locale]);

  const [tab, setTab] = useState<Tab>("total");
  const [items, setItems] = useState<LeaderboardApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");

    fetchLeaderboard(getLeaderboardType(tab), 20)
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "";
        setError(message || ui.error);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab, ui.error]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      refresh();
    }, 0);

    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const entries = useMemo(() => mapRowsToEntries(tab, items, locale), [tab, items, locale]);
  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const list = useMemo(() => entries.slice(3), [entries]);

  const currentUsername =
    typeof window !== "undefined"
      ? window.localStorage.getItem("dp_username") || ""
      : "";

  const currentRank = useMemo(() => {
    if (!entries.length || !currentUsername) return null;
    const idx = entries.findIndex(
      (entry) =>
        typeof entry.name === "string" &&
        entry.name.toLowerCase() === currentUsername.toLowerCase()
    );
    return idx >= 0 ? idx + 1 : null;
  }, [entries, currentUsername]);

  const currentEntry = useMemo(() => {
    if (!currentRank) return null;
    return entries[currentRank - 1] ?? null;
  }, [entries, currentRank]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-20%,rgba(50,110,242,0.32),transparent_38%),linear-gradient(180deg,#040b19_0%,#050d1e_58%,#061125_100%)] text-white">
      <div className="mx-auto w-full max-w-[430px] px-2 pb-28 pt-3 md:max-w-[920px] md:px-6 md:pb-10">
        <div className="mx-auto overflow-hidden rounded-[34px] border border-[#193051] bg-[linear-gradient(180deg,#07142b_0%,#061126_58%,#050f21_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
          <div className="border-b border-white/7 px-3 pb-4 pt-4 md:px-6 md:pt-5">
            <div className="relative mb-3 flex items-center justify-end text-slate-300">
              <div className="pointer-events-none absolute inset-x-0 text-center text-[1.03rem] font-extrabold tracking-tight text-white md:text-lg">
                {ui.title}
              </div>

              <div className="relative flex items-center gap-2">
                <NotificationsBell buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06]" />

                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg"
                    aria-label="Menu"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    ⋯
                  </button>

                  {menuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
                      role="menu"
                      aria-label="Quick menu"
                    >
                      <button
                        type="button"
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          refresh();
                        }}
                      >
                        Aktualisieren
                      </button>
                      <Link
                        href="/einstellungen"
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Einstellungen
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[#1c3459] bg-[#07152f] p-1 text-[11px] font-semibold md:max-w-[520px] md:text-xs">
              <button
                type="button"
                onClick={() => setTab("total")}
                className={`rounded-xl px-2 py-2 transition ${
                  tab === "total"
                    ? "bg-[#2f80ff] text-white shadow-[0_8px_20px_rgba(47,128,255,0.45)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ui.total}
              </button>
              <button
                type="button"
                onClick={() => setTab("wins")}
                className={`rounded-xl px-2 py-2 transition ${
                  tab === "wins"
                    ? "bg-[#2f80ff] text-white shadow-[0_8px_20px_rgba(47,128,255,0.45)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ui.wins}
              </button>
              <button
                type="button"
                onClick={() => setTab("votes")}
                className={`rounded-xl px-2 py-2 transition ${
                  tab === "votes"
                    ? "bg-[#2f80ff] text-white shadow-[0_8px_20px_rgba(47,128,255,0.45)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ui.votes}
              </button>
            </div>
          </div>

          <div className="px-3 py-4 md:px-6 md:py-6">
            {loading ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-slate-300">
                {ui.loading}
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-rose-400/25 bg-rose-400/10 p-5 text-rose-200">
                {error}
              </div>
            ) : !entries.length ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-slate-300">
                {ui.empty}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-[26px] border border-[#1f385f] bg-[radial-gradient(circle_at_50%_0%,rgba(36,89,170,0.28),transparent_60%),linear-gradient(180deg,#0a1d3f_0%,#081a36_56%,#07162f_100%)] px-3 pb-4 pt-3 md:px-4">
                  <div className="flex items-end justify-between gap-2">
                    <div className="max-w-[33%] flex-1">
                      {podium[1] ? (
                        <TopPodiumCard entry={podium[1]} place={2} locale={locale} tab={tab} />
                      ) : null}
                    </div>

                    <div className="max-w-[34%] flex-1">
                      {podium[0] ? (
                        <TopPodiumCard entry={podium[0]} place={1} center locale={locale} tab={tab} />
                      ) : null}
                    </div>

                    <div className="max-w-[33%] flex-1">
                      {podium[2] ? (
                        <TopPodiumCard entry={podium[2]} place={3} locale={locale} tab={tab} />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-[22px] border border-[#1d3458] bg-[linear-gradient(180deg,rgba(8,18,37,0.95)_0%,rgba(5,12,26,0.98)_100%)] p-2.5">
                  {list.map((entry, idx) => (
                    <ListRow
                      key={entry.id}
                      entry={entry}
                      rank={idx + 4}
                      locale={locale}
                      tab={tab}
                    />
                  ))}
                </div>

                <div className="rounded-[22px] border border-[#1e365b] bg-[linear-gradient(180deg,rgba(16,33,62,0.9)_0%,rgba(10,21,42,0.96)_100%)] p-3 shadow-[0_14px_32px_rgba(0,0,0,0.28)]">
                  <div className="mb-2 text-[12px] font-semibold text-slate-300">
                    {ui.yourRank}
                  </div>

                  {currentEntry && currentRank ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2b71cf] bg-gradient-to-br from-sky-400/25 to-blue-500/10 text-[10px] font-extrabold text-white">
                          {currentEntry.avatarText}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[12px] font-semibold text-white">
                            {currentEntry.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ui.rank} {currentRank}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[15px] font-extrabold text-white">
                          {formatPrimaryMetric(currentEntry.points, locale, tab)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {currentEntry.subtitle}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] text-slate-300">
                      Kein eigener Rang gefunden.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <MobileBottomNav pathname="/leaderboard" locale={locale} />
      </div>
    </main>
  );
}