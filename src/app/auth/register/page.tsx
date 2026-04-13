"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import AuthShell from "@/components/auth/AuthShell";
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

type RegisterUi = {
  badge: string;
  title: string;
  subtitle: string;
  footerLabel: string;
  footerAction: string;

  usernameLabel: string;
  usernamePlaceholder: string;
  usernameInvalid: string;
  usernameTaken: string;
  usernameAvailable: string;
  usernameChecking: string;
  usernameSubmitError: string;

  emailLabel: string;
  emailPlaceholder: string;
  emailInvalid: string;
  emailTaken: string;
  emailAvailable: string;
  emailChecking: string;
  emailSubmitError: string;

  passwordLabel: string;
  passwordPlaceholder: string;
  passwordInvalid: string;

  dateOfBirthLabel: string;
  dateOfBirthInvalid: string;
  dateOfBirthHint: string;

  registerFailed: string;
  serverUnavailable: string;

  submit: string;
  loading: string;
};

const REGISTER_UI: Record<ChallengeLocale, RegisterUi> = {
  de: {
    badge: "Neues Konto",
    title: "Deinen Account erstellen",
    subtitle:
      "Erstelle dein Konto, damit du Challenges annehmen, unterstützen und bei 18+ Inhalten verlässlich geprüft werden kannst.",
    footerLabel: "Schon ein Konto?",
    footerAction: "Zum Login",

    usernameLabel: "Benutzername",
    usernamePlaceholder: "z. B. jasmin_01",
    usernameInvalid:
      "Mindestens 3 Zeichen. Erlaubt sind Buchstaben, Zahlen und _.",
    usernameTaken: "Benutzername ist bereits vergeben.",
    usernameAvailable: "Benutzername ist verfügbar.",
    usernameChecking: "Benutzername wird geprüft…",
    usernameSubmitError:
      "Der Benutzername ist nicht verfügbar oder konnte noch nicht geprüft werden.",

    emailLabel: "E-Mail",
    emailPlaceholder: "deine@email.de",
    emailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    emailTaken: "E-Mail ist bereits registriert.",
    emailAvailable: "E-Mail ist verfügbar.",
    emailChecking: "E-Mail wird geprüft…",
    emailSubmitError:
      "Die E-Mail-Adresse ist nicht verfügbar oder konnte noch nicht geprüft werden.",

    passwordLabel: "Passwort",
    passwordPlaceholder: "Mindestens 6 Zeichen",
    passwordInvalid: "Dein Passwort muss mindestens 6 Zeichen haben.",

    dateOfBirthLabel: "Geburtsdatum",
    dateOfBirthInvalid: "Bitte gib ein gültiges Geburtsdatum an.",
    dateOfBirthHint: "Wird zur Altersprüfung für 18+ Challenges verwendet.",

    registerFailed: "Registrierung fehlgeschlagen.",
    serverUnavailable: "Server nicht erreichbar.",

    submit: "Konto erstellen",
    loading: "Konto wird erstellt…",
  },

  en: {
    badge: "New account",
    title: "Create your account",
    subtitle:
      "Create your account so you can join challenges, support them and be reliably verified for 18+ content.",
    footerLabel: "Already have an account?",
    footerAction: "Go to login",

    usernameLabel: "Username",
    usernamePlaceholder: "e.g. jasmin_01",
    usernameInvalid:
      "At least 3 characters. Letters, numbers and _ are allowed.",
    usernameTaken: "Username is already taken.",
    usernameAvailable: "Username is available.",
    usernameChecking: "Checking username…",
    usernameSubmitError:
      "The username is not available or could not be checked yet.",

    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    emailInvalid: "Please enter a valid email address.",
    emailTaken: "Email is already registered.",
    emailAvailable: "Email is available.",
    emailChecking: "Checking email…",
    emailSubmitError:
      "The email address is not available or could not be checked yet.",

    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    passwordInvalid: "Your password must be at least 6 characters long.",

    dateOfBirthLabel: "Date of birth",
    dateOfBirthInvalid: "Please enter a valid date of birth.",
    dateOfBirthHint: "Used for age verification for 18+ challenges.",

    registerFailed: "Registration failed.",
    serverUnavailable: "Server unavailable.",

    submit: "Create account",
    loading: "Creating account…",
  },

  es: {
    badge: "Nueva cuenta",
    title: "Crear tu cuenta",
    subtitle:
      "Crea tu cuenta para participar en retos, apoyarlos y poder ser verificado correctamente para contenido 18+.",
    footerLabel: "¿Ya tienes una cuenta?",
    footerAction: "Ir al login",

    usernameLabel: "Nombre de usuario",
    usernamePlaceholder: "p. ej. jasmin_01",
    usernameInvalid:
      "Mínimo 3 caracteres. Se permiten letras, números y _.",
    usernameTaken: "El nombre de usuario ya está en uso.",
    usernameAvailable: "El nombre de usuario está disponible.",
    usernameChecking: "Comprobando nombre de usuario…",
    usernameSubmitError:
      "El nombre de usuario no está disponible o todavía no se ha podido comprobar.",

    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    emailInvalid: "Por favor, introduce una dirección de correo válida.",
    emailTaken: "El correo ya está registrado.",
    emailAvailable: "El correo está disponible.",
    emailChecking: "Comprobando correo…",
    emailSubmitError:
      "La dirección de correo no está disponible o todavía no se ha podido comprobar.",

    passwordLabel: "Contraseña",
    passwordPlaceholder: "Al menos 6 caracteres",
    passwordInvalid: "Tu contraseña debe tener al menos 6 caracteres.",

    dateOfBirthLabel: "Fecha de nacimiento",
    dateOfBirthInvalid: "Por favor, introduce una fecha de nacimiento válida.",
    dateOfBirthHint: "Se utiliza para la verificación de edad en retos 18+.",

    registerFailed: "El registro ha fallado.",
    serverUnavailable: "Servidor no disponible.",

    submit: "Crear cuenta",
    loading: "Creando cuenta…",
  },

  fr: {
    badge: "Nouveau compte",
    title: "Créer ton compte",
    subtitle:
      "Crée ton compte pour participer aux défis, les soutenir et être vérifié de manière fiable pour les contenus 18+.",
    footerLabel: "Tu as déjà un compte ?",
    footerAction: "Aller à la connexion",

    usernameLabel: "Nom d’utilisateur",
    usernamePlaceholder: "ex. jasmin_01",
    usernameInvalid:
      "Au moins 3 caractères. Lettres, chiffres et _ autorisés.",
    usernameTaken: "Le nom d’utilisateur est déjà pris.",
    usernameAvailable: "Le nom d’utilisateur est disponible.",
    usernameChecking: "Vérification du nom d’utilisateur…",
    usernameSubmitError:
      "Le nom d’utilisateur n’est pas disponible ou n’a pas encore pu être vérifié.",

    emailLabel: "E-mail",
    emailPlaceholder: "ton@email.com",
    emailInvalid: "Veuillez saisir une adresse e-mail valide.",
    emailTaken: "L’e-mail est déjà enregistré.",
    emailAvailable: "L’e-mail est disponible.",
    emailChecking: "Vérification de l’e-mail…",
    emailSubmitError:
      "L’adresse e-mail n’est pas disponible ou n’a pas encore pu être vérifiée.",

    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Au moins 6 caractères",
    passwordInvalid: "Ton mot de passe doit contenir au moins 6 caractères.",

    dateOfBirthLabel: "Date de naissance",
    dateOfBirthInvalid: "Veuillez saisir une date de naissance valide.",
    dateOfBirthHint: "Utilisée pour la vérification d’âge des défis 18+.",

    registerFailed: "L’inscription a échoué.",
    serverUnavailable: "Serveur indisponible.",

    submit: "Créer un compte",
    loading: "Création du compte…",
  },
};

type CheckJson = { available?: boolean; message?: string | string[] };
type RegisterJson = { message?: string | string[] };

function msgFromBody(body: any): string | null {
  const msg = body?.message;
  if (Array.isArray(msg)) return msg.join(" • ");
  if (typeof msg === "string") return msg;
  return null;
}

async function safeReadJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUsername(value: string) {
  return /^[A-Za-z0-9_]{3,}$/.test(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => REGISTER_UI[locale] ?? REGISTER_UI.de, [locale]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const cleanedUsername = useMemo(() => username.trim(), [username]);
  const cleanedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const usernameValid = useMemo(
    () => isValidUsername(cleanedUsername),
    [cleanedUsername]
  );
  const emailValid = useMemo(() => isValidEmail(cleanedEmail), [cleanedEmail]);
  const passwordValid = password.length >= 6;

  const dateOfBirthValid = useMemo(() => {
    if (!dateOfBirth) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth);
  }, [dateOfBirth]);

  const usernameInvalid = submitted && !usernameValid;
  const emailInvalid = submitted && !emailValid;
  const passwordInvalid = submitted && !passwordValid;
  const dateOfBirthInvalid = submitted && !dateOfBirthValid;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) router.replace("/challenges");
  }, [router]);

  useEffect(() => {
    if (!cleanedUsername) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (!usernameValid) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    const t = setTimeout(async () => {
      setCheckingUsername(true);

      try {
        const result: any = await apiFetch(
          `/users/check-username?username=${encodeURIComponent(cleanedUsername)}`,
          { method: "GET" }
        );

        if (result && typeof result.ok === "boolean") {
          const res: Response = result;

          if (!res.ok) {
            setUsernameAvailable(null);
            return;
          }

          const data = ((await safeReadJson(res)) ?? {}) as CheckJson;
          setUsernameAvailable(Boolean(data?.available));
          return;
        }

        const data = (result ?? {}) as CheckJson;
        setUsernameAvailable(Boolean(data?.available));
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [cleanedUsername, usernameValid]);

  useEffect(() => {
    if (!cleanedEmail) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    if (!emailValid) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    const t = setTimeout(async () => {
      setCheckingEmail(true);

      try {
        const result: any = await apiFetch(
          `/users/check-email?email=${encodeURIComponent(cleanedEmail)}`,
          { method: "GET" }
        );

        if (result && typeof result.ok === "boolean") {
          const res: Response = result;

          if (!res.ok) {
            setEmailAvailable(null);
            return;
          }

          const data = ((await safeReadJson(res)) ?? {}) as CheckJson;
          setEmailAvailable(Boolean(data?.available));
          return;
        }

        const data = (result ?? {}) as CheckJson;
        setEmailAvailable(Boolean(data?.available));
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [cleanedEmail, emailValid]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);
    setError("");

    if (!usernameValid) {
      setError(ui.usernameInvalid);
      return;
    }

    if (usernameAvailable !== true) {
      setError(ui.usernameSubmitError);
      return;
    }

    if (!emailValid) {
      setError(ui.emailInvalid);
      return;
    }

    if (emailAvailable !== true) {
      setError(ui.emailSubmitError);
      return;
    }

    if (!passwordValid) {
      setError(ui.passwordInvalid);
      return;
    }

    if (!dateOfBirthValid) {
      setError(ui.dateOfBirthInvalid);
      return;
    }

    try {
      setLoading(true);

      const result: any = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanedUsername,
          email: cleanedEmail,
          password,
          dateOfBirth,
        }),
      });

      if (result && typeof result.ok === "boolean") {
        const res: Response = result;

        if (!res.ok) {
          let msg = ui.registerFailed;
          const body = await safeReadJson(res);
          msg = msgFromBody(body) ?? msg;
          setError(msg);
          return;
        }

        router.replace("/auth/login");
        return;
      }

      const data = (result ?? {}) as RegisterJson;
      const maybeMsg = msgFromBody(data);

      if (
        maybeMsg &&
        /fail|error|invalid|exists|vergeben|registr/i.test(maybeMsg)
      ) {
        setError(maybeMsg);
        return;
      }

      router.replace("/auth/login");
    } catch (err: any) {
      setError(err?.message ?? ui.serverUnavailable);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    usernameValid &&
    usernameAvailable === true &&
    !checkingUsername &&
    emailValid &&
    emailAvailable === true &&
    !checkingEmail &&
    passwordValid &&
    dateOfBirthValid &&
    !loading;

  return (
    <AuthShell
      badge={ui.badge}
      title={ui.title}
      subtitle={ui.subtitle}
      footerLink={{
        href: "/auth/login",
        label: ui.footerLabel,
        action: ui.footerAction,
      }}
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <TextField
          id="username"
          label={ui.usernameLabel}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={ui.usernamePlaceholder}
          autoComplete="username"
          error={
            usernameInvalid
              ? ui.usernameInvalid
              : usernameValid && !checkingUsername && usernameAvailable === false
              ? ui.usernameTaken
              : undefined
          }
          success={
            usernameValid && !checkingUsername && usernameAvailable === true
              ? ui.usernameAvailable
              : undefined
          }
          hint={
            usernameValid && checkingUsername
              ? ui.usernameChecking
              : undefined
          }
        />

        <TextField
          id="email"
          label={ui.emailLabel}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={ui.emailPlaceholder}
          autoComplete="email"
          inputMode="email"
          error={
            emailInvalid
              ? ui.emailInvalid
              : emailValid && !checkingEmail && emailAvailable === false
              ? ui.emailTaken
              : undefined
          }
          success={
            emailValid && !checkingEmail && emailAvailable === true
              ? ui.emailAvailable
              : undefined
          }
          hint={emailValid && checkingEmail ? ui.emailChecking : undefined}
        />

        <TextField
          id="password"
          label={ui.passwordLabel}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={ui.passwordPlaceholder}
          autoComplete="new-password"
          error={passwordInvalid ? ui.passwordInvalid : undefined}
        />

        <TextField
          id="dateOfBirth"
          label={ui.dateOfBirthLabel}
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          error={dateOfBirthInvalid ? ui.dateOfBirthInvalid : undefined}
          hint={!dateOfBirthInvalid ? ui.dateOfBirthHint : undefined}
        />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <PrimaryButton
          type="submit"
          variant="teal"
          disabled={!canSubmit}
          loading={loading}
          loadingText={ui.loading}
          className="mt-1 w-full"
        >
          {ui.submit}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}