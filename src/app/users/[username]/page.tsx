"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

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

type PublicProfileUi = {
  invalidUsername: string;
  profileLoadFailed: string;
  profileTitle: string;
  backToChallenges: string;

  publicProfile: string;
  statsAndChallenges: string;
  overviewText: string;
  challengesShort: string;

  level: string;
  xp: string;
  newHere: string;
  created: string;
  completed: string;
  voteScoreTotal: string;
  supports: string;
  wonChallenges: string;
  title: string;

  challengesTitle: string;
  sortedByVoteScore: string;
  noCreatedChallengesYet: string;
  visible: string;
  createdContent: string;

  noChallengesTitle: string;
  noChallengesText: string;

  createdBadge: string;
  opening: string;
  score: string;
  likes: string;
  dislikes: string;

  currentlyVoting: string;
  currentlyRunning: string;
  finished: string;
  beforeStart: string;

  createdByUser: string;
  open: string;

  loadingOverview: string;
  loadingChallenges: string;
};

const PUBLIC_PROFILE_UI: Record<ChallengeLocale, PublicProfileUi> = {
  de: {
    invalidUsername: "Ungültiger Username.",
    profileLoadFailed: "Profil konnte nicht geladen werden.",
    profileTitle: "Profil",
    backToChallenges: "← Zurück zu Challenges",

    publicProfile: "Öffentliches Profil",
    statsAndChallenges: "Stats & Challenges",
    overviewText:
      "Überblick über Performance, Challenges und Unterstützungen dieses Users.",
    challengesShort: "← Challenges",

    level: "Level",
    xp: "XP gesamt",
    newHere: "Neu dabei",
    created: "Erstellt",
    completed: "Erfüllt",
    voteScoreTotal: "Vote Score gesamt",
    supports: "Supports",
    wonChallenges: "Gewonnene Challenges",
    title: "Titel",

    challengesTitle: "Challenges",
    sortedByVoteScore: "Nach Vote Score sortiert.",
    noCreatedChallengesYet: "Noch keine erstellten Challenges.",
    visible: "Sichtbar",
    createdContent: "Erstellte Inhalte",

    noChallengesTitle: "Noch keine Challenges",
    noChallengesText:
      "Dieser User hat aktuell noch keine Challenges erstellt.",

    createdBadge: "Erstellt",
    opening: "Öffnen →",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",

    currentlyVoting: "Gerade im Voting",
    currentlyRunning: "Läuft aktuell",
    finished: "Abgeschlossen",
    beforeStart: "Noch vor dem Start",

    createdByUser: "Diese Challenge wurde vom User erstellt.",
    open: "Öffnen →",

    loadingOverview: "Lade Profil…",
    loadingChallenges: "Lade Challenges…",
  },

  en: {
    invalidUsername: "Invalid username.",
    profileLoadFailed: "Could not load profile.",
    profileTitle: "Profile",
    backToChallenges: "← Back to challenges",

    publicProfile: "Public profile",
    statsAndChallenges: "Stats & challenges",
    overviewText:
      "Overview of this user's performance, challenges and support activity.",
    challengesShort: "← Challenges",

    level: "Level",
    xp: "Total XP",
    newHere: "New here",
    created: "Created",
    completed: "Completed",
    voteScoreTotal: "Total vote score",
    supports: "Supports",
    wonChallenges: "Won challenges",
    title: "Title",

    challengesTitle: "Challenges",
    sortedByVoteScore: "Sorted by vote score.",
    noCreatedChallengesYet: "No created challenges yet.",
    visible: "Visible",
    createdContent: "Created content",

    noChallengesTitle: "No challenges yet",
    noChallengesText: "This user has not created any challenges yet.",

    createdBadge: "Created",
    opening: "Open →",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",

    currentlyVoting: "Currently in voting",
    currentlyRunning: "Currently running",
    finished: "Completed",
    beforeStart: "Before start",

    createdByUser: "This challenge was created by the user.",
    open: "Open →",

    loadingOverview: "Loading profile…",
    loadingChallenges: "Loading challenges…",
  },

  es: {
    invalidUsername: "Nombre de usuario no válido.",
    profileLoadFailed: "No se pudo cargar el perfil.",
    profileTitle: "Perfil",
    backToChallenges: "← Volver a challenges",

    publicProfile: "Perfil público",
    statsAndChallenges: "Estadísticas y challenges",
    overviewText:
      "Resumen del rendimiento, los challenges y los apoyos de este usuario.",
    challengesShort: "← Challenges",

    level: "Nivel",
    xp: "XP total",
    newHere: "Nuevo aquí",
    created: "Creados",
    completed: "Completados",
    voteScoreTotal: "Vote score total",
    supports: "Supports",
    wonChallenges: "Challenges ganados",
    title: "Título",

    challengesTitle: "Challenges",
    sortedByVoteScore: "Ordenado por vote score.",
    noCreatedChallengesYet: "Todavía no hay challenges creados.",
    visible: "Visibles",
    createdContent: "Contenido creado",

    noChallengesTitle: "Todavía no hay challenges",
    noChallengesText:
      "Este usuario todavía no ha creado ningún challenge.",

    createdBadge: "Creado",
    opening: "Abrir →",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",

    currentlyVoting: "Ahora en voting",
    currentlyRunning: "Actualmente activo",
    finished: "Completado",
    beforeStart: "Antes del inicio",

    createdByUser: "Este challenge fue creado por el usuario.",
    open: "Abrir →",

    loadingOverview: "Cargando perfil…",
    loadingChallenges: "Cargando challenges…",
  },

  fr: {
    invalidUsername: "Nom d’utilisateur invalide.",
    profileLoadFailed: "Impossible de charger le profil.",
    profileTitle: "Profil",
    backToChallenges: "← Retour aux challenges",

    publicProfile: "Profil public",
    statsAndChallenges: "Stats & challenges",
    overviewText:
      "Vue d’ensemble des performances, des challenges et des soutiens de cet utilisateur.",
    challengesShort: "← Challenges",

    level: "Niveau",
    xp: "XP total",
    newHere: "Nouveau ici",
    created: "Créés",
    completed: "Terminés",
    voteScoreTotal: "Vote score total",
    supports: "Supports",
    wonChallenges: "Challenges gagnés",
    title: "Titre",

    challengesTitle: "Challenges",
    sortedByVoteScore: "Trié par vote score.",
    noCreatedChallengesYet: "Aucun challenge créé pour le moment.",
    visible: "Visibles",
    createdContent: "Contenus créés",

    noChallengesTitle: "Pas encore de challenges",
    noChallengesText:
      "Cet utilisateur n’a encore créé aucun challenge.",

    createdBadge: "Créé",
    opening: "Ouvrir →",
    score: "Score",
    likes: "Likes",
    dislikes: "Dislikes",

    currentlyVoting: "Actuellement en voting",
    currentlyRunning: "En cours",
    finished: "Terminé",
    beforeStart: "Avant le début",

    createdByUser: "Ce challenge a été créé par l’utilisateur.",
    open: "Ouvrir →",

    loadingOverview: "Chargement du profil…",
    loadingChallenges: "Chargement des challenges…",
  },
};

type Profile = {
  username: string;
  avatarUrl?: string | null;
  totalXp?: number;
  level?: number;
  levelTitle?: string | null;
  currentLevelXp?: number;
  nextLevel?: number;
  nextLevelXp?: number;
  xpIntoLevel?: number;
  xpNeededForNextLevel?: number;
  remainingToNextLevel?: number;
  progress?: number;
  isMaxLevel?: boolean;

  stats: {
    created: number;
    completed: number;
    completedWins: number;
    voteScoreTotal: number;
    supportCount: number;
    supportedChallenges: number;
  };
  challenges: Array<{
    id: string;
    title: string;
    status: string;
    score: number;
    upVotes: number;
    downVotes: number;
  }>;
};

function isValidUsername(u: string) {
  return /^[A-Za-z0-9_]{3,}$/.test(u);
}

function initials(username: string) {
  const u = (username || "").trim();
  if (!u) return "?";
  return u.slice(0, 2).toUpperCase();
}

function statusLabel(status: string | undefined, locale: ChallengeLocale) {
  if (status === "funding") return "Funding";
  if (status === "active") {
    if (locale === "en") return "Active";
    if (locale === "es") return "Activo";
    if (locale === "fr") return "Actif";
    return "Aktiv";
  }
  if (status === "voting") return "Voting";
  if (status === "completed") {
    if (locale === "en") return "Completed";
    if (locale === "es") return "Completado";
    if (locale === "fr") return "Terminé";
    return "Erfüllt";
  }
  return status ?? "—";
}

function statusClasses(status?: string) {
  if (status === "funding") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "active") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "voting") return "border-purple-200 bg-purple-50 text-purple-800";
  if (status === "completed") return "border-green-200 bg-green-50 text-green-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function n(v: any) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function StatCard({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  accent?: "neutral" | "info" | "success" | "warning";
}) {
  const cls =
    accent === "info"
      ? "border-blue-200 bg-blue-50"
      : accent === "success"
        ? "border-green-200 bg-green-50"
        : accent === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-white/10 bg-white/95";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
        {value}
      </div>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}

function ChallengeRow({
  c,
  locale,
  ui,
}: {
  c: {
    id: string;
    title: string;
    status: string;
    score?: number;
    upVotes?: number;
    downVotes?: number;
  };
  locale: ChallengeLocale;
  ui: PublicProfileUi;
}) {
  const score = n(c.score);
  const upVotes = n(c.upVotes);
  const downVotes = n(c.downVotes);

  const signal =
    c.status === "voting"
      ? { label: ui.currentlyVoting, cls: "border-purple-200 bg-purple-50 text-purple-800" }
      : c.status === "active"
        ? { label: ui.currentlyRunning, cls: "border-blue-200 bg-blue-50 text-blue-800" }
        : c.status === "completed"
          ? { label: ui.finished, cls: "border-green-200 bg-green-50 text-green-800" }
          : { label: ui.beforeStart, cls: "border-amber-200 bg-amber-50 text-amber-800" };

  return (
    <Link
      href={`/challenges/${c.id}`}
      className="group block overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md"
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">
                {ui.createdBadge}
              </span>

              <div
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                  c.status
                )}`}
              >
                {statusLabel(c.status, locale)}
              </div>

              <div
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${signal.cls}`}
              >
                {signal.label}
              </div>
            </div>

            <div className="mt-3 line-clamp-1 text-xl font-extrabold tracking-tight text-slate-950 transition group-hover:text-slate-800">
              {c.title}
            </div>

            <div className="mt-1 text-sm text-slate-600">
              {ui.createdByUser}
            </div>
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition group-hover:border-slate-300 group-hover:text-slate-950">
              {ui.open}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-blue-800">
            {ui.score} {score}
          </div>

          <div className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-green-800">
            {ui.likes} {upVotes}
          </div>

          <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-red-800">
            {ui.dislikes} {downVotes}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const raw = String(params?.username ?? "");
  const username = useMemo(() => raw.trim(), [raw]);

  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(
    () => PUBLIC_PROFILE_UI[activeLocale] ?? PUBLIC_PROFILE_UI.de,
    [activeLocale]
  );

  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    if (!isValidUsername(username)) {
      setLoading(false);
      setData(null);
      setError(ui.invalidUsername);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setError("");
        setLoading(true);

        const res = await apiFetch(
          `/users/${username}/public`,
          { method: "GET" },
          false
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || ui.profileLoadFailed);
        }

        const json = (await res.json()) as Profile;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? ui.profileLoadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, ui]);

  const createdChallengesSorted = useMemo(() => {
    const list = data?.challenges ? [...data.challenges] : [];
    return list.sort((a, b) => n(b.score) - n(a.score));
  }, [data]);

  const totalVisible = createdChallengesSorted.length;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {loading && (
          <div className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white p-6 shadow-2xl">
              <div className="h-8 w-52 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-5 w-72 animate-pulse rounded bg-slate-100" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
                <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white p-6 shadow-2xl">
              <div className="h-7 w-44 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-5 w-56 animate-pulse rounded bg-slate-100" />
              <div className="mt-6 grid gap-4">
                <div className="h-32 animate-pulse rounded-[26px] border border-slate-200 bg-slate-50" />
                <div className="h-32 animate-pulse rounded-[26px] border border-slate-200 bg-slate-50" />
                <div className="h-32 animate-pulse rounded-[26px] border border-slate-200 bg-slate-50" />
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="text-lg font-extrabold text-slate-900">
              {ui.profileTitle}
            </div>
            <div className="mt-2 font-semibold text-red-700">{error}</div>
            <div className="mt-4">
              <Link href="/challenges">
                <PrimaryButton variant="secondary">
                  {ui.backToChallenges}
                </PrimaryButton>
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mb-8 rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-7 shadow-2xl ring-1 ring-white/10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                      {ui.publicProfile}
                    </span>
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                      {ui.statsAndChallenges}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-5">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 text-3xl font-extrabold text-white shadow-lg">
                      {initials(data.username)}
                    </div>

                    <div className="min-w-0">
                      <h1 className="truncate text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        @{data.username}
                      </h1>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-200">
                          {ui.level} {Number(data.level ?? 1)}
                        </span>
                        <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
                          {data.levelTitle ?? ui.newHere}
                        </span>
                        <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">
                          {Number(data.totalXp ?? 0)} XP
                        </span>
                      </div>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                        {ui.overviewText}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Link href="/challenges">
                    <PrimaryButton variant="secondary">
                      {ui.challengesShort}
                    </PrimaryButton>
                  </Link>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={ui.level} value={n(data.level)} accent="info" />
                <StatCard
                  label={ui.title}
                  value={data.levelTitle ?? ui.newHere}
                  accent="neutral"
                />
                <StatCard
                  label={ui.xp}
                  value={n(data.totalXp)}
                  accent="warning"
                />
                <StatCard label={ui.created} value={n(data.stats.created)} accent="info" />
                <StatCard
                  label={ui.completed}
                  value={n(data.stats.completed)}
                  accent="success"
                />
                <StatCard
                  label={ui.voteScoreTotal}
                  value={n(data.stats.voteScoreTotal)}
                  accent="neutral"
                />
                <StatCard label={ui.supports} value={n(data.stats.supportCount)} accent="warning" />
                <StatCard
                  label={ui.wonChallenges}
                  value={n(data.stats.completedWins ?? 0)}
                  accent="success"
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white p-7 shadow-2xl ring-1 ring-black/5">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {ui.challengesTitle}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {createdChallengesSorted.length
                      ? ui.sortedByVoteScore
                      : ui.noCreatedChallengesYet}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                  {ui.visible}: {totalVisible}
                </div>

                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-800">
                  {ui.createdContent}
                </div>
              </div>

              <div className="mt-6">
                {createdChallengesSorted.length === 0 ? (
                  <EmptyHint
                    title={ui.noChallengesTitle}
                    text={ui.noChallengesText}
                  />
                ) : (
                  <div className="grid gap-4">
                    {createdChallengesSorted.map((c) => (
                      <ChallengeRow
                        key={c.id}
                        c={c}
                        locale={activeLocale}
                        ui={ui}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}