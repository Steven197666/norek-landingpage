/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

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

type ProfileUi = {
  loadingProfile: string;
  profileLoadFailed: string;
  profileLoadRetry: string;
  loginAgain: string;

  accountArea: string;
  profileTitle: string;
  adminIntro: string;
  userIntro: string;

  paymentsAdmin: string;
  myChallenges: string;
  logout: string;

  viewAvatar: string;
  noAvatar: string;
  avatarChange: string;
  avatarLoading: string;
  avatarFormatsHint: string;

  role: string;
  adultVerified: string;
  adultUnlockedByDob: string;
  adultNotUnlocked: string;

  adminTools: string;
  adminAccessActive: string;
  adminAccessText: string;
  openPayments: string;
  webhooks: string;
  payouts: string;
  comingNext: string;
  later: string;

  progressTitle: string;
  progressSubtitle: string;
  currentLevel: string;
  totalXp: string;
  currentRank: string;
  progressToLevel: string;
  maxLevelReached: string;
  stillXp: string;
  xpInThisLevel: string;
  untilLevel: string;
  maxLevelText: string;
  newHere: string;

  overviewTitle: string;
  overviewSubtitle: string;
  challengesCreated: string;
  completed: string;
  wonChallenges: string;
  funding: string;
  activeVoting: string;
  memberSince: string;
  yourStart: string;

  latestChallengesTitle: string;
  latestChallengesSubtitle: string;
  noChallengesYet: string;

  winsTitle: string;
  winsSubtitle: string;
  totalWinnings: string;
  noWinsYet: string;
  winAmount: string;
  won: string;

  accountDetails: string;
  accountDetailsSubtitle: string;
  email: string;
  userId: string;

  security: string;
  securitySubtitle: string;
  dateOfBirth: string;
  saveDateOfBirth: string;
  saving: string;
  dateOfBirthSaveSuccess: string;
  dateOfBirthSaveFailed: string;
  dobUnlockHint: string;

  usefulLater: string;
  changePassword: string;
  deleteAccount: string;

  changePasswordTitle: string;
  changePasswordSubtitle: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  saveNewPassword: string;
  passwordChanged: string;
  passwordChangeFailed: string;

  deleteAccountTitle: string;
  deleteAccountSubtitle: string;
  deleteAccountWarning: string;
  deleteAccountConfirmPlaceholder: string;
  deleteAccountConfirmText: string;
  deleteAccountSuccess: string;
  deleteAccountFailed: string;
  deleteMyAccount: string;

  cancel: string;
  confirm: string;
  loading: string;

  close: string;

  uploadTypeError: string;
  uploadSizeError: string;
  avatarUploadFailed: string;
  avatarUploadSuccess: string;

  requestFailed: string;
  roleUser: string;

  statusFunding: string;
  statusActive: string;
  statusVoting: string;
  statusCompleted: string;
};

