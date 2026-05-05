"use client";

export const dynamic = "force-dynamic";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiJson } from "@/lib/api";
import { Toast } from "@/components/Toast";
import MobileChallengesOverview from "@/components/mobile/MobileChallengesOverview";
import PrimaryButton from "@/components/ui/PrimaryButton";

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

type Viewer = {
  id: string;
  username?: string | null;
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
  confirmedPotAmount?: number | null;

  winnerUsername?: string | null;
  winnerName?: string | null;
  winner?: WinnerUser | null;
  winnerUser?: WinnerUser | null;
  isTeamChallenge?: boolean | null;
  mode?: string | null;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asUserRef(value: unknown): ChallengeUserRef | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  if (!id) return null;

  return {
    id,
    username: asString(record.username) ?? undefined,
    avatarUrl: asString(record.avatarUrl) ?? asString(record.avatar_url),
  };
}

function normalizeChallengeFromApi(item: Challenge): Challenge {
  const record = item as Challenge & Record<string, unknown>;

  const normalizedThumbnailUrl =
    item.thumbnailUrl ?? asString(record.thumbnail_url) ?? asString(record.thumbnail);

  const normalizedPreviewImageUrl =
    asString(record.previewImageUrl) ?? asString(record.preview_image_url);

  const normalizedLeaderThumbnailUrl =
    asString(record.leaderThumbnailUrl) ?? asString(record.leader_thumbnail_url);

  const normalizedLeaderPlaybackId =
    asString(record.leaderPlaybackId) ?? asString(record.leader_playback_id);

  const normalizedWinnerPlaybackId =
    item.winnerPlaybackId ??
    asString(record.winnerPlaybackId) ??
    asString(record.winner_playback_id);

  const normalizedEndsAt =
    item.endsAt ?? asString(record.ends_at) ?? asString(record.endAt);

  const normalizedVotingEndsAt =
    item.votingEndsAt ??
    asString(record.voting_ends_at) ??
    asString(record.votingEndAt);

  const normalizedParticipantCount =
    item.participantCount ??
    asFiniteNumber(record.participant_count) ??
    asFiniteNumber(record.participants_count) ??
    asFiniteNumber(record.participants);

  const normalizedOwner =
    item.owner ??
    asUserRef(record.owner) ??
    asUserRef(record.Owner) ??
    asUserRef(record.creator);

  return {
    ...item,
    thumbnailUrl: normalizedThumbnailUrl,
    thumbnail_url: item.thumbnail_url ?? normalizedThumbnailUrl,
    previewImageUrl: normalizedPreviewImageUrl,
    leaderThumbnailUrl: normalizedLeaderThumbnailUrl,
    leaderPlaybackId: normalizedLeaderPlaybackId,
    winnerPlaybackId: normalizedWinnerPlaybackId,
    endsAt: normalizedEndsAt,
    votingEndsAt: normalizedVotingEndsAt,
    participantCount: normalizedParticipantCount,
    confirmedPotAmount:
      item.confirmedPotAmount ??
      asFiniteNumber(record.confirmed_pot_amount) ??
      asFiniteNumber(record.confirmedPotAmount),
    owner: normalizedOwner,
    Owner: item.Owner ?? normalizedOwner,
    creator: item.creator ?? normalizedOwner,
  };
}

type ChallengesResponse = {
  data: Challenge[];
  page?: number;
  hasMore?: boolean;
};

type MeResponse = {
  data?: {
    id: string;
    username?: string | null;
  };
  id?: string;
  username?: string | null;
};

type FilterKey = "all" | "funding" | "active" | "voting" | "completed" | "live";
type ScopeFilter = "all" | "new" | "popular";
type SortKey =
  | "newest"
  | "title_asc"
  | "progress_desc"
  | "remaining_asc"
  | "status";

type ChallengeLocale = "de" | "en" | "es" | "fr";
type TranslationMap = Partial<Record<ChallengeLocale, string>>;

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

