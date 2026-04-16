"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import { Toast } from "@/components/Toast";
import PrimaryButton from "@/components/ui/PrimaryButton";
import UserLink from "@/components/UserLink";

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
  minAmount: number | null;
  currentAmount: number | null;
  status: "funding" | "active" | "completed" | "voting" | string;
  result?: ChallengeResultType | null;
  createdAt?: string;
  thumbnailUrl?: string | null;

  owner?: ChallengeUserRef | null;
  Owner?: ChallengeUserRef | null;
  creator?: ChallengeUserRef | null;

  supporterCount?: number | null;

  winnerUsername?: string | null;
  winnerName?: string | null;
  winner?: WinnerUser | null;
  winnerUser?: WinnerUser | null;
};

type Resp = { data: Challenge[] } | Challenge[];

type FilterKey = "all" | "funding" | "active" | "voting" | "completed";
type SortKey =
  | "newest"
  | "title_asc"
  | "progress_desc"
  | "remaining_asc"
  | "status";

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

function getIntlLocale(locale: ChallengeLocale) {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es-ES";
  if (locale === "fr") return "fr-FR";
  return "de-DE";
}

function replaceUiText(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

type MyChallengesUi = {
  pageBadge: string;
  pageTitle: string;
  pageIntro: string;

  ownChallenges: string;
  totalFunding: string;
  totalGoals: string;

  newChallenge: string;
  refresh: string;

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

  loadingMineFailed: string;
  loadingMineFailedToast: string;

  noOwnChallengesTitle: string;
  noOwnChallengesText: string;

  tryAgain: string;
  open: string;
  details: string;
  edit: string;

  creatorUnknown: string;
  by: string;
  noDescription: string;

  currentAmount: string;
  goal: string;
  noGoal: string;
  supporters: string;
  progress: string;
  goalReached: string;
  leftToGoal: string;
  supportersShort: string;

  createdAt: string;

  fundingHookNearGoal: string;
  fundingHookStart: string;
  fundingHookGeneric: string;
  activeHook: string;
  votingHook: string;
  completedWinnerHook: string;
  completedFailedHook: string;
  fallbackHook: string;

  fundingMini: string;
  activeMini: string;
  votingMini: string;
  completedMini: string;
  fallbackMini: string;

  badgeReady: string;
  badgeAlmostThere: string;
  badgeBuilding: string;
  badgeLiveForParticipants: string;
  badgeCommunityDecides: string;
  badgeFinalResult: string;

  winnerLabel: string;
  completedWithoutWinner: string;
  challengeCompleted: string;

  inVoting: string;
};

const MY_CHALLENGES_UI: Record<ChallengeLocale, MyChallengesUi> = {
  de: {
    pageBadge: "Creator Bereich",
    pageTitle: "Meine Challenges",
    pageIntro:
      "Hier siehst du deine eigenen Challenges im gleichen Produkt-Look wie die Hauptübersicht — mit Status, Funding, Fortschritt und direktem Zugriff auf Details oder Bearbeitung.",

    ownChallenges: "Eigene Challenges",
    totalFunding: "Funding gesamt",
    totalGoals: "Zielsumme",

    newChallenge: "+ Neue Challenge",
    refresh: "Aktualisieren",

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

    loadingMineFailed: "Konnte deine Challenges nicht laden.",
    loadingMineFailedToast: "Deine Challenges konnten nicht geladen werden.",

    noOwnChallengesTitle: "Noch keine eigenen Challenges",
    noOwnChallengesText:
      "Erstelle deine erste Challenge oder passe Filter und Suche an.",

    tryAgain: "Erneut versuchen",
    open: "Öffnen",
    details: "Details",
    edit: "Bearbeiten",

    creatorUnknown: "Creator unbekannt",
    by: "Von",
    noDescription: "Keine Beschreibung vorhanden.",

    currentAmount: "Aktueller Stand",
    goal: "Ziel",
    noGoal: "Kein Ziel",
    supporters: "Unterstützer",
    progress: "Fortschritt",
    goalReached: "✅ Ziel erreicht",
    leftToGoal: "🎯 Noch {amount} bis zum Ziel",
    supportersShort: "🔥 {count} Unterstützer",

    createdAt: "Erstellt",

    fundingHookNearGoal: "Fast am Ziel – nur noch {amount} bis zum Start.",
    fundingHookStart:
      "Noch {amount} bis zum Ziel. Unterstützer machen diese Challenge startklar.",
    fundingHookGeneric:
      "Diese Challenge sammelt gerade Unterstützung und baut ihren Pot auf.",
    activeHook: "Challenge läuft – jetzt mit eigenem Versuch antreten.",
    votingHook:
      "Voting aktiv – die Community entscheidet gerade, welcher Versuch gewinnt.",
    completedWinnerHook: "Gewinner steht fest: {winner}",
    completedFailedHook: "Diese Challenge wurde ohne Gewinner beendet.",
    fallbackHook: "Status verfügbar – öffne die Challenge für alle Details.",

    fundingMini:
      "Unterstützer erhöhen den Pot, bevor die Challenge richtig Fahrt aufnimmt.",
    activeMini:
      "Jetzt können Teilnehmer gültige Versuche einreichen und sich den Sieg holen.",
    votingMini:
      "Jetzt zählt die Meinung der Community – das Voting entscheidet den Gewinner.",
    completedMini:
      "Das Ergebnis steht fest. Du kannst dir ansehen, wie die Challenge ausgegangen ist.",
    fallbackMini:
      "Öffne die Challenge, um den aktuellen Stand und die Regeln zu sehen.",

    badgeReady: "Startklar",
    badgeAlmostThere: "Fast am Ziel",
    badgeBuilding: "Im Aufbau",
    badgeLiveForParticipants: "Live für Teilnehmer",
    badgeCommunityDecides: "Community entscheidet",
    badgeFinalResult: "Ergebnis steht fest",

    winnerLabel: "🏆 Gewinner:",
    completedWithoutWinner: "❌ Ohne Gewinner beendet",
    challengeCompleted: "🏁 Challenge abgeschlossen",

    inVoting: "Im Voting",
  },

  en: {
    pageBadge: "Creator area",
    pageTitle: "My challenges",
    pageIntro:
      "Here you see your own challenges in the same product look as the main overview — with status, funding, progress and direct access to details or editing.",

    ownChallenges: "Own challenges",
    totalFunding: "Total funding",
    totalGoals: "Goal total",

    newChallenge: "+ New challenge",
    refresh: "Refresh",

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

    loadingMineFailed: "Could not load your challenges.",
    loadingMineFailedToast: "Your challenges could not be loaded.",

    noOwnChallengesTitle: "No own challenges yet",
    noOwnChallengesText:
      "Create your first challenge or adjust filters and search.",

    tryAgain: "Try again",
    open: "Open",
    details: "Details",
    edit: "Edit",

    creatorUnknown: "Creator unknown",
    by: "By",
    noDescription: "No description available.",

    currentAmount: "Current amount",
    goal: "Goal",
    noGoal: "No goal",
    supporters: "Supporters",
    progress: "Progress",
    goalReached: "✅ Goal reached",
    leftToGoal: "🎯 {amount} left to goal",
    supportersShort: "🔥 {count} supporters",

    createdAt: "Created",

    fundingHookNearGoal: "Almost there — only {amount} left to launch.",
    fundingHookStart:
      "{amount} left to goal. Supporters are getting this challenge ready.",
    fundingHookGeneric:
      "This challenge is currently gathering support and building its pot.",
    activeHook: "Challenge is live — now enter with your own attempt.",
    votingHook:
      "Voting is live — the community is deciding which attempt wins.",
    completedWinnerHook: "Winner decided: {winner}",
    completedFailedHook: "This challenge ended without a winner.",
    fallbackHook: "Status available — open the challenge for all details.",

    fundingMini:
      "Supporters increase the pot before the challenge really takes off.",
    activeMini:
      "Participants can now submit valid attempts and fight for the win.",
    votingMini:
      "Now the community opinion matters — voting decides the winner.",
    completedMini:
      "The result is final. You can open the challenge to see how it ended.",
    fallbackMini:
      "Open the challenge to see the current status and rules.",

    badgeReady: "Ready to launch",
    badgeAlmostThere: "Almost there",
    badgeBuilding: "Building up",
    badgeLiveForParticipants: "Live for participants",
    badgeCommunityDecides: "Community decides",
    badgeFinalResult: "Final result",

    winnerLabel: "🏆 Winner:",
    completedWithoutWinner: "❌ Ended without winner",
    challengeCompleted: "🏁 Challenge completed",

    inVoting: "In voting",
  },

  es: {
    pageBadge: "Área del creador",
    pageTitle: "Mis retos",
    pageIntro:
      "Aquí ves tus propios retos con el mismo aspecto de producto que la vista principal: con estado, financiación, progreso y acceso directo a detalles o edición.",

    ownChallenges: "Retos propios",
    totalFunding: "Financiación total",
    totalGoals: "Suma de objetivos",

    newChallenge: "+ Nuevo reto",
    refresh: "Actualizar",

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
    remainingAsc: "Hasta objetivo (poco → mucho)",
    statusSort: "Estado (Financiación → Completado)",

    loadingMineFailed: "No se pudieron cargar tus retos.",
    loadingMineFailedToast: "Tus retos no se pudieron cargar.",

    noOwnChallengesTitle: "Todavía no tienes retos propios",
    noOwnChallengesText:
      "Crea tu primer reto o ajusta los filtros y la búsqueda.",

    tryAgain: "Intentar de nuevo",
    open: "Abrir",
    details: "Detalles",
    edit: "Editar",

    creatorUnknown: "Creador desconocido",
    by: "Por",
    noDescription: "No hay descripción disponible.",

    currentAmount: "Cantidad actual",
    goal: "Objetivo",
    noGoal: "Sin objetivo",
    supporters: "Patrocinadores",
    progress: "Progreso",
    goalReached: "✅ Objetivo alcanzado",
    leftToGoal: "🎯 Faltan {amount} para el objetivo",
    supportersShort: "🔥 {count} patrocinadores",

    createdAt: "Creado",

    fundingHookNearGoal: "Casi listo: solo faltan {amount} para arrancar.",
    fundingHookStart:
      "Faltan {amount} para el objetivo. Los apoyos están dejando este reto listo para arrancar.",
    fundingHookGeneric:
      "Este reto está reuniendo apoyo y construyendo su bote.",
    activeHook: "El reto está activo: ahora toca participar con tu propio intento.",
    votingHook:
      "La votación está activa: la comunidad decide qué intento gana.",
    completedWinnerHook: "Ganador decidido: {winner}",
    completedFailedHook: "Este reto terminó sin ganador.",
    fallbackHook: "Estado disponible: abre el reto para ver todos los detalles.",

    fundingMini:
      "Los apoyos aumentan el bote antes de que el reto despegue de verdad.",
    activeMini:
      "Ahora los participantes pueden enviar intentos válidos y luchar por la victoria.",
    votingMini:
      "Ahora cuenta la opinión de la comunidad: la votación decide al ganador.",
    completedMini:
      "El resultado ya es definitivo. Puedes abrir el reto para ver cómo terminó.",
    fallbackMini:
      "Abre el reto para ver el estado actual y las reglas.",

    badgeReady: "Listo para arrancar",
    badgeAlmostThere: "Casi listo",
    badgeBuilding: "En construcción",
    badgeLiveForParticipants: "Activo para participantes",
    badgeCommunityDecides: "La comunidad decide",
    badgeFinalResult: "Resultado final",

    winnerLabel: "🏆 Ganador:",
    completedWithoutWinner: "❌ Terminado sin ganador",
    challengeCompleted: "🏁 Reto completado",

    inVoting: "En votación",
  },

  fr: {
    pageBadge: "Espace créateur",
    pageTitle: "Mes défis",
    pageIntro:
      "Ici, tu vois tes propres défis dans le même style produit que la vue principale — avec statut, financement, progression et accès direct aux détails ou à l’édition.",

    ownChallenges: "Défis personnels",
    totalFunding: "Financement total",
    totalGoals: "Somme des objectifs",

    newChallenge: "+ Nouveau défi",
    refresh: "Actualiser",

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
    remainingAsc: "Jusqu’à l’objectif (peu → beaucoup)",
    statusSort: "Statut (Financement → Complété)",

    loadingMineFailed: "Impossible de charger tes défis.",
    loadingMineFailedToast: "Tes défis n’ont pas pu être chargés.",

    noOwnChallengesTitle: "Aucun défi personnel pour le moment",
    noOwnChallengesText:
      "Crée ton premier défi ou ajuste les filtres et la recherche.",

    tryAgain: "Réessayer",
    open: "Ouvrir",
    details: "Détails",
    edit: "Modifier",

    creatorUnknown: "Créateur inconnu",
    by: "Par",
    noDescription: "Aucune description disponible.",

    currentAmount: "Montant actuel",
    goal: "Objectif",
    noGoal: "Aucun objectif",
    supporters: "Soutiens",
    progress: "Progression",
    goalReached: "✅ Objectif atteint",
    leftToGoal: "🎯 Il reste {amount} avant l’objectif",
    supportersShort: "🔥 {count} soutiens",

    createdAt: "Créé",

    fundingHookNearGoal:
      "Presque prêt — il ne reste plus que {amount} avant le lancement.",
    fundingHookStart:
      "Il reste {amount} avant l’objectif. Les soutiens rendent ce défi prêt à démarrer.",
    fundingHookGeneric:
      "Ce défi rassemble actuellement du soutien et construit sa cagnotte.",
    activeHook: "Le défi est en cours — c’est le moment de participer avec ta propre tentative.",
    votingHook:
      "Le vote est en cours — la communauté décide quelle tentative gagne.",
    completedWinnerHook: "Gagnant décidé : {winner}",
    completedFailedHook: "Ce défi s’est terminé sans gagnant.",
    fallbackHook: "Statut disponible — ouvre le défi pour tous les détails.",

    fundingMini:
      "Les soutiens augmentent la cagnotte avant que le défi ne prenne vraiment son élan.",
    activeMini:
      "Les participants peuvent maintenant soumettre des tentatives valides et se battre pour gagner.",
    votingMini:
      "Maintenant, l’avis de la communauté compte — le vote décide du gagnant.",
    completedMini:
      "Le résultat est définitif. Tu peux ouvrir le défi pour voir comment il s’est terminé.",
    fallbackMini:
      "Ouvre le défi pour voir le statut actuel et les règles.",

    badgeReady: "Prêt à démarrer",
    badgeAlmostThere: "Presque prêt",
    badgeBuilding: "En construction",
    badgeLiveForParticipants: "Ouvert aux participants",
    badgeCommunityDecides: "La communauté décide",
    badgeFinalResult: "Résultat final",

    winnerLabel: "🏆 Gagnant :",
    completedWithoutWinner: "❌ Terminé sans gagnant",
    challengeCompleted: "🏁 Défi complété",

    inVoting: "En vote",
  },
};

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function statusLabel(
  status: string | undefined,
  result: string | null | undefined,
  ui: MyChallengesUi
) {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const normalizedResult = String(result ?? "").toLowerCase();

  if (normalizedStatus === "funding") return ui.funding;
  if (normalizedStatus === "active") return ui.active;
  if (normalizedStatus === "voting") return ui.voting;
  if (normalizedStatus === "completed" && normalizedResult === "failed") {
    return ui.completed;
  }
  if (normalizedStatus === "completed") return ui.completed;
  return status ?? "—";
}

function statusClasses(status?: string, result?: string | null) {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const normalizedResult = String(result ?? "").toLowerCase();

  if (normalizedStatus === "funding") {
    return "border-amber-400/30 bg-amber-400/15 text-amber-100";
  }
  if (normalizedStatus === "active") {
    return "border-cyan-400/30 bg-cyan-400/15 text-cyan-100";
  }
  if (normalizedStatus === "voting") {
    return "border-indigo-400/30 bg-indigo-400/15 text-indigo-100";
  }
  if (normalizedStatus === "completed" && normalizedResult === "failed") {
    return "border-red-500/30 bg-red-500/15 text-red-100";
  }
  if (normalizedStatus === "completed") {
    return "border-emerald-400/30 bg-emerald-400/15 text-emerald-100";
  }
  return "border-white/10 bg-white/5 text-slate-300";
}

function tabClasses(active: boolean) {
  return active
    ? "rounded-2xl border border-blue-400/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]"
    : "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white";
}

function getCreatorUser(challenge: Challenge): {
  username: string | null;
  avatarUrl: string | null;
} {
  const ref = challenge.owner ?? challenge.Owner ?? challenge.creator ?? null;
  const username = ref?.username ?? null;
  const avatarUrl = ref?.avatarUrl ?? null;

  if (!username || typeof username !== "string") {
    return { username: null, avatarUrl };
  }

  const cleaned = username.trim();
  return {
    username: cleaned.length > 0 ? cleaned : null,
    avatarUrl,
  };
}

function getWinnerUser(challenge: Challenge): {
  username: string | null;
  avatarUrl: string | null;
} {
  const username =
    challenge.winnerUsername ??
    challenge.winnerUser?.username ??
    challenge.winner?.username ??
    challenge.winnerName ??
    null;

  const avatarUrl =
    challenge.winnerUser?.avatarUrl ?? challenge.winner?.avatarUrl ?? null;

  if (!username || typeof username !== "string") {
    return { username: null, avatarUrl };
  }

  const cleaned = username.trim();
  return {
    username: cleaned.length > 0 ? cleaned : null,
    avatarUrl,
  };
}

function getCompletedInfo(challenge: Challenge, ui: MyChallengesUi) {
  const winner = getWinnerUser(challenge);
  const result = String(challenge.result ?? "").trim().toLowerCase();
  const status = String(challenge.status ?? "").trim().toLowerCase();

  if (status !== "completed") return null;

  if (winner.username) {
    return {
      kind: "winner" as const,
      label: ui.winnerLabel,
      username: winner.username,
      avatarUrl: winner.avatarUrl,
      className:
        "rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-100",
    };
  }

  if (result === "failed") {
    return {
      kind: "failed" as const,
      label: ui.completedWithoutWinner,
      username: null,
      avatarUrl: null,
      className:
        "rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-100",
    };
  }

  return {
    kind: "completed" as const,
    label: ui.challengeCompleted,
    username: null,
    avatarUrl: null,
    className:
      "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200",
  };
}

function getCardHook(
  challenge: Challenge,
  ui: MyChallengesUi,
  locale: ChallengeLocale
) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();
  const current = challenge.currentAmount ?? 0;
  const goal = challenge.minAmount ?? 0;
  const remaining = goal > 0 ? Math.max(0, goal - current) : 0;
  const winner = getWinnerUser(challenge).username;

  if (status === "funding") {
    if (goal > 0 && remaining > 0) {
      if (remaining <= goal * 0.15) {
        return {
          text: replaceUiText(ui.fundingHookNearGoal, {
            amount: formatMoneyEUR(remaining, locale),
          }),
          className:
            "rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100",
        };
      }

      return {
        text: replaceUiText(ui.fundingHookStart, {
          amount: formatMoneyEUR(remaining, locale),
        }),
        className:
          "rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100",
        };
    }

    return {
      text: ui.fundingHookGeneric,
      className:
        "rounded-2xl border border-amber-400/30 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100",
    };
  }

  if (status === "active") {
    return {
      text: ui.activeHook,
      className:
        "rounded-2xl border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-100",
    };
  }

  if (status === "voting") {
    return {
      text: ui.votingHook,
      className:
        "rounded-2xl border border-indigo-400/30 bg-indigo-500/15 px-3 py-2 text-sm font-semibold text-indigo-100",
    };
  }

  if (status === "completed" && winner) {
    return {
      text: replaceUiText(ui.completedWinnerHook, { winner }),
      className:
        "rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100",
    };
  }

  if (status === "completed" && result === "failed") {
    return {
      text: ui.completedFailedHook,
      className:
        "rounded-2xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-100",
    };
  }

  return {
    text: ui.fallbackHook,
    className:
      "rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200",
  };
}

function getCardMiniExplanation(challenge: Challenge, ui: MyChallengesUi) {
  const status = String(challenge.status ?? "").toLowerCase();

  if (status === "funding") return ui.fundingMini;
  if (status === "active") return ui.activeMini;
  if (status === "voting") return ui.votingMini;
  if (status === "completed") return ui.completedMini;
  return ui.fallbackMini;
}

function getMomentumBadge(challenge: Challenge, ui: MyChallengesUi) {
  const status = String(challenge.status ?? "").toLowerCase();
  const current = challenge.currentAmount ?? 0;
  const goal = challenge.minAmount ?? 0;

  if (status === "funding" && goal > 0) {
    const pct = (current / goal) * 100;

    if (pct >= 100) {
      return {
        label: ui.badgeReady,
        className:
          "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-100",
      };
    }

    if (pct >= 80) {
      return {
        label: ui.badgeAlmostThere,
        className:
          "rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-100",
      };
    }

    return {
      label: ui.badgeBuilding,
      className:
        "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300",
    };
  }

  if (status === "active") {
    return {
      label: ui.badgeLiveForParticipants,
      className:
        "rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-100",
    };
  }

  if (status === "voting") {
    return {
      label: ui.badgeCommunityDecides,
      className:
        "rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-100",
    };
  }

  if (status === "completed") {
    return {
      label: ui.badgeFinalResult,
      className:
        "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-100",
    };
  }

  return null;
}

function getCardFrameClasses(challenge: Challenge) {
  const status = String(challenge.status ?? "").toLowerCase();
  const result = String(challenge.result ?? "").toLowerCase();

  if (status === "funding") {
    return {
      outer:
        "group overflow-hidden rounded-[26px] border border-amber-400/25 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-amber-400/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
      top:
        "border-b border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-300/5 px-5 py-4",
      body: "p-4",
      stat: "rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3.5",
      progressWrap:
        "mt-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3.5",
      footer: "mt-3 border-t border-amber-400/20 pt-3",
      accent: "bg-amber-400",
    };
  }

  if (status === "active") {
    return {
      outer:
        "group overflow-hidden rounded-[26px] border border-cyan-400/25 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-cyan-400/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
      top:
        "border-b border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-400/5 px-5 py-4",
      body: "p-4",
      stat: "rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3.5",
      progressWrap:
        "mt-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-3.5",
      footer: "mt-3 border-t border-cyan-400/20 pt-3",
      accent: "bg-cyan-400",
    };
  }

  if (status === "voting") {
    return {
      outer:
        "group overflow-hidden rounded-[26px] border border-indigo-400/25 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-indigo-400/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
      top:
        "border-b border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-400/5 px-5 py-4",
      body: "p-4",
      stat: "rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-3.5",
      progressWrap:
        "mt-3 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 p-3.5",
      footer: "mt-3 border-t border-indigo-400/20 pt-3",
      accent: "bg-indigo-400",
    };
  }

  if (status === "completed" && result === "failed") {
    return {
      outer:
        "group overflow-hidden rounded-[26px] border border-red-400/25 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-red-400/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
      top:
        "border-b border-red-400/20 bg-gradient-to-br from-red-500/10 via-transparent to-rose-400/5 px-5 py-4",
      body: "p-4",
      stat: "rounded-2xl border border-red-400/25 bg-red-500/10 p-3.5",
      progressWrap:
        "mt-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-3.5",
      footer: "mt-3 border-t border-red-400/20 pt-3",
      accent: "bg-red-400",
    };
  }

  if (status === "completed") {
    return {
      outer:
        "group overflow-hidden rounded-[26px] border border-emerald-400/25 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-emerald-400/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
      top:
        "border-b border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-400/5 px-5 py-4",
      body: "p-4",
      stat: "rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5",
      progressWrap:
        "mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3.5",
      footer: "mt-3 border-t border-emerald-400/20 pt-3",
      accent: "bg-emerald-400",
    };
  }

  return {
    outer:
      "group overflow-hidden rounded-[26px] border border-white/10 bg-[#0A1222] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.45)]",
    top:
      "border-b border-white/10 bg-gradient-to-br from-white/[0.04] via-transparent to-slate-500/5 px-5 py-4",
    body: "p-4",
    stat: "rounded-2xl border border-white/10 bg-white/[0.04] p-3.5",
    progressWrap: "mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5",
    footer: "mt-3 border-t border-white/10 pt-3",
    accent: "bg-slate-300",
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

const STATUS_ORDER: Record<string, number> = {
  funding: 1,
  active: 2,
  voting: 3,
  completed: 4,
};

export default function MyChallengesPage() {
  const router = useRouter();
  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => MY_CHALLENGES_UI[activeLocale], [activeLocale]);

  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadMine = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const data = await apiJson<Resp>("/challenges/me", { method: "GET" }, true);
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        router.replace("/auth/login");
        return;
      }

      setError(ui.loadingMineFailed);
      setItems([]);
      setToast({
        message: ui.loadingMineFailedToast,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [router, ui]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      funding: items.filter((c) => c.status === "funding").length,
      active: items.filter((c) => c.status === "active").length,
      voting: items.filter((c) => c.status === "voting").length,
      completed: items.filter((c) => c.status === "completed").length,
    };
  }, [items]);

  const totalCurrent = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.currentAmount ?? 0), 0),
    [items]
  );

  const totalGoals = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.minAmount ?? 0), 0),
    [items]
  );

  const preparedItems = useMemo(() => {
    let list =
      filter === "all" ? items : items.filter((c) => (c.status ?? "") === filter);

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((c) => {
        const creator = getCreatorUser(c).username ?? "";
        const hay = `${c.title ?? ""} ${c.description ?? ""} ${creator}`.toLowerCase();
        return hay.includes(query);
      });
    }

    const arr = [...list];

    if (sort === "title_asc") {
      arr.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", "de"));
    } else if (sort === "progress_desc") {
      arr.sort((a, b) => {
        const aGoal = a.minAmount ?? 0;
        const bGoal = b.minAmount ?? 0;
        const aRatio = aGoal > 0 ? (a.currentAmount ?? 0) / aGoal : 0;
        const bRatio = bGoal > 0 ? (b.currentAmount ?? 0) / bGoal : 0;
        return bRatio - aRatio;
      });
    } else if (sort === "remaining_asc") {
      arr.sort((a, b) => {
        const aRemaining =
          (a.minAmount ?? 0) > 0
            ? Math.max(0, (a.minAmount ?? 0) - (a.currentAmount ?? 0))
            : Number.POSITIVE_INFINITY;
        const bRemaining =
          (b.minAmount ?? 0) > 0
            ? Math.max(0, (b.minAmount ?? 0) - (b.currentAmount ?? 0))
            : Number.POSITIVE_INFINITY;
        return aRemaining - bRemaining;
      });
    } else if (sort === "status") {
      arr.sort((a, b) => {
        const sa = STATUS_ORDER[a.status ?? ""] ?? 999;
        const sb = STATUS_ORDER[b.status ?? ""] ?? 999;
        if (sa !== sb) return sa - sb;

        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    } else {
      arr.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return arr;
  }, [items, filter, q, sort]);

  return (
    <main className="min-h-screen min-h-dvh bg-slate-950">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-8 overflow-hidden rounded-[32px] border border-blue-500/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#050B17_0%,#09101D_55%,#0B1322_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <span className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  {ui.pageBadge}
                </span>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {ui.pageTitle}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {ui.pageIntro}
                </p>

                {!loading && !error && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {ui.ownChallenges}:{" "}
                      <span className="font-semibold text-white">{counts.all}</span>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {ui.totalFunding}: {formatMoneyEUR(totalCurrent, activeLocale)}
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {ui.totalGoals}: {formatMoneyEUR(totalGoals, activeLocale)}
                    </div>
                  </div>
                )}
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
                  onClick={loadMine}
                  className="w-full sm:w-auto"
                >
                  {ui.refresh}
                </PrimaryButton>
              </div>
            </div>
          </div>

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mb-4 flex flex-wrap gap-2"
            >
              <button
                onClick={() => setFilter("all")}
                className={tabClasses(filter === "all")}
              >
                {ui.all}
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setFilter("funding")}
                className={tabClasses(filter === "funding")}
              >
                {ui.funding}
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                  {counts.funding}
                </span>
              </button>

              <button
                onClick={() => setFilter("active")}
                className={tabClasses(filter === "active")}
              >
                {ui.active}
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                  {counts.active}
                </span>
              </button>

              <button
                onClick={() => setFilter("voting")}
                className={tabClasses(filter === "voting")}
              >
                {ui.voting}
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
                  {counts.voting}
                </span>
              </button>

              <button
                onClick={() => setFilter("completed")}
                className={tabClasses(filter === "completed")}
              >
                {ui.completed}
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-white">
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
                  <div className="text-sm font-semibold text-slate-300">{ui.search}</div>
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
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0A1222] p-5 shadow-xl ring-1 ring-white/5"
                >
                  <div className="animate-pulse">
                    <div className="aspect-[16/9] rounded-2xl bg-slate-700/60" />
                    <div className="mt-4 h-6 w-24 rounded-full bg-slate-700/60" />
                    <div className="mt-4 h-8 w-3/4 rounded bg-slate-700/60" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-slate-700/60" />
                    <div className="mt-4 h-4 w-full rounded bg-slate-700/60" />
                    <div className="mt-2 h-4 w-5/6 rounded bg-slate-700/60" />
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="h-20 rounded-2xl bg-slate-700/60" />
                      <div className="h-20 rounded-2xl bg-slate-700/60" />
                      <div className="h-20 rounded-2xl bg-slate-700/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && preparedItems.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-[#0B1322] p-8 text-center shadow-2xl ring-1 ring-white/5">
              <div className="mb-2 text-xl font-extrabold text-white">
                {ui.noOwnChallengesTitle}
              </div>
              <p className="text-slate-300">
                {ui.noOwnChallengesText}
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 shadow-sm">
              <p className="font-semibold text-red-100">{error}</p>
              <div className="mt-4">
                <PrimaryButton type="button" variant="dark" onClick={loadMine}>
                  {ui.tryAgain}
                </PrimaryButton>
              </div>
            </div>
          )}

          {!loading && !error && preparedItems.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {preparedItems.map((c, index) => {
                const current = c.currentAmount ?? 0;
                const goal = c.minAmount ?? 0;
                const hasGoal = goal > 0;
                const pctRaw = hasGoal ? (current / goal) * 100 : 0;
                const pctBar = hasGoal ? clamp(pctRaw, 0, 100) : 0;
                const remainingToStart = hasGoal ? Math.max(0, goal - current) : null;
                const startReached = hasGoal && remainingToStart === 0;

                const supporterCount =
                  typeof c.supporterCount === "number" ? c.supporterCount : 0;
                const creator = getCreatorUser(c);
                const completedInfo = getCompletedInfo(c, ui);
                const trimmedDescription = c.description?.trim() ?? "";
                const hasDescription = trimmedDescription.length > 0;

                const cardHook = getCardHook(c, ui, activeLocale);
                const cardMiniExplanation = getCardMiniExplanation(c, ui);
                const momentumBadge = getMomentumBadge(c, ui);
                const frame = getCardFrameClasses(c);
                const resolvedThumbnailUrl = resolveThumbnailUrl(c.thumbnailUrl);

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                    className={frame.outer}
                  >
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-black/5 bg-slate-200">
                      {resolvedThumbnailUrl ? (
                        <>
                          <img
                            src={resolvedThumbnailUrl}
                            alt={c.title || ui.pageTitle}
                            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10 transition duration-300 group-hover:from-black/75 group-hover:via-black/30 group-hover:to-black/20" />
                          <div className="absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/15" />

                          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${statusClasses(
                                  c.status,
                                  c.result
                                )}`}
                              >
                                {statusLabel(c.status, c.result, ui)}
                              </span>

                              {momentumBadge ? (
                                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                  {momentumBadge.label}
                                </span>
                              ) : null}

                              {startReached && c.status !== "completed" ? (
                                <span className="rounded-full border border-green-300/40 bg-green-400/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                  {ui.goalReached}
                                </span>
                              ) : null}
                            </div>

                            <div className="line-clamp-2 max-w-[85%] text-xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-2xl">
                              {c.title}
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
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm ${statusClasses(
                                  c.status,
                                  c.result
                                )}`}
                              >
                                {statusLabel(c.status, c.result, ui)}
                              </span>

                              {momentumBadge ? (
                                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                  {momentumBadge.label}
                                </span>
                              ) : null}

                              {startReached && c.status !== "completed" ? (
                                <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                  {ui.goalReached}
                                </span>
                              ) : null}
                            </div>

                            <div className="line-clamp-2 max-w-[85%] text-xl font-extrabold leading-tight text-white drop-shadow">
                              {c.title}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={frame.top}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                                c.status,
                                c.result
                              )}`}
                            >
                              {statusLabel(c.status, c.result, ui)}
                            </div>

                            {momentumBadge ? (
                              <div className={momentumBadge.className}>
                                {momentumBadge.label}
                              </div>
                            ) : null}

                            {String(c.status).toLowerCase() === "voting" ? (
                              <div className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-100">
                                {ui.inVoting}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-2">
                            {creator.username ? (
                              <div className="flex items-center gap-2 text-sm text-slate-200">
                                <span className="text-slate-400">{ui.by}</span>
                                <UserLink
                                  username={creator.username}
                                  avatarUrl={creator.avatarUrl}
                                  avatarSize={28}
                                  className="text-sm"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">
                                {ui.creatorUnknown}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 min-h-[44px] text-sm leading-6 text-slate-300">
                            {hasDescription ? (
                              <div className="line-clamp-2 break-words">
                                {trimmedDescription}
                              </div>
                            ) : (
                              <span className="text-slate-400">
                                {ui.noDescription}
                              </span>
                            )}
                          </div>

                          <div className={`mt-3 ${cardHook.className}`}>
                            {cardHook.text}
                          </div>

                          <div className="mt-2 text-xs leading-5 text-slate-400">
                            {cardMiniExplanation}
                          </div>
                        </div>

                        <Link href={`/challenges/${c.id}`}>
                          <PrimaryButton
                            variant="secondary"
                            className="h-10 shrink-0 px-4"
                          >
                            {ui.open}
                          </PrimaryButton>
                        </Link>
                      </div>
                    </div>

                    <div className={frame.body}>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className={frame.stat}>
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {ui.currentAmount}
                          </div>
                          <div className="mt-1.5 text-lg font-extrabold text-white">
                            {formatMoneyEUR(current, activeLocale)}
                          </div>
                        </div>

                        <div className={frame.stat}>
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {ui.goal}
                          </div>
                          <div className="mt-1.5 text-lg font-extrabold text-white">
                            {hasGoal ? formatMoneyEUR(goal, activeLocale) : ui.noGoal}
                          </div>
                        </div>

                        <div className={frame.stat}>
                          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {ui.supporters}
                          </div>
                          <div className="mt-1.5 text-lg font-extrabold text-white">
                            {supporterCount}
                          </div>
                        </div>
                      </div>

                      {hasGoal ? (
                        <div className={frame.progressWrap}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-200">
                              {ui.progress}
                            </span>
                            <span className="font-semibold text-slate-400">
                              {Math.round(pctRaw)}%
                            </span>
                          </div>

                          <div className="h-2.5 w-full rounded-full bg-white/10 ring-1 ring-white/10">
                            <div
                              className={`h-2.5 rounded-full transition-all ${frame.accent}`}
                              style={{ width: `${pctBar}%` }}
                              aria-label="Progress"
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {!startReached && remainingToStart != null ? (
                              <div className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-100">
                                {replaceUiText(ui.leftToGoal, {
                                  amount: formatMoneyEUR(remainingToStart, activeLocale),
                                })}
                              </div>
                            ) : (
                              <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-100">
                                {ui.goalReached}
                              </div>
                            )}

                            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-extrabold text-slate-200">
                              {replaceUiText(ui.supportersShort, { count: supporterCount })}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {completedInfo ? (
                        <div className="mt-3">
                          {completedInfo.kind === "winner" &&
                          completedInfo.username ? (
                            <div className={completedInfo.className}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{completedInfo.label}</span>
                                <UserLink
                                  username={completedInfo.username}
                                  avatarUrl={completedInfo.avatarUrl}
                                  avatarSize={28}
                                  className="text-emerald-100"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className={completedInfo.className}>
                              {completedInfo.label}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className={frame.footer}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/challenges/${c.id}`}>
                              <PrimaryButton
                                type="button"
                                variant="secondary"
                                className="h-10 px-4"
                              >
                                {ui.details}
                              </PrimaryButton>
                            </Link>

                            <Link href={`/challenges/${c.id}/edit`}>
                              <PrimaryButton
                                type="button"
                                variant="dark"
                                className="h-10 px-4"
                              >
                                {ui.edit}
                              </PrimaryButton>
                            </Link>
                          </div>

                          <div className="text-xs text-slate-400">
                            {c.createdAt
                              ? `${ui.createdAt}: ${new Date(c.createdAt).toLocaleString(
                                  getIntlLocale(activeLocale)
                                )}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
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