const PROFILE_UI: Record<ChallengeLocale, ProfileUi> = {
  de: {
    loadingProfile: "Lade Profil…",
    profileLoadFailed: "Konnte Profil nicht laden. Bitte erneut einloggen.",
    profileLoadRetry: "Erneut laden",
    loginAgain: "Neu einloggen",

    accountArea: "Account Bereich",
    profileTitle: "Dein Profil",
    adminIntro:
      "Verwalte deinen Account und greife direkt auf deine Admin-Werkzeuge für Zahlungen und Systemübersicht zu.",
    userIntro:
      "Verwalte deinen Account, prüfe deinen 18+ Status und behalte deine Gewinne und Challenges im Blick.",

    paymentsAdmin: "Payments Admin",
    myChallenges: "Meine Challenges",
    logout: "Logout",

    viewAvatar: "Profilbild groß anzeigen",
    noAvatar: "Kein Profilbild vorhanden",
    avatarChange: "Bild ändern",
    avatarLoading: "Lädt...",
    avatarFormatsHint: "JPG, PNG oder WEBP · max. 5 MB",

    role: "Rolle",
    adultVerified: "18+: Verifiziert",
    adultUnlockedByDob: "18+: Über Geburtsdatum erkannt",
    adultNotUnlocked: "18+: Nicht freigeschaltet",

    adminTools: "Admin Tools",
    adminAccessActive: "Admin-Zugang aktiv",
    adminAccessText:
      "Dein Konto ist als Admin eingetragen. Von hier gelangst du direkt zur Zahlungsübersicht und später zu Webhook-Logs und Auszahlungen.",
    openPayments: "Payments öffnen",
    webhooks: "Webhooks",
    payouts: "Payouts",
    comingNext: "Kommt als Nächstes",
    later: "Kommt später",

    progressTitle: "Dein Fortschritt",
    progressSubtitle: "So nah bist du am nächsten Level.",
    currentLevel: "Aktuelles Level",
    totalXp: "XP",
    currentRank: "Dein aktueller Rang im System.",
    progressToLevel: "Fortschritt zu Level",
    maxLevelReached: "Max-Level erreicht",
    stillXp: "Noch",
    xpInThisLevel: "XP in diesem Level",
    untilLevel: "bis Level",
    maxLevelText: "Du hast das Max-Level erreicht",
    newHere: "Neu dabei",

    overviewTitle: "Deine Übersicht",
    overviewSubtitle: "Die wichtigsten Zahlen auf einen Blick.",
    challengesCreated: "Challenges erstellt",
    completed: "Abgeschlossen",
    wonChallenges: "Gewonnene Challenges",
    funding: "Funding",
    activeVoting: "Aktiv / Voting",
    memberSince: "Dabei seit",
    yourStart: "Dein Start auf Norek",

    latestChallengesTitle: "Neueste Challenges",
    latestChallengesSubtitle: "Deine zuletzt erstellten Challenges.",
    noChallengesYet: "Du hast noch keine Challenges erstellt.",

    winsTitle: "Gewinne",
    winsSubtitle: "Deine zuletzt gewonnenen Challenges.",
    totalWinnings: "Gesamtgewinn",
    noWinsYet: "Du hast aktuell noch keine Challenge gewonnen.",
    winAmount: "Gewinn",
    won: "Gewonnen",

    accountDetails: "Kontodetails",
    accountDetailsSubtitle:
      "Technische und allgemeine Informationen zu deinem Konto.",
    email: "E-Mail",
    userId: "User ID",

    security: "Sicherheit",
    securitySubtitle:
      "Persönliche Daten, Altersfreigabe und spätere Sicherheitsfunktionen.",
    dateOfBirth: "Geburtsdatum",
    saveDateOfBirth: "Geburtsdatum speichern",
    saving: "Speichert…",
    dateOfBirthSaveSuccess: "Geburtsdatum gespeichert.",
    dateOfBirthSaveFailed: "Geburtsdatum konnte nicht gespeichert werden.",
    dobUnlockHint:
      "Dieses Datum wird genutzt, um 18+ Challenges freizuschalten.",

    usefulLater: "Später sinnvoll",
    changePassword: "Passwort ändern",
    deleteAccount: "Account löschen",

    changePasswordTitle: "Passwort ändern",
    changePasswordSubtitle: "Lege ein neues Passwort für deinen Account fest.",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmNewPassword: "Neues Passwort wiederholen",
    saveNewPassword: "Neues Passwort speichern",
    passwordChanged: "Passwort erfolgreich geändert.",
    passwordChangeFailed: "Passwort konnte nicht geändert werden.",

    deleteAccountTitle: "Account löschen",
    deleteAccountSubtitle: "Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden.",
    deleteAccountWarning:
      "Wenn du deinen Account löschst, verlierst du den Zugriff auf dein Profil und alle damit verbundenen Daten.",
    deleteAccountConfirmPlaceholder: "Zum Bestätigen DELETE eingeben",
    deleteAccountConfirmText: "Gib zur Bestätigung genau \"DELETE\" ein.",
    deleteAccountSuccess: "Account gelöscht.",
    deleteAccountFailed: "Account konnte nicht gelöscht werden.",
    deleteMyAccount: "Meinen Account löschen",

    cancel: "Abbrechen",
    confirm: "Bestätigen",
    loading: "Lädt...",

    close: "Schließen",

    uploadTypeError: "Bitte nur JPG, PNG oder WEBP hochladen.",
    uploadSizeError: "Das Bild ist zu groß. Maximal 5 MB.",
    avatarUploadFailed: "Profilbild konnte nicht hochgeladen werden.",
    avatarUploadSuccess: "Profilbild aktualisiert.",

    requestFailed: "Anfrage fehlgeschlagen",
    roleUser: "user",

    statusFunding: "Funding",
    statusActive: "Aktiv",
    statusVoting: "Voting",
    statusCompleted: "Abgeschlossen",
  },

  en: {
    loadingProfile: "Loading profile…",
    profileLoadFailed: "Could not load profile. Please log in again.",
    profileLoadRetry: "Retry",
    loginAgain: "Log in again",

    accountArea: "Account area",
    profileTitle: "Your profile",
    adminIntro:
      "Manage your account and access your admin tools for payments and system overview directly.",
    userIntro:
      "Manage your account, check your 18+ status and keep track of your wins and challenges.",

    paymentsAdmin: "Payments admin",
    myChallenges: "My challenges",
    logout: "Logout",

    viewAvatar: "View profile picture",
    noAvatar: "No profile picture available",
    avatarChange: "Change image",
    avatarLoading: "Uploading...",
    avatarFormatsHint: "JPG, PNG or WEBP · max. 5 MB",

    role: "Role",
    adultVerified: "18+: Verified",
    adultUnlockedByDob: "18+: Unlocked via date of birth",
    adultNotUnlocked: "18+: Not unlocked",

    adminTools: "Admin tools",
    adminAccessActive: "Admin access active",
    adminAccessText:
      "Your account is marked as admin. From here you can jump straight to the payment overview and later to webhook logs and payouts.",
    openPayments: "Open payments",
    webhooks: "Webhooks",
    payouts: "Payouts",
    comingNext: "Coming next",
    later: "Coming later",

    progressTitle: "Your progress",
    progressSubtitle: "How close you are to the next level.",
    currentLevel: "Current level",
    totalXp: "XP",
    currentRank: "Your current rank in the system.",
    progressToLevel: "Progress to level",
    maxLevelReached: "Max level reached",
    stillXp: "Still",
    xpInThisLevel: "XP in this level",
    untilLevel: "until level",
    maxLevelText: "You have reached the max level",
    newHere: "New here",

    overviewTitle: "Your overview",
    overviewSubtitle: "The most important numbers at a glance.",
    challengesCreated: "Challenges created",
    completed: "Completed",
    wonChallenges: "Challenges won",
    funding: "Funding",
    activeVoting: "Active / Voting",
    memberSince: "Member since",
    yourStart: "Your start on Norek",

    latestChallengesTitle: "Latest challenges",
    latestChallengesSubtitle: "Your most recently created challenges.",
    noChallengesYet: "You have not created any challenges yet.",

    winsTitle: "Wins",
    winsSubtitle: "Your most recently won challenges.",
    totalWinnings: "Total winnings",
    noWinsYet: "You have not won any challenge yet.",
    winAmount: "Win",
    won: "Won",

    accountDetails: "Account details",
    accountDetailsSubtitle:
      "Technical and general information about your account.",
    email: "Email",
    userId: "User ID",

    security: "Security",
    securitySubtitle:
      "Personal data, age unlock and later security features.",
    dateOfBirth: "Date of birth",
    saveDateOfBirth: "Save date of birth",
    saving: "Saving…",
    dateOfBirthSaveSuccess: "Date of birth saved.",
    dateOfBirthSaveFailed: "Could not save date of birth.",
    dobUnlockHint:
      "This date is used to unlock 18+ challenges.",

    usefulLater: "Useful later",
    changePassword: "Change password",
    deleteAccount: "Delete account",

    changePasswordTitle: "Change password",
    changePasswordSubtitle: "Set a new password for your account.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    saveNewPassword: "Save new password",
    passwordChanged: "Password changed successfully.",
    passwordChangeFailed: "Could not change password.",

    deleteAccountTitle: "Delete account",
    deleteAccountSubtitle: "This action is permanent and cannot be undone.",
    deleteAccountWarning:
      "If you delete your account, you will lose access to your profile and all related data.",
    deleteAccountConfirmPlaceholder: "Type DELETE to confirm",
    deleteAccountConfirmText: "Type exactly \"DELETE\" to confirm.",
    deleteAccountSuccess: "Account deleted.",
    deleteAccountFailed: "Could not delete account.",
    deleteMyAccount: "Delete my account",

    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading...",

    close: "Close",

    uploadTypeError: "Please upload only JPG, PNG or WEBP.",
    uploadSizeError: "The image is too large. Maximum 5 MB.",
    avatarUploadFailed: "Could not upload profile picture.",
    avatarUploadSuccess: "Profile picture updated.",

    requestFailed: "Request failed",
    roleUser: "user",

    statusFunding: "Funding",
    statusActive: "Active",
    statusVoting: "Voting",
    statusCompleted: "Completed",
  },

  es: {
    loadingProfile: "Cargando perfil…",
    profileLoadFailed: "No se pudo cargar el perfil. Vuelve a iniciar sesión.",
    profileLoadRetry: "Volver a cargar",
    loginAgain: "Iniciar sesión de nuevo",

    accountArea: "Área de cuenta",
    profileTitle: "Tu perfil",
    adminIntro:
      "Gestiona tu cuenta y accede directamente a tus herramientas de admin para pagos y visión general del sistema.",
    userIntro:
      "Gestiona tu cuenta, revisa tu estado 18+ y mantén a la vista tus ganancias y retos.",

    paymentsAdmin: "Admin de pagos",
    myChallenges: "Mis challenges",
    logout: "Cerrar sesión",

    viewAvatar: "Ver foto de perfil",
    noAvatar: "No hay foto de perfil",
    avatarChange: "Cambiar imagen",
    avatarLoading: "Subiendo...",
    avatarFormatsHint: "JPG, PNG o WEBP · máx. 5 MB",

    role: "Rol",
    adultVerified: "18+: Verificado",
    adultUnlockedByDob: "18+: Detectado por fecha de nacimiento",
    adultNotUnlocked: "18+: No desbloqueado",

    adminTools: "Herramientas admin",
    adminAccessActive: "Acceso admin activo",
    adminAccessText:
      "Tu cuenta está marcada como admin. Desde aquí puedes entrar directamente en la vista de pagos y más adelante en logs de webhooks y payouts.",
    openPayments: "Abrir pagos",
    webhooks: "Webhooks",
    payouts: "Payouts",
    comingNext: "Lo siguiente",
    later: "Más adelante",

    progressTitle: "Tu progreso",
    progressSubtitle: "Así de cerca estás del siguiente nivel.",
    currentLevel: "Nivel actual",
    totalXp: "XP",
    currentRank: "Tu rango actual en el sistema.",
    progressToLevel: "Progreso hacia el nivel",
    maxLevelReached: "Nivel máximo alcanzado",
    stillXp: "Faltan",
    xpInThisLevel: "XP en este nivel",
    untilLevel: "hasta el nivel",
    maxLevelText: "Has alcanzado el nivel máximo",
    newHere: "Recién llegado",

    overviewTitle: "Tu resumen",
    overviewSubtitle: "Las cifras más importantes de un vistazo.",
    challengesCreated: "Challenges creados",
    completed: "Completados",
    wonChallenges: "Challenges ganados",
    funding: "Funding",
    activeVoting: "Activo / Voting",
    memberSince: "Desde",
    yourStart: "Tu inicio en Norek",

    latestChallengesTitle: "Últimos challenges",
    latestChallengesSubtitle: "Tus challenges creados más recientemente.",
    noChallengesYet: "Todavía no has creado ningún challenge.",

    winsTitle: "Ganancias",
    winsSubtitle: "Tus últimos challenges ganados.",
    totalWinnings: "Ganancia total",
    noWinsYet: "Por ahora no has ganado ningún challenge.",
    winAmount: "Ganancia",
    won: "Ganado",

    accountDetails: "Detalles de la cuenta",
    accountDetailsSubtitle:
      "Información técnica y general sobre tu cuenta.",
    email: "Correo electrónico",
    userId: "ID de usuario",

    security: "Seguridad",
    securitySubtitle:
      "Datos personales, desbloqueo por edad y futuras funciones de seguridad.",
    dateOfBirth: "Fecha de nacimiento",
    saveDateOfBirth: "Guardar fecha de nacimiento",
    saving: "Guardando…",
    dateOfBirthSaveSuccess: "Fecha de nacimiento guardada.",
    dateOfBirthSaveFailed: "No se pudo guardar la fecha de nacimiento.",
    dobUnlockHint:
      "Esta fecha se usa para desbloquear challenges 18+.",

    usefulLater: "Útil más adelante",
    changePassword: "Cambiar contraseña",
    deleteAccount: "Eliminar cuenta",

    changePasswordTitle: "Cambiar contraseña",
    changePasswordSubtitle: "Define una nueva contraseña para tu cuenta.",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmNewPassword: "Repetir nueva contraseña",
    saveNewPassword: "Guardar nueva contraseña",
    passwordChanged: "Contraseña cambiada correctamente.",
    passwordChangeFailed: "No se pudo cambiar la contraseña.",

    deleteAccountTitle: "Eliminar cuenta",
    deleteAccountSubtitle: "Esta acción es permanente y no se puede deshacer.",
    deleteAccountWarning:
      "Si eliminas tu cuenta, perderás el acceso a tu perfil y a todos los datos relacionados.",
    deleteAccountConfirmPlaceholder: "Escribe DELETE para confirmar",
    deleteAccountConfirmText: "Escribe exactamente \"DELETE\" para confirmar.",
    deleteAccountSuccess: "Cuenta eliminada.",
    deleteAccountFailed: "No se pudo eliminar la cuenta.",
    deleteMyAccount: "Eliminar mi cuenta",

    cancel: "Cancelar",
    confirm: "Confirmar",
    loading: "Cargando...",

    close: "Cerrar",

    uploadTypeError: "Sube solo JPG, PNG o WEBP.",
    uploadSizeError: "La imagen es demasiado grande. Máximo 5 MB.",
    avatarUploadFailed: "No se pudo subir la foto de perfil.",
    avatarUploadSuccess: "Foto de perfil actualizada.",

    requestFailed: "La solicitud ha fallado",
    roleUser: "user",

    statusFunding: "Funding",
    statusActive: "Activo",
    statusVoting: "Voting",
    statusCompleted: "Completado",
  },

  fr: {
    loadingProfile: "Chargement du profil…",
    profileLoadFailed:
      "Impossible de charger le profil. Merci de te reconnecter.",
    profileLoadRetry: "Recharger",
    loginAgain: "Se reconnecter",

    accountArea: "Espace compte",
    profileTitle: "Ton profil",
    adminIntro:
      "Gère ton compte et accède directement à tes outils admin pour les paiements et la vue système.",
    userIntro:
      "Gère ton compte, vérifie ton statut 18+ et garde un œil sur tes gains et tes défis.",

    paymentsAdmin: "Admin paiements",
    myChallenges: "Mes challenges",
    logout: "Déconnexion",

    viewAvatar: "Voir l’image de profil",
    noAvatar: "Aucune image de profil",
    avatarChange: "Changer l’image",
    avatarLoading: "Téléversement...",
    avatarFormatsHint: "JPG, PNG ou WEBP · max. 5 MB",

    role: "Rôle",
    adultVerified: "18+ : Vérifié",
    adultUnlockedByDob: "18+ : Détecté via la date de naissance",
    adultNotUnlocked: "18+ : Non débloqué",

    adminTools: "Outils admin",
    adminAccessActive: "Accès admin actif",
    adminAccessText:
      "Ton compte est marqué comme admin. Depuis ici, tu peux accéder directement à l’aperçu des paiements puis plus tard aux logs de webhooks et aux payouts.",
    openPayments: "Ouvrir les paiements",
    webhooks: "Webhooks",
    payouts: "Payouts",
    comingNext: "Arrive ensuite",
    later: "Plus tard",

    progressTitle: "Ta progression",
    progressSubtitle: "À quel point tu es proche du niveau suivant.",
    currentLevel: "Niveau actuel",
    totalXp: "XP",
    currentRank: "Ton rang actuel dans le système.",
    progressToLevel: "Progression vers le niveau",
    maxLevelReached: "Niveau max atteint",
    stillXp: "Encore",
    xpInThisLevel: "XP dans ce niveau",
    untilLevel: "jusqu’au niveau",
    maxLevelText: "Tu as atteint le niveau maximum",
    newHere: "Nouveau ici",

    overviewTitle: "Ton aperçu",
    overviewSubtitle: "Les chiffres les plus importants en un coup d’œil.",
    challengesCreated: "Challenges créés",
    completed: "Terminés",
    wonChallenges: "Challenges gagnés",
    funding: "Funding",
    activeVoting: "Actif / Voting",
    memberSince: "Membre depuis",
    yourStart: "Ton début sur Norek",

    latestChallengesTitle: "Derniers challenges",
    latestChallengesSubtitle: "Tes challenges créés les plus récents.",
    noChallengesYet: "Tu n’as encore créé aucun challenge.",

    winsTitle: "Gains",
    winsSubtitle: "Tes derniers challenges gagnés.",
    totalWinnings: "Gain total",
    noWinsYet: "Tu n’as encore gagné aucun challenge.",
    winAmount: "Gain",
    won: "Gagné",

    accountDetails: "Détails du compte",
    accountDetailsSubtitle:
      "Informations techniques et générales sur ton compte.",
    email: "E-mail",
    userId: "ID utilisateur",

    security: "Sécurité",
    securitySubtitle:
      "Données personnelles, déblocage 18+ et futures fonctions de sécurité.",
    dateOfBirth: "Date de naissance",
    saveDateOfBirth: "Enregistrer la date de naissance",
    saving: "Enregistrement…",
    dateOfBirthSaveSuccess: "Date de naissance enregistrée.",
    dateOfBirthSaveFailed:
      "Impossible d’enregistrer la date de naissance.",
    dobUnlockHint:
      "Cette date est utilisée pour débloquer les challenges 18+.",

    usefulLater: "Utile plus tard",
    changePassword: "Changer le mot de passe",
    deleteAccount: "Supprimer le compte",

    changePasswordTitle: "Changer le mot de passe",
    changePasswordSubtitle: "Définis un nouveau mot de passe pour ton compte.",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmer le nouveau mot de passe",
    saveNewPassword: "Enregistrer le nouveau mot de passe",
    passwordChanged: "Mot de passe modifié avec succès.",
    passwordChangeFailed: "Impossible de modifier le mot de passe.",

    deleteAccountTitle: "Supprimer le compte",
    deleteAccountSubtitle: "Cette action est définitive et ne peut pas être annulée.",
    deleteAccountWarning:
      "Si tu supprimes ton compte, tu perdras l’accès à ton profil et à toutes les données associées.",
    deleteAccountConfirmPlaceholder: "Saisis DELETE pour confirmer",
    deleteAccountConfirmText: "Saisis exactement \"DELETE\" pour confirmer.",
    deleteAccountSuccess: "Compte supprimé.",
    deleteAccountFailed: "Impossible de supprimer le compte.",
    deleteMyAccount: "Supprimer mon compte",

    cancel: "Annuler",
    confirm: "Confirmer",
    loading: "Chargement...",

    close: "Fermer",

    uploadTypeError: "Merci d’envoyer uniquement du JPG, PNG ou WEBP.",
    uploadSizeError: "L’image est trop grande. Maximum 5 MB.",
    avatarUploadFailed: "Impossible d’envoyer l’image de profil.",
    avatarUploadSuccess: "Image de profil mise à jour.",

    requestFailed: "La requête a échoué",
    roleUser: "user",

    statusFunding: "Funding",
    statusActive: "Actif",
    statusVoting: "Voting",
    statusCompleted: "Terminé",
  },
};