function getIntlLocale(locale: ChallengeLocale) {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es-ES";
  if (locale === "fr") return "fr-FR";
  return "de-DE";
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

type OverviewUi = {
  discover: string;
  heroTitle: string;
  heroText: string;
  loaded: string;
  votingDecides: string;
  potGrowsLive: string;
  newChallenge: string;
  refresh: string;

  platformNumbersEyebrow: string;
  platformNumbersTitle: string;
  platformNumbersText: string;

  totalPaidOut: string;
  totalPaidOutHint: string;
  totalChallenges: string;
  totalChallengesHint: string;
  totalUsers: string;
  totalUsersHint: string;
  totalSupports: string;
  totalSupportsHint: string;

  realParticipationTitle: string;
  realParticipationText: string;
  clearCompetitionTitle: string;
  clearCompetitionText: string;
  communityDecidesTitle: string;
  communityDecidesText: string;

  all: string;
  funding: string;
  active: string;
  voting: string;
  completed: string;

  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  sort: string;
  newest: string;
  titleAsc: string;
  progressDesc: string;
  remainingAsc: string;
  statusSort: string;

  loadingError: string;
  noMatchingChallenges: string;
  noMatchingChallengesText: string;
  tryAgain: string;

  currentAmount: string;
  goal: string;
  supporters: string;
  progress: string;
  noGoal: string;
  creatorUnknown: string;
  noDescription: string;
  by: string;
  open: string;

  goalReached: string;
  leftToGoal: string;
  supportersCount: string;

  fromAmount: string;
  enterAmount: string;
  enterMinAmount: string;
  continueToStripe: string;
  checkoutFailed: string;
  paymentSuccessRefresh: string;

  loadMore: string;
  loadingMore: string;
  allShown: string;
  page: string;

  onboardingClose: string;
  onboardingBack: string;
  onboardingLater: string;
  onboardingNext: string;
  onboardingDone: string;

  onboardingCardChallenge: string;
  onboardingCardChallengeText: string;
  onboardingCardParticipation: string;
  onboardingCardParticipationText: string;
  onboardingCardVoting: string;
  onboardingCardVotingText: string;

  createdAt: string;

  statusFunding: string;
  statusActive: string;
  statusVoting: string;
  statusEnded: string;
  statusCompleted: string;

  fundingButton: string;
  activeButton: string;
  votingLocked: string;
  failedLocked: string;
  winnerLocked: string;
  completedLocked: string;
  unavailable: string;

  winnerLabel: string;
  endedWithoutWinner: string;
  challengeCompleted: string;

  hookFundingAlmost: string;
  hookFundingLeft: string;
  hookFundingGeneric: string;
  hookActive: string;
  hookVoting: string;
  hookWinner: string;
  hookFailed: string;
  hookGeneric: string;

  miniFunding: string;
  miniActive: string;
  miniVoting: string;
  miniCompleted: string;
  miniGeneric: string;

  momentumReady: string;
  momentumAlmost: string;
  momentumBuilding: string;
  momentumLive: string;
  momentumVoting: string;
  momentumFinal: string;

  votingLiveBadge: string;
};

const OVERVIEW_UI_TEXT: Record<ChallengeLocale, OverviewUi> = {
  de: {
    discover: "Norek Discover",
    heroTitle: "Challenges mit echtem Einsatz.",
    heroText:
      "Hier treten Nutzer gegeneinander an, die Community votet und der stärkste Beitrag gewinnt. Unterstützungen erhöhen den Pot und machen Challenges spürbar größer.",
    loaded: "Geladen:",
    votingDecides: "Voting entscheidet",
    potGrowsLive: "Pot wächst live",
    newChallenge: "+ Neue Challenge",
    refresh: "Aktualisieren",

    platformNumbersEyebrow: "Norek in Zahlen",
    platformNumbersTitle: "Was Nutzer mit der App bisher erreicht haben",
    platformNumbersText:
      "Öffentliche Gesamtzahlen der Plattform statt einzelner privater Gewinne.",

    totalPaidOut: "Gesamt ausgezahlt",
    totalPaidOutHint: "An Gewinner ausgezahlt",
    totalChallenges: "Challenges erstellt",
    totalChallengesHint: "Veröffentlicht auf Norek",
    totalUsers: "Community-Mitglieder",
    totalUsersHint: "Registrierte Nutzer",
    totalSupports: "Unterstützungen",
    totalSupportsHint: "Bestätigte Supports",

    realParticipationTitle: "Echte Teilnahme",
    realParticipationText:
      "Keine beliebigen Uploads. Hier zählt nur, was wirklich geliefert wurde.",
    clearCompetitionTitle: "Klarer Wettbewerb",
    clearCompetitionText:
      "Nicht posten, hoffen, verschwinden - sondern antreten, liefern, gewinnen.",
    communityDecidesTitle: "Community entscheidet",
    communityDecidesText:
      "Das Voting macht sichtbar, welches Video wirklich vorne liegt.",

    all: "Alle",
    funding: "Funding",
    active: "Aktiv",
    voting: "Voting",
    completed: "Abgeschlossen",

    search: "Suche",
    searchPlaceholder: "Titel, Beschreibung oder Creator…",
    clearSearch: "Suche löschen",
    sort: "Sortierung",
    newest: "Neueste",
    titleAsc: "Titel A–Z",
    progressDesc: "Fortschritt (hoch → runter)",
    remainingAsc: "Bis Ziel (wenig → viel)",
    statusSort: "Status (Funding → Abgeschlossen)",

    loadingError: "Challenges konnten nicht geladen werden.",
    noMatchingChallenges: "Noch keine passenden Challenges",
    noMatchingChallengesText:
      "Keine Challenges passen zu deinem Filter oder deiner Suche.",
    tryAgain: "Erneut versuchen",

    currentAmount: "Aktueller Stand",
    goal: "Ziel",
    supporters: "Unterstützer",
    progress: "Fortschritt",
    noGoal: "Kein Ziel",
    creatorUnknown: "Creator unbekannt",
    noDescription: "Keine Beschreibung vorhanden.",
    by: "Von",
    open: "Öffnen",

    goalReached: "✅ Ziel erreicht",
    leftToGoal: "🎯 Noch {amount} bis zum Ziel",
    supportersCount: "🔥 {count} Unterstützer",

    fromAmount: "ab {amount}",
    enterAmount: "Bitte Betrag eingeben",
    enterMinAmount: "Mindestens {amount} eingeben",
    continueToStripe: "Weiter zu Stripe…",
    checkoutFailed: "Checkout konnte nicht gestartet werden.",
    paymentSuccessRefresh: "Zahlung erfolgreich. Die Übersicht wird aktualisiert…",

    loadMore: "Mehr laden",
    loadingMore: "Lade mehr…",
    allShown: "Alle aktuell geladenen Challenges angezeigt.",
    page: "Seite",

    onboardingClose: "Schließen",
    onboardingBack: "Zurück",
    onboardingLater: "Später",
    onboardingNext: "Weiter",
    onboardingDone: "Verstanden",

    onboardingCardChallenge: "Challenge",
    onboardingCardChallengeText:
      "Nutzer erstellen Aufgaben mit Regeln, Ziel und Anforderungen.",
    onboardingCardParticipation: "Teilnahme",
    onboardingCardParticipationText:
      "Du trittst mit einem echten Versuch an – nicht mit irgendeinem Fake-Clip.",
    onboardingCardVoting: "Voting",
    onboardingCardVotingText:
      "Die Community bewertet die Beiträge. Der stärkste Versuch gewinnt.",

    createdAt: "Erstellt:",

    statusFunding: "Funding",
    statusActive: "Aktiv",
    statusVoting: "Voting",
    statusEnded: "Beendet",
    statusCompleted: "Abgeschlossen",

    fundingButton: "Pot erhöhen",
    activeButton: "Pot weiter erhöhen",
    votingLocked: "🗳️ Jetzt entscheidet die Community",
    failedLocked: "❌ Ohne Gewinner beendet",
    winnerLocked: "✅ Gewinner steht fest",
    completedLocked: "✅ Abgeschlossen",
    unavailable: "Nicht verfügbar",

    winnerLabel: "🏆 Gewinner:",
    endedWithoutWinner: "❌ Ohne Gewinner beendet",
    challengeCompleted: "🏁 Challenge abgeschlossen",

    hookFundingAlmost: "Fast startklar – noch {amount}.",
    hookFundingLeft: "Noch {amount} bis zum Start.",
    hookFundingGeneric: "Sammelt gerade Support für den Start.",
    hookActive: "Challenge läuft – jetzt mit eigenem Versuch antreten.",
    hookVoting:
      "Voting aktiv – die Community entscheidet gerade, welcher Versuch gewinnt.",
    hookWinner: "Gewinner steht fest: {winner}",
    hookFailed: "Diese Challenge wurde ohne Gewinner beendet.",
    hookGeneric: "Status verfügbar – öffne die Challenge für alle Details.",

    miniFunding:
      "Unterstützer erhöhen den Pot, bevor die Challenge richtig Fahrt aufnimmt.",
    miniActive:
      "Jetzt können Teilnehmer gültige Versuche einreichen und sich den Sieg holen.",
    miniVoting:
      "Jetzt zählt die Meinung der Community – das Voting entscheidet den Gewinner.",
    miniCompleted:
      "Das Ergebnis steht fest. Du kannst dir ansehen, wie die Challenge ausgegangen ist.",
    miniGeneric:
      "Öffne die Challenge, um den aktuellen Stand und die Regeln zu sehen.",

    momentumReady: "Startklar",
    momentumAlmost: "Fast am Ziel",
    momentumBuilding: "Im Aufbau",
    momentumLive: "Live für Teilnehmer",
    momentumVoting: "Community entscheidet",
    momentumFinal: "Ergebnis steht fest",

    votingLiveBadge: "Im Voting",
  },

  en: {
    discover: "Norek Discover",
    heroTitle: "Challenges with real stakes.",
    heroText:
      "Users compete here, the community votes, and the strongest attempt wins. Support increases the pot and makes challenges feel bigger.",
    loaded: "Loaded:",
    votingDecides: "Voting decides",
    potGrowsLive: "Pot grows live",
    newChallenge: "+ New challenge",
    refresh: "Refresh",

    platformNumbersEyebrow: "Norek in numbers",
    platformNumbersTitle: "What users have achieved in the app so far",
    platformNumbersText:
      "Public platform totals instead of individual private winnings.",

    totalPaidOut: "Total paid out",
    totalPaidOutHint: "Paid out to winners",
    totalChallenges: "Challenges created",
    totalChallengesHint: "Published on Norek",
    totalUsers: "Community members",
    totalUsersHint: "Registered users",
    totalSupports: "Supports",
    totalSupportsHint: "Confirmed supports",

    realParticipationTitle: "Real participation",
    realParticipationText:
      "No random uploads. Only what was actually delivered counts here.",
    clearCompetitionTitle: "Clear competition",
    clearCompetitionText:
      "Not post, hope, disappear - but compete, deliver, win.",
    communityDecidesTitle: "Community decides",
    communityDecidesText:
      "Voting makes it visible which video is really in front.",

    all: "All",
    funding: "Funding",
    active: "Active",
    voting: "Voting",
    completed: "Completed",

    search: "Search",
    searchPlaceholder: "Title, description or creator…",
    clearSearch: "Clear search",
    sort: "Sort",
    newest: "Newest",
    titleAsc: "Title A–Z",
    progressDesc: "Progress (high → low)",
    remainingAsc: "To goal (low → high)",
    statusSort: "Status (Funding → Completed)",

    loadingError: "Challenges could not be loaded.",
    noMatchingChallenges: "No matching challenges yet",
    noMatchingChallengesText:
      "No challenges match your filter or search.",
    tryAgain: "Try again",

    currentAmount: "Current amount",
    goal: "Goal",
    supporters: "Supporters",
    progress: "Progress",
    noGoal: "No goal",
    creatorUnknown: "Creator unknown",
    noDescription: "No description available.",
    by: "By",
    open: "Open",

    goalReached: "✅ Goal reached",
    leftToGoal: "🎯 {amount} left to goal",
    supportersCount: "🔥 {count} supporters",

    fromAmount: "from {amount}",
    enterAmount: "Please enter an amount",
    enterMinAmount: "Enter at least {amount}",
    continueToStripe: "Continue to Stripe…",
    checkoutFailed: "Checkout could not be started.",
    paymentSuccessRefresh: "Payment successful. Refreshing overview…",

    loadMore: "Load more",
    loadingMore: "Loading more…",
    allShown: "All currently loaded challenges are displayed.",
    page: "Page",

    onboardingClose: "Close",
    onboardingBack: "Back",
    onboardingLater: "Later",
    onboardingNext: "Next",
    onboardingDone: "Got it",

    onboardingCardChallenge: "Challenge",
    onboardingCardChallengeText:
      "Users create tasks with rules, a goal and requirements.",
    onboardingCardParticipation: "Participation",
    onboardingCardParticipationText:
      "You enter with a real attempt — not just some fake clip.",
    onboardingCardVoting: "Voting",
    onboardingCardVotingText:
      "The community rates the entries. The strongest attempt wins.",

    createdAt: "Created:",

    statusFunding: "Funding",
    statusActive: "Active",
    statusVoting: "Voting",
    statusEnded: "Ended",
    statusCompleted: "Completed",

    fundingButton: "Increase pot",
    activeButton: "Increase pot further",
    votingLocked: "🗳️ The community is deciding now",
    failedLocked: "❌ Ended without winner",
    winnerLocked: "✅ Winner decided",
    completedLocked: "✅ Completed",
    unavailable: "Unavailable",

    winnerLabel: "🏆 Winner:",
    endedWithoutWinner: "❌ Ended without winner",
    challengeCompleted: "🏁 Challenge completed",

    hookFundingAlmost: "Almost there - only {amount} left to launch.",
    hookFundingLeft:
      "{amount} left to the goal. Supporters are getting this challenge ready.",
    hookFundingGeneric:
      "This challenge is currently gathering support and building its pot.",
    hookActive: "Challenge is live - now it's time to enter with your own attempt.",
    hookVoting:
      "Voting is live - the community is deciding which attempt wins.",
    hookWinner: "Winner decided: {winner}",
    hookFailed: "This challenge ended without a winner.",
    hookGeneric: "Open the challenge to see all details and the current status.",

    miniFunding:
      "Supporters increase the pot before the challenge really takes off.",
    miniActive:
      "Participants can now submit valid attempts and fight for the win.",
    miniVoting:
      "Now the community decides which video really deserves to win.",
    miniCompleted:
      "The result is final. Open the challenge to see how it ended.",
    miniGeneric:
      "Open the challenge to see the current status and rules.",

    momentumReady: "Ready to launch",
    momentumAlmost: "Almost there",
    momentumBuilding: "Building up",
    momentumLive: "Open for participants",
    momentumVoting: "Community decides",
    momentumFinal: "Final result",

    votingLiveBadge: "Voting live",
  },

  es: {
    discover: "Norek Discover",
    heroTitle: "Retos con apuestas reales.",
    heroText:
      "Aquí los usuarios compiten, la comunidad vota y el intento más fuerte gana. El apoyo aumenta el bote y hace que los retos se sientan más grandes.",
    loaded: "Cargados:",
    votingDecides: "La votación decide",
    potGrowsLive: "El bote crece en vivo",
    newChallenge: "+ Nuevo reto",
    refresh: "Actualizar",

    platformNumbersEyebrow: "Norek en cifras",
    platformNumbersTitle: "Lo que los usuarios han conseguido hasta ahora",
    platformNumbersText:
      "Totales públicos de la plataforma en lugar de ganancias privadas individuales.",

    totalPaidOut: "Total pagado",
    totalPaidOutHint: "Pagado a los ganadores",
    totalChallenges: "Retos creados",
    totalChallengesHint: "Publicados en Norek",
    totalUsers: "Miembros de la comunidad",
    totalUsersHint: "Usuarios registrados",
    totalSupports: "Apoyos",
    totalSupportsHint: "Apoyos confirmados",

    realParticipationTitle: "Participación real",
    realParticipationText:
      "No hay subidas aleatorias. Aquí solo cuenta lo que realmente se entregó.",
    clearCompetitionTitle: "Competencia clara",
    clearCompetitionText:
      "No publicar, esperar y desaparecer, sino competir, cumplir y ganar.",
    communityDecidesTitle: "La comunidad decide",
    communityDecidesText:
      "La votación deja claro qué vídeo va realmente por delante.",

    all: "Todos",
    funding: "Financiación",
    active: "Activo",
    voting: "Votación",
    completed: "Completado",

    search: "Buscar",
    searchPlaceholder: "Título, descripción o creador…",
    clearSearch: "Borrar búsqueda",
    sort: "Ordenar",
    newest: "Más recientes",
    titleAsc: "Título A–Z",
    progressDesc: "Progreso (alto → bajo)",
    remainingAsc: "Hasta el objetivo (bajo → alto)",
    statusSort: "Estado (Financiación → Completado)",

    loadingError: "No se pudieron cargar los retos.",
    noMatchingChallenges: "Todavía no hay retos coincidentes",
    noMatchingChallengesText:
      "Ningún reto coincide con tu filtro o tu búsqueda.",
    tryAgain: "Intentar de nuevo",

    currentAmount: "Cantidad actual",
    goal: "Objetivo",
    supporters: "Patrocinadores",
    progress: "Progreso",
    noGoal: "Sin objetivo",
    creatorUnknown: "Creador desconocido",
    noDescription: "No hay descripción disponible.",
    by: "Por",
    open: "Abrir",

    goalReached: "✅ Objetivo alcanzado",
    leftToGoal: "🎯 Faltan {amount} para el objetivo",
    supportersCount: "🔥 {count} patrocinadores",

    fromAmount: "desde {amount}",
    enterAmount: "Introduce una cantidad",
    enterMinAmount: "Introduce al menos {amount}",
    continueToStripe: "Continuar a Stripe…",
    checkoutFailed: "No se pudo iniciar el checkout.",
    paymentSuccessRefresh: "Pago realizado con éxito. Actualizando la vista…",

    loadMore: "Cargar más",
    loadingMore: "Cargando más…",
    allShown: "Se muestran todos los retos cargados actualmente.",
    page: "Página",

    onboardingClose: "Cerrar",
    onboardingBack: "Atrás",
    onboardingLater: "Más tarde",
    onboardingNext: "Siguiente",
    onboardingDone: "Entendido",

    onboardingCardChallenge: "Reto",
    onboardingCardChallengeText:
      "Los usuarios crean tareas con reglas, objetivo y requisitos.",
    onboardingCardParticipation: "Participación",
    onboardingCardParticipationText:
      "Participas con un intento real, no con un clip falso cualquiera.",
    onboardingCardVoting: "Votación",
    onboardingCardVotingText:
      "La comunidad valora los aportes. El intento más fuerte gana.",

    createdAt: "Creado:",

    statusFunding: "Financiación",
    statusActive: "Activo",
    statusVoting: "Votación",
    statusEnded: "Finalizado",
    statusCompleted: "Completado",

    fundingButton: "Aumentar bote",
    activeButton: "Seguir aumentando el bote",
    votingLocked: "🗳️ La comunidad decide ahora",
    failedLocked: "❌ Terminó sin ganador",
    winnerLocked: "✅ Ganador decidido",
    completedLocked: "✅ Completado",
    unavailable: "No disponible",

    winnerLabel: "🏆 Ganador:",
    endedWithoutWinner: "❌ Terminó sin ganador",
    challengeCompleted: "🏁 Reto completado",

    hookFundingAlmost: "Casi listo: solo faltan {amount} para arrancar.",
    hookFundingLeft:
      "Faltan {amount} para el objetivo. Los patrocinadores están dejando este reto listo.",
    hookFundingGeneric:
      "Este reto está reuniendo apoyo y construyendo su bote.",
    hookActive: "El reto está activo: ahora toca entrar con tu propio intento.",
    hookVoting:
      "La votación está en marcha: la comunidad decide qué intento gana.",
    hookWinner: "Ganador decidido: {winner}",
    hookFailed: "Este reto terminó sin ganador.",
    hookGeneric: "Abre el reto para ver todos los detalles y el estado actual.",

    miniFunding:
      "Los patrocinadores aumentan el bote antes de que el reto despegue de verdad.",
    miniActive:
      "Los participantes ya pueden enviar intentos válidos y luchar por la victoria.",
    miniVoting:
      "Ahora la comunidad decide qué vídeo merece realmente ganar.",
    miniCompleted:
      "El resultado es definitivo. Abre el reto para ver cómo terminó.",
    miniGeneric:
      "Abre el reto para ver el estado actual y las reglas.",

    momentumReady: "Listo para arrancar",
    momentumAlmost: "Casi listo",
    momentumBuilding: "En construcción",
    momentumLive: "Abierto para participantes",
    momentumVoting: "La comunidad decide",
    momentumFinal: "Resultado final",

    votingLiveBadge: "En votación",
  },

  fr: {
    discover: "Norek Discover",
    heroTitle: "Des défis avec un vrai enjeu.",
    heroText:
      "Ici, les utilisateurs s'affrontent, la communauté vote et la tentative la plus forte gagne. Le soutien augmente la cagnotte et rend les défis plus intenses.",
    loaded: "Chargés :",
    votingDecides: "Le vote décide",
    potGrowsLive: "La cagnotte grandit en direct",
    newChallenge: "+ Nouveau défi",
    refresh: "Actualiser",

    platformNumbersEyebrow: "Norek en chiffres",
    platformNumbersTitle: "Ce que les utilisateurs ont déjà accompli",
    platformNumbersText:
      "Des chiffres publics de la plateforme au lieu de gains privés individuels.",

    totalPaidOut: "Total versé",
    totalPaidOutHint: "Versé aux gagnants",
    totalChallenges: "Défis créés",
    totalChallengesHint: "Publiés sur Norek",
    totalUsers: "Membres de la communauté",
    totalUsersHint: "Utilisateurs inscrits",
    totalSupports: "Soutiens",
    totalSupportsHint: "Soutiens confirmés",

    realParticipationTitle: "Participation réelle",
    realParticipationText:
      "Pas de mises en ligne au hasard. Ici, seul ce qui a vraiment été livré compte.",
    clearCompetitionTitle: "Compétition claire",
    clearCompetitionText:
      "Pas publier, espérer, disparaître, mais concourir, livrer, gagner.",
    communityDecidesTitle: "La communauté décide",
    communityDecidesText:
      "Le vote montre clairement quelle vidéo mène vraiment.",

    all: "Tous",
    funding: "Financement",
    active: "Actif",
    voting: "Vote",
    completed: "Complété",

    search: "Recherche",
    searchPlaceholder: "Titre, description ou créateur…",
    clearSearch: "Effacer la recherche",
    sort: "Tri",
    newest: "Les plus récents",
    titleAsc: "Titre A–Z",
    progressDesc: "Progression (haut → bas)",
    remainingAsc: "Jusqu’à l’objectif (bas → haut)",
    statusSort: "Statut (Financement → Complété)",

    loadingError: "Les défis n'ont pas pu être chargés.",
    noMatchingChallenges: "Aucun défi correspondant pour le moment",
    noMatchingChallengesText:
      "Aucun défi ne correspond à ton filtre ou à ta recherche.",
    tryAgain: "Réessayer",

    currentAmount: "Montant actuel",
    goal: "Objectif",
    supporters: "Soutiens",
    progress: "Progression",
    noGoal: "Aucun objectif",
    creatorUnknown: "Créateur inconnu",
    noDescription: "Aucune description disponible.",
    by: "Par",
    open: "Ouvrir",

    goalReached: "✅ Objectif atteint",
    leftToGoal: "🎯 Il reste {amount} avant l’objectif",
    supportersCount: "🔥 {count} soutiens",

    fromAmount: "à partir de {amount}",
    enterAmount: "Merci de saisir un montant",
    enterMinAmount: "Saisis au moins {amount}",
    continueToStripe: "Continuer vers Stripe…",
    checkoutFailed: "Le checkout n’a pas pu être lancé.",
    paymentSuccessRefresh: "Paiement réussi. Actualisation de la vue…",

    loadMore: "Charger plus",
    loadingMore: "Chargement…",
    allShown: "Tous les défis actuellement chargés sont affichés.",
    page: "Page",

    onboardingClose: "Fermer",
    onboardingBack: "Retour",
    onboardingLater: "Plus tard",
    onboardingNext: "Suivant",
    onboardingDone: "Compris",

    onboardingCardChallenge: "Défi",
    onboardingCardChallengeText:
      "Les utilisateurs créent des tâches avec règles, objectif et exigences.",
    onboardingCardParticipation: "Participation",
    onboardingCardParticipationText:
      "Tu participes avec une vraie tentative, pas avec un faux clip quelconque.",
    onboardingCardVoting: "Vote",
    onboardingCardVotingText:
      "La communauté évalue les contributions. La tentative la plus forte gagne.",

    createdAt: "Créé :",

    statusFunding: "Financement",
    statusActive: "Actif",
    statusVoting: "Vote",
    statusEnded: "Terminé",
    statusCompleted: "Complété",

    fundingButton: "Augmenter la cagnotte",
    activeButton: "Augmenter encore la cagnotte",
    votingLocked: "🗳️ La communauté décide maintenant",
    failedLocked: "❌ Terminé sans gagnant",
    winnerLocked: "✅ Gagnant décidé",
    completedLocked: "✅ Complété",
    unavailable: "Indisponible",

    winnerLabel: "🏆 Gagnant :",
    endedWithoutWinner: "❌ Terminé sans gagnant",
    challengeCompleted: "🏁 Défi complété",

    hookFundingAlmost: "Presque prêt — plus que {amount} avant le lancement.",
    hookFundingLeft:
      "Il reste {amount} avant l’objectif. Les soutiens préparent ce défi.",
    hookFundingGeneric:
      "Ce défi rassemble actuellement du soutien et construit sa cagnotte.",
    hookActive: "Le défi est en cours — il est temps d’entrer avec ta propre tentative.",
    hookVoting:
      "Le vote est en cours — la communauté décide quelle tentative gagne.",
    hookWinner: "Gagnant décidé : {winner}",
    hookFailed: "Ce défi s’est terminé sans gagnant.",
    hookGeneric: "Ouvre le défi pour voir tous les détails et le statut actuel.",

    miniFunding:
      "Les soutiens augmentent la cagnotte avant que le défi ne décolle vraiment.",
    miniActive:
      "Les participants peuvent maintenant soumettre des tentatives valides et viser la victoire.",
    miniVoting:
      "Maintenant, la communauté décide quelle vidéo mérite vraiment de gagner.",
    miniCompleted:
      "Le résultat est définitif. Ouvre le défi pour voir comment il s’est terminé.",
    miniGeneric:
      "Ouvre le défi pour voir le statut actuel et les règles.",

    momentumReady: "Prêt à lancer",
    momentumAlmost: "Presque prêt",
    momentumBuilding: "En construction",
    momentumLive: "Ouvert aux participants",
    momentumVoting: "La communauté décide",
    momentumFinal: "Résultat final",

    votingLiveBadge: "En vote",
  },
};

const ONBOARDING_SLIDES: Record<
  ChallengeLocale,
  { eyebrow: string; title: string; text: string }[]
> = {
  de: [
    {
      eyebrow: "Willkommen bei Norek",
      title: "Hier treten Nutzer in echten Challenges gegeneinander an",
      text:
        "Norek ist keine normale Video-Plattform. Hier gibt es Challenges, Konkurrenz, Voting und einen Pot. Nutzer treten an, die Community bewertet, der stärkste Versuch gewinnt.",
    },
    {
      eyebrow: "Teilnahme",
      title: "So machst du mit",
      text:
        "Du nimmst eine Challenge an und reichst deinen Versuch direkt in der App ein – je nach Challenge live oder als verifizierte Aufnahme. Nur gültige und regelkonforme Versuche kommen in die Wertung.",
    },
    {
      eyebrow: "Gewinnen",
      title: "Nicht Support entscheidet – sondern dein Versuch",
      text:
        "Der Pot macht Challenges spannender, aber gewinnen kann ihn nur, wer einen gültigen Versuch einreicht und im Voting überzeugt. Entscheidend ist nicht Glück, sondern die Stärke deines Beitrags.",
    },
  ],
  en: [
    {
      eyebrow: "Welcome to Norek",
      title: "Users compete here in real challenges",
      text:
        "Norek is not a normal video platform. Here you get challenges, rivalry, voting and a pot. Users compete, the community rates, and the strongest attempt wins.",
    },
    {
      eyebrow: "Participation",
      title: "How to join",
      text:
        "You accept a challenge and submit your attempt directly in the app — either live or as a verified recording, depending on the challenge. Only valid and rule-compliant attempts enter the ranking.",
    },
    {
      eyebrow: "Winning",
      title: "Support does not decide — your attempt does",
      text:
        "The pot makes challenges more exciting, but only someone who submits a valid attempt and convinces in voting can win it. What matters is not luck, but the strength of your contribution.",
    },
  ],
  es: [
    {
      eyebrow: "Bienvenido a Norek",
      title: "Aquí los usuarios compiten en retos reales",
      text:
        "Norek no es una plataforma de vídeo normal. Aquí hay retos, competencia, votación y un bote. Los usuarios compiten, la comunidad valora y el intento más fuerte gana.",
    },
    {
      eyebrow: "Participación",
      title: "Así participas",
      text:
        "Aceptas un reto y envías tu intento directamente en la app, ya sea en directo o como grabación verificada, según el reto. Solo los intentos válidos y conformes con las reglas entran en la valoración.",
    },
    {
      eyebrow: "Ganar",
      title: "No decide el apoyo, sino tu intento",
      text:
        "El bote hace los retos más emocionantes, pero solo puede ganarlo quien envía un intento válido y convence en la votación. Lo decisivo no es la suerte, sino la fuerza de tu aportación.",
    },
  ],
  fr: [
    {
      eyebrow: "Bienvenue sur Norek",
      title: "Ici, les utilisateurs s’affrontent dans de vrais défis",
      text:
        "Norek n’est pas une plateforme vidéo classique. Ici, il y a des défis, de la concurrence, du vote et une cagnotte. Les utilisateurs s’affrontent, la communauté évalue et la tentative la plus forte gagne.",
    },
    {
      eyebrow: "Participation",
      title: "Comment participer",
      text:
        "Tu acceptes un défi et tu soumets ta tentative directement dans l’application — en live ou en enregistrement vérifié selon le défi. Seules les tentatives valides et conformes aux règles entrent dans l’évaluation.",
    },
    {
      eyebrow: "Gagner",
      title: "Ce n’est pas le soutien qui décide, mais ta tentative",
      text:
        "La cagnotte rend les défis plus excitants, mais seul celui qui soumet une tentative valide et convainc au vote peut la gagner. Ce n’est pas la chance qui compte, mais la force de ta contribution.",
    },
  ],
};

const PAGE_SIZE = 20;

function resolveThumbnailUrl(url: string | null | undefined): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;

  if (v.startsWith("http://") || v.startsWith("https://")) {
    return v;
  }

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

function statusLabel(
  status?: string,
  result?: string | null,
  locale: ChallengeLocale = "de"
) {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const normalizedResult = String(result ?? "").toLowerCase();
  const ui = OVERVIEW_UI_TEXT[locale];

  if (normalizedStatus === "funding") return ui.statusFunding;
  if (normalizedStatus === "active") return ui.statusActive;
  if (normalizedStatus === "voting") return ui.statusVoting;
  if (normalizedStatus === "completed" && normalizedResult === "failed") {
    return ui.statusEnded;
  }
  if (normalizedStatus === "completed") {
    return ui.statusCompleted;
  }
  return status ?? "—";
}

function statusClasses(status?: string, result?: string | null) {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const normalizedResult = String(result ?? "").toLowerCase();

  if (normalizedStatus === "funding") {
    return "border-blue-500/30 bg-blue-500/15 text-blue-200";
  }
  if (normalizedStatus === "active") {
    return "border-cyan-400/30 bg-cyan-400/15 text-cyan-200";
  }
  if (normalizedStatus === "voting") {
    return "border-indigo-400/30 bg-indigo-400/15 text-indigo-200";
  }
  if (normalizedStatus === "completed" && normalizedResult === "failed") {
    return "border-red-500/30 bg-red-500/15 text-red-200";
  }
  if (normalizedStatus === "completed") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  }
  return "border-white/10 bg-white/5 text-slate-300";
}

function tabClasses(active: boolean) {
  return active
    ? "rounded-2xl border border-blue-400/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
    : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white";
}

function getSupporterCount(challenge: Challenge): number | null {
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

  return null;
}

function mapSortToBackend(sort: SortKey): string {
  if (sort === "title_asc") return "title_asc";
  if (sort === "progress_desc") return "progress_desc";
  if (sort === "remaining_asc") return "remaining_asc";
  if (sort === "status") return "status";
  return "newest";
}

function getCardCta(challenge: Challenge, locale: ChallengeLocale = "de") {
  const ui = OVERVIEW_UI_TEXT[locale];
  return {
    label: ui.open,
    href: `/challenges/${challenge.id}`,
  };
}

function getMomentumBadge(
  challenge: Challenge,
  locale: ChallengeLocale = "de"
) {
  const status = String(challenge.status ?? "").toLowerCase();
  const current = challenge.currentAmount ?? 0; 
  const goal = challenge.minAmount ?? 0; 
  const ui = OVERVIEW_UI_TEXT[locale];

  if (status === "funding" && goal > 0) {
    const pct = (current / goal) * 100; 

    if (pct >= 100) {
      return {
        label: ui.momentumReady,
        className:
          "rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800",
      };
    }

    if (pct >= 80) {
      return {
        label: ui.momentumAlmost,
        className:
          "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800",
      };
    }

    return null;
  }

  if (status === "active") {
    return {
      label: ui.momentumLive,
      className:
        "rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800",
    };
  }

  if (status === "voting") {
    return {
      label: ui.momentumVoting,
      className:
        "rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800",
    };
  }

  if (status === "completed") {
    return null;
  }

  return null;
}

function getCardFrameClasses(challenge: Challenge) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();

  const base =
    "group overflow-hidden rounded-[28px] border bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]";

  if (status === "funding") {
    return {
      outer: `${base} border-blue-500/15 ring-blue-500/10`,
      top: "",
      body: "p-0",
      stat: "rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-3",
      progressWrap:
        "mt-3 rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-3",
      footer: "mt-2.5 border-t border-white/6 pt-2",
      accent: "bg-blue-500",
    };
  }

  if (status === "active") {
    return {
      outer: `${base} border-cyan-400/15 ring-cyan-400/10`,
      top: "",
      body: "p-0",
      stat: "rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3",
      progressWrap:
        "mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3",
      footer: "mt-2.5 border-t border-white/6 pt-2",
      accent: "bg-cyan-400",
    };
  }

  if (status === "voting") {
    return {
      outer: `${base} border-indigo-400/15 ring-indigo-400/10`,
      top: "",
      body: "p-0",
      stat: "rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-3",
      progressWrap:
        "mt-3 rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-3",
      footer: "mt-2.5 border-t border-white/6 pt-2",
      accent: "bg-indigo-400",
    };
  }

  if (status === "completed" && result === "failed") {
    return {
      outer: `${base} border-red-500/15 ring-red-500/10`,
      top: "",
      body: "p-0",
      stat: "rounded-2xl border border-red-500/15 bg-red-500/[0.06] p-3",
      progressWrap:
        "mt-3 rounded-2xl border border-red-500/15 bg-red-500/[0.06] p-3",
      footer: "mt-2.5 border-t border-white/6 pt-2",
      accent: "bg-red-500",
    };
  }

  if (status === "completed") {
    return {
      outer: `${base} border-emerald-500/15 ring-emerald-500/10`,
      top: "",
      body: "p-0",
      stat: "rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3",
      progressWrap:
        "mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3",
      footer: "mt-2.5 border-t border-white/6 pt-2",
      accent: "bg-emerald-500",
    };
  }

  return {
    outer: `${base} border-white/10 ring-white/5`,
    top: "",
    body: "p-0",
    stat: "rounded-2xl border border-white/10 bg-white/[0.03] p-3",
    progressWrap: "mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3",
    footer: "mt-2.5 border-t border-white/6 pt-2",
    accent: "bg-slate-500",
  };
}

function getThumbnailFallbackClasses(challenge: Challenge) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();

  if (status === "funding") {
    return "from-amber-500 via-orange-400 to-amber-300";
  }

  if (status === "active") {
    return "from-blue-600 via-cyan-500 to-sky-400";
  }

  if (status === "voting") {
    return "from-purple-600 via-fuchsia-500 to-pink-400";
  }

  if (status === "completed" && result === "failed") {
    return "from-red-600 via-rose-500 to-orange-400";
  }

  if (status === "completed") {
    return "from-green-600 via-emerald-500 to-lime-400";
  }

  return "from-slate-700 via-slate-500 to-slate-300";
}

function FooterNavIcon({
  name,
}: {
  name: "overview" | "challenges" | "leaderboard" | "wallet";
}) {
  const common = {
    className: "h-[17px] w-[17px]",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "overview") {
    return (
      <svg {...common}>
        <path
          d="M4 11.5L12 5L20 11.5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V11.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 20V14H15V20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "challenges") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (name === "leaderboard") {
    return (
      <svg {...common}>
        <path
          d="M12 4L14.6 9.2L20.4 10L16.2 14L17.2 19.8L12 17.1L6.8 19.8L7.8 14L3.6 10L9.4 9.2L12 4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChallengesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [viewerChecked, setViewerChecked] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [isMobile, setIsMobile] = useState(false);

  const [activeLocale, setActiveLocale] = useState<ChallengeLocale>("de");
  const ui = useMemo(() => OVERVIEW_UI_TEXT[activeLocale], [activeLocale]);
  const onboardingSlides = useMemo(() => ONBOARDING_SLIDES[activeLocale], [activeLocale]);
  const didMountRef = useRef(false);

  useEffect(() => {
    setActiveLocale(getActiveChallengeLocale());
  }, []);

  const handleLocaleChange = useCallback((nextLocale: ChallengeLocale) => {
    setActiveLocale(nextLocale);
    localStorage.setItem("app_locale", nextLocale);
    localStorage.setItem("locale", nextLocale);
    localStorage.setItem("language", nextLocale);
  }, []);

  const onboardingStorageKey = useMemo(() => {
    if (!viewer?.id) return null;
    return `darepay_onboarding_seen_${viewer.id}`;
  }, [viewer?.id]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadChallenges = useCallback(
    async (opts?: {
      signal?: AbortSignal;
      page?: number;
      append?: boolean;
      silent?: boolean;
    }) => {
      const nextPage = opts?.page ?? 1;
      const append = !!opts?.append;
      const silent = !!opts?.silent;

      try {
        if (!silent) {
          setError("");
        }

        if (append) {
          setLoadingMore(true);
        } else if (!silent) {
          setLoading(true);
        }

        const params = new URLSearchParams();
        params.set("page", String(nextPage));
        params.set("limit", String(PAGE_SIZE));

        if (q) {
          params.set("search", q);
        }

        if (filter !== "all") {
          params.set("status", filter);
        }

        params.set("sort", mapSortToBackend(sort));

        const json = await apiJson<ChallengesResponse>(
          `/challenges?${params.toString()}`,
          { method: "GET", signal: opts?.signal }
        );

        const fetchedItems = Array.isArray(json?.data)
          ? json.data.map(normalizeChallengeFromApi)
          : [];
        const backendPage = Number(json?.page ?? nextPage);
        const backendHasMore = !!json?.hasMore;

        setPage(backendPage);
        setHasMore(backendHasMore);

        setItems((prev) => {
          if (!append) return fetchedItems;

          const merged = [...prev];
          const seen = new Set(merged.map((item) => item.id));

          for (const item of fetchedItems) {
            if (!seen.has(item.id)) {
              merged.push(item);
              seen.add(item.id);
            }
          }

          return merged;
        });
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string };
        if (err?.name === "AbortError") return;

        if (err?.message === "NO_TOKEN") {
          router.replace("/auth/login");
          return;
        }

        if (err?.message === "UNAUTHORIZED") return;

        setError(
          ui.loadingError
        );
        if (!append) {
          setItems([]);
          setPage(1);
          setHasMore(false);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setLoadingMore(false);
      }
    },
    [router, q, filter, sort, ui.loadingError]
  );

  useEffect(() => {
    let mounted = true;

    async function loadViewer() {
      try {
        const json = await apiJson<MeResponse>("/users/me", { method: "GET" });
        const user = json?.data ?? json;

        if (!mounted) return;

        if (user?.id) {
          setViewer({
            id: user.id,
            username: user.username ?? null,
          });
        } else {
          setViewer(null);
        }
      } catch {
        if (!mounted) return;
        setViewer(null);
      } finally {
        if (mounted) {
          setViewerChecked(true);
        }
      }
    }

    loadViewer();

    return () => {
      mounted = false;
    };
  }, [loadChallenges]);

  useEffect(() => {
    if (!viewerChecked) return;
    if (!viewer?.id) return;
    if (!onboardingStorageKey) return;

    const alreadySeen = window.localStorage.getItem(onboardingStorageKey);

    if (!alreadySeen) {
      setShowOnboarding(true);
      setOnboardingStep(0);
    }
  }, [viewerChecked, viewer?.id, onboardingStorageKey]);

  useEffect(() => {
    const controller = new AbortController();
    loadChallenges({ signal: controller.signal, page: 1, append: false });
    didMountRef.current = true;

    return () => controller.abort();
  }, [loadChallenges]);

  useEffect(() => {
    if (!didMountRef.current) return;

    const controller = new AbortController();
    loadChallenges({ signal: controller.signal, page: 1, append: false });

    return () => controller.abort();
  }, [q, filter, sort, loadChallenges]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment !== "success") return;

    setToast({
      message: ui.paymentSuccessRefresh,
      type: "success",
    });

    let cancelled = false;
    const timeouts: number[] = [];

    const run = async () => {
      if (cancelled) return;
      try {
        await loadChallenges({ page: 1, append: false });
      } catch {}
    };

    run();

    [1500, 3500, 6000].forEach((ms) => {
      const t = window.setTimeout(() => {
        if (!cancelled) {
          loadChallenges({ page: 1, append: false, silent: true }).catch(
            () => {}
          );
        }
      }, ms);
      timeouts.push(t);
    });

    return () => {
      cancelled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [searchParams, loadChallenges, ui.paymentSuccessRefresh]);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const closeOnboardingAndRemember = useCallback(() => {
    if (onboardingStorageKey) {
      window.localStorage.setItem(onboardingStorageKey, "1");
    }
    setShowOnboarding(false);
  }, [onboardingStorageKey]);

  const handleNextOnboarding = useCallback(() => {
    if (onboardingStep < onboardingSlides.length - 1) {
      setOnboardingStep((prev) => prev + 1);
      return;
    }

    closeOnboardingAndRemember();
  }, [onboardingStep, onboardingSlides.length, closeOnboardingAndRemember]);

  const handleBackOnboarding = useCallback(() => {
    if (onboardingStep > 0) {
      setOnboardingStep((prev) => prev - 1);
    }
  }, [onboardingStep]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    if (!hasMore) return;

    await loadChallenges({
      page: page + 1,
      append: true,
    });
  };

  const handleRefresh = async () => {
    await loadChallenges({ page: 1, append: false });
  };

  const counts = useMemo(() => {
    return {
      all: items.length,
      funding: items.filter((c) => c.status === "funding").length,
      active: items.filter((c) => c.status === "active").length,
      voting: items.filter((c) => c.status === "voting").length,
      completed: items.filter((c) => c.status === "completed").length,
      live: items.filter((c) => String(c.status).toLowerCase() === "live").length,
    };
  }, [items]);

  const preparedItems = useMemo(() => {
    let next = [...items];

    if (scopeFilter === "new") {
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      next = next.filter((challenge) => {
        if (!challenge.createdAt) return false;
        const createdTs = new Date(challenge.createdAt).getTime();
        if (Number.isNaN(createdTs)) return false;
        return now - createdTs <= sevenDaysMs;
      });
    }

    if (scopeFilter === "popular") {
      next.sort((a, b) => {
        const aValue = Number(a.confirmedPotAmount ?? a.currentAmount ?? 0);
        const bValue = Number(b.confirmedPotAmount ?? b.currentAmount ?? 0);
        return bValue - aValue;
      });
    }

    return next;
  }, [items, scopeFilter]);

  const currentSlide = onboardingSlides[onboardingStep];
  const isLastOnboardingStep = onboardingStep === onboardingSlides.length - 1;

  if (isMobile) {
    return (
      <main className="min-h-screen bg-slate-950">
        <MobileChallengesOverview
          locale={activeLocale}
          items={preparedItems}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          page={page}
          counts={counts}
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          filter={filter}
          setFilter={setFilter}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          sort={sort}
          setSort={setSort}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
        />

        <AnimatePresence>
          {showOnboarding && currentSlide && (
            <motion.div
              className="fixed inset-0 z-[120] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={closeOnboardingAndRemember}
              />

              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-300/20 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              >
                <div className="bg-gradient-to-r from-amber-400/15 via-orange-300/10 to-white/[0.04] p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                        {currentSlide.eyebrow}
                      </p>
                      <h2 className="mt-3 text-2xl font-black leading-tight text-white md:text-3xl">
                        {currentSlide.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={closeOnboardingAndRemember}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      {ui.onboardingClose}
                    </button>
                  </div>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                    {currentSlide.text}
                  </p>

                  <div className="mt-6 flex items-center gap-2">
                    {onboardingSlides.map((_, index) => (
                      <div
                        key={index}
                        className={[
                          "h-2 rounded-full transition-all",
                          index === onboardingStep
                            ? "w-8 bg-amber-300"
                            : "w-2 bg-white/20",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-white/10 bg-white/[0.03] p-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {ui.onboardingCardChallenge}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {ui.onboardingCardChallengeText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {ui.onboardingCardParticipation}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {ui.onboardingCardParticipationText}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {ui.onboardingCardVoting}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {ui.onboardingCardVotingText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                  <button
                    type="button"
                    onClick={handleBackOnboarding}
                    disabled={onboardingStep === 0}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {ui.onboardingBack}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={closeOnboardingAndRemember}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                    >
                      {ui.onboardingLater}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextOnboarding}
                      className="rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
                    >
                      {isLastOnboardingStep ? ui.onboardingDone : ui.onboardingNext}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-3 pb-36 pt-3 md:px-6 md:pt-6 xl:pb-28">
        <div className="mb-3 hidden justify-end md:flex xl:hidden">
          <select
            value={activeLocale}
            onChange={(e) => handleLocaleChange(e.target.value as ChallengeLocale)}
            className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 outline-none transition hover:bg-white/10"
            aria-label="Language"
          >
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </select>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-6 overflow-hidden rounded-[32px] border border-blue-500/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#050B17_0%,#09101D_55%,#0B1322_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                    {ui.discover}
                  </span>

                  <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                    {ui.heroTitle}
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                    {ui.heroText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href="/challenges/create">
                    <PrimaryButton variant="dark" className="w-full sm:w-auto">
                      {ui.newChallenge}
                    </PrimaryButton>
                  </Link>

                  <PrimaryButton
                    type="button"
                    variant="secondary"
                    onClick={handleRefresh}
                    className="w-full sm:w-auto"
                  >
                    {ui.refresh}
                  </PrimaryButton>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {ui.totalSupports}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">
                    {counts.all}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {ui.loaded} {preparedItems.length}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {ui.voting}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">
                    {counts.voting}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{ui.votingDecides}</div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {ui.active}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">
                    {counts.active}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{ui.potGrowsLive}</div>
                </div>
              </div>
            </div>
          </div>

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mb-3 flex flex-wrap gap-2"
            >
              <button
                onClick={() => setFilter("all")}
                className={tabClasses(filter === "all")}
              >
                {ui.all}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setFilter("funding")}
                className={tabClasses(filter === "funding")}
              >
                {ui.funding}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {counts.funding}
                </span>
              </button>

              <button
                onClick={() => setFilter("active")}
                className={tabClasses(filter === "active")}
              >
                {ui.active}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {counts.active}
                </span>
              </button>

              <button
                onClick={() => setFilter("voting")}
                className={tabClasses(filter === "voting")}
              >
                {ui.voting}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {counts.voting}
                </span>
              </button>

              <button
                onClick={() => setFilter("completed")}
                className={tabClasses(filter === "completed")}
              >
                {ui.completed}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  {counts.completed}
                </span>
              </button>
            </motion.div>
          )}

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.12,
                ease: "easeOut",
              }}
              className="mb-6 rounded-[28px] border border-white/10 bg-[#0B1322] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-[240px] flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-sm font-semibold text-slate-300">
                    {ui.search}
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder={ui.searchPlaceholder}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                    />
                    {searchInput.trim() && (
                      <button
                        onClick={() => setSearchInput("")}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                        title={ui.clearSearch}
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="text-sm font-semibold text-slate-300">
                    {ui.sort}
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="newest">{ui.newest}</option>
                    <option value="title_asc">{ui.titleAsc}</option>
                    <option value="progress_desc">
                      {ui.progressDesc}
                    </option>
                    <option value="remaining_asc">
                      {ui.remainingAsc}
                    </option>
                    <option value="status">
                      {ui.statusSort}
                    </option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[24px] border border-white/10 bg-white p-5 shadow-xl ring-1 ring-black/5"
                >
                  <div className="animate-pulse">
                    <div className="aspect-[16/9] rounded-2xl bg-slate-200" />
                    <div className="mt-4 h-6 w-24 rounded-full bg-slate-200" />
                    <div className="mt-4 h-8 w-3/4 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
                    <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="h-20 rounded-2xl bg-slate-200" />
                      <div className="h-20 rounded-2xl bg-slate-200" />
                      <div className="h-20 rounded-2xl bg-slate-200" />
                    </div>
                    <div className="mt-4 h-24 rounded-2xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && preparedItems.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white p-8 text-center shadow-2xl">
              <div className="mb-2 text-xl font-extrabold text-slate-900">
                {ui.noMatchingChallenges}
              </div>

              <p className="text-slate-600">
                {ui.noMatchingChallengesText}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="font-semibold text-red-700">{error}</p>
              <div className="mt-4">
                <PrimaryButton
                  type="button"
                  variant="dark"
                  onClick={handleRefresh}
                >
                  {ui.tryAgain}
                </PrimaryButton>
              </div>
            </div>
          )}

          {!loading && !error && preparedItems.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {preparedItems.map((c, index) => {
                  const current = c.currentAmount ?? 0;
                  const localizedTitle = getLocalizedChallengeText(
                    c.title,
                    c.titleTranslations,
                    activeLocale
                  );

                  const localizedDescription = getLocalizedChallengeText(
                    c.description,
                    c.descriptionTranslations,
                    activeLocale
                  );
                  const supporterCount = getSupporterCount(c);
                  const trimmedDescription = localizedDescription.trim();
                  const hasDescription = trimmedDescription.length > 0;

                  const cardCta = getCardCta(c, activeLocale);
                  const momentumBadge = getMomentumBadge(c, activeLocale);
                  const frame = getCardFrameClasses(c);
                  const thumbnailAspectClass = "aspect-[16/10.5]";
                  const resolvedThumbnailUrl = resolveChallengePreviewImage(c);
                  const uploadedVideoFallbackUrl = resolveUploadedVideoFallbackUrl(c);
                  const hasOnlineVideo = challengeHasOnlineVideo(c);

                  return (
                    <Link key={c.id} href={cardCta.href} className="block">
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.32,
                          delay: Math.min(index * 0.04, 0.2),
                        }}
                        className={`${frame.outer} cursor-pointer`}
                      >
                      <div
                        className={`relative ${thumbnailAspectClass} overflow-hidden border-b border-black/5 bg-slate-200`}
                      >
                        {resolvedThumbnailUrl ? (
                          <>
                            <Image
                              src={resolvedThumbnailUrl}
                              alt={localizedTitle || c.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10 transition duration-300 group-hover:from-black/75 group-hover:via-black/30 group-hover:to-black/20" />
                            <div className="absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/15" />

                            <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-5">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {hasOnlineVideo ? (
                                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md">
                                    {activeLocale === "en"
                                      ? "Video online"
                                      : activeLocale === "es"
                                        ? "Video online"
                                        : activeLocale === "fr"
                                          ? "Video en ligne"
                                          : "Video online"}
                                  </span>
                                ) : null}

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${statusClasses(
                                    c.status,
                                    c.result
                                  )}`}
                                >
                                  {statusLabel(c.status, c.result, activeLocale)}
                                </span>

                                {momentumBadge ? (
                                  <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                    {momentumBadge.label}
                                  </span>
                                ) : null}
                              </div>

                              <div className="line-clamp-2 max-w-[86%] text-lg font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-[28px]">
                                {localizedTitle || c.title}
                              </div>
                            </div>
                          </>
                        ) : uploadedVideoFallbackUrl ? (
                          <>
                            <video
                              src={uploadedVideoFallbackUrl}
                              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10 transition duration-300 group-hover:from-black/75 group-hover:via-black/30 group-hover:to-black/20" />
                            <div className="absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/15" />

                            <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-5">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {hasOnlineVideo ? (
                                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-md">
                                    {activeLocale === "en"
                                      ? "Video online"
                                      : activeLocale === "es"
                                        ? "Video online"
                                        : activeLocale === "fr"
                                          ? "Video en ligne"
                                          : "Video online"}
                                  </span>
                                ) : null}

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${statusClasses(
                                    c.status,
                                    c.result
                                  )}`}
                                >
                                  {statusLabel(c.status, c.result, activeLocale)}
                                </span>

                                {momentumBadge ? (
                                  <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                    {momentumBadge.label}
                                  </span>
                                ) : null}
                              </div>

                              <div className="line-clamp-2 max-w-[86%] text-lg font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-[28px]">
                                {localizedTitle || c.title}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div
                            className={`relative flex h-full w-full items-end bg-gradient-to-br ${getThumbnailFallbackClasses(
                              c
                            )} transition duration-500 ease-out group-hover:scale-[1.02]`}
                          >
                            <div className="absolute inset-0 bg-black/20 transition duration-300 group-hover:bg-black/28" />

                            <div className="relative z-10 w-full p-4">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {hasOnlineVideo ? (
                                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100 backdrop-blur-sm">
                                    {activeLocale === "en"
                                      ? "Video online"
                                      : activeLocale === "es"
                                        ? "Video online"
                                        : activeLocale === "fr"
                                          ? "Video en ligne"
                                          : "Video online"}
                                  </span>
                                ) : null}

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm ${statusClasses(
                                    c.status,
                                    c.result
                                  )}`}
                                >
                                  {statusLabel(c.status, c.result, activeLocale)}
                                </span>

                                {momentumBadge ? (
                                  <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                    {momentumBadge.label}
                                  </span>
                                ) : null}
                              </div>

                              <div className="line-clamp-2 max-w-[86%] text-lg font-extrabold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:text-[28px]">
                                {localizedTitle || c.title}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-lg font-extrabold tracking-tight text-white">
                              {localizedTitle || c.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString(getIntlLocale(activeLocale), {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : null}
                            </div>
                          </div>

                          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
                            {supporterCount ?? 0}
                          </div>
                        </div>

                        <div className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                          {hasDescription ? (
                            <span className="break-words">{trimmedDescription}</span>
                          ) : (
                            <span className="text-slate-500">{ui.noDescription}</span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="text-[20px] font-extrabold tracking-tight text-blue-300">
                            {formatMoneyEUR(current, activeLocale)}
                          </div>

                          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                            {statusLabel(c.status, c.result, activeLocale)}
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                {hasMore ? (
                  <PrimaryButton
                    type="button"
                    variant="dark"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? ui.loadingMore
                      : ui.loadMore}
                  </PrimaryButton>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                    {ui.allShown}
                  </div>
                )}

                {!loading && !error && page > 0 && (
                  <div className="text-sm text-slate-400">{ui.page} {page}</div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showOnboarding && currentSlide && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeOnboardingAndRemember}
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-300/20 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            >
              <div className="bg-gradient-to-r from-amber-400/15 via-orange-300/10 to-white/[0.04] p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                      {currentSlide.eyebrow}
                    </p>
                    <h2 className="mt-3 text-2xl font-black leading-tight text-white md:text-3xl">
                      {currentSlide.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeOnboardingAndRemember}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {ui.onboardingClose}
                  </button>
                </div>

                <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                  {currentSlide.text}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  {onboardingSlides.map((_, index) => (
                    <div
                      key={index}
                      className={[
                        "h-2 rounded-full transition-all",
                        index === onboardingStep
                          ? "w-8 bg-amber-300"
                          : "w-2 bg-white/20",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 border-t border-white/10 bg-white/[0.03] p-6 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">{ui.onboardingCardChallenge}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {ui.onboardingCardChallengeText}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    {ui.onboardingCardParticipation}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {ui.onboardingCardParticipationText}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">{ui.onboardingCardVoting}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {ui.onboardingCardVotingText}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                <button
                  type="button"
                  onClick={handleBackOnboarding}
                  disabled={onboardingStep === 0}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ui.onboardingBack}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeOnboardingAndRemember}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    {ui.onboardingLater}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextOnboarding}
                    className="rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
                  >
                    {isLastOnboardingStep ? ui.onboardingDone : ui.onboardingNext}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 767px) {
          footer {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-x-0 bottom-3 z-50 hidden justify-center px-3 md:flex xl:hidden">
        <div className="w-full max-w-[760px] rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.90)_0%,rgba(7,13,22,0.96)_100%)] p-2 shadow-[0_16px_34px_rgba(0,0,0,0.44)] backdrop-blur-xl">
          <div className="grid h-[72px] grid-cols-5 items-end px-1 pb-1.5 pt-1 text-center text-[10px] font-semibold text-slate-400">
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-end gap-1 pb-1 ${
                (pathname ?? "").startsWith("/profile") ? "text-slate-200" : ""
              }`}
            >
              <span className="text-[11px]"><FooterNavIcon name="overview" /></span>
              <span>Home</span>
            </Link>

            <Link
              href="/challenges"
              className={`flex flex-col items-center justify-end gap-1 pb-1 ${
                (pathname ?? "").startsWith("/challenges") ? "text-slate-200" : ""
              }`}
            >
              <span className="text-[11px]"><FooterNavIcon name="challenges" /></span>
              <span>Challenges</span>
            </Link>

            <Link href="/challenges/create" className="flex flex-col items-center justify-start">
              <span className="relative -mt-[14px] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#2F7BFF_0%,#1E5EFF_100%)] text-lg font-bold text-white shadow-[0_10px_22px_rgba(24,94,255,0.30),0_0_0_4px_rgba(6,11,19,0.96)]">
                +
              </span>
            </Link>

            <Link
              href="/leaderboard"
              className={`flex flex-col items-center justify-end gap-1 pb-1 ${
                (pathname ?? "").startsWith("/leaderboard") ? "text-slate-200" : ""
              }`}
            >
              <span className="text-[11px]"><FooterNavIcon name="leaderboard" /></span>
              <span>Leaderboard</span>
            </Link>

            <Link
              href="/wallet"
              className={`flex flex-col items-center justify-end gap-1 pb-1 ${
                (pathname ?? "").startsWith("/wallet") ? "text-slate-200" : ""
              }`}
            >
              <span className="text-[11px]"><FooterNavIcon name="wallet" /></span>
              <span>Wallet</span>
            </Link>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

export default function ChallengesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Lädt...</div>}>
      <ChallengesPageContent />
    </Suspense>
  );
}