"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";

function clampInt(n: any, min: number, max: number, fallback: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(x)));
}

async function getErrorMessageFromResponse(
  res: Response,
  locale: ChallengeLocale = "de"
): Promise<string> {
  const fallback =
    locale === "en"
      ? `Request failed (${res.status})`
      : locale === "es"
        ? `La solicitud ha fallado (${res.status})`
        : locale === "fr"
          ? `La requête a échoué (${res.status})`
          : `Anfrage fehlgeschlagen (${res.status})`;

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

function SurfaceCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-[#0B1322] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5 ${className}`}
    >
      <div className="mb-5">
        <div className="text-xl font-extrabold tracking-tight text-white">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1.5 text-sm leading-6 text-slate-400">
            {subtitle}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-slate-200">{children}</span>;
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <div className="text-xs leading-5 text-slate-400">{children}</div>;
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
      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/12 text-amber-200"
        : tone === "danger"
          ? "border-red-500/25 bg-red-500/12 text-red-200"
          : tone === "info"
            ? "border-blue-400/25 bg-blue-500/12 text-blue-200"
            : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <div
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${cls}`}
    >
      {children}
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
      ? "border-emerald-500/20 bg-emerald-500/[0.08]"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/[0.08]"
        : tone === "danger"
          ? "border-red-500/20 bg-red-500/[0.08]"
          : tone === "info"
            ? "border-blue-400/20 bg-blue-500/[0.08]"
            : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-extrabold text-white">{value}</div>
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
      ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-100"
        : tone === "danger"
          ? "border-red-500/20 bg-red-500/[0.08] text-red-100"
          : tone === "info"
            ? "border-blue-400/20 bg-blue-500/[0.08] text-blue-100"
            : "border-white/10 bg-white/[0.03] text-slate-300";

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-sm font-extrabold">{title}</div>
      <div className="mt-1.5 text-sm leading-6">{text}</div>
    </div>
  );
}

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

  if (stored) {
    return normalizeLocale(stored);
  }

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

type CreateUi = {
  back: string;
  creatorArea: string;
  createTitle: string;
  createIntro: string;

  liveRequiredShort: string;
  verifiedRecordingShort: string;
  from500Short: string;
  riskLevel2Short: string;
  adultsOnlyShort: string;
  minDurationShort: string;

  errorCreateFallback: string;

  basicData: string;
  basicDataSubtitle: string;
  title: string;
  titlePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;

  thumbnail: string;
  chooseImage: string;
  changeImage: string;
  thumbnailHelper: string;
  thumbnailPreview: string;
  thumbnailMissingTitle: string;
  thumbnailMissingText: string;

  fundingAndParticipation: string;
  fundingAndParticipationSubtitle: string;
  fundingGoal: string;
  fundingGoalHelper: string;
  riskLevel: string;
  riskLevelHelper: string;
  harmless: string;
  riskMild: string;
  riskHigh: string;

  mark18Plus: string;
  mark18PlusHelper: string;
  minDuration: string;
  minDurationHelper: string;

  liveRequiredTitle: string;
  liveRequiredText: string;
  standardModeTitle: string;
  standardModeText: string;

  importantNotice: string;
  importantNoticeText: string;

  productLogic: string;
  productLogicLive: string;
  productLogicRecorded: string;

  riskMetaHarmlessTitle: string;
  riskMetaHarmlessText: string;
  riskMetaMildTitle: string;
  riskMetaMildText: string;
  riskMetaHighTitle: string;
  riskMetaHighText: string;

  preview: string;
  previewSubtitle: string;
  participation: string;
  release: string;
  open: string;

  noTitleYet: string;
  noDescriptionYet: string;

  footerHint: string;
  cancel: string;
  createButton: string;
  creating: string;

  titleRequired: string;
  fundingMinError: string;
  ageConfirm: string;

  thumbnailTypeError: string;
  thumbnailSizeError: string;
  createNoIdError: string;
};

const CREATE_UI_TEXT: Record<ChallengeLocale, CreateUi> = {
  de: {
    back: "← Zurück",
    creatorArea: "Creator Bereich",
    createTitle: "Neue Challenge erstellen",
    createIntro:
      "Definiere klar, worum es geht, wie hoch das Funding-Ziel ist, wie lange ein Versuch mindestens dauern muss und wie streng die Teilnahme abgesichert werden soll.",

    liveRequiredShort: "🔴 Live erforderlich",
    verifiedRecordingShort: "🎥 Verifizierte Aufnahme",
    from500Short: "💶 Ab 500 €",
    riskLevel2Short: "⚠️ Risk Level 2",
    adultsOnlyShort: "🔞 Ab 18",
    minDurationShort: "Mindestdauer",

    errorCreateFallback: "Fehler beim Erstellen",

    basicData: "Basisdaten",
    basicDataSubtitle: "Das ist die öffentliche Grundstruktur deiner Challenge.",
    title: "Titel",
    titlePlaceholder: "z. B. Eisbad 30 Sekunden",
    description: "Beschreibung",
    descriptionPlaceholder:
      "Beschreibe klar, was gemacht werden muss und woran man erkennt, ob die Challenge erfüllt wurde…",

    thumbnail: "Vorschaubild",
    chooseImage: "Bild auswählen",
    changeImage: "Bild ändern",
    thumbnailHelper: "Optional. Erlaubt sind JPG, PNG oder WEBP bis 5 MB.",
    thumbnailPreview: "Thumbnail-Vorschau",
    thumbnailMissingTitle: "Ohne Thumbnail wirkt die Challenge schwächer.",
    thumbnailMissingText:
      "Ein gutes Bild macht sofort klar, worum es geht und erhöht die Chance, dass Nutzer hängen bleiben.",

    fundingAndParticipation: "Funding & Teilnahme",
    fundingAndParticipationSubtitle:
      "Hier legst du fest, wie stark die Challenge wirkt und wie streng die Teilnahme abgesichert wird.",
    fundingGoal: "Funding-Ziel",
    fundingGoalHelper: "Mindestens 10 €. Ab 500 € ist Live für Teilnehmer verpflichtend.",
    riskLevel: "Risiko-Level",
    riskLevelHelper:
      "Risk Level 2 aktiviert automatisch 18+ und einen Pflicht-Hinweis für Teilnehmer. Die Live-Pflicht hängt separat am Funding-Ziel ab 500 €.",
    harmless: "0 – harmlos",
    riskMild: "1 – Hinweis / mildes Risiko",
    riskHigh: "2 – hohes Risiko",

    mark18Plus: "Challenge als 18+ markieren",
    mark18PlusHelper:
      "Aktiviert eine Altersfreigabe. Bei Risk Level 2 wird 18+ automatisch gesetzt.",
    minDuration: "Mindestdauer des Versuchs",
    minDurationHelper: "Der Versuch muss mindestens {seconds}s dauern, damit er gültig ist.",

    liveRequiredTitle: "Live-Pflicht aktiv",
    liveRequiredText:
      "Ab einem Funding-Ziel von 500 € ist für diese Challenge ein echter Live-Versuch Pflicht. Eine normale Aufnahme reicht dann nicht mehr aus.",
    standardModeTitle: "Standard-Modus",
    standardModeText:
      "Unter 500 € läuft die Teilnahme standardmäßig über eine verifizierte In-App-Aufnahme. Ab 500 € wird Live verpflichtend.",

    importantNotice: "Wichtiger Hinweis",
    importantNoticeText:
      "Diese Regel ist hart: Ab einem Funding-Ziel von 500 € wird die Challenge automatisch als Live-Pflicht behandelt. Plane das bewusst ein, weil das die Teilnahmehürde spürbar erhöht.",

    productLogic: "Produktlogik",
    productLogicLive:
      "Weil das Funding-Ziel bei mindestens 500 € liegt, ist für diese Challenge ein Live-Versuch Pflicht. Auch live muss der Versuch mindestens {seconds}s dauern, damit er gültig ist.",
    productLogicRecorded:
      "Diese Challenge läuft aktuell über eine verifizierte In-App-Aufnahme. Die Aufnahme muss mindestens {seconds}s dauern, damit sie gültig eingereicht werden kann. Ab 500 € Funding-Ziel würde automatisch Live-Pflicht greifen.",

    riskMetaHarmlessTitle: "✅ Harmlos",
    riskMetaHarmlessText: "Normale Challenge ohne zusätzliche Sicherheitswarnung.",
    riskMetaMildTitle: "⚠️ Hinweis-Status",
    riskMetaMildText: "Die Challenge ist sensibler als normal, aber ohne harte Sperre.",
    riskMetaHighTitle: "⚠️ Hohes Risiko",
    riskMetaHighText:
      "Teilnehmer sehen vor dem Start einen Pflicht-Hinweis. 18+ wird automatisch aktiviert.",

    preview: "Vorschau",
    previewSubtitle: "So wirkt die Challenge aktuell in ihrer Grundlogik.",
    participation: "Teilnahme",
    release: "Freigabe",
    open: "Offen",

    noTitleYet: "Noch kein Titel",
    noDescriptionYet:
      "Noch keine Beschreibung. Ohne klare Beschreibung wissen Nutzer nicht, woran Erfolg oder Misserfolg gemessen wird.",

    footerHint:
      "Prüfe Titel, Zielbetrag und Regel-Logik sauber. Vor allem bei 500 € und mehr sollte die Live-Pflicht bewusst gesetzt sein.",
    cancel: "Abbrechen",
    createButton: "Challenge erstellen",
    creating: "Wird erstellt...",

    titleRequired: "Titel darf nicht leer sein.",
    fundingMinError: "Das Funding-Ziel muss mindestens 10 € betragen.",
    ageConfirm: "Hinweis: Diese Challenge wird als 18+ markiert. Willst du fortfahren?",

    thumbnailTypeError: "Erlaubt sind nur JPG, PNG oder WEBP.",
    thumbnailSizeError: "Das Bild darf maximal 5 MB groß sein.",
    createNoIdError: "Challenge wurde erstellt, aber keine ID zurückgegeben.",
  },

  en: {
    back: "← Back",
    creatorArea: "Creator area",
    createTitle: "Create new challenge",
    createIntro:
      "Define clearly what this challenge is about, what the funding goal is, how long an attempt must last at minimum and how strict participation should be secured.",

    liveRequiredShort: "🔴 Live required",
    verifiedRecordingShort: "🎥 Verified recording",
    from500Short: "💶 From €500",
    riskLevel2Short: "⚠️ Risk level 2",
    adultsOnlyShort: "🔞 18+",
    minDurationShort: "Minimum duration",

    errorCreateFallback: "Error while creating",

    basicData: "Basic data",
    basicDataSubtitle: "This is the public basic structure of your challenge.",
    title: "Title",
    titlePlaceholder: "e.g. Ice bath 30 seconds",
    description: "Description",
    descriptionPlaceholder:
      "Describe clearly what has to be done and how people can tell whether the challenge was completed…",

    thumbnail: "Thumbnail",
    chooseImage: "Choose image",
    changeImage: "Change image",
    thumbnailHelper: "Optional. JPG, PNG or WEBP up to 5 MB are allowed.",
    thumbnailPreview: "Thumbnail preview",
    thumbnailMissingTitle: "Without a thumbnail, the challenge feels weaker.",
    thumbnailMissingText:
      "A strong image makes the challenge understandable immediately and improves the chance that users will stay interested.",

    fundingAndParticipation: "Funding & participation",
    fundingAndParticipationSubtitle:
      "Here you define how strong the challenge feels and how strictly participation is secured.",
    fundingGoal: "Funding goal",
    fundingGoalHelper: "At least €10. From €500, live participation becomes mandatory.",
    riskLevel: "Risk level",
    riskLevelHelper:
      "Risk level 2 automatically activates 18+ and a mandatory notice for participants. The live requirement is triggered separately by a funding goal of €500 or more.",
    harmless: "0 – harmless",
    riskMild: "1 – notice / mild risk",
    riskHigh: "2 – high risk",

    mark18Plus: "Mark challenge as 18+",
    mark18PlusHelper:
      "Activates an age restriction. With risk level 2, 18+ is set automatically.",
    minDuration: "Minimum attempt duration",
    minDurationHelper: "The attempt must last at least {seconds}s to count as valid.",

    liveRequiredTitle: "Live required",
    liveRequiredText:
      "From a funding goal of €500, a real live attempt is mandatory for this challenge. A normal recording is no longer enough.",
    standardModeTitle: "Standard mode",
    standardModeText:
      "Below €500, participation runs by default via a verified in-app recording. From €500, live becomes mandatory.",

    importantNotice: "Important notice",
    importantNoticeText:
      "This rule is strict: from a funding goal of €500, the challenge is automatically treated as live-required. Plan this consciously because it raises the participation barrier noticeably.",

    productLogic: "Product logic",
    productLogicLive:
      "Because the funding goal is at least €500, a live attempt is mandatory for this challenge. Even live, the attempt must last at least {seconds}s to count as valid.",
    productLogicRecorded:
      "This challenge currently runs via a verified in-app recording. The recording must last at least {seconds}s to be submitted as valid. From a funding goal of €500, live would automatically become mandatory.",

    riskMetaHarmlessTitle: "✅ Harmless",
    riskMetaHarmlessText: "Normal challenge without additional safety warnings.",
    riskMetaMildTitle: "⚠️ Notice status",
    riskMetaMildText: "The challenge is more sensitive than normal, but without a hard restriction.",
    riskMetaHighTitle: "⚠️ High risk",
    riskMetaHighText:
      "Participants see a mandatory notice before starting. 18+ is activated automatically.",

    preview: "Preview",
    previewSubtitle: "This is how the challenge currently looks in its core logic.",
    participation: "Participation",
    release: "Access",
    open: "Open",

    noTitleYet: "No title yet",
    noDescriptionYet:
      "No description yet. Without a clear description, users do not know what defines success or failure.",

    footerHint:
      "Check title, target amount and rule logic carefully. Especially at €500 or more, the live requirement should be chosen consciously.",
    cancel: "Cancel",
    createButton: "Create challenge",
    creating: "Creating...",

    titleRequired: "Title must not be empty.",
    fundingMinError: "The funding goal must be at least €10.",
    ageConfirm: "Notice: This challenge will be marked as 18+. Do you want to continue?",

    thumbnailTypeError: "Only JPG, PNG or WEBP are allowed.",
    thumbnailSizeError: "The image may be at most 5 MB.",
    createNoIdError: "Challenge was created, but no ID was returned.",
  },

  es: {
    back: "← Volver",
    creatorArea: "Área del creador",
    createTitle: "Crear nuevo reto",
    createIntro:
      "Define con claridad de qué trata el reto, cuál es el objetivo de financiación, cuánto debe durar como mínimo un intento y qué tan estricta debe ser la participación.",

    liveRequiredShort: "🔴 Directo obligatorio",
    verifiedRecordingShort: "🎥 Grabación verificada",
    from500Short: "💶 Desde 500 €",
    riskLevel2Short: "⚠️ Nivel de riesgo 2",
    adultsOnlyShort: "🔞 +18",
    minDurationShort: "Duración mínima",

    errorCreateFallback: "Error al crear",

    basicData: "Datos básicos",
    basicDataSubtitle: "Esta es la estructura pública básica de tu reto.",
    title: "Título",
    titlePlaceholder: "p. ej. Baño de hielo 30 segundos",
    description: "Descripción",
    descriptionPlaceholder:
      "Describe claramente qué debe hacerse y cómo se reconoce si el reto se ha cumplido…",

    thumbnail: "Miniatura",
    chooseImage: "Elegir imagen",
    changeImage: "Cambiar imagen",
    thumbnailHelper: "Opcional. Se permiten JPG, PNG o WEBP de hasta 5 MB.",
    thumbnailPreview: "Vista previa de la miniatura",
    thumbnailMissingTitle: "Sin miniatura, el reto se ve más débil.",
    thumbnailMissingText:
      "Una buena imagen deja claro de inmediato de qué va el reto y aumenta la probabilidad de que los usuarios se queden.",

    fundingAndParticipation: "Financiación y participación",
    fundingAndParticipationSubtitle:
      "Aquí defines qué fuerza transmite el reto y qué tan estrictamente se asegura la participación.",
    fundingGoal: "Objetivo de financiación",
    fundingGoalHelper: "Al menos 10 €. A partir de 500 €, el directo es obligatorio para los participantes.",
    riskLevel: "Nivel de riesgo",
    riskLevelHelper:
      "El nivel de riesgo 2 activa automáticamente +18 y un aviso obligatorio para los participantes. La obligación de ir en directo depende aparte del objetivo de financiación a partir de 500 €.",
    harmless: "0 – inofensivo",
    riskMild: "1 – aviso / riesgo leve",
    riskHigh: "2 – riesgo alto",

    mark18Plus: "Marcar reto como +18",
    mark18PlusHelper:
      "Activa una restricción de edad. Con nivel de riesgo 2, +18 se aplica automáticamente.",
    minDuration: "Duración mínima del intento",
    minDurationHelper: "El intento debe durar al menos {seconds}s para que sea válido.",

    liveRequiredTitle: "Directo obligatorio",
    liveRequiredText:
      "A partir de un objetivo de financiación de 500 €, un intento real en directo es obligatorio para este reto. Una grabación normal ya no es suficiente.",
    standardModeTitle: "Modo estándar",
    standardModeText:
      "Por debajo de 500 €, la participación funciona por defecto mediante una grabación verificada dentro de la app. A partir de 500 €, el directo pasa a ser obligatorio.",

    importantNotice: "Aviso importante",
    importantNoticeText:
      "Esta regla es estricta: a partir de un objetivo de financiación de 500 €, el reto se trata automáticamente como reto con directo obligatorio. Planifícalo conscientemente porque eleva claramente la barrera de participación.",

    productLogic: "Lógica del producto",
    productLogicLive:
      "Como el objetivo de financiación es de al menos 500 €, para este reto es obligatorio un intento en directo. Incluso en directo, el intento debe durar al menos {seconds}s para que sea válido.",
    productLogicRecorded:
      "Este reto funciona actualmente mediante una grabación verificada dentro de la app. La grabación debe durar al menos {seconds}s para poder enviarse como válida. A partir de 500 € de objetivo, el directo pasaría a ser obligatorio automáticamente.",

    riskMetaHarmlessTitle: "✅ Inofensivo",
    riskMetaHarmlessText: "Reto normal sin advertencias de seguridad adicionales.",
    riskMetaMildTitle: "⚠️ Estado de aviso",
    riskMetaMildText: "El reto es más sensible de lo normal, pero sin una restricción dura.",
    riskMetaHighTitle: "⚠️ Riesgo alto",
    riskMetaHighText:
      "Los participantes ven un aviso obligatorio antes de empezar. +18 se activa automáticamente.",

    preview: "Vista previa",
    previewSubtitle: "Así se ve actualmente el reto en su lógica base.",
    participation: "Participación",
    release: "Acceso",
    open: "Abierto",

    noTitleYet: "Todavía no hay título",
    noDescriptionYet:
      "Todavía no hay descripción. Sin una descripción clara, los usuarios no sabrán cómo se mide el éxito o el fracaso.",

    footerHint:
      "Revisa bien el título, el objetivo y la lógica de reglas. Sobre todo con 500 € o más, la obligación de ir en directo debe elegirse conscientemente.",
    cancel: "Cancelar",
    createButton: "Crear reto",
    creating: "Creando...",

    titleRequired: "El título no puede estar vacío.",
    fundingMinError: "El objetivo de financiación debe ser de al menos 10 €.",
    ageConfirm: "Aviso: Este reto se marcará como +18. ¿Quieres continuar?",

    thumbnailTypeError: "Solo se permiten JPG, PNG o WEBP.",
    thumbnailSizeError: "La imagen puede tener un máximo de 5 MB.",
    createNoIdError: "El reto fue creado, pero no se devolvió ningún ID.",
  },

  fr: {
    back: "← Retour",
    creatorArea: "Espace créateur",
    createTitle: "Créer un nouveau défi",
    createIntro:
      "Définis clairement de quoi il s’agit, quel est l’objectif de financement, combien de temps une tentative doit durer au minimum et à quel point la participation doit être sécurisée.",

    liveRequiredShort: "🔴 Live requis",
    verifiedRecordingShort: "🎥 Enregistrement vérifié",
    from500Short: "💶 Dès 500 €",
    riskLevel2Short: "⚠️ Niveau de risque 2",
    adultsOnlyShort: "🔞 18+",
    minDurationShort: "Durée minimale",

    errorCreateFallback: "Erreur lors de la création",

    basicData: "Données de base",
    basicDataSubtitle: "Voici la structure publique de base de ton défi.",
    title: "Titre",
    titlePlaceholder: "ex. Bain glacé 30 secondes",
    description: "Description",
    descriptionPlaceholder:
      "Décris clairement ce qu’il faut faire et comment on reconnaît que le défi a été accompli…",

    thumbnail: "Miniature",
    chooseImage: "Choisir une image",
    changeImage: "Changer l’image",
    thumbnailHelper: "Optionnel. JPG, PNG ou WEBP jusqu’à 5 MB autorisés.",
    thumbnailPreview: "Aperçu de la miniature",
    thumbnailMissingTitle: "Sans miniature, le défi paraît plus faible.",
    thumbnailMissingText:
      "Une bonne image montre immédiatement de quoi il s’agit et augmente les chances que les utilisateurs restent intéressés.",

    fundingAndParticipation: "Financement et participation",
    fundingAndParticipationSubtitle:
      "Ici, tu définis à quel point le défi paraît fort et à quel point la participation est strictement sécurisée.",
    fundingGoal: "Objectif de financement",
    fundingGoalHelper: "Au moins 10 €. À partir de 500 €, le live devient obligatoire pour les participants.",
    riskLevel: "Niveau de risque",
    riskLevelHelper:
      "Le niveau de risque 2 active automatiquement le 18+ et un avis obligatoire pour les participants. L’obligation du live dépend séparément d’un objectif de financement d’au moins 500 €.",
    harmless: "0 – sans danger",
    riskMild: "1 – avertissement / risque léger",
    riskHigh: "2 – risque élevé",

    mark18Plus: "Marquer le défi comme 18+",
    mark18PlusHelper:
      "Active une restriction d’âge. Avec le niveau de risque 2, le 18+ est activé automatiquement.",
    minDuration: "Durée minimale de la tentative",
    minDurationHelper: "La tentative doit durer au moins {seconds}s pour être considérée comme valide.",

    liveRequiredTitle: "Live requis",
    liveRequiredText:
      "À partir d’un objectif de financement de 500 €, une véritable tentative en direct est obligatoire pour ce défi. Un enregistrement normal ne suffit alors plus.",
    standardModeTitle: "Mode standard",
    standardModeText:
      "En dessous de 500 €, la participation fonctionne par défaut via un enregistrement vérifié dans l’application. À partir de 500 €, le live devient obligatoire.",

    importantNotice: "Avis important",
    importantNoticeText:
      "Cette règle est stricte : à partir d’un objectif de financement de 500 €, le défi est automatiquement traité comme un défi avec live obligatoire. Planifie cela consciemment, car cela augmente nettement la barrière de participation.",

    productLogic: "Logique produit",
    productLogicLive:
      "Comme l’objectif de financement est d’au moins 500 €, une tentative en direct est obligatoire pour ce défi. Même en live, la tentative doit durer au moins {seconds}s pour être valide.",
    productLogicRecorded:
      "Ce défi fonctionne actuellement via un enregistrement vérifié dans l’application. L’enregistrement doit durer au moins {seconds}s pour être soumis comme valide. À partir d’un objectif de 500 €, le live deviendrait automatiquement obligatoire.",

    riskMetaHarmlessTitle: "✅ Sans danger",
    riskMetaHarmlessText: "Défi normal sans avertissement de sécurité supplémentaire.",
    riskMetaMildTitle: "⚠️ Statut d’avertissement",
    riskMetaMildText: "Le défi est plus sensible que la normale, mais sans blocage strict.",
    riskMetaHighTitle: "⚠️ Risque élevé",
    riskMetaHighText:
      "Les participants voient un avis obligatoire avant de commencer. Le 18+ est activé automatiquement.",

    preview: "Aperçu",
    previewSubtitle: "Voici l’apparence actuelle du défi dans sa logique de base.",
    participation: "Participation",
    release: "Accès",
    open: "Ouvert",

    noTitleYet: "Pas encore de titre",
    noDescriptionYet:
      "Pas encore de description. Sans description claire, les utilisateurs ne savent pas comment le succès ou l’échec est évalué.",

    footerHint:
      "Vérifie soigneusement le titre, l’objectif et la logique des règles. En particulier à partir de 500 €, l’obligation du live doit être choisie consciemment.",
    cancel: "Annuler",
    createButton: "Créer le défi",
    creating: "Création...",

    titleRequired: "Le titre ne doit pas être vide.",
    fundingMinError: "L’objectif de financement doit être d’au moins 10 €.",
    ageConfirm: "Avis : ce défi sera marqué comme 18+. Veux-tu continuer ?",

    thumbnailTypeError: "Seuls JPG, PNG ou WEBP sont autorisés.",
    thumbnailSizeError: "L’image peut faire au maximum 5 MB.",
    createNoIdError: "Le défi a été créé, mais aucun ID n’a été renvoyé.",
  },
};

function replaceUiText(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

type CreatedChallengeResponse = {
  id?: string;
  data?: {
    id?: string;
  };
};

export default function CreateChallengePage() {
  const router = useRouter();
  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => CREATE_UI_TEXT[activeLocale], [activeLocale]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [minAmount, setMinAmount] = useState("10");
  const [requiredSeconds, setRequiredSeconds] = useState("10");

  const [riskLevel, setRiskLevel] = useState<0 | 1 | 2>(0);
  const [is18Plus, setIs18Plus] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const effectiveIs18Plus = useMemo(() => {
    if (riskLevel === 2) return true;
    return is18Plus;
  }, [riskLevel, is18Plus]);

  const requiredSecondsPreview = useMemo(() => {
    return clampInt(requiredSeconds, 3, 300, 10);
  }, [requiredSeconds]);

  const parsedMinAmount = useMemo(() => {
    const n = Number(String(minAmount).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }, [minAmount]);

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
        title: ui.riskMetaMildTitle,
        text: ui.riskMetaMildText,
        tone: "warning" as const,
      };
    }

    return {
      title: ui.riskMetaHarmlessTitle,
      text: ui.riskMetaHarmlessText,
      tone: "success" as const,
    };
  }, [riskLevel, ui]);

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

  async function uploadThumbnail(challengeId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch(
      `/challenges/${challengeId}/thumbnail`,
      {
        method: "POST",
        body: formData,
      },
      true
    );

    if (!res.ok) {
      throw new Error(await getErrorMessageFromResponse(res, activeLocale));
    }
  }

  async function handleCreate() {
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(ui.titleRequired);
      return;
    }

    if (thumbnailError) {
      setError(thumbnailError);
      return;
    }

    const normalizedRequiredSeconds = clampInt(requiredSeconds, 3, 300, 10);

    if (!Number.isFinite(parsedMinAmount) || parsedMinAmount < 10) {
      setError(ui.fundingMinError);
      return;
    }

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
      minAmount: parsedMinAmount,
      requiredSeconds: normalizedRequiredSeconds,
      riskLevel,
      is18Plus: effectiveIs18Plus,
    };

    if (riskLevel < 2 && is18Plus) {
      const ok = confirm(ui.ageConfirm);
      if (!ok) return;
    }

    try {
      setSaving(true);

      const res = await apiFetch(
        "/challenges",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        true
      );

      if (!res.ok) {
        const msg = await getErrorMessageFromResponse(res, activeLocale);
        setError(msg);
        return;
      }

      const json: CreatedChallengeResponse = await res.json().catch(() => ({}));
      const challengeId = json?.data?.id ?? json?.id;

      if (!challengeId) {
        throw new Error(ui.createNoIdError);
      }

      if (thumbnailFile) {
        await uploadThumbnail(String(challengeId), thumbnailFile);
      }

      router.push(`/challenges/${challengeId}`);
    } catch (e: any) {
      if (e?.message === "NO_TOKEN") {
        router.replace("/auth/login");
        return;
      }

      if (e?.message === "UNAUTHORIZED") return;

      setError(e?.message ?? ui.errorCreateFallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950">
      <div className="mx-auto max-w-5xl p-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/challenges">
              <PrimaryButton variant="secondary">{ui.back}</PrimaryButton>
            </Link>
          </div>

          <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl sm:p-8">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
                {ui.creatorArea}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {ui.createTitle}
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                {ui.createIntro}
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
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-3xl border border-red-500/25 bg-red-500/[0.1] p-5 text-sm font-semibold text-red-200 shadow-sm">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6">
            <SurfaceCard
              title={ui.basicData}
              subtitle={ui.basicDataSubtitle}
            >
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <SectionLabel>{ui.title}</SectionLabel>
                  <input
                    placeholder={ui.titlePlaceholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="grid gap-2">
                  <SectionLabel>{ui.description}</SectionLabel>
                  <textarea
                    placeholder={ui.descriptionPlaceholder}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px] rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <div className="grid gap-2">
                  <SectionLabel>{ui.thumbnail}</SectionLabel>

                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleThumbnailChange(e.target.files?.[0] ?? null)
                      }
                    />
                    {thumbnailFile ? ui.changeImage : ui.chooseImage}
                  </label>

                  <HelperText>{ui.thumbnailHelper}</HelperText>

                  {thumbnailError ? (
                    <div className="text-xs font-semibold text-red-300">
                      {thumbnailError}
                    </div>
                  ) : null}

                  {thumbnailPreview ? (
                    <div className="mt-2 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
                      <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-200">
                        {ui.thumbnailPreview}
                      </div>
                      <div className="aspect-[16/9] bg-[#060e1a]">
                        <img
                          src={thumbnailPreview}
                          alt={ui.thumbnailPreview}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}

                  {!thumbnailPreview ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                      <div className="font-semibold text-white">{ui.thumbnailMissingTitle}</div>
                      <div className="mt-1.5 leading-6">{ui.thumbnailMissingText}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard
              title={ui.fundingAndParticipation}
              subtitle={ui.fundingAndParticipationSubtitle}
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <SectionLabel>{ui.fundingGoal}</SectionLabel>
                    <input
                      type="number"
                      min="10"
                      step="0.01"
                      placeholder="z. B. 50"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <HelperText>{ui.fundingGoalHelper}</HelperText>
                  </label>

                  <label className="grid gap-2">
                    <SectionLabel>{ui.riskLevel}</SectionLabel>
                    <select
                      value={riskLevel}
                      onChange={(e) =>
                        setRiskLevel(Number(e.target.value) as 0 | 1 | 2)
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value={0}>{ui.harmless}</option>
                      <option value={1}>{ui.riskMild}</option>
                      <option value={2}>{ui.riskHigh}</option>
                    </select>
                    <HelperText>{ui.riskLevelHelper}</HelperText>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={effectiveIs18Plus}
                      disabled={riskLevel === 2}
                      onChange={(e) => setIs18Plus(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-white/[0.06] text-blue-500 focus:ring-blue-500"
                    />
                    <div className="grid gap-1">
                      <div className="text-sm font-semibold text-white">
                        {ui.mark18Plus}
                      </div>
                      <div className="text-sm leading-6 text-slate-300">
                        {ui.mark18PlusHelper}
                      </div>
                    </div>
                  </label>

                  <label className="grid gap-2">
                    <SectionLabel>{ui.minDuration}</SectionLabel>
                    <input
                      type="number"
                      min="3"
                      max="300"
                      step="1"
                      value={requiredSeconds}
                      onChange={(e) => setRequiredSeconds(e.target.value)}
                      className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <HelperText>
                      {replaceUiText(ui.minDurationHelper, {
                        seconds: requiredSecondsPreview,
                      })}
                    </HelperText>
                  </label>
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
            </SurfaceCard>

            <SurfaceCard
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
                  value={requiresLive ? ui.liveRequiredShort : ui.verifiedRecordingShort}
                  tone={requiresLive ? "danger" : "info"}
                />
                <StatTile
                  label={ui.minDuration}
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
                  <StatusPill tone="danger">{ui.riskLevel2Short}</StatusPill>
                )}
                {effectiveIs18Plus && (
                  <StatusPill tone="warning">{ui.adultsOnlyShort}</StatusPill>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                {requiresLive
                  ? activeLocale === "en"
                    ? "This challenge would currently be created with live required, because the funding goal is at least €500."
                    : activeLocale === "es"
                      ? "Este reto se crearía ahora mismo con directo obligatorio, porque el objetivo de financiación es de al menos 500 €."
                      : activeLocale === "fr"
                        ? "Ce défi serait actuellement créé avec live obligatoire, car l'objectif de financement est d'au moins 500 €."
                        : "Diese Challenge würde aktuell als Live-Pflicht erstellt werden, weil das Funding-Ziel bei mindestens 500 € liegt."
                  : activeLocale === "en"
                    ? "This challenge would currently be created with a verified in-app recording. Live becomes mandatory only from a €500 funding goal."
                    : activeLocale === "es"
                      ? "Este reto se crearía ahora mismo con una grabación verificada en la app. El directo solo pasa a ser obligatorio a partir de un objetivo de 500 €."
                      : activeLocale === "fr"
                        ? "Ce défi serait actuellement créé avec un enregistrement vérifié dans l'application. Le live ne devient obligatoire qu'à partir d'un objectif de 500 €."
                        : "Diese Challenge würde aktuell mit verifizierter In-App-Aufnahme erstellt werden. Erst ab 500 € Funding-Ziel wird Live verpflichtend."}
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-lg font-extrabold tracking-tight text-white">
                  {title.trim() || ui.noTitleYet}
                </div>

                <div className="mt-2 text-sm leading-7 text-slate-300">
                  {description.trim() ? description.trim() : ui.noDescriptionYet}
                </div>
              </div>
            </SurfaceCard>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-[#0B1322] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
              <div className="text-sm leading-6 text-slate-300">
                {ui.footerHint}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/challenges">
                  <PrimaryButton variant="secondary">{ui.cancel}</PrimaryButton>
                </Link>

                <PrimaryButton onClick={handleCreate} disabled={saving}>
                  {saving ? ui.creating : ui.createButton}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}