type MeResponse = {
  id: string;
  email: string;
  username: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string | null;
  isAdultVerified?: boolean;
  dateOfBirth?: string | null;
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
};

type ChallengeUserRef = {
  id: string;
  username?: string;
};

type WinnerRef = {
  attemptId?: string;
  userId?: string | null;
  username?: string | null;
  playbackId?: string | null;
  score?: number;
  submittedAt?: string | null;
};

type MyChallenge = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  previewImageUrl?: string | null;
  minAmount?: number | null;
  currentAmount?: number | null;
  status?: "funding" | "active" | "voting" | "completed" | string;
  result?: string | null;
  createdAt?: string;
  owner?: ChallengeUserRef | null;
  Owner?: ChallengeUserRef | null;
  winnerUserId?: string | null;
  winnerAttemptId?: string | null;
  winnerPlaybackId?: string | null;
  winner?: WinnerRef | null;
};

type MySubmission = {
  id: string;
  challengeId: string;
  title: string;
  status: string;
  submittedAt?: string | null;
  score?: number;
  upVotes?: number;
};

function initials(username: string) {
  const u = (username || "").trim();
  if (!u) return "?";
  return u.slice(0, 2).toUpperCase();
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

function formatCompactNumber(value: number, locale: ChallengeLocale = "de") {
  try {
    return new Intl.NumberFormat(getIntlLocale(locale), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

function statusLabel(status: string | undefined, ui: ProfileUi) {
  if (status === "funding") return ui.statusFunding;
  if (status === "active") return ui.statusActive;
  if (status === "voting") return ui.statusVoting;
  if (status === "completed") return ui.statusCompleted;
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

function getUnknownErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const msg = error.message?.trim();
    if (msg) return msg;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}

async function getApiErrorMessage(
  res: Response,
  fallback: string
) {
  try {
    const clone = res.clone();
    const data = await clone.json();

    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    //
  }

  try {
    const txt = await res.text();
    if (txt?.trim()) return txt;
  } catch {
    //
  }

  return fallback;
}

function getChallengeWinnerUsername(challenge: MyChallenge): string | null {
  const u = challenge.winner?.username;
  if (!u || typeof u !== "string") return null;
  const clean = u.trim();
  return clean || null;
}

function hasUserWonChallenge(challenge: MyChallenge, me: MeResponse | null) {
  if (!me) return false;

  if (
    challenge.winnerUserId &&
    String(challenge.winnerUserId) === String(me.id)
  ) {
    return true;
  }

  const winnerUsername = getChallengeWinnerUsername(challenge);
  if (winnerUsername && winnerUsername === me.username) {
    return true;
  }

  return false;
}

function getAdultStatusLabel(me: MeResponse | null, ui: ProfileUi) {
  if (!me) return ui.adultNotUnlocked;
  if (me.isAdultVerified) return ui.adultVerified;
  if (isAtLeast18(me.dateOfBirth)) return ui.adultUnlockedByDob;
  return ui.adultNotUnlocked;
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

function getChallengePreviewSrc(challenge: MyChallenge) {
  const raw =
    challenge.thumbnailUrl ??
    challenge.thumbnail_url ??
    challenge.previewImageUrl ??
    null;

  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${getBackendBaseUrl()}${raw}`;
}

function formatRelativeTime(dateInput: string | undefined, locale: ChallengeLocale) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const rtf = new Intl.RelativeTimeFormat(getIntlLocale(locale), { numeric: "auto" });
  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 60) return rtf.format(deltaSeconds, "second");

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) return rtf.format(deltaMinutes, "minute");

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) return rtf.format(deltaHours, "hour");

  const deltaDays = Math.round(deltaHours / 24);
  return rtf.format(deltaDays, "day");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={`mt-2 font-extrabold tracking-tight text-slate-950 ${
          typeof value === "string" && String(value).length > 10
            ? "text-2xl leading-tight"
            : "text-4xl"
        }`}
      >
        {value}
      </div>
      {hint ? <div className="mt-2 text-sm text-slate-500">{hint}</div> : null}
    </div>
  );
}

function InfoMiniCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={`mt-2 text-sm text-slate-800 ${
          mono ? "break-all font-mono" : "break-words font-semibold"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FooterNavIcon({
  name,
}: {
  name: "overview" | "challenges" | "activity" | "wallet";
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

  if (name === "activity") {
    return (
      <svg {...common}>
        <path
          d="M3 12H7L9.5 8L13.5 16L16 11H21"
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

function NorekLogo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Norek Logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="norekGrad"
          x1="380"
          y1="180"
          x2="900"
          y2="900"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#8FEFFF" />
          <stop offset="0.46" stopColor="#4E8FFF" />
          <stop offset="1" stopColor="#173DFF" />
        </linearGradient>
      </defs>

      <path
        d="M456 290L596 430V878L456 1018V290Z"
        fill="url(#norekGrad)"
      />

      <path
        d="M638 570L750 678L638 786V570Z"
        fill="url(#norekGrad)"
      />

      <path
        d="M610 430L864 684V426C864 351 894 286 941 239L988 190V478L930 430L902 471C887 494 878 524 878 557V878L610 610V430Z"
        fill="url(#norekGrad)"
      />

      <path
        d="M866 304L1002 173L976 440L918 346L866 304Z"
        fill="url(#norekGrad)"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeLocale, setActiveLocale] = useState<ChallengeLocale>("de");
  const ui = useMemo(
    () => PROFILE_UI[activeLocale] ?? PROFILE_UI.de,
    [activeLocale]
  );

  const [me, setMe] = useState<MeResponse | null>(null);
  const [myChallenges, setMyChallenges] = useState<MyChallenge[]>([]);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileBio, setProfileBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [mobileTab, setMobileTab] = useState<
    "overview" | "challenges" | "submits" | "achievements"
  >("overview");
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("dp_username");
    localStorage.removeItem("dp_avatar_url");
    localStorage.removeItem("dp_role");
    router.replace("/auth/login");
  }, [router]);

  useEffect(() => {
    setActiveLocale(getActiveChallengeLocale());
  }, []);

  const handleLocaleChange = useCallback((nextLocale: ChallengeLocale) => {
    setActiveLocale(nextLocale);
    localStorage.setItem("app_locale", nextLocale);
    localStorage.setItem("locale", nextLocale);
    localStorage.setItem("language", nextLocale);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const meRes = await apiFetch("/users/me", { method: "GET" }, true);

      if (!meRes.ok) {
        const msg = await getApiErrorMessage(meRes, ui.profileLoadFailed);

        if (meRes.status === 401) {
          logout();
          return;
        }

        setError(msg);
        return;
      }

      const meData: MeResponse = await meRes.json();
      setMe(meData);
      setDateOfBirth(meData?.dateOfBirth ?? "");

      if (meData?.username) {
        localStorage.setItem("dp_username", meData.username);
      }
      if (meData?.avatarUrl) {
        localStorage.setItem("dp_avatar_url", meData.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
      if (meData?.role) {
        localStorage.setItem("dp_role", meData.role);
      } else {
        localStorage.removeItem("dp_role");
      }

      const challengesRes = await apiFetch(
        "/challenges/me",
        { method: "GET" },
        true
      );

      if (!challengesRes.ok) {
        if (challengesRes.status === 401) {
          logout();
          return;
        }
        setMyChallenges([]);
        return;
      }

      const rawChallenges = await challengesRes.json();
      const list = Array.isArray(rawChallenges)
        ? rawChallenges
        : Array.isArray(rawChallenges?.data)
          ? rawChallenges.data
          : [];

      setMyChallenges(list);
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, "");

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(ui.profileLoadFailed);
    } finally {
      setLoading(false);
    }
  }, [logout, ui]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    loadProfile();
  }, [loadProfile, router]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowAvatarLightbox(false);
      }
    }

    if (showAvatarLightbox) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [showAvatarLightbox]);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/users/me",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateOfBirth: dateOfBirth.trim() ? dateOfBirth : null,
          }),
        },
        true
      );

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, ui.dateOfBirthSaveFailed);
        setError(msg);
        return;
      }

      const data: MeResponse = await res.json();

      setMe(data);
      setDateOfBirth(data?.dateOfBirth ?? "");
      setSuccess(ui.dateOfBirthSaveSuccess);

      if (data?.username) {
        localStorage.setItem("dp_username", data.username);
      }
      if (data?.avatarUrl) {
        localStorage.setItem("dp_avatar_url", data.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
      if (data?.role) {
        localStorage.setItem("dp_role", data.role);
      } else {
        localStorage.removeItem("dp_role");
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, "");

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(ui.dateOfBirthSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(file?: File | null) {
    if (!file) return;

    const isAllowed = ["image/jpeg", "image/png", "image/webp"].includes(
      file.type
    );
    if (!isAllowed) {
      setError(ui.uploadTypeError);
      setSuccess("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(ui.uploadSizeError);
      setSuccess("");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await apiFetch(
        "/users/me/avatar",
        {
          method: "PATCH",
          body: formData,
        },
        true
      );

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, ui.avatarUploadFailed);
        setError(msg);
        return;
      }

      const data: MeResponse = await res.json();
      setMe(data);
      setSuccess(ui.avatarUploadSuccess);

      if (data?.username) {
        localStorage.setItem("dp_username", data.username);
      }
      if (data?.avatarUrl) {
        localStorage.setItem("dp_avatar_url", data.avatarUrl);
      } else {
        localStorage.removeItem("dp_avatar_url");
      }
      if (data?.role) {
        localStorage.setItem("dp_role", data.role);
      } else {
        localStorage.removeItem("dp_role");
      }
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, "");

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(ui.avatarUploadFailed);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleChangePassword() {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      setError(ui.requestFailed);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(ui.passwordChangeFailed);
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setSuccess("");

      const res = await apiFetch(
        "/users/me/password",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
        true
      );

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, ui.passwordChangeFailed);
        setError(msg);
        return;
      }

      setSuccess(ui.passwordChanged);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordModal(false);
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, ui.passwordChangeFailed);

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(ui.passwordChangeFailed);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmInput.trim() !== "DELETE") {
      setError(ui.deleteAccountFailed);
      return;
    }

    try {
      setDeletingAccount(true);
      setError("");
      setSuccess("");

      const res = await apiFetch("/users/me", { method: "DELETE" }, true);

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, ui.deleteAccountFailed);
        setError(msg);
        return;
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("dp_username");
      localStorage.removeItem("dp_avatar_url");
      localStorage.removeItem("dp_role");

      router.replace("/auth/login");
    } catch (e: unknown) {
      const msg = getUnknownErrorMessage(e, ui.deleteAccountFailed);

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        logout();
        return;
      }

      setError(ui.deleteAccountFailed);
    } finally {
      setDeletingAccount(false);
    }
  }

  const createdLabel = useMemo(() => {
    if (!me?.createdAt) return null;
    const d = new Date(me.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(getIntlLocale(activeLocale), {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }, [me?.createdAt, activeLocale]);

  const adultStatusLabel = useMemo(
    () => getAdultStatusLabel(me, ui),
    [me, ui]
  );
  const avatarSrc = useMemo(() => getAvatarSrc(me?.avatarUrl), [me?.avatarUrl]);
  const isAdmin = (me?.role ?? "").toLowerCase() === "admin";

  const stats = useMemo(() => {
    const created = myChallenges.length;
    const funding = myChallenges.filter((c) => c.status === "funding").length;
    const active = myChallenges.filter((c) => c.status === "active").length;
    const voting = myChallenges.filter((c) => c.status === "voting").length;
    const completed = myChallenges.filter((c) => c.status === "completed").length;

    const wonChallenges = myChallenges.filter((c) => hasUserWonChallenge(c, me));
    const totalWinnings = wonChallenges.reduce((sum, c) => {
      return sum + Number(c.currentAmount ?? 0);
    }, 0);

    return {
      created,
      funding,
      active,
      voting,
      completed,
      wonChallenges,
      wonCount: wonChallenges.length,
      totalWinnings,
    };
  }, [myChallenges, me]);

  const latestChallenges = useMemo(() => {
    return [...myChallenges]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [myChallenges]);

  const mobileHighlights = useMemo(
    () => latestChallenges.slice(0, 6),
    [latestChallenges]
  );

  const mobileWinRate = useMemo(() => {
    if (!stats.completed) return 0;
    return Math.round((stats.wonCount / stats.completed) * 100);
  }, [stats.completed, stats.wonCount]);

  const mobileTabs = useMemo(
    () => [
      {
        key: "overview" as const,
        label:
          activeLocale === "de"
            ? "Uebersicht"
            : activeLocale === "es"
              ? "Resumen"
              : activeLocale === "fr"
                ? "Aperçu"
                : "Overview",
      },
      {
        key: "challenges" as const,
        label:
          activeLocale === "de"
            ? "Challenges"
            : activeLocale === "es"
              ? "Retos"
              : activeLocale === "fr"
                ? "Défis"
                : "Challenges",
      },
      {
        key: "submits" as const,
        label:
          activeLocale === "de"
            ? "Submits"
            : activeLocale === "es"
              ? "Envíos"
              : activeLocale === "fr"
                ? "Soumissions"
                : "Submits",
      },
      {
        key: "achievements" as const,
        label:
          activeLocale === "de"
            ? "Erfolge"
            : activeLocale === "es"
              ? "Logros"
              : activeLocale === "fr"
                ? "Succès"
                : "Achievements",
      },
    ],
    [activeLocale]
  );

  const mobileCopy = useMemo(
    () => ({
      highlights:
        activeLocale === "de"
          ? "Highlights"
          : activeLocale === "es"
            ? "Destacados"
            : activeLocale === "fr"
              ? "Moments forts"
              : "Highlights",
      seeAll:
        activeLocale === "de"
          ? "Alle anzeigen"
          : activeLocale === "es"
            ? "Ver todo"
            : activeLocale === "fr"
              ? "Voir tout"
              : "See all",
      activeChallenges:
        activeLocale === "de"
          ? "Aktive Challenges"
          : activeLocale === "es"
            ? "Retos activos"
            : activeLocale === "fr"
              ? "Défis actifs"
              : "Active challenges",
      latestActivity:
        activeLocale === "de"
          ? "Letzte Aktivitaet"
          : activeLocale === "es"
            ? "Última actividad"
            : activeLocale === "fr"
              ? "Activité récente"
              : "Latest activity",
      myChallenges:
        activeLocale === "de"
          ? "Meine Challenges"
          : activeLocale === "es"
            ? "Mis retos"
            : activeLocale === "fr"
              ? "Mes défis"
              : "My challenges",
      submissions:
        activeLocale === "de"
          ? "Einreichungen"
          : activeLocale === "es"
            ? "Envíos"
            : activeLocale === "fr"
              ? "Soumissions"
              : "Submits",
      submitsShort:
        activeLocale === "de"
          ? "Submits"
          : activeLocale === "es"
            ? "Envíos"
            : activeLocale === "fr"
              ? "Soum."
              : "Submits",
      achievements:
        activeLocale === "de"
          ? "Erfolge"
          : activeLocale === "es"
            ? "Logros"
            : activeLocale === "fr"
              ? "Succès"
              : "Achievements",
      all:
        activeLocale === "de"
          ? "Alle"
          : activeLocale === "es"
            ? "Todo"
            : activeLocale === "fr"
              ? "Tout"
              : "All",
      wins:
        activeLocale === "de"
          ? "Siege"
          : activeLocale === "es"
            ? "Victorias"
            : activeLocale === "fr"
              ? "Victoires"
              : "Wins",
      votes:
        activeLocale === "de"
          ? "Votes"
          : activeLocale === "es"
            ? "Votos"
            : activeLocale === "fr"
              ? "Votes"
              : "Votes",
      earned:
        activeLocale === "de"
          ? "Verdient"
          : activeLocale === "es"
            ? "Ganado"
            : activeLocale === "fr"
              ? "Gagné"
              : "Earned",
      active:
        activeLocale === "de"
          ? "Aktiv"
          : activeLocale === "es"
            ? "Activo"
            : activeLocale === "fr"
              ? "Actif"
              : "Active",
      winRate:
        activeLocale === "de"
          ? "Winrate"
          : activeLocale === "es"
            ? "Tasa de victoria"
            : activeLocale === "fr"
              ? "Taux de victoire"
              : "Winrate",
    }),
    [activeLocale]
  );

  const mobileActivities = useMemo(() => {
    return latestChallenges.slice(0, 3).map((challenge, index) => {
      const message =
        activeLocale === "de"
          ? `${challenge.title} wurde aktualisiert`
          : activeLocale === "es"
            ? `${challenge.title} fue actualizado`
            : activeLocale === "fr"
              ? `${challenge.title} a ete mis a jour`
              : `${challenge.title} was updated`;

      const when = formatRelativeTime(challenge.createdAt, activeLocale);
      const points = index === 0 ? "+10" : index === 1 ? "+6" : "+2";

      return {
        id: challenge.id,
        message,
        when,
        points,
      };
    });
  }, [latestChallenges, activeLocale]);

  useEffect(() => {
    let canceled = false;

    async function loadMySubmissions() {
      if (!me?.id || latestChallenges.length === 0) {
        if (!canceled) setMySubmissions([]);
        return;
      }

      try {
        const results = await Promise.all(
          latestChallenges.slice(0, 8).map(async (challenge) => {
            const res = await apiFetch(
              `/challenges/${challenge.id}/attempts/me`,
              { method: "GET" },
              true
            );

            if (!res.ok) return [] as MySubmission[];

            const data = await res.json();
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
                ? data.data
                : [];

            return list.map((entry: any) => ({
              id: String(entry?.id ?? ""),
              challengeId: String(entry?.challengeId ?? challenge.id),
              title: challenge.title,
              status: String(entry?.status ?? "submitted"),
              submittedAt: entry?.submittedAt ?? entry?.createdAt ?? null,
              score: Number(entry?.score ?? 0),
              upVotes: Number(entry?.upVotes ?? 0),
            }));
          })
        );

        if (canceled) return;

        const merged = results
          .flat()
          .filter((s) => s.id)
          .sort((a, b) => {
            const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return tb - ta;
          });

        setMySubmissions(merged);
      } catch {
        if (!canceled) setMySubmissions([]);
      }
    }

    loadMySubmissions();

    return () => {
      canceled = true;
    };
  }, [latestChallenges, me?.id]);

  const defaultProfileClaim = useMemo(() => {
    if (activeLocale === "de") {
      return "Ich stelle mich jeder Challenge. Keine Ausreden.";
    }
    if (activeLocale === "es") {
      return "Acepto cada challenge. Sin excusas.";
    }
    if (activeLocale === "fr") {
      return "Je releve chaque challenge. Aucune excuse.";
    }
    return "I take every challenge. No excuses.";
  }, [activeLocale]);

  const profileBioStorageKey = useMemo(() => {
    if (!me?.id) return "";
    return `dp_profile_bio_${me.id}_${activeLocale}`;
  }, [activeLocale, me?.id]);

  useEffect(() => {
    if (!profileBioStorageKey) return;

    const stored = localStorage.getItem(profileBioStorageKey)?.trim();
    setProfileBio(stored || defaultProfileClaim);
    setEditingBio(false);
  }, [defaultProfileClaim, profileBioStorageKey]);

  const desktopBadges = useMemo(() => {
    const badges: string[] = [];

    if (stats.wonCount >= 5) {
      badges.push(
        activeLocale === "de"
          ? "Top Performer"
          : activeLocale === "es"
            ? "Top Performer"
            : activeLocale === "fr"
              ? "Top Performer"
              : "Top Performer"
      );
    }

    if (me?.isAdultVerified || isAtLeast18(me?.dateOfBirth)) {
      badges.push("18+");
    }

    if (isAdmin) {
      badges.push("Admin");
    }

    if (!badges.length) {
      badges.push(
        activeLocale === "de"
          ? "Aktiv"
          : activeLocale === "es"
            ? "Activo"
            : activeLocale === "fr"
              ? "Actif"
              : "Active"
      );
    }

    return badges;
  }, [activeLocale, isAdmin, me?.dateOfBirth, me?.isAdultVerified, stats.wonCount]);

  const desktopWinRate = useMemo(() => {
    if (!stats.completed) return 0;
    return Math.round((stats.wonCount / stats.completed) * 100);
  }, [stats.completed, stats.wonCount]);

  const mySubmissionVotes = useMemo(() => {
    return mySubmissions.reduce((sum, s) => sum + Number(s.upVotes ?? 0), 0);
  }, [mySubmissions]);

  const desktopStats = useMemo(() => {
    return [
      {
        label:
          activeLocale === "de"
            ? "Challenges"
            : activeLocale === "es"
              ? "Challenges"
              : activeLocale === "fr"
                ? "Challenges"
                : "Challenges",
        value: String(stats.created),
      },
      {
        label:
          activeLocale === "de"
            ? "Siege"
            : activeLocale === "es"
              ? "Victorias"
              : activeLocale === "fr"
                ? "Victoires"
                : "Wins",
        value: String(stats.wonCount),
      },
      {
        label:
          activeLocale === "de"
            ? "Aktiv / Voting"
            : activeLocale === "es"
              ? "Activo / Voting"
              : activeLocale === "fr"
                ? "Actif / Voting"
                : "Active / Voting",
        value: `${stats.active} / ${stats.voting}`,
      },
      {
        label:
          activeLocale === "de"
            ? "Verdient"
            : activeLocale === "es"
              ? "Ganado"
              : activeLocale === "fr"
                ? "Gagne"
                : "Earned",
        value: formatMoneyEUR(stats.totalWinnings, activeLocale),
      },
    ];
  }, [activeLocale, stats.active, stats.created, stats.totalWinnings, stats.voting, stats.wonCount]);

  if (loading) {
    return (
      <main className="min-h-screen min-h-dvh bg-slate-950">
        <div className="mx-auto max-w-6xl p-6">
          <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl">
            <div className="text-slate-700">{ui.loadingProfile}</div>
          </div>
        </div>
      </main>
    );
  }

  if (!loading && error && !me) {
    return (
      <main className="min-h-screen min-h-dvh bg-slate-950">
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="text-lg font-extrabold text-slate-900">
              {ui.profileTitle}
            </div>
            <div className="mt-2 font-semibold text-red-700">{error}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              <PrimaryButton type="button" variant="dark" onClick={loadProfile}>
                {ui.profileLoadRetry}
              </PrimaryButton>

              <PrimaryButton type="button" variant="secondary" onClick={logout}>
                {ui.loginAgain}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!me) return null;

  return (
    <main className="min-h-screen min-h-dvh bg-slate-950">
      <div className="mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+112px)] pt-[calc(env(safe-area-inset-top)+12px)] [@media(min-width:768px)_and_(min-height:700px)]:hidden">
        <div className="mb-2 flex items-center justify-between text-slate-300">
          <button
            type="button"
            onClick={() => router.push("/challenges")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5"
            aria-label="Back"
          >
            <span className="text-sm">←</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={activeLocale}
              onChange={(e) =>
                handleLocaleChange(e.target.value as ChallengeLocale)
              }
              className="h-8 rounded-full border border-white/10 bg-white/5 px-2 text-[11px] font-semibold text-slate-200 outline-none transition hover:bg-white/10"
              aria-label="Language"
            >
              <option value="de">DE</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>

            <button
              type="button"
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5"
              aria-label="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4C9.79086 4 8 5.79086 8 8V10.5C8 11.3456 7.68438 12.1608 7.11558 12.7861L6 14H18L16.8844 12.7861C16.3156 12.1608 16 11.3456 16 10.5V8C16 5.79086 14.2091 4 12 4Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 17C10.7739 17.6083 11.3599 18 12 18C12.6401 18 13.2261 17.6083 13.5 17"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (avatarSrc) setShowAvatarLightbox(true);
              }}
              className="h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-slate-700"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`Profile picture of ${me.username}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                  {initials(me.username)}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="mb-3.5 rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(44,129,255,0.28),transparent_40%),linear-gradient(165deg,#0b1830_0%,#091324_68%,#070f1c_100%)] p-[18px] shadow-2xl">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => {
                if (avatarSrc) setShowAvatarLightbox(true);
              }}
              className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-slate-700"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`Profile picture of ${me.username}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-white">
                  {initials(me.username)}
                </div>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[25px] font-extrabold leading-none tracking-tight text-white">
                {me.username}
              </div>
              <div className="mt-1 text-xs font-medium text-sky-200">@{me.username.toLowerCase()}</div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {desktopBadges.slice(0, 2).map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-100"
                  >
                    {badge}
                  </span>
                ))}
                {!desktopBadges.includes("18+") ? (
                  <span className="rounded-full border border-teal-300/30 bg-teal-300/15 px-2 py-0.5 text-[10px] font-semibold text-teal-100">
                    18+
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-slate-300">{profileBio || defaultProfileClaim}</p>

          <div className="mt-4 grid grid-cols-4 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/20">
            <div className="px-2 py-2.5 text-center">
              <div className="text-[14px] font-extrabold text-white">{stats.created}</div>
              <div className="text-[10px] text-slate-400">Challenges</div>
            </div>
            <div className="px-2 py-2.5 text-center">
              <div className="text-[14px] font-extrabold text-white">{stats.wonCount}</div>
              <div className="text-[10px] text-slate-400">{activeLocale === "de" ? "Siege" : "Wins"}</div>
            </div>
            <div className="px-2 py-2.5 text-center">
              <div className="text-[14px] font-extrabold text-white">{formatCompactNumber(stats.active + stats.voting, activeLocale)}</div>
              <div className="text-[10px] text-slate-400">{mobileCopy.active}</div>
            </div>
            <div className="px-2 py-2.5 text-center">
              <div className="text-[14px] font-extrabold text-white">{formatMoneyEUR(stats.totalWinnings, activeLocale)}</div>
              <div className="text-[10px] text-slate-400">{mobileCopy.earned}</div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">Level {Number(me.level ?? 1)}</div>
              <div className="text-xs font-semibold text-slate-300">{mobileWinRate}%</div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-[#2f7bff]"
                style={{
                  width: `${Math.max(0, Math.min(100, Number(me.progress ?? 0) * 100))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{Number(me.xpIntoLevel ?? 0)} / {Number(me.xpNeededForNextLevel ?? 0)} XP</span>
              <span>{mobileCopy.winRate} {mobileWinRate}%</span>
            </div>
          </div>
        </div>

        <div className="mb-3.5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">{mobileCopy.highlights}</h2>
            <Link href="/challenges/me" className="text-[11px] font-semibold text-[#4a95ff]">
              {mobileCopy.seeAll}
            </Link>
          </div>

          {mobileHighlights.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              {ui.noChallengesYet}
            </div>
          ) : (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5">
              {mobileHighlights.slice(0, 3).map((challenge) => {
                const preview = getChallengePreviewSrc(challenge);
                return (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.id}`}
                    className="min-w-[118px] rounded-xl border border-white/10 bg-[#091427] p-1.5 text-white"
                  >
                    <div className="h-[86px] overflow-hidden rounded-lg bg-slate-800">
                      {preview ? (
                        <img src={preview} alt={challenge.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-[linear-gradient(135deg,#1a2f4f_0%,#0f1e34_100%)]" />
                      )}
                    </div>
                    <div className="mt-1.5 line-clamp-1 text-[10px] font-semibold">{challenge.title}</div>
                    <div className="text-[10px] text-slate-400">{formatMoneyEUR(Number(challenge.currentAmount ?? 0), activeLocale)}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-4 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#081120]/90 p-1 text-[10px] text-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur">
          {mobileTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMobileTab(tab.key)}
              className={`rounded-xl py-2.5 transition duration-150 ${
                mobileTab === tab.key
                  ? "border border-white/15 bg-white/10 font-semibold text-white"
                  : "border border-transparent text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {mobileTab === "overview" ? (
            <motion.div
              key="mobile-tab-overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              <div className="mb-4 rounded-2xl border border-white/10 bg-[#091427] p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{mobileCopy.activeChallenges}</h3>
                <Link href="/challenges/me" className="text-[11px] font-semibold text-[#4a95ff]">
                  {mobileCopy.seeAll}
                </Link>
              </div>

              {latestChallenges.length ? (
                <Link
                  href={`/challenges/${latestChallenges[0].id}`}
                  className="flex min-h-[52px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div>
                    <div className="line-clamp-1 text-xs font-semibold text-white">{latestChallenges[0].title}</div>
                    <div className="text-[10px] text-slate-400">{formatMoneyEUR(Number(latestChallenges[0].currentAmount ?? 0), activeLocale)}</div>
                  </div>
                  <span className="rounded-md bg-[#1f66ff] px-2 py-1 text-[10px] font-bold text-white">
                    {statusLabel(latestChallenges[0].status, ui)}
                  </span>
                </Link>
              ) : (
                <div className="text-xs text-slate-400">{ui.noChallengesYet}</div>
              )}
            </div>

              <div className="mb-2 rounded-2xl border border-white/10 bg-[#091427] p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{mobileCopy.latestActivity}</h3>
                <Link href="/challenges/me" className="text-[11px] font-semibold text-[#4a95ff]">
                  {mobileCopy.all}
                </Link>
              </div>

              {mobileActivities.length === 0 ? (
                <div className="text-xs text-slate-400">{ui.noChallengesYet}</div>
              ) : (
                <div className="space-y-2">
                  {mobileActivities.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="flex min-h-[50px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="line-clamp-1 text-xs font-semibold text-white">{item.message}</div>
                        <div className="text-[10px] text-slate-400">{item.when}</div>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-400">{item.points}</div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </motion.div>
          ) : null}

          {mobileTab === "challenges" ? (
            <motion.div
              key="mobile-tab-challenges"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="mb-2 rounded-2xl border border-white/10 bg-[#091427] p-3"
            >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{mobileCopy.myChallenges}</h3>
              <Link href="/challenges/me" className="text-[11px] font-semibold text-[#4a95ff]">
                {mobileCopy.all}
              </Link>
            </div>

            {latestChallenges.length === 0 ? (
              <div className="text-xs text-slate-400">{ui.noChallengesYet}</div>
            ) : (
              <div className="space-y-2">
                {latestChallenges.slice(0, 3).map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.id}`}
                    className="flex min-h-[50px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="line-clamp-1 text-xs font-semibold text-white">{challenge.title}</div>
                      <div className="text-[10px] text-slate-400">{formatMoneyEUR(Number(challenge.currentAmount ?? 0), activeLocale)}</div>
                    </div>
                    <span className="rounded-md bg-[#1f66ff] px-2 py-1 text-[10px] font-bold text-white">
                      {statusLabel(challenge.status, ui)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            </motion.div>
          ) : null}

          {mobileTab === "submits" ? (
            <motion.div
              key="mobile-tab-submits"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="mb-2 rounded-2xl border border-white/10 bg-[#091427] p-3"
            >
            <h3 className="mb-2 text-sm font-bold text-white">{mobileCopy.submissions}</h3>
            <div className="space-y-2">
              {mySubmissions.slice(0, 4).map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="line-clamp-1 text-xs font-semibold text-white">{submission.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatRelativeTime(submission.submittedAt ?? undefined, activeLocale)}</span>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5">{submission.status}</span>
                  </div>
                </div>
              ))}
              {mySubmissions.length === 0 ? (
                <div className="text-xs text-slate-400">{ui.noChallengesYet}</div>
              ) : null}
            </div>
            </motion.div>
          ) : null}

          {mobileTab === "achievements" ? (
            <motion.div
              key="mobile-tab-achievements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="mb-2 rounded-2xl border border-white/10 bg-[#091427] p-3"
            >
            <h3 className="mb-2 text-sm font-bold text-white">{mobileCopy.achievements}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] text-slate-400">{mobileCopy.wins}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{stats.wonCount}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] text-slate-400">{mobileCopy.submitsShort}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{mySubmissions.length}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] text-slate-400">{mobileCopy.votes}</div>
                <div className="mt-1 text-sm font-extrabold text-white">{mySubmissionVotes}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[10px] text-slate-400">XP</div>
                <div className="mt-1 text-sm font-extrabold text-white">{Number(me.totalXp ?? 0)}</div>
              </div>
            </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <MobileBottomNav pathname={pathname ?? ""} locale={activeLocale} />
      </div>

      <div className="hidden w-full [@media(min-width:768px)_and_(min-height:700px)]:block xl:hidden">
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_18%_-10%,rgba(55,121,255,0.28),transparent_40%),linear-gradient(165deg,#030b1a_0%,#071126_55%,#091733_100%)] px-6 py-5">
          <div className="flex min-h-[calc(100vh-40px)] flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(165deg,#050c1c_0%,#07142c_62%,#0a1b37_100%)] p-5 shadow-[0_30px_80px_rgba(2,8,23,0.65)] ring-1 ring-white/10">
            <div>
            <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>9:41</span>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-4 rounded-sm bg-slate-300" />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between">
              <NorekLogo className="h-14 w-auto" />

              <div className="flex items-center gap-2.5">
                <select
                  value={activeLocale}
                  onChange={(e) => handleLocaleChange(e.target.value as ChallengeLocale)}
                  className="h-8 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-slate-200 outline-none"
                  aria-label="Language"
                >
                  <option value="de">DE</option>
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                  <option value="fr">FR</option>
                </select>

                <button
                  type="button"
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200"
                  aria-label="Notifications"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 4C9.79086 4 8 5.79086 8 8V10.5C8 11.3456 7.68438 12.1608 7.11558 12.7861L6 14H18L16.8844 12.7861C16.3156 12.1608 16 11.3456 16 10.5V8C16 5.79086 14.2091 4 12 4Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.5 17C10.7739 17.6083 11.3599 18 12 18C12.6401 18 13.2261 17.6083 13.5 17"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (avatarSrc) setShowAvatarLightbox(true);
                  }}
                  className="h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-slate-700"
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={`Profile picture of ${me.username}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                      {initials(me.username)}
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[42px] font-black leading-none tracking-tight text-white">
                {activeLocale === "de" ? `Hey ${me.username}!` : `Hey ${me.username}!`}
              </div>
              <div className="mt-1.5 text-2xl text-slate-300">
                {activeLocale === "de"
                  ? "Bereit fuer deine naechste Challenge?"
                  : activeLocale === "es"
                    ? "Listo para tu proximo challenge?"
                    : activeLocale === "fr"
                      ? "Pret pour ton prochain challenge ?"
                      : "Ready for your next challenge?"}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b172d] p-4">
                <div className="text-lg font-semibold text-slate-200">
                  {activeLocale === "de" ? "Dein Guthaben" : "Balance"}
                </div>
                <div className="mt-2 text-[38px] font-black leading-none text-white">
                  {formatMoneyEUR(stats.totalWinnings, activeLocale)}
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex h-11 items-center justify-between gap-3 rounded-xl bg-[#2f7bff] px-4 text-base font-semibold text-white"
                >
                  <span>{activeLocale === "de" ? "Einzahlen" : "Deposit"}</span>
                  <span aria-hidden>→</span>
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b172d] p-4">
                <div className="text-lg font-semibold text-slate-200">
                  {activeLocale === "de" ? "Dein Level" : "Your level"}
                </div>
                <div className="mt-1 text-[38px] font-black leading-none text-white">Level {Number(me.level ?? 1)}</div>
                <div className="mt-2 text-sm font-semibold text-slate-300">
                  {Number(me.xpIntoLevel ?? 0)} / {Number(me.xpNeededForNextLevel ?? 0)} XP
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-[#2f7bff]"
                    style={{ width: `${Math.max(0, Math.min(100, Number(me.progress ?? 0) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[34px] font-black leading-none text-white">{mobileCopy.myChallenges}</h3>
              <Link href="/challenges/me" className="text-lg font-semibold text-[#4a95ff]">
                {activeLocale === "de" ? "Alle ansehen" : "See all"}
              </Link>
            </div>

            {latestChallenges.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-base text-slate-300">
                {ui.noChallengesYet}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {latestChallenges.slice(0, 3).map((challenge) => {
                  const preview = getChallengePreviewSrc(challenge);
                  return (
                    <Link
                      key={`tablet-ref-card-${challenge.id}`}
                      href={`/challenges/${challenge.id}`}
                      className="rounded-2xl border border-white/10 bg-[#0a1a30] p-2"
                    >
                      <div className="h-28 overflow-hidden rounded-xl bg-slate-800">
                        {preview ? (
                          <img src={preview} alt={challenge.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[linear-gradient(135deg,#1a2f4f_0%,#0f1e34_100%)]" />
                        )}
                      </div>
                      <div className="mt-2 line-clamp-1 text-lg font-bold text-white">{challenge.title}</div>
                      <div className="mt-1 text-sm text-slate-300">
                        {formatMoneyEUR(Number(challenge.currentAmount ?? 0), activeLocale)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-[34px] font-black leading-none text-white">{mobileCopy.latestActivity}</h3>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-[#0b172d] p-3">
                <div className="text-[28px] font-black leading-none text-white">{mySubmissions.length}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Tricks</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b172d] p-3">
                <div className="text-[28px] font-black leading-none text-white">{formatMoneyEUR(stats.totalWinnings, activeLocale)}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{mobileCopy.earned}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b172d] p-3">
                <div className="text-[28px] font-black leading-none text-white">{mobileWinRate}%</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{mobileCopy.winRate}</div>
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-[#0b172d]/80 p-3">
              {mobileActivities.length ? (
                mobileActivities.slice(0, 3).map((item) => (
                  <div key={`tablet-feed-row-${item.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <div className="min-w-0 pr-3">
                      <div className="line-clamp-1 text-sm font-semibold text-white">{item.message}</div>
                      <div className="text-xs text-slate-400">{item.when}</div>
                    </div>
                    <div className="text-sm font-bold text-emerald-400">{item.points}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">{ui.noChallengesYet}</div>
              )}
            </div>

            </div>

            <footer className="mt-auto pt-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                <div className="relative h-[88px] overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.9)_0%,rgba(7,13,22,0.96)_100%)]">
                  <div className="grid h-full grid-cols-5 items-end px-1 pb-1.5 pt-1 text-center text-[10px] font-semibold text-slate-400">
                    <Link href="/profile" className="flex flex-col items-center justify-end gap-1 pb-1 text-slate-200">
                      <span className="text-[11px]"><FooterNavIcon name="overview" /></span>
                      <span>Home</span>
                    </Link>
                    <Link href="/challenges" className="flex flex-col items-center justify-end gap-1 pb-1">
                      <span className="text-[11px]"><FooterNavIcon name="challenges" /></span>
                      <span>Challenges</span>
                    </Link>
                    <Link href="/challenges/create" className="flex flex-col items-center justify-start">
                      <span className="relative -mt-[14px] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#2F7BFF_0%,#1E5EFF_100%)] text-lg font-bold text-white shadow-[0_10px_22px_rgba(24,94,255,0.30),0_0_0_4px_rgba(6,11,19,0.96)]">+</span>
                    </Link>
                    <Link href="/activity" className="flex flex-col items-center justify-end gap-1 pb-1">
                      <span className="text-[11px]"><FooterNavIcon name="activity" /></span>
                      <span>Feed</span>
                    </Link>
                    <Link href="/wallet" className="flex flex-col items-center justify-end gap-1 pb-1">
                      <span className="text-[11px]"><FooterNavIcon name="wallet" /></span>
                      <span>Wallet</span>
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <div className="mx-auto hidden max-w-6xl p-6 xl:block">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <span aria-hidden>←</span>
            {activeLocale === "de"
              ? "Zurueck"
              : activeLocale === "es"
                ? "Atras"
                : activeLocale === "fr"
                  ? "Retour"
                  : "Back"}
          </Link>

          <div className="flex items-center gap-2">
            <select
              value={activeLocale}
              onChange={(e) =>
                handleLocaleChange(e.target.value as ChallengeLocale)
              }
              className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 outline-none transition hover:bg-white/10"
              aria-label="Language"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>

            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Notifications"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4C9.79086 4 8 5.79086 8 8V10.5C8 11.3456 7.68438 12.1608 7.11558 12.7861L6 14H18L16.8844 12.7861C16.3156 12.1608 16 11.3456 16 10.5V8C16 5.79086 14.2091 4 12 4Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 17C10.7739 17.6083 11.3599 18 12 18C12.6401 18 13.2261 17.6083 13.5 17"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowPasswordModal(true);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Settings"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.95 5.45 15.22 5.988 16.248 5.421C17.84 4.543 19.606 6.309 18.728 7.901C18.161 8.929 18.699 10.199 19.832 10.474C21.588 10.9 21.588 13.398 19.832 13.824C18.699 14.099 18.161 15.369 18.728 16.397C19.606 17.989 17.84 19.755 16.248 18.877C15.22 18.31 13.95 18.848 13.675 19.981C13.249 21.737 10.751 21.737 10.325 19.981C10.05 18.848 8.78 18.31 7.752 18.877C6.16 19.755 4.394 17.989 5.272 16.397C5.839 15.369 5.301 14.099 4.168 13.824C2.412 13.398 2.412 10.9 4.168 10.474C5.301 10.199 5.839 8.929 5.272 7.901C4.394 6.309 6.16 4.543 7.752 5.421C8.78 5.988 10.05 5.45 10.325 4.317Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                if (avatarSrc) {
                  setShowAvatarLightbox(true);
                }
              }}
              className="h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-slate-700"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`Profile picture of ${me.username}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                  {initials(me.username)}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_80%_-20%,rgba(44,129,255,0.35),transparent_42%),linear-gradient(165deg,#0d1f35_0%,#0a1526_58%,#081221_100%)] p-6 shadow-2xl ring-1 ring-white/10 lg:p-7">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (avatarSrc) {
                        setShowAvatarLightbox(true);
                      }
                    }}
                    className={`group relative block h-24 w-24 overflow-hidden rounded-3xl border border-white/20 bg-slate-800 text-left shadow-xl transition ${
                      avatarSrc ? "hover:scale-[1.02]" : "cursor-default"
                    }`}
                    title={avatarSrc ? ui.viewAvatar : ui.noAvatar}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={`Profile picture of ${me.username}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white">
                        {initials(me.username)}
                      </div>
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="truncate text-3xl font-extrabold tracking-tight text-white">
                    {me.username}
                  </div>
                  <div className="text-sm font-semibold text-sky-200">@{me.username}</div>

                  {editingBio ? (
                    <div className="mt-2 max-w-xl space-y-2">
                      <textarea
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value.slice(0, 150))}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-300"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = profileBio.trim() || defaultProfileClaim;
                            setProfileBio(next);
                            if (profileBioStorageKey) {
                              localStorage.setItem(profileBioStorageKey, next);
                            }
                            setEditingBio(false);
                          }}
                          className="rounded-lg border border-sky-300/40 bg-sky-400/20 px-3 py-1.5 text-xs font-semibold text-sky-100"
                        >
                          {activeLocale === "de"
                            ? "Speichern"
                            : activeLocale === "es"
                              ? "Guardar"
                              : activeLocale === "fr"
                                ? "Enregistrer"
                                : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileBio(defaultProfileClaim);
                            setEditingBio(false);
                          }}
                          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
                        >
                          {activeLocale === "de"
                            ? "Zuruecksetzen"
                            : activeLocale === "es"
                              ? "Restablecer"
                              : activeLocale === "fr"
                                ? "Reinitialiser"
                                : "Reset"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="max-w-xl text-sm text-slate-300">{profileBio || defaultProfileClaim}</p>
                      <button
                        type="button"
                        onClick={() => setEditingBio(true)}
                        className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/15"
                      >
                        {activeLocale === "de"
                          ? "Bio bearbeiten"
                          : activeLocale === "es"
                            ? "Editar bio"
                            : activeLocale === "fr"
                              ? "Modifier bio"
                              : "Edit bio"}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {desktopBadges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100"
                      >
                        {badge}
                      </span>
                    ))}

                    <span className="inline-flex items-center rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-200">
                      {adultStatusLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                  title={ui.avatarChange}
                >
                  {uploadingAvatar ? ui.avatarLoading : ui.avatarChange}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
                />

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  {ui.logout}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {desktopStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    {item.label}
                  </div>
                  <div className="mt-1 truncate text-2xl font-extrabold tracking-tight text-white">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    {activeLocale === "de"
                      ? "Level-Fortschritt"
                      : activeLocale === "es"
                        ? "Progreso de nivel"
                        : activeLocale === "fr"
                          ? "Progression de niveau"
                          : "Level progress"}
                  </div>
                  <div className="mt-1 text-xl font-extrabold text-white">
                    Level {Number(me.level ?? 1)}
                  </div>
                </div>

                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  {desktopWinRate}% Win-Rate
                </div>
              </div>

              <div className="mt-3 h-2.5 w-full rounded-full bg-slate-800/80">
                <div
                  className="h-2.5 rounded-full bg-[#2f7bff]"
                  style={{
                    width: `${Math.max(0, Math.min(100, Number(me.progress ?? 0) * 100))}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span>
                  {Number(me.xpIntoLevel ?? 0)} / {Number(me.xpNeededForNextLevel ?? 0)} XP
                </span>
                <span>
                  {ui.stillXp} {Number(me.remainingToNextLevel ?? 0)} XP {ui.untilLevel} {Number(me.nextLevel ?? Number(me.level ?? 1) + 1)}
                </span>
              </div>
            </div>
          </div>

          {(success || error) && (
            <div className="mt-4">
              {success ? (
                <div className="rounded-2xl border border-green-300/40 bg-green-500/15 px-4 py-3 text-sm font-semibold text-green-200">
                  {success}
                </div>
              ) : null}

              {error ? (
                <div className="mt-3 rounded-2xl border border-rose-300/40 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {isAdmin ? (
          <div className="mb-6 rounded-[28px] border border-teal-400/20 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 p-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                  {ui.adminTools}
                </div>

                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
                  {ui.adminAccessActive}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {ui.adminAccessText}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/admin/payments">
                  <PrimaryButton variant="dark">{ui.openPayments}</PrimaryButton>
                </Link>

                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-400"
                  title={ui.comingNext}
                >
                  {ui.webhooks}
                </button>

                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-400"
                  title={ui.later}
                >
                  {ui.payouts}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="order-3 rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.progressTitle}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.progressSubtitle}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {ui.currentLevel}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-5xl font-extrabold leading-none tracking-tight text-slate-950">
                      {Number(me.level ?? 1)}
                    </div>

                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      {Number(me.totalXp ?? 0)} {ui.totalXp}
                    </div>
                  </div>

                  <div className="mt-4 text-base font-extrabold text-slate-900">
                    {me.levelTitle ?? ui.newHere}
                  </div>

                  <div className="mt-2 text-sm leading-6 text-slate-500">
                    {ui.currentRank}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ui.progressToLevel}{" "}
                        {Number(me.nextLevel ?? Number(me.level ?? 1) + 1)}
                      </div>
                      <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                        {Number(me.totalXp ?? 0)} {ui.totalXp}
                      </div>
                    </div>

                    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                      {me.isMaxLevel
                        ? ui.maxLevelReached
                        : `${ui.stillXp} ${Number(me.remainingToNextLevel ?? 0)} XP`}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        Level {Number(me.level ?? 1)}
                      </span>
                      <span className="font-semibold text-slate-500">
                        Level {Number(me.nextLevel ?? Number(me.level ?? 1) + 1)}
                      </span>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-slate-900 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, Number(me.progress ?? 0) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                      <span>
                        {Number(me.xpIntoLevel ?? 0)} /{" "}
                        {Number(me.xpNeededForNextLevel ?? 0)} {ui.xpInThisLevel}
                      </span>

                      {!me.isMaxLevel ? (
                        <span className="font-semibold text-slate-800">
                          {ui.stillXp} {Number(me.remainingToNextLevel ?? 0)} XP{" "}
                          {ui.untilLevel}{" "}
                          {Number(me.nextLevel ?? Number(me.level ?? 1) + 1)}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          {ui.maxLevelText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2 rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.overviewTitle}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.overviewSubtitle}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label={ui.challengesCreated} value={stats.created} />
                <StatCard label={ui.completed} value={stats.completed} />
                <StatCard label={ui.wonChallenges} value={stats.wonCount} />
                <StatCard label={ui.funding} value={stats.funding} />
                <StatCard
                  label={ui.activeVoting}
                  value={`${stats.active} / ${stats.voting}`}
                />
                <StatCard
                  label={ui.memberSince}
                  value={createdLabel ?? "—"}
                  hint={ui.yourStart}
                />
              </div>
            </div>

            <div className="order-1 rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.latestChallengesTitle}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.latestChallengesSubtitle}
                </div>
              </div>

              {latestChallenges.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {ui.noChallengesYet}
                </div>
              ) : (
                <div className="grid gap-3">
                  {latestChallenges.map((challenge) => (
                    <Link
                      key={challenge.id}
                      href={`/challenges/${challenge.id}`}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-slate-900">
                            {challenge.title}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {formatMoneyEUR(
                              Number(challenge.currentAmount ?? 0),
                              activeLocale
                            )}
                            <span className="text-slate-400"> / </span>
                            {challenge.minAmount != null
                              ? formatMoneyEUR(
                                  Number(challenge.minAmount),
                                  activeLocale
                                )
                              : "—"}
                          </div>
                        </div>

                        <div
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                            challenge.status
                          )}`}
                        >
                          {statusLabel(challenge.status, ui)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.winsTitle}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.winsSubtitle}
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  {ui.totalWinnings}
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-green-900">
                  {formatMoneyEUR(stats.totalWinnings, activeLocale)}
                </div>
              </div>

              {stats.wonChallenges.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {ui.noWinsYet}
                </div>
              ) : (
                <div className="grid gap-3">
                  {stats.wonChallenges.slice(0, 5).map((challenge) => (
                    <Link
                      key={challenge.id}
                      href={`/challenges/${challenge.id}`}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-slate-900">
                            {challenge.title}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-green-700">
                            {ui.winAmount}:{" "}
                            {formatMoneyEUR(
                              Number(challenge.currentAmount ?? 0),
                              activeLocale
                            )}
                          </div>
                        </div>

                        <div className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                          {ui.won}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.accountDetails}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.accountDetailsSubtitle}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoMiniCard label={ui.email} value={me.email || "—"} />
                <InfoMiniCard label={ui.role} value={me.role ?? ui.roleUser} />
                <InfoMiniCard label={ui.memberSince} value={createdLabel ?? "—"} />
                <InfoMiniCard label={ui.userId} value={me.id} mono />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5">
              <div className="mb-4">
                <div className="text-lg font-extrabold text-slate-900">
                  {ui.security}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {ui.securitySubtitle}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {ui.dateOfBirth}
                  </div>

                  <div className="mt-3 grid gap-3">
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-slate-900 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
                    />

                    <PrimaryButton
                      type="button"
                      variant="dark"
                      onClick={handleSave}
                      disabled={saving}
                      loading={saving}
                      loadingText={ui.saving}
                    >
                      {ui.saveDateOfBirth}
                    </PrimaryButton>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    {ui.dobUnlockHint}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-extrabold text-slate-900">
                    {ui.usefulLater}
                  </div>

                  <div className="mt-3 grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setShowPasswordModal(true);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {ui.changePassword}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setDeleteConfirmInput("");
                        setShowDeleteModal(true);
                      }}
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-left font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      {ui.deleteAccount}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showAvatarLightbox && avatarSrc && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowAvatarLightbox(false)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowAvatarLightbox(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/70 px-3 py-2 text-sm font-bold text-white transition hover:bg-black"
              >
                {ui.close}
              </button>

              <img
                src={avatarSrc}
                alt={`Profile picture of ${me.username}`}
                className="max-h-[90vh] max-w-[90vw] rounded-3xl border border-white/10 object-contain shadow-2xl"
              />
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-slate-900">
                {ui.changePasswordTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{ui.changePasswordSubtitle}</p>

              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={ui.currentPassword}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={ui.newPassword}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder={ui.confirmNewPassword}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!changingPassword) {
                      setShowPasswordModal(false);
                    }
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  disabled={changingPassword}
                >
                  {ui.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? ui.loading : ui.saveNewPassword}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-rose-700">
                {ui.deleteAccountTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-700">{ui.deleteAccountSubtitle}</p>
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {ui.deleteAccountWarning}
              </p>

              <div className="mt-4">
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  placeholder={ui.deleteAccountConfirmPlaceholder}
                  className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                />
                <p className="mt-2 text-xs text-slate-500">{ui.deleteAccountConfirmText}</p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!deletingAccount) {
                      setShowDeleteModal(false);
                    }
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                  disabled={deletingAccount}
                >
                  {ui.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmInput.trim() !== "DELETE"}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAccount ? ui.loading : ui.deleteMyAccount}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}