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

type LoginUi = {
  badge: string;
  title: string;
  subtitle: string;
  footerLabel: string;
  footerAction: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  invalidEmail: string;
  invalidPassword: string;
  loginFailed: string;
  loginNoToken: string;
  serverUnavailable: string;
  submit: string;
  loading: string;
};

const LOGIN_UI: Record<ChallengeLocale, LoginUi> = {
  de: {
    badge: "Willkommen zurück",
    title: "In deinen Account einloggen",
    subtitle:
      "Melde dich an, um Challenges zu verfolgen, anzunehmen und live zu streamen.",
    footerLabel: "Noch kein Konto?",
    footerAction: "Jetzt registrieren",
    emailLabel: "E-Mail",
    emailPlaceholder: "deine@email.de",
    passwordLabel: "Passwort",
    passwordPlaceholder: "Mindestens 6 Zeichen",
    invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    invalidPassword: "Dein Passwort muss mindestens 6 Zeichen haben.",
    loginFailed:
      "Login fehlgeschlagen. Bitte prüfe deine E-Mail und dein Passwort.",
    loginNoToken:
      "Login erfolgreich, aber kein Token erhalten. Bitte prüfe die Backend-Response.",
    serverUnavailable: "Server nicht erreichbar.",
    submit: "Einloggen",
    loading: "Logge ein…",
  },
  en: {
    badge: "Welcome back",
    title: "Log in to your account",
    subtitle: "Sign in to follow challenges, join them and stream live.",
    footerLabel: "No account yet?",
    footerAction: "Register now",
    emailLabel: "Email",
    emailPlaceholder: "your@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    invalidEmail: "Please enter a valid email address.",
    invalidPassword: "Your password must be at least 6 characters long.",
    loginFailed: "Login failed. Please check your email and password.",
    loginNoToken:
      "Login succeeded, but no token was returned. Please check the backend response.",
    serverUnavailable: "Server unavailable.",
    submit: "Log in",
    loading: "Logging in…",
  },
  es: {
    badge: "Bienvenido de nuevo",
    title: "Inicia sesión en tu cuenta",
    subtitle:
      "Inicia sesión para seguir retos, participar y transmitir en directo.",
    footerLabel: "¿Aún no tienes cuenta?",
    footerAction: "Regístrate ahora",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Al menos 6 caracteres",
    invalidEmail: "Por favor, introduce una dirección de correo válida.",
    invalidPassword: "Tu contraseña debe tener al menos 6 caracteres.",
    loginFailed:
      "Error al iniciar sesión. Revisa tu correo y tu contraseña.",
    loginNoToken:
      "El inicio de sesión fue correcto, pero no se recibió ningún token. Revisa la respuesta del backend.",
    serverUnavailable: "Servidor no disponible.",
    submit: "Iniciar sesión",
    loading: "Iniciando sesión…",
  },
  fr: {
    badge: "Bon retour",
    title: "Connecte-toi à ton compte",
    subtitle:
      "Connecte-toi pour suivre des défis, y participer et diffuser en direct.",
    footerLabel: "Pas encore de compte ?",
    footerAction: "S’inscrire maintenant",
    emailLabel: "E-mail",
    emailPlaceholder: "ton@email.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Au moins 6 caractères",
    invalidEmail: "Veuillez saisir une adresse e-mail valide.",
    invalidPassword: "Ton mot de passe doit contenir au moins 6 caractères.",
    loginFailed:
      "Échec de la connexion. Vérifie ton e-mail et ton mot de passe.",
    loginNoToken:
      "Connexion réussie, mais aucun token n’a été reçu. Vérifie la réponse du backend.",
    serverUnavailable: "Serveur indisponible.",
    submit: "Se connecter",
    loading: "Connexion…",
  },
};

type LoginJson = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  message?: string | string[];
};

function getErrorMessageFromBody(body: any): string | null {
  const msg = body?.message;
  if (Array.isArray(msg)) return msg.join(" • ");
  if (typeof msg === "string") return msg;
  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const router = useRouter();
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => LOGIN_UI[locale] ?? LOGIN_UI.de, [locale]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cleanedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const emailInvalid = submitted && !isValidEmail(cleanedEmail);
  const passwordInvalid = submitted && password.length < 6;
  const canSubmit =
    isValidEmail(cleanedEmail) && password.length >= 6 && !loading;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) router.replace("/challenges");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);
    setError("");

    if (!isValidEmail(cleanedEmail)) {
      setError(ui.invalidEmail);
      return;
    }

    if (password.length < 6) {
      setError(ui.invalidPassword);
      return;
    }

    try {
      setLoading(true);

      const result: any = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail, password }),
      });

      if (result && typeof result.ok === "boolean") {
        const res: Response = result;

        if (!res.ok) {
          let msg = ui.loginFailed;

          try {
            const data = (await res.json()) as LoginJson;
            msg = getErrorMessageFromBody(data) ?? msg;
          } catch {
            try {
              const txt = await res.text();
              if (txt) msg = txt;
            } catch {}
          }

          setError(msg);
          return;
        }

        const data = (await res.json()) as LoginJson;
        const token =
          data?.access_token || data?.accessToken || data?.token || undefined;

        if (!token) {
          setError(ui.loginNoToken);
          return;
        }

        localStorage.setItem("access_token", token);
        router.replace("/challenges");
        return;
      }

      const data = result as LoginJson;
      const token =
        data?.access_token || data?.accessToken || data?.token || undefined;

      if (!token) {
        const msg =
          getErrorMessageFromBody(data) ??
          ui.loginNoToken;
        setError(msg);
        return;
      }

      localStorage.setItem("access_token", token);
      router.replace("/challenges");
    } catch (err: any) {
      setError(err?.message ?? ui.serverUnavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge={ui.badge}
      title={ui.title}
      subtitle={ui.subtitle}
      footerLink={{
        href: "/auth/register",
        label: ui.footerLabel,
        action: ui.footerAction,
      }}
    >
      <form onSubmit={onSubmit} className="grid gap-5">
        <TextField
          id="email"
          label={ui.emailLabel}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={ui.emailPlaceholder}
          autoComplete="email"
          inputMode="email"
          error={emailInvalid ? ui.invalidEmail : undefined}
        />

        <TextField
          id="password"
          label={ui.passwordLabel}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={ui.passwordPlaceholder}
          autoComplete="current-password"
          error={passwordInvalid ? ui.invalidPassword : undefined}
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