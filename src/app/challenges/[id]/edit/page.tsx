"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import TextField from "@/components/ui/TextField";
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

function replaceUiText(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

type EditUi = {
  missingChallengeId: string;
  loadingChallenge: string;
  back: string;

  editChallengeBadge: string;
  editChallengeTitle: string;
  editChallengeIntro: string;

  liveRequiredShort: string;
  verifiedRecordingShort: string;
  from500Short: string;
  riskLevel2Short: string;
  adultsOnlyShort: string;
  minDurationShort: string;

  titleRequired: string;
  fundingMinError: string;
  requiredSecondsInvalid: string;
  requiredSecondsRange: string;
  requiredSecondsSaveRange: string;
  risk18Required: string;
  ownerForbidden: string;
  unknownError: string;

  thumbnailTypeError: string;
  thumbnailSizeError: string;
  requestFailed: string;

  funding: string;
  active: string;
  voting: string;
  completed: string;

  basicData: string;
  basicDataSubtitle: string;
  title: string;
  titlePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  descriptionHint: string;
  thumbnail: string;
  thumbnailChoose: string;
  thumbnailChange: string;
  thumbnailHelper: string;
  thumbnailPreview: string;

  fundingParticipation: string;
  fundingParticipationSubtitle: string;
  fundingGoal: string;
  fundingGoalPlaceholder: string;
  fundingGoalHint: string;
  requiredSeconds: string;
  requiredSecondsPlaceholder: string;
  requiredSecondsHint: string;
  riskLevel: string;
  riskLevelHint: string;

  harmless: string;
  warning: string;
  highRisk: string;

  challenge18: string;
  challenge18Hint: string;

  status: string;
  statusHint: string;

  liveRequiredTitle: string;
  liveRequiredText: string;
  standardModeTitle: string;
  standardModeText: string;

  importantNotice: string;
  importantNoticeText: string;

  riskMetaHarmlessTitle: string;
  riskMetaHarmlessText: string;
  riskMetaWarningTitle: string;
  riskMetaWarningText: string;
  riskMetaHighTitle: string;
  riskMetaHighText: string;

  productLogic: string;
  productLogicLive: string;
  productLogicRecorded: string;

  preview: string;
  previewSubtitle: string;
  participation: string;
  release: string;
  open: string;
  noTitleYet: string;
  noDescriptionYet: string;

  previewSavedLive: string;
  previewSavedRecorded: string;

  footerHint: string;
  saveChanges: string;
  saving: string;
  uploadingImage: string;
  cancel: string;
};

const EDIT_UI_TEXT: Record<ChallengeLocale, EditUi> = {
  de: {
    missingChallengeId: "Fehlende Challenge-ID",
    loadingChallenge: "Lade Challenge…",
    back: "← Zurück",

    editChallengeBadge: "Challenge bearbeiten",
    editChallengeTitle: "Challenge aktualisieren",
    editChallengeIntro:
      "Passe Titel, Beschreibung, Vorschaubild, Funding-Ziel und Regeln an. Ab 500 € Funding-Ziel greift automatisch Live-Pflicht.",

    liveRequiredShort: "🔴 Live erforderlich",
    verifiedRecordingShort: "🎥 Verifizierte Aufnahme",
    from500Short: "💶 Ab 500 €",
    riskLevel2Short: "⚠️ Risk Level 2",
    adultsOnlyShort: "🔞 Ab 18",
    minDurationShort: "Mindestdauer",

    titleRequired: "Titel darf nicht leer sein.",
    fundingMinError: "Das Funding-Ziel muss mindestens 10 € betragen.",
    requiredSecondsInvalid: "Bitte gib eine gültige Sekunden-Zahl ein.",
    requiredSecondsRange: "Erlaubt sind 1 bis 600 Sekunden.",
    requiredSecondsSaveRange: "Mindestdauer muss zwischen 1 und 600 Sekunden liegen.",
    risk18Required: "Für Risiko-Level 2 muss die Challenge als 18+ markiert sein.",
    ownerForbidden: "Du bist nicht der Owner dieser Challenge.",
    unknownError: "Unbekannter Fehler",

    thumbnailTypeError: "Erlaubt sind nur JPG, PNG oder WEBP.",
    thumbnailSizeError: "Das Bild darf maximal 5 MB groß sein.",
    requestFailed: "Anfrage fehlgeschlagen",

    funding: "Funding",
    active: "Aktiv",
    voting: "Voting",
    completed: "Abgeschlossen",

    basicData: "Basisdaten",
    basicDataSubtitle: "Hier bearbeitest du die sichtbaren Grunddaten der Challenge.",
    title: "Titel",
    titlePlaceholder: "z. B. Ice Bucket Challenge",
    description: "Beschreibung",
    descriptionPlaceholder: "Beschreibe klar, was erfüllt werden muss.",
    descriptionHint: "Kurz, verständlich und ohne unnötiges Gelaber.",
    thumbnail: "Vorschaubild",
    thumbnailChoose: "Neues Bild auswählen",
    thumbnailChange: "Bild ändern",
    thumbnailHelper: "Optional. Erlaubt sind JPG, PNG oder WEBP bis 5 MB.",
    thumbnailPreview: "Thumbnail-Vorschau",

    fundingParticipation: "Funding & Teilnahme",
    fundingParticipationSubtitle:
      "Hier steuerst du Zielbetrag, Sicherheitsstufe und Teilnahme-Logik.",
    fundingGoal: "Funding-Ziel",
    fundingGoalPlaceholder: "z. B. 100",
    fundingGoalHint: "Mindestens 10 €. Ab 500 € ist Live für Teilnehmer verpflichtend.",
    requiredSeconds: "Mindestdauer Video (Sekunden)",
    requiredSecondsPlaceholder: "z. B. 10",
    requiredSecondsHint: "Erlaubt sind 1 bis 600 Sekunden.",
    riskLevel: "Risiko-Level",
    riskLevelHint:
      "Risk Level steuert Warnhinweise und Sicherheitsstufe. Die Live-Pflicht hängt separat am Funding-Ziel ab 500 €.",

    harmless: "0 – harmlos",
    warning: "1 – Hinweis",
    highRisk: "2 – hohes Risiko",

    challenge18: "Diese Challenge ist ab 18",
    challenge18Hint: "Bei Risiko-Level 2 ist 18+ automatisch Pflicht.",

    status: "Status",
    statusHint: "Der Status ist hier gesperrt, damit der Flow sauber bleibt.",

    liveRequiredTitle: "Live-Pflicht aktiv",
    liveRequiredText:
      "Ab einem Funding-Ziel von 500 € ist für diese Challenge ein echter Live-Versuch Pflicht. Eine normale Aufnahme reicht dann nicht mehr aus.",
    standardModeTitle: "Standard-Modus",
    standardModeText:
      "Unter 500 € läuft die Teilnahme standardmäßig über eine verifizierte In-App-Aufnahme. Ab 500 € wird Live verpflichtend.",

    importantNotice: "Wichtiger Hinweis",
    importantNoticeText:
      "Diese Regel ist hart: Ab einem Funding-Ziel von 500 € wird die Challenge automatisch als Live-Pflicht behandelt. Plane das bewusst ein, weil das die Teilnahmehürde spürbar erhöht.",

    riskMetaHarmlessTitle: "✅ Harmlos",
    riskMetaHarmlessText: "Normale Challenge ohne zusätzliche Sicherheitswarnung.",
    riskMetaWarningTitle: "⚠️ Hinweis-Status",
    riskMetaWarningText: "Die Challenge ist sensibler als normal, aber ohne harte Sperre.",
    riskMetaHighTitle: "⚠️ Hohes Risiko",
    riskMetaHighText:
      "Teilnehmer sehen vor dem Start einen Pflicht-Hinweis. 18+ wird automatisch aktiviert.",

    productLogic: "Produktlogik",
    productLogicLive:
      "Weil das Funding-Ziel bei mindestens 500 € liegt, ist für diese Challenge ein Live-Versuch Pflicht. Auch live muss der Versuch mindestens {seconds}s dauern, damit er gültig ist.",
    productLogicRecorded:
      "Diese Challenge läuft aktuell über eine verifizierte In-App-Aufnahme. Die Aufnahme muss mindestens {seconds}s dauern, damit sie gültig eingereicht werden kann. Ab 500 € Funding-Ziel würde automatisch Live-Pflicht greifen.",

    preview: "Vorschau",
    previewSubtitle: "So wirkt die Challenge nach deinen Änderungen.",
    participation: "Teilnahme",
    release: "Freigabe",
    open: "Offen",
    noTitleYet: "Noch kein Titel",
    noDescriptionYet:
      "Noch keine Beschreibung. Ohne klare Beschreibung wissen Nutzer nicht, woran Erfolg oder Misserfolg gemessen wird.",

    previewSavedLive:
      "Diese Challenge würde aktuell als Live-Pflicht gespeichert werden, weil das Funding-Ziel bei mindestens 500 € liegt.",
    previewSavedRecorded:
      "Diese Challenge würde aktuell mit verifizierter In-App-Aufnahme gespeichert werden. Erst ab 500 € Funding-Ziel wird Live verpflichtend.",

    footerHint:
      "Prüfe Titel, Zielbetrag und Regel-Logik sauber. Vor allem bei 500 € und mehr sollte die Live-Pflicht bewusst gesetzt sein.",
    saveChanges: "Änderungen speichern",
    saving: "Speichert…",
    uploadingImage: "Lädt Bild hoch…",
    cancel: "Abbrechen",
  },

  en: {
    missingChallengeId: "Missing challenge ID",
    loadingChallenge: "Loading challenge…",
    back: "← Back",

    editChallengeBadge: "Edit challenge",
    editChallengeTitle: "Update challenge",
    editChallengeIntro:
      "Adjust title, description, thumbnail, funding goal and rules. From a funding goal of €500, live becomes mandatory automatically.",

    liveRequiredShort: "🔴 Live required",
    verifiedRecordingShort: "🎥 Verified recording",
    from500Short: "💶 From €500",
    riskLevel2Short: "⚠️ Risk level 2",
    adultsOnlyShort: "🔞 18+",
    minDurationShort: "Minimum duration",

    titleRequired: "Title must not be empty.",
    fundingMinError: "The funding goal must be at least €10.",
    requiredSecondsInvalid: "Please enter a valid number of seconds.",
    requiredSecondsRange: "Allowed: 1 to 600 seconds.",
    requiredSecondsSaveRange: "Minimum duration must be between 1 and 600 seconds.",
    risk18Required: "For risk level 2, the challenge must be marked as 18+.",
    ownerForbidden: "You are not the owner of this challenge.",
    unknownError: "Unknown error",

    thumbnailTypeError: "Only JPG, PNG or WEBP are allowed.",
    thumbnailSizeError: "The image may be at most 5 MB.",
    requestFailed: "Request failed",

    funding: "Funding",
    active: "Active",
    voting: "Voting",
    completed: "Completed",

    basicData: "Basic data",
    basicDataSubtitle: "Here you edit the visible core data of the challenge.",
    title: "Title",
    titlePlaceholder: "e.g. Ice Bucket Challenge",
    description: "Description",
    descriptionPlaceholder: "Describe clearly what must be achieved.",
    descriptionHint: "Short, understandable and without useless fluff.",
    thumbnail: "Thumbnail",
    thumbnailChoose: "Choose new image",
    thumbnailChange: "Change image",
    thumbnailHelper: "Optional. JPG, PNG or WEBP up to 5 MB are allowed.",
    thumbnailPreview: "Thumbnail preview",

    fundingParticipation: "Funding & participation",
    fundingParticipationSubtitle:
      "Here you control target amount, safety level and participation logic.",
    fundingGoal: "Funding goal",
    fundingGoalPlaceholder: "e.g. 100",
    fundingGoalHint: "At least €10. From €500, live participation is mandatory.",
    requiredSeconds: "Minimum video duration (seconds)",
    requiredSecondsPlaceholder: "e.g. 10",
    requiredSecondsHint: "Allowed: 1 to 600 seconds.",
    riskLevel: "Risk level",
    riskLevelHint:
      "Risk level controls warnings and safety level. The live requirement is triggered separately by a funding goal of €500 or more.",

    harmless: "0 – harmless",
    warning: "1 – notice",
    highRisk: "2 – high risk",

    challenge18: "This challenge is 18+",
    challenge18Hint: "At risk level 2, 18+ becomes mandatory automatically.",

    status: "Status",
    statusHint: "Status is locked here so the flow stays clean.",

    liveRequiredTitle: "Live required",
    liveRequiredText:
      "From a funding goal of €500, a real live attempt is mandatory for this challenge. A normal recording is no longer enough.",
    standardModeTitle: "Standard mode",
    standardModeText:
      "Below €500, participation runs by default via a verified in-app recording. From €500, live becomes mandatory.",

    importantNotice: "Important notice",
    importantNoticeText:
      "This rule is strict: from a funding goal of €500, the challenge is automatically treated as live-required. Plan this consciously because it noticeably raises the participation barrier.",

    riskMetaHarmlessTitle: "✅ Harmless",
    riskMetaHarmlessText: "Normal challenge without additional safety warnings.",
    riskMetaWarningTitle: "⚠️ Notice status",
    riskMetaWarningText: "The challenge is more sensitive than normal, but without a hard restriction.",
    riskMetaHighTitle: "⚠️ High risk",
    riskMetaHighText:
      "Participants see a mandatory notice before starting. 18+ is activated automatically.",

    productLogic: "Product logic",
    productLogicLive:
      "Because the funding goal is at least €500, a live attempt is mandatory for this challenge. Even live, the attempt must last at least {seconds}s to count as valid.",
    productLogicRecorded:
      "This challenge currently runs via a verified in-app recording. The recording must last at least {seconds}s to be submitted as valid. From a funding goal of €500, live would automatically become mandatory.",

    preview: "Preview",
    previewSubtitle: "This is how the challenge will look after your changes.",
    participation: "Participation",
    release: "Access",
    open: "Open",
    noTitleYet: "No title yet",
    noDescriptionYet:
      "No description yet. Without a clear description, users do not know how success or failure is measured.",

    previewSavedLive:
      "This challenge would currently be saved as live-required because the funding goal is at least €500.",
    previewSavedRecorded:
      "This challenge would currently be saved with a verified in-app recording. Only from a funding goal of €500 does live become mandatory.",

    footerHint:
      "Check title, target amount and rule logic carefully. Especially at €500 or more, the live requirement should be chosen consciously.",
    saveChanges: "Save changes",
    saving: "Saving…",
    uploadingImage: "Uploading image…",
    cancel: "Cancel",
  },

  es: {
    missingChallengeId: "Falta el ID del reto",
    loadingChallenge: "Cargando reto…",
    back: "← Volver",

    editChallengeBadge: "Editar reto",
    editChallengeTitle: "Actualizar reto",
    editChallengeIntro:
      "Ajusta título, descripción, miniatura, objetivo de financiación y reglas. A partir de un objetivo de 500 €, el directo pasa a ser obligatorio automáticamente.",

    liveRequiredShort: "🔴 Directo obligatorio",
    verifiedRecordingShort: "🎥 Grabación verificada",
    from500Short: "💶 Desde 500 €",
    riskLevel2Short: "⚠️ Nivel de riesgo 2",
    adultsOnlyShort: "🔞 +18",
    minDurationShort: "Duración mínima",

    titleRequired: "El título no puede estar vacío.",
    fundingMinError: "El objetivo de financiación debe ser de al menos 10 €.",
    requiredSecondsInvalid: "Introduce un número de segundos válido.",
    requiredSecondsRange: "Permitido: de 1 a 600 segundos.",
    requiredSecondsSaveRange: "La duración mínima debe estar entre 1 y 600 segundos.",
    risk18Required: "Para nivel de riesgo 2, el reto debe estar marcado como +18.",
    ownerForbidden: "No eres el propietario de este reto.",
    unknownError: "Error desconocido",

    thumbnailTypeError: "Solo se permiten JPG, PNG o WEBP.",
    thumbnailSizeError: "La imagen puede tener un máximo de 5 MB.",
    requestFailed: "La solicitud ha fallado",

    funding: "Financiación",
    active: "Activo",
    voting: "Votación",
    completed: "Completado",

    basicData: "Datos básicos",
    basicDataSubtitle: "Aquí editas los datos visibles principales del reto.",
    title: "Título",
    titlePlaceholder: "p. ej. Ice Bucket Challenge",
    description: "Descripción",
    descriptionPlaceholder: "Describe claramente lo que debe cumplirse.",
    descriptionHint: "Corto, claro y sin relleno innecesario.",
    thumbnail: "Miniatura",
    thumbnailChoose: "Elegir nueva imagen",
    thumbnailChange: "Cambiar imagen",
    thumbnailHelper: "Opcional. Se permiten JPG, PNG o WEBP de hasta 5 MB.",
    thumbnailPreview: "Vista previa de la miniatura",

    fundingParticipation: "Financiación y participación",
    fundingParticipationSubtitle:
      "Aquí controlas el objetivo, el nivel de seguridad y la lógica de participación.",
    fundingGoal: "Objetivo de financiación",
    fundingGoalPlaceholder: "p. ej. 100",
    fundingGoalHint: "Al menos 10 €. A partir de 500 €, el directo es obligatorio para los participantes.",
    requiredSeconds: "Duración mínima del vídeo (segundos)",
    requiredSecondsPlaceholder: "p. ej. 10",
    requiredSecondsHint: "Permitido: de 1 a 600 segundos.",
    riskLevel: "Nivel de riesgo",
    riskLevelHint:
      "El nivel de riesgo controla avisos y nivel de seguridad. La obligación del directo depende aparte de un objetivo de 500 € o más.",

    harmless: "0 – inofensivo",
    warning: "1 – aviso",
    highRisk: "2 – riesgo alto",

    challenge18: "Este reto es +18",
    challenge18Hint: "Con nivel de riesgo 2, +18 pasa a ser obligatorio automáticamente.",

    status: "Estado",
    statusHint: "Aquí el estado está bloqueado para que el flujo siga limpio.",

    liveRequiredTitle: "Directo obligatorio",
    liveRequiredText:
      "A partir de un objetivo de financiación de 500 €, un intento real en directo es obligatorio para este reto. Una grabación normal ya no es suficiente.",
    standardModeTitle: "Modo estándar",
    standardModeText:
      "Por debajo de 500 €, la participación funciona por defecto mediante una grabación verificada dentro de la app. A partir de 500 €, el directo pasa a ser obligatorio.",

    importantNotice: "Aviso importante",
    importantNoticeText:
      "Esta regla es estricta: a partir de un objetivo de financiación de 500 €, el reto se trata automáticamente como reto con directo obligatorio. Planifícalo conscientemente porque eleva claramente la barrera de participación.",

    riskMetaHarmlessTitle: "✅ Inofensivo",
    riskMetaHarmlessText: "Reto normal sin advertencias de seguridad adicionales.",
    riskMetaWarningTitle: "⚠️ Estado de aviso",
    riskMetaWarningText: "El reto es más sensible de lo normal, pero sin una restricción dura.",
    riskMetaHighTitle: "⚠️ Riesgo alto",
    riskMetaHighText:
      "Los participantes ven un aviso obligatorio antes de empezar. +18 se activa automáticamente.",

    productLogic: "Lógica del producto",
    productLogicLive:
      "Como el objetivo de financiación es de al menos 500 €, para este reto es obligatorio un intento en directo. Incluso en directo, el intento debe durar al menos {seconds}s para que sea válido.",
    productLogicRecorded:
      "Este reto funciona actualmente mediante una grabación verificada dentro de la app. La grabación debe durar al menos {seconds}s para poder enviarse como válida. A partir de 500 € de objetivo, el directo pasaría a ser obligatorio automáticamente.",

    preview: "Vista previa",
    previewSubtitle: "Así se verá el reto después de tus cambios.",
    participation: "Participación",
    release: "Acceso",
    open: "Abierto",
    noTitleYet: "Todavía no hay título",
    noDescriptionYet:
      "Todavía no hay descripción. Sin una descripción clara, los usuarios no sabrán cómo se mide el éxito o el fracaso.",

    previewSavedLive:
      "Este reto se guardaría ahora mismo como reto con directo obligatorio porque el objetivo de financiación es de al menos 500 €.",
    previewSavedRecorded:
      "Este reto se guardaría ahora mismo con grabación verificada dentro de la app. Solo a partir de 500 € el directo pasa a ser obligatorio.",

    footerHint:
      "Revisa bien el título, el objetivo y la lógica de reglas. Sobre todo con 500 € o más, la obligación de ir en directo debe elegirse conscientemente.",
    saveChanges: "Guardar cambios",
    saving: "Guardando…",
    uploadingImage: "Subiendo imagen…",
    cancel: "Cancelar",
  },

  fr: {
    missingChallengeId: "ID du défi manquant",
    loadingChallenge: "Chargement du défi…",
    back: "← Retour",

    editChallengeBadge: "Modifier le défi",
    editChallengeTitle: "Mettre à jour le défi",
    editChallengeIntro:
      "Ajuste le titre, la description, la miniature, l’objectif de financement et les règles. À partir d’un objectif de 500 €, le live devient automatiquement obligatoire.",

    liveRequiredShort: "🔴 Live requis",
    verifiedRecordingShort: "🎥 Enregistrement vérifié",
    from500Short: "💶 Dès 500 €",
    riskLevel2Short: "⚠️ Niveau de risque 2",
    adultsOnlyShort: "🔞 18+",
    minDurationShort: "Durée minimale",

    titleRequired: "Le titre ne doit pas être vide.",
    fundingMinError: "L’objectif de financement doit être d’au moins 10 €.",
    requiredSecondsInvalid: "Merci de saisir un nombre de secondes valide.",
    requiredSecondsRange: "Autorisé : de 1 à 600 secondes.",
    requiredSecondsSaveRange: "La durée minimale doit être comprise entre 1 et 600 secondes.",
    risk18Required: "Pour le niveau de risque 2, le défi doit être marqué comme 18+.",
    ownerForbidden: "Tu n’es pas le propriétaire de ce défi.",
    unknownError: "Erreur inconnue",

    thumbnailTypeError: "Seuls JPG, PNG ou WEBP sont autorisés.",
    thumbnailSizeError: "L’image peut faire au maximum 5 MB.",
    requestFailed: "La requête a échoué",

    funding: "Financement",
    active: "Actif",
    voting: "Vote",
    completed: "Complété",

    basicData: "Données de base",
    basicDataSubtitle: "Ici, tu modifies les données visibles principales du défi.",
    title: "Titre",
    titlePlaceholder: "ex. Ice Bucket Challenge",
    description: "Description",
    descriptionPlaceholder: "Décris clairement ce qui doit être accompli.",
    descriptionHint: "Court, clair et sans blabla inutile.",
    thumbnail: "Miniature",
    thumbnailChoose: "Choisir une nouvelle image",
    thumbnailChange: "Changer l’image",
    thumbnailHelper: "Optionnel. JPG, PNG ou WEBP jusqu’à 5 MB autorisés.",
    thumbnailPreview: "Aperçu de la miniature",

    fundingParticipation: "Financement et participation",
    fundingParticipationSubtitle:
      "Ici, tu contrôles l’objectif, le niveau de sécurité et la logique de participation.",
    fundingGoal: "Objectif de financement",
    fundingGoalPlaceholder: "ex. 100",
    fundingGoalHint: "Au moins 10 €. À partir de 500 €, le live devient obligatoire pour les participants.",
    requiredSeconds: "Durée minimale de la vidéo (secondes)",
    requiredSecondsPlaceholder: "ex. 10",
    requiredSecondsHint: "Autorisé : de 1 à 600 secondes.",
    riskLevel: "Niveau de risque",
    riskLevelHint:
      "Le niveau de risque contrôle les avertissements et le niveau de sécurité. L’obligation du live dépend séparément d’un objectif de 500 € ou plus.",

    harmless: "0 – sans danger",
    warning: "1 – avertissement",
    highRisk: "2 – risque élevé",

    challenge18: "Ce défi est 18+",
    challenge18Hint: "Au niveau de risque 2, le 18+ devient automatiquement obligatoire.",

    status: "Statut",
    statusHint: "Le statut est verrouillé ici pour que le flux reste propre.",

    liveRequiredTitle: "Live requis",
    liveRequiredText:
      "À partir d’un objectif de financement de 500 €, une véritable tentative en direct est obligatoire pour ce défi. Un enregistrement normal ne suffit alors plus.",
    standardModeTitle: "Mode standard",
    standardModeText:
      "En dessous de 500 €, la participation fonctionne par défaut via un enregistrement vérifié dans l’application. À partir de 500 €, le live devient obligatoire.",

    importantNotice: "Avis important",
    importantNoticeText:
      "Cette règle est stricte : à partir d’un objectif de financement de 500 €, le défi est automatiquement traité comme un défi avec live obligatoire. Planifie cela consciemment, car cela augmente nettement la barrière de participation.",

    riskMetaHarmlessTitle: "✅ Sans danger",
    riskMetaHarmlessText: "Défi normal sans avertissement de sécurité supplémentaire.",
    riskMetaWarningTitle: "⚠️ Statut d’avertissement",
    riskMetaWarningText: "Le défi est plus sensible que la normale, mais sans blocage strict.",
    riskMetaHighTitle: "⚠️ Risque élevé",
    riskMetaHighText:
      "Les participants voient un avis obligatoire avant de commencer. Le 18+ est activé automatiquement.",

    productLogic: "Logique produit",
    productLogicLive:
      "Comme l’objectif de financement est d’au moins 500 €, une tentative en direct est obligatoire pour ce défi. Même en live, la tentative doit durer au moins {seconds}s pour être valide.",
    productLogicRecorded:
      "Ce défi fonctionne actuellement via un enregistrement vérifié dans l’application. L’enregistrement doit durer au moins {seconds}s pour être soumis comme valide. À partir d’un objectif de 500 €, le live deviendrait automatiquement obligatoire.",

    preview: "Aperçu",
    previewSubtitle: "Voici à quoi ressemblera le défi après tes modifications.",
    participation: "Participation",
    release: "Accès",
    open: "Ouvert",
    noTitleYet: "Pas encore de titre",
    noDescriptionYet:
      "Pas encore de description. Sans description claire, les utilisateurs ne savent pas comment le succès ou l’échec est évalué.",

    previewSavedLive:
      "Ce défi serait actuellement enregistré comme défi avec live obligatoire, car l’objectif de financement est d’au moins 500 €.",
    previewSavedRecorded:
      "Ce défi serait actuellement enregistré avec un enregistrement vérifié dans l’application. Ce n’est qu’à partir de 500 € que le live devient obligatoire.",

    footerHint:
      "Vérifie soigneusement le titre, l’objectif et la logique des règles. En particulier à partir de 500 €, l’obligation du live doit être choisie consciemment.",
    saveChanges: "Enregistrer les modifications",
    saving: "Enregistrement…",
    uploadingImage: "Téléversement de l’image…",
    cancel: "Annuler",
  },
};

type ChallengeResponse = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl?: string | null;
  minAmount: number | null;
  status?: "funding" | "active" | "voting" | "completed" | string;
  requiredSeconds?: number | null;
  riskLevel?: 0 | 1 | 2 | number | null;
  is18Plus?: boolean | null;

  data?: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl?: string | null;
    minAmount: number | null;
    status?: "funding" | "active" | "voting" | "completed" | string;
    requiredSeconds?: number | null;
    riskLevel?: 0 | 1 | 2 | number | null;
    is18Plus?: boolean | null;
  };
};

function parseAmount(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function clampInt(n: any, min: number, max: number, fallback: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

function statusLabel(status: string | undefined, locale: ChallengeLocale, ui: EditUi) {
  if (status === "funding") return ui.funding;
  if (status === "active") return ui.active;
  if (status === "voting") return ui.voting;
  if (status === "completed") return ui.completed;
  return status ?? "—";
}

function statusClasses(status?: string) {
  if (status === "funding") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "active") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  if (status === "voting") {
    return "border-purple-200 bg-purple-50 text-purple-800";
  }
  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

async function getErrorMessage(
  res: Response,
  locale: ChallengeLocale = "de",
  ui?: EditUi
) {
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

  const prefix =
    ui?.requestFailed ??
    (locale === "en"
      ? "Request failed"
      : locale === "es"
        ? "La solicitud ha fallado"
        : locale === "fr"
          ? "La requête a échoué"
          : "Anfrage fehlgeschlagen");

  return `${prefix} (${res.status})`;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8">
      <div className="mb-6">
        <div className="text-xl font-extrabold tracking-tight text-slate-950">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1.5 text-sm leading-6 text-slate-600">
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const cls =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : tone === "info"
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}
    >
      {children}
    </div>
  );
}

function NoticeBox({
  title,
  text,
  tone = "neutral",
}: {
  title: string;
  text: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const cls =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "danger"
          ? "border-red-200 bg-red-50 text-red-900"
          : tone === "info"
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-sm font-extrabold">{title}</div>
      <div className="mt-1.5 text-sm leading-6">{text}</div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}) {
  const cls =
    tone === "success"
      ? "border-green-200 bg-green-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "danger"
          ? "border-red-200 bg-red-50"
          : tone === "info"
            ? "border-blue-200 bg-blue-50"
            : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-extrabold text-slate-950">{value}</div>
    </div>
  );
}

export default function EditChallengePage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const router = useRouter();
  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => EDIT_UI_TEXT[activeLocale], [activeLocale]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [minAmount, setMinAmount] = useState("10");

  const [requiredSeconds, setRequiredSeconds] = useState("10");
  const [riskLevel, setRiskLevel] = useState<0 | 1 | 2>(0);
  const [is18Plus, setIs18Plus] = useState(false);

  const [status, setStatus] = useState<
    "funding" | "active" | "voting" | "completed"
  >("funding");

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const titleError = useMemo(() => {
    if (!title.trim()) return ui.titleRequired;
    return undefined;
  }, [title, ui]);

  const amountError = useMemo(() => {
    const n = parseAmount(minAmount);
    if (n === null || n < 10) {
      return ui.fundingMinError;
    }
    return undefined;
  }, [minAmount, ui]);

  const requiredSecondsError = useMemo(() => {
    const n = Number(requiredSeconds);
    if (!Number.isFinite(n)) {
      return ui.requiredSecondsInvalid;
    }
    if (n < 1 || n > 600) {
      return ui.requiredSecondsRange;
    }
    return undefined;
  }, [requiredSeconds, ui]);

  const thumbnailError = useMemo(() => {
    if (!thumbnailFile) return undefined;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(thumbnailFile.type)) {
      return ui.thumbnailTypeError;
    }

    if (thumbnailFile.size > 5 * 1024 * 1024) {
      return ui.thumbnailSizeError;
    }

    return undefined;
  }, [thumbnailFile, ui]);

  const parsedMinAmount = useMemo(() => {
    const n = parseAmount(minAmount);
    return n ?? 0;
  }, [minAmount]);

  const requiredSecondsPreview = useMemo(() => {
    return clampInt(requiredSeconds, 1, 600, 10);
  }, [requiredSeconds]);

  const effectiveIs18Plus = useMemo(() => {
    if (riskLevel === 2) return true;
    return is18Plus;
  }, [riskLevel, is18Plus]);

  const reachesLiveThreshold = useMemo(() => {
    return parsedMinAmount >= 500;
  }, [parsedMinAmount]);

  const requiresLive = useMemo(() => {
    return parsedMinAmount >= 500;
  }, [parsedMinAmount]);

  const participationModeMeta = useMemo(() => {
    if (requiresLive) {
      return {
        pill: ui.liveRequiredShort,
        pillTone: "danger" as const,
        title: ui.liveRequiredTitle,
        text: ui.liveRequiredText,
      };
    }

    return {
      pill: ui.verifiedRecordingShort,
      pillTone: "info" as const,
      title: ui.standardModeTitle,
      text: ui.standardModeText,
    };
  }, [requiresLive, ui]);

  const riskMeta = useMemo(() => {
    if (riskLevel === 2) {
      return {
        title: ui.riskMetaHighTitle,
        text: ui.riskMetaHighText,
        tone: "danger" as const,
      };
    }

    if (riskLevel === 1) {
      return {
        title: ui.riskMetaWarningTitle,
        text: ui.riskMetaWarningText,
        tone: "warning" as const,
      };
    }

    return {
      title: ui.riskMetaHarmlessTitle,
      text: ui.riskMetaHarmlessText,
      tone: "success" as const,
    };
  }, [riskLevel, ui]);

  const canSave = useMemo(() => {
    return !titleError && !amountError && !requiredSecondsError && !saving;
  }, [titleError, amountError, requiredSecondsError, saving]);

  function handleThumbnailChange(file: File | null) {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    setThumbnailFile(file);

    if (!file) {
      setThumbnailPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  }

  async function uploadThumbnail(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch(
      `/challenges/${id}/thumbnail`,
      {
        method: "POST",
        body: formData,
      },
      true
    );

    if (!res.ok) {
      throw new Error(await getErrorMessage(res, activeLocale, ui));
    }

    const json = await res.json().catch(() => null);
    const nextThumbnailUrl =
      json?.thumbnailUrl ??
      json?.data?.thumbnailUrl ??
      json?.challenge?.thumbnailUrl ??
      "";

    if (nextThumbnailUrl) {
      setThumbnailUrl(String(nextThumbnailUrl));
      setThumbnailPreview("");
      setThumbnailFile(null);
    }
  }

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await apiFetch(`/challenges/${id}`, { method: "GET" });

        if (!res.ok) {
          throw new Error(await getErrorMessage(res, activeLocale, ui));
        }

        const json: ChallengeResponse = await res.json();
        const data = json?.data ?? json;

        if (cancelled) return;

        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setThumbnailUrl(data.thumbnailUrl ?? "");
        setMinAmount(
          data.minAmount == null || Number(data.minAmount) < 10
            ? "10"
            : String(data.minAmount)
        );
        setRequiredSeconds(
          String(clampInt(data.requiredSeconds ?? 10, 1, 600, 10))
        );
        setRiskLevel(clampInt(data.riskLevel ?? 0, 0, 2, 0) as 0 | 1 | 2);
        setIs18Plus(!!data.is18Plus);

        if (
          data.status === "funding" ||
          data.status === "active" ||
          data.status === "voting" ||
          data.status === "completed"
        ) {
          setStatus(data.status);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? ui.unknownError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, activeLocale, ui]);

  useEffect(() => {
    if (riskLevel === 2) {
      setIs18Plus(true);
    }
  }, [riskLevel]);

  async function handleUpdate() {
    if (!id || saving) return;

    setError("");

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(ui.titleRequired);
      return;
    }

    const amt = parseAmount(minAmount);
    if (amt === null || amt < 10) {
      setError(ui.fundingMinError);
      return;
    }

    const seconds = Number(requiredSeconds);
    if (!Number.isFinite(seconds) || seconds < 1 || seconds > 600) {
      setError(ui.requiredSecondsSaveRange);
      return;
    }

    if (riskLevel === 2 && !effectiveIs18Plus) {
      setError(ui.risk18Required);
      return;
    }

    if (thumbnailError) {
      setError(thumbnailError);
      return;
    }

    try {
      setSaving(true);

      const payload: {
        title: string;
        description: string | null;
        minAmount: number;
        requiredSeconds: number;
        riskLevel: 0 | 1 | 2;
        is18Plus: boolean;
      } = {
        title: cleanTitle,
        description: description.trim() === "" ? null : description.trim(),
        minAmount: amt,
        requiredSeconds: clampInt(seconds, 1, 600, 10),
        riskLevel,
        is18Plus: effectiveIs18Plus,
      };

      const res = await apiFetch(
        `/challenges/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        true
      );

      if (res.status === 403) {
        setError(ui.ownerForbidden);
        return;
      }

      if (!res.ok) {
        setError(await getErrorMessage(res, activeLocale, ui));
        return;
      }

      if (thumbnailFile) {
        setUploadingThumbnail(true);
        await uploadThumbnail(thumbnailFile);
        setUploadingThumbnail(false);
      }

      router.push(`/challenges/${id}`);
    } catch (e: any) {
      if (e?.message === "NO_TOKEN") {
        router.replace("/auth/login");
        return;
      }

      if (e?.message === "UNAUTHORIZED") return;

      setError(e?.message ?? ui.unknownError);
    } finally {
      setSaving(false);
      setUploadingThumbnail(false);
    }
  }

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
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          {ui.loadingChallenge}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950">
      <div className="mx-auto max-w-5xl p-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href={`/challenges/${id}`}>
              <PrimaryButton variant="secondary">{ui.back}</PrimaryButton>
            </Link>
          </div>

          <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl sm:p-8">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                {ui.editChallengeBadge}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {ui.editChallengeTitle}
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                {ui.editChallengeIntro}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill tone={participationModeMeta.pillTone}>
                  {participationModeMeta.pill}
                </StatusPill>
                {reachesLiveThreshold && (
                  <StatusPill tone="warning">{ui.from500Short}</StatusPill>
                )}
                {riskLevel === 2 && (
                  <StatusPill tone="danger">{ui.riskLevel2Short}</StatusPill>
                )}
                {effectiveIs18Plus && (
                  <StatusPill tone="warning">{ui.adultsOnlyShort}</StatusPill>
                )}
                <StatusPill tone="neutral">
                  {requiredSecondsPreview}s {ui.minDurationShort}
                </StatusPill>
                <div
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                    status
                  )}`}
                >
                  {statusLabel(status, activeLocale, ui)}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="grid gap-6">
            <SectionCard
              title={ui.basicData}
              subtitle={ui.basicDataSubtitle}
            >
              <div className="grid gap-5">
                <TextField
                  id="title"
                  label={ui.title}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={ui.titlePlaceholder}
                  error={titleError}
                />

                <TextField
                  id="description"
                  label={ui.description}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={ui.descriptionPlaceholder}
                  as="textarea"
                  rows={6}
                  hint={ui.descriptionHint}
                />

                <div className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {ui.thumbnail}
                  </span>

                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleThumbnailChange(e.target.files?.[0] ?? null)
                      }
                    />
                    {thumbnailFile ? ui.thumbnailChange : ui.thumbnailChoose}
                  </label>

                  <div className="text-xs text-slate-500">{ui.thumbnailHelper}</div>

                  {thumbnailError ? (
                    <div className="text-xs font-semibold text-red-600">
                      {thumbnailError}
                    </div>
                  ) : null}

                  {(thumbnailPreview || thumbnailUrl) && (
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                        {ui.thumbnailPreview}
                      </div>
                      <div className="aspect-[16/9] bg-slate-100">
                        <img
                          src={thumbnailPreview || thumbnailUrl}
                          alt={ui.thumbnailPreview}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={ui.fundingParticipation}
              subtitle={ui.fundingParticipationSubtitle}
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="grid gap-5">
                  <TextField
                    id="minAmount"
                    label={ui.fundingGoal}
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder={ui.fundingGoalPlaceholder}
                    inputMode="decimal"
                    error={amountError}
                    hint={!amountError ? ui.fundingGoalHint : undefined}
                  />

                  <TextField
                    id="requiredSeconds"
                    label={ui.requiredSeconds}
                    value={requiredSeconds}
                    onChange={(e) => setRequiredSeconds(e.target.value)}
                    placeholder={ui.requiredSecondsPlaceholder}
                    inputMode="numeric"
                    error={requiredSecondsError}
                    hint={!requiredSecondsError ? ui.requiredSecondsHint : undefined}
                  />

                  <div className="grid gap-2">
                    <label
                      htmlFor="riskLevel"
                      className="text-sm font-semibold text-slate-800"
                    >
                      {ui.riskLevel}
                    </label>

                    <select
                      id="riskLevel"
                      value={riskLevel}
                      onChange={(e) =>
                        setRiskLevel(clampInt(e.target.value, 0, 2, 0) as 0 | 1 | 2)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    >
                      <option value={0}>{ui.harmless}</option>
                      <option value={1}>{ui.warning}</option>
                      <option value={2}>{ui.highRisk}</option>
                    </select>

                    <p className="text-sm text-slate-500">{ui.riskLevelHint}</p>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                      checked={effectiveIs18Plus}
                      onChange={(e) => setIs18Plus(e.target.checked)}
                      disabled={riskLevel === 2}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {ui.challenge18}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {ui.challenge18Hint}
                      </div>
                    </div>
                  </label>

                  <div className="grid gap-2">
                    <label
                      htmlFor="status"
                      className="text-sm font-semibold text-slate-800"
                    >
                      {ui.status}
                    </label>

                    <select
                      id="status"
                      value={status}
                      onChange={() => {}}
                      disabled
                      className="h-12 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 text-slate-500 outline-none"
                    >
                      <option value="funding">{ui.funding}</option>
                      <option value="active">{ui.active}</option>
                      <option value="voting">{ui.voting}</option>
                      <option value="completed">{ui.completed}</option>
                    </select>

                    <p className="text-sm text-slate-500">{ui.statusHint}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <NoticeBox
                    title={participationModeMeta.title}
                    text={participationModeMeta.text}
                    tone={participationModeMeta.pillTone}
                  />

                  <NoticeBox
                    title={ui.importantNotice}
                    text={ui.importantNoticeText}
                    tone="warning"
                  />

                  <NoticeBox
                    title={riskMeta.title}
                    text={riskMeta.text}
                    tone={riskMeta.tone}
                  />

                  <NoticeBox
                    title={ui.productLogic}
                    text={
                      requiresLive
                        ? replaceUiText(ui.productLogicLive, {
                            seconds: requiredSecondsPreview,
                          })
                        : replaceUiText(ui.productLogicRecorded, {
                            seconds: requiredSecondsPreview,
                          })
                    }
                    tone={requiresLive ? "danger" : "info"}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={ui.preview}
              subtitle={ui.previewSubtitle}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label={ui.fundingGoal}
                  value={
                    Number.isFinite(parsedMinAmount)
                      ? formatMoneyEUR(parsedMinAmount, activeLocale)
                      : formatMoneyEUR(0, activeLocale)
                  }
                  tone={reachesLiveThreshold ? "warning" : "neutral"}
                />
                <StatTile
                  label={ui.participation}
                  value={requiresLive ? ui.liveRequiredTitle : ui.verifiedRecordingShort.replace("🎥 ", "")}
                  tone={requiresLive ? "danger" : "info"}
                />
                <StatTile
                  label={ui.minDurationShort}
                  value={`${requiredSecondsPreview}s`}
                  tone="neutral"
                />
                <StatTile
                  label={ui.release}
                  value={effectiveIs18Plus ? "18+" : ui.open}
                  tone={effectiveIs18Plus ? "warning" : "success"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone={participationModeMeta.pillTone}>
                  {participationModeMeta.pill}
                </StatusPill>
                {reachesLiveThreshold && (
                  <StatusPill tone="warning">{ui.from500Short}</StatusPill>
                )}
                {riskLevel === 2 && (
                  <StatusPill tone="danger">{ui.riskMetaHighTitle}</StatusPill>
                )}
                {effectiveIs18Plus && (
                  <StatusPill tone="warning">{ui.adultsOnlyShort}</StatusPill>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                {requiresLive ? ui.previewSavedLive : ui.previewSavedRecorded}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="text-lg font-extrabold tracking-tight text-slate-950">
                  {title.trim() || ui.noTitleYet}
                </div>

                <div className="mt-2 text-sm leading-7 text-slate-700">
                  {description.trim() ? description.trim() : ui.noDescriptionYet}
                </div>
              </div>
            </SectionCard>

            <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white p-5 shadow-2xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm leading-6 text-slate-600">
                {ui.footerHint}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryButton
                  type="button"
                  onClick={handleUpdate}
                  variant="dark"
                  disabled={!canSave || uploadingThumbnail}
                  loading={saving || uploadingThumbnail}
                  loadingText={
                    uploadingThumbnail ? ui.uploadingImage : ui.saving
                  }
                  className="w-full sm:w-auto"
                >
                  {ui.saveChanges}
                </PrimaryButton>

                <PrimaryButton
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => router.push(`/challenges/${id}`)}
                >
                  {ui.cancel}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}