"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import NotificationsBell from "@/components/NotificationsBell";

type ChallengeLocale = "de" | "en" | "es" | "fr";
type TranslationMap = Partial<Record<ChallengeLocale, string>>;

type FilterKey = "all" | "funding" | "active" | "voting" | "completed" | "live";
type ScopeFilter = "all" | "new" | "popular";
type SortKey =
  | "newest"
  | "title_asc"
  | "progress_desc"
  | "remaining_asc"
  | "status";

type FundUser = {
  id: string;
};

type Fund = {
  id: string;
  amount: number;
  createdAt?: string;
  user?: FundUser;
};

type ChallengeUserRef = {
  id: string;
  username?: string;
  avatarUrl?: string | null;
};

type WinnerUser = {
  id?: string;
  username?: string;
  avatarUrl?: string | null;
};

type ChallengeResultType = "passed" | "failed" | "pending" | string;

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  originalLanguage?: string | null;
  titleTranslations?: TranslationMap | null;
  descriptionTranslations?: TranslationMap | null;
  minAmount: number | null;
  currentAmount: number | null;
  status: "funding" | "active" | "completed" | "voting" | string;
  result?: ChallengeResultType | null;
  createdAt?: string;
  endsAt?: string | null;
  votingEndsAt?: string | null;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  previewImageUrl?: string | null;
  leaderThumbnailUrl?: string | null;
  leaderPlaybackId?: string | null;
  winnerPlaybackId?: string | null;
  owner?: ChallengeUserRef | null;
  Owner?: ChallengeUserRef | null;
  creator?: ChallengeUserRef | null;
  funds?: Fund[];
  supporterCount?: number | null;
  fundCount?: number | null;
  participantCount?: number | null;
  winnerUsername?: string | null;
  winnerName?: string | null;
  winner?: WinnerUser | null;
  winnerUser?: WinnerUser | null;
};

type Counts = {
  all: number;
  funding: number;
  active: number;
  voting: number;
  completed: number;
  live: number;
};

type Props = {
  locale: ChallengeLocale;
  items: Challenge[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string;
  page: number;
  counts: Counts;
  scopeFilter: ScopeFilter;
  setScopeFilter: (value: ScopeFilter) => void;
  filter: FilterKey;
  setFilter: (value: FilterKey) => void;
  searchInput: string;
  setSearchInput: (value: string) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  onRefresh: () => void | Promise<void>;
  onLoadMore: () => void | Promise<void>;
};

type MobileOverviewUi = {
  title: string;
  global: string;
  allScope: string;
  newScope: string;
  popularScope: string;
  all: string;
  funding: string;
  active: string;
  voting: string;
  completed: string;
  live: string;
  noDescription: string;
  noResults: string;
  noResultsText: string;
  retry: string;
  loadMore: string;
  loadingMore: string;
  allShown: string;
  current: string;
  targetPot: string;
  currentPot: string;
  participants: string;
  supporters: string;
  deadline: string;
  endsIn: string;
  endedWithoutWinner: string;
  completedDone: string;
};

const MOBILE_UI: Record<ChallengeLocale, MobileOverviewUi> = {
  de: {
    title: "Challenges",
    global: "Global",
    allScope: "Alle",
    newScope: "Neu",
    popularScope: "Beliebt",
    all: "Alle",
    funding: "Funding",
    active: "Aktiv",
    voting: "Voting",
    completed: "Beendet",
    live: "Live",
    noDescription: "Keine Beschreibung vorhanden.",
    noResults: "Keine passenden Challenges",
    noResultsText: "Aktuell wurden keine passenden Challenges gefunden.",
    retry: "Erneut laden",
    loadMore: "Mehr laden",
    loadingMore: "Lädt…",
    allShown: "Alle geladenen Challenges angezeigt.",
    current: "€",
    targetPot: "Zielpot",
    currentPot: "Aktueller Pot",
    participants: "Teilnehmer",
    supporters: "Unterstützer",
    deadline: "Endet",
    endsIn: "Endet in",
    endedWithoutWinner: "Ohne Gewinner",
    completedDone: "Beendet",
  },
  en: {
    title: "Challenges",
    global: "Global",
    allScope: "All",
    newScope: "New",
    popularScope: "Popular",
    all: "All",
    funding: "Funding",
    active: "Active",
    voting: "Voting",
    completed: "Ended",
    live: "Live",
    noDescription: "No description available.",
    noResults: "No matching challenges",
    noResultsText: "There are currently no matching challenges.",
    retry: "Retry",
    loadMore: "Load more",
    loadingMore: "Loading…",
    allShown: "All loaded challenges are shown.",
    current: "€",
    targetPot: "Target Pot",
    currentPot: "Current Pot",
    participants: "Participants",
    supporters: "Supporters",
    deadline: "Ends",
    endsIn: "Ends in",
    endedWithoutWinner: "No winner",
    completedDone: "Ended",
  },
  es: {
    title: "Challenges",
    global: "Global",
    allScope: "Todos",
    newScope: "Nuevo",
    popularScope: "Populares",
    all: "Todos",
    funding: "Funding",
    active: "Activo",
    voting: "Votación",
    completed: "Finalizado",
    live: "Live",
    noDescription: "No hay descripción disponible.",
    noResults: "No hay retos coincidentes",
    noResultsText: "Actualmente no hay retos coincidentes.",
    retry: "Reintentar",
    loadMore: "Cargar más",
    loadingMore: "Cargando…",
    allShown: "Se muestran todos los retos cargados.",
    current: "€",
    targetPot: "Bote objetivo",
    currentPot: "Bote actual",
    participants: "Participantes",
    supporters: "Apoyos",
    deadline: "Termina",
    endsIn: "Termina en",
    endedWithoutWinner: "Sin ganador",
    completedDone: "Finalizado",
  },
  fr: {
    title: "Challenges",
    global: "Global",
    allScope: "Tous",
    newScope: "Nouveau",
    popularScope: "Populaire",
    all: "Tous",
    funding: "Funding",
    active: "Actif",
    voting: "Vote",
    completed: "Terminé",
    live: "Live",
    noDescription: "Aucune description disponible.",
    noResults: "Aucun défi correspondant",
    noResultsText: "Aucun défi correspondant pour le moment.",
    retry: "Réessayer",
    loadMore: "Charger plus",
    loadingMore: "Chargement…",
    allShown: "Tous les défis chargés sont affichés.",
    current: "€",
    targetPot: "Pot cible",
    currentPot: "Pot actuel",
    participants: "Participants",
    supporters: "Soutiens",
    deadline: "Se termine",
    endsIn: "Se termine dans",
    endedWithoutWinner: "Sans gagnant",
    completedDone: "Terminé",
  },
};

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
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} €`;
  }
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

function resolveThumbnailUrl(url: string | null | undefined): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;

  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  if (v.startsWith("/")) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "")
      .trim()
      .replace(/\/+$/, "");
    if (!apiBase) return v;
    return `${apiBase}${v}`;
  }

  return v;
}

function extractMuxPlaybackId(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  // Handle .m3u8 stream URLs
  if (raw.startsWith("https://stream.mux.com/")) {
    return raw
      .replace("https://stream.mux.com/", "")
      .replace(".m3u8", "")
      .trim();
  }

  if (raw.startsWith("http://stream.mux.com/")) {
    return raw
      .replace("http://stream.mux.com/", "")
      .replace(".m3u8", "")
      .trim();
  }

  // Handle .m3u8 in paths
  if (raw.includes(".m3u8")) {
    const last = raw.split("/").pop() ?? "";
    return last.replace(".m3u8", "").trim() || null;
  }

  // Reject full URLs
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/")
  ) {
    return null;
  }

  // Return bare ID
  return raw;
}

function resolveChallengePreviewImage(challenge: Challenge): string | null {
  const directThumb = resolveThumbnailUrl(
    challenge.thumbnailUrl ?? challenge.thumbnail_url ?? null
  );
  if (directThumb) return directThumb;

  const directPreview = resolveThumbnailUrl(
    challenge.previewImageUrl ?? challenge.leaderThumbnailUrl ?? null
  );
  if (directPreview) return directPreview;

  const rawPlayback =
    challenge.winnerPlaybackId ??
    challenge.leaderPlaybackId ??
    null;

  const muxPlaybackId = extractMuxPlaybackId(rawPlayback);

  if (muxPlaybackId) {
    return `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?time=1&width=640&fit_mode=preserve`;
  }

  return null;
}

function resolveUploadedVideoFallbackUrl(challenge: Challenge): string | null {
  const raw = String(
    challenge.winnerPlaybackId ?? challenge.leaderPlaybackId ?? ""
  ).trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const looksLikeUploadedVideo =
    lower.includes("/uploads/") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".ogv");

  if (!looksLikeUploadedVideo) return null;
  return resolveThumbnailUrl(raw);
}

function challengeHasOnlineVideo(challenge: Challenge): boolean {
  return [
    challenge.previewImageUrl,
    challenge.leaderThumbnailUrl,
    challenge.leaderPlaybackId,
    challenge.winnerPlaybackId,
  ].some((value) => String(value ?? "").trim().length > 0);
}

function getSupporterCount(challenge: Challenge): number {
  if (
    typeof challenge.supporterCount === "number" &&
    Number.isFinite(challenge.supporterCount)
  ) {
    return Math.max(0, Math.floor(challenge.supporterCount));
  }

  if (Array.isArray(challenge.funds)) {
    return new Set(
      challenge.funds.map((f) => f.user?.id).filter(Boolean) as string[]
    ).size;
  }

  return 0;
}

function getParticipantCount(challenge: Challenge): number {
  if (
    typeof challenge.participantCount === "number" &&
    Number.isFinite(challenge.participantCount)
  ) {
    return Math.max(0, Math.floor(challenge.participantCount));
  }

  if (
    typeof challenge.fundCount === "number" &&
    Number.isFinite(challenge.fundCount)
  ) {
    return Math.max(0, Math.floor(challenge.fundCount));
  }

  return getSupporterCount(challenge);
}

function getStatusLabel(
  challenge: Challenge,
  locale: ChallengeLocale,
  ui: MobileOverviewUi
) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();

  if (status === "funding") return ui.funding;
  if (status === "active") return ui.active;
  if (status === "live") return ui.live;
  if (status === "voting") return ui.voting;
  if (status === "completed" && result === "failed") return ui.endedWithoutWinner;
  if (status === "completed") return ui.completedDone;
  return challenge.status;
}

function getStatusClasses(challenge: Challenge) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();

  if (status === "funding") {
    return "border-[#2A62F6]/34 bg-[#123A86]/34 text-[#8CB2FB]";
  }
  if (status === "active") {
    return "border-[#2D79FF]/24 bg-[#173A73]/34 text-[#A5C4FF]";
  }
  if (status === "live") {
    return "border-[#2B73FF]/30 bg-[#17458F]/34 text-[#9EC5FF]";
  }
  if (status === "voting") {
    return "border-[#4A67CD]/28 bg-[#2A396A]/34 text-[#A7B5E4]";
  }
  if (status === "completed" && result === "failed") {
    return "border-[#8A5151]/28 bg-[#3B2424]/36 text-[#D4A2A2]";
  }
  if (status === "completed") {
    return "border-[#2E8175]/28 bg-[#1E3F3A]/34 text-[#90C9BF]";
  }

  return "border-white/10 bg-white/[0.05] text-[#9FA8B6]";
}

function tabClass(active: boolean) {
  return active
    ? "inline-flex h-[30px] items-center rounded-[10px] border border-[#2E67FF]/42 bg-[linear-gradient(180deg,#2C72FF_0%,#1E5BFF_100%)] px-3 text-[10px] font-semibold text-white shadow-[0_8px_16px_rgba(30,91,255,0.22)]"
    : "inline-flex h-[30px] items-center rounded-[10px] border border-transparent bg-transparent px-3 text-[10px] font-medium text-[#8290A4]";
}

function scopeClass(active: boolean) {
  return active
    ? "inline-flex h-[24px] items-center rounded-full border border-white/10 bg-white/[0.06] px-3 text-[9px] font-medium text-[#D8E3F4]"
    : "inline-flex h-[24px] items-center rounded-full border border-white/8 bg-white/[0.025] px-3 text-[9px] font-medium text-[#7F8EA3]";
}

function HeaderMenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
      <circle cx="6" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export default function MobileChallengesOverview({
  locale,
  items,
  loading,
  loadingMore,
  hasMore,
  error,
  scopeFilter,
  setScopeFilter,
  filter,
  setFilter,
  onRefresh,
  onLoadMore,
}: Props) {
  const ui = MOBILE_UI[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px] bg-[radial-gradient(circle_at_50%_-14%,rgba(20,72,156,0.11),transparent_42%),linear-gradient(180deg,#050A12_0%,#050B14_100%)] px-4 pb-30 pt-[calc(env(safe-area-inset-top)+8px)] text-white">
      <div className="mb-3.5 flex items-start justify-between px-0.5">
        <div>
          <div className="text-[18px] font-semibold leading-none tracking-[-0.015em] text-[#F5F8FF]">
            {ui.title}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/7 bg-white/[0.025] px-2 py-[2px] text-[8.5px] font-medium tracking-[0.01em] text-[#708096]">
            <span>{ui.global}</span>
            <span className="rounded-full bg-white/[0.08] px-1.5 py-[1px] text-[7.5px] text-[#9DAAC0]">
              {items.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <NotificationsBell buttonClassName="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/6 bg-white/[0.03] text-[#A6B1C2]" />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white/6 bg-white/[0.03] text-[#A6B1C2]"
              aria-label="Menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <HeaderMenuIcon />
            </button>

            {menuOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[#0B1422] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
                role="menu"
                aria-label="Quick menu"
              >
                <Link
                  href="/einstellungen"
                  className="block rounded-xl px-3 py-2 text-[12px] font-medium text-[#D4DEED] transition hover:bg-white/[0.06]"
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

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setScopeFilter("all")} className={scopeClass(scopeFilter === "all")}>
          {ui.allScope}
        </button>
        <button type="button" onClick={() => setScopeFilter("new")} className={scopeClass(scopeFilter === "new")}>
          {ui.newScope}
        </button>
        <button type="button" onClick={() => setScopeFilter("popular")} className={scopeClass(scopeFilter === "popular")}>
          {ui.popularScope}
        </button>
      </div>

      <div className="mb-3.5 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setFilter("active")} className={tabClass(filter === "active")}>
          {ui.active}
        </button>
        <button type="button" onClick={() => setFilter("funding")} className={tabClass(filter === "funding")}>
          {ui.funding}
        </button>
        <button type="button" onClick={() => setFilter("voting")} className={tabClass(filter === "voting")}>
          {ui.voting}
        </button>
        <button type="button" onClick={() => setFilter("completed")} className={tabClass(filter === "completed")}>
          {ui.completed}
        </button>
        <button type="button" onClick={() => setFilter("live")} className={tabClass(filter === "live")}>
          {ui.live}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[120px] gap-3 rounded-[18px] border border-white/5 bg-[#0A111B] p-3 animate-pulse"
            >
              <div className="h-[92px] w-[92px] rounded-[12px] bg-white/10" />
              <div className="flex-1">
                <div className="h-3.5 w-2/3 rounded bg-white/10" />
                <div className="mt-2.5 h-2.5 w-1/2 rounded bg-white/10" />
                <div className="mt-5 h-2.5 w-full rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[16px] border border-red-400/20 bg-red-500/10 p-4">
          <div className="text-sm font-semibold text-red-200">{error}</div>
          <button
            type="button"
            onClick={() => onRefresh()}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-bold text-slate-900"
          >
            {ui.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[18px] border border-white/7 bg-[#0A111B] p-5 text-center">
          <div className="text-base font-bold text-white">{ui.noResults}</div>
          <div className="mt-1.5 text-xs leading-5 text-slate-400">{ui.noResultsText}</div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((challenge, index) => {
              const title = getLocalizedChallengeText(
                challenge.title,
                challenge.titleTranslations,
                locale
              );

              const description = getLocalizedChallengeText(
                challenge.description,
                challenge.descriptionTranslations,
                locale
              );

              const thumbnailSrc = resolveChallengePreviewImage(challenge);
              const uploadedVideoFallbackUrl = resolveUploadedVideoFallbackUrl(challenge);

              const participantCount = getParticipantCount(challenge);
              const supporterCount = getSupporterCount(challenge);
              const current = Number(challenge.currentAmount ?? 0);
              const target = Number(challenge.minAmount ?? 0);
              const hasOnlineVideo = challengeHasOnlineVideo(challenge);

              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.12) }}
                    className="relative flex min-h-[120px] gap-3 rounded-[18px] border border-white/4 bg-[#08111C] p-3 shadow-[0_10px_22px_rgba(0,0,0,0.28)]"
                  >
                    <div className="relative h-[92px] w-[92px] flex-shrink-0 overflow-hidden rounded-[12px] bg-[#101A26]">
                      {thumbnailSrc ? (
                        <>
                          <img
                            src={thumbnailSrc}
                            alt={title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-transparent" />
                        </>
                      ) : uploadedVideoFallbackUrl ? (
                        <>
                          <video
                            src={uploadedVideoFallbackUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                            onLoadedData={(e) => {
                              const video = e.currentTarget;
                              if (video.currentTime > 0) return;
                              try {
                                video.currentTime = 0.1;
                              } catch {}
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="relative h-full w-full bg-[radial-gradient(circle_at_18%_14%,rgba(86,164,255,0.24),transparent_40%),linear-gradient(180deg,#162739_0%,#0B1624_100%)]">
                          <div className="absolute left-2 top-2 h-1.5 w-7 rounded-full bg-white/12" />
                          <div className="absolute left-2 top-5 h-1.5 w-4 rounded-full bg-white/9" />
                          <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full bg-white/11" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border border-white/12 bg-black/25 text-white/75">
                              <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">
                                <path d="M3 2.2L7.2 5 3 7.8V2.2z" fill="currentColor" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-1.5 rounded bg-black/62 px-1.5 py-[2px] text-[6.5px] font-semibold tracking-[0.03em] text-white/95">
                        00:00
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pr-0.5 pt-1">
                      <div className="mb-[2px] flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-[13px] font-semibold leading-[1.16] tracking-[-0.01em] text-[#F4F7FF]">
                          {title}
                        </h3>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {hasOnlineVideo ? (
                            <span className="inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-[2px] text-[6.5px] font-semibold uppercase tracking-[0.06em] text-emerald-200">
                              {locale === "en"
                                ? "Video online"
                                : locale === "es"
                                  ? "Video online"
                                  : locale === "fr"
                                    ? "Video en ligne"
                                    : "Video online"}
                            </span>
                          ) : null}

                          <span
                            className={`inline-flex rounded-full border px-2 py-[2px] text-[6.5px] font-semibold uppercase tracking-[0.06em] ${getStatusClasses(
                              challenge
                            )}`}
                          >
                            {getStatusLabel(challenge, locale, ui)}
                          </span>
                        </div>
                      </div>

                      <p className="line-clamp-1 text-[9.5px] text-[#8C97A7]">
                        {description || ui.noDescription}
                      </p>

                      <div className="h-2.5" />

                      <div className="flex items-center justify-between text-[8.5px]">
                        <div className="flex items-center gap-1 text-[#8FA0B8]">
                          <span className="font-bold text-[#F4F8FF]">{formatMoneyEUR(target, locale)}</span>
                          <span>{ui.targetPot}</span>
                        </div>
                        <div className="text-right text-[#9AA9BC]">
                          {participantCount} {ui.participants}
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[8.5px]">
                        <div className="flex items-center gap-1 text-[#8FA0B8]">
                          <span className="font-bold text-[#F4F8FF]">{formatMoneyEUR(current, locale)}</span>
                          <span>{ui.currentPot}</span>
                        </div>
                        <div className="text-right text-[#9AA9BC]">
                          {supporterCount} {ui.supporters}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            {hasMore ? (
              <button
                type="button"
                onClick={() => onLoadMore()}
                disabled={loadingMore}
                className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-xs font-bold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
              >
                {loadingMore ? ui.loadingMore : ui.loadMore}
              </button>
            ) : (
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[11px] font-medium text-slate-400">
                {ui.allShown}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        html,
        body {
          background: #050a12;
        }

        @media (max-width: 767px) {
          footer {
            display: none !important;
          }
        }
      `}</style>

      <div className="h-24" />
      <MobileBottomNav pathname="/challenges" locale={locale} />
    </div>
  );
}