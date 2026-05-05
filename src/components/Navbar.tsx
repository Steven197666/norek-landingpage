"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import UserAvatar from "@/components/UserAvatar";

type NavItem = { href: string; label: string };
type AppLocale = "de" | "en" | "es" | "fr";

const localeOptions = [
  { value: "de", short: "DE", native: "Deutsch", flagSrc: "/flags/de.svg" },
  { value: "en", short: "EN", native: "English", flagSrc: "/flags/en.svg" },
  { value: "es", short: "ES", native: "Español", flagSrc: "/flags/es.svg" },
  { value: "fr", short: "FR", native: "Français", flagSrc: "/flags/fr.svg" },
] as const;

function normalizeAppLocale(value: string | null | undefined): AppLocale {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "en") return "en";
  if (raw === "es") return "es";
  if (raw === "fr") return "fr";
  return "de";
}

function getStoredAppLocale(): AppLocale {
  if (typeof window === "undefined") return "de";
  return normalizeAppLocale(window.localStorage.getItem("app_locale"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGetUserFromMe(data: any): {
  username: string | null;
  avatarUrl: string | null;
  role: string | null;
  totalXp: number;
  level: number;
  levelTitle: string | null;
} {
  const username =
    typeof data?.username === "string" && data.username.trim().length > 0
      ? data.username.trim()
      : typeof data?.data?.username === "string" && data.data.username.trim().length > 0
        ? data.data.username.trim()
        : null;

  const avatarUrl =
    typeof data?.avatarUrl === "string" && data.avatarUrl.trim().length > 0
      ? data.avatarUrl.trim()
      : typeof data?.data?.avatarUrl === "string" && data.data.avatarUrl.trim().length > 0
        ? data.data.avatarUrl.trim()
        : null;

  const role =
    typeof data?.role === "string" && data.role.trim().length > 0
      ? data.role.trim()
      : typeof data?.data?.role === "string" && data.data.role.trim().length > 0
        ? data.data.role.trim()
        : null;

  const totalXp = Number(data?.totalXp ?? data?.data?.totalXp ?? 0);
  const level = Number(data?.level ?? data?.data?.level ?? 1);

  const levelTitle =
    typeof data?.levelTitle === "string" && data.levelTitle.trim().length > 0
      ? data.levelTitle.trim()
      : typeof data?.data?.levelTitle === "string" && data.data.levelTitle.trim().length > 0
        ? data.data.levelTitle.trim()
        : null;

  return { username, avatarUrl, role, totalXp, level, levelTitle };
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const localeMenuRef = useRef<HTMLDivElement | null>(null);

  const [hasToken, setHasToken] = useState(false);
  const [checked, setChecked] = useState(false);
  const [locale, setLocale] = useState<AppLocale>("de");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileCompact, setIsProfileCompact] = useState(false);
  const [isChallengesCompact, setIsChallengesCompact] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setHasToken(!!token);
    setLocale(getStoredAppLocale());

    const cachedUsername = localStorage.getItem("dp_username");
    const cachedAvatarUrl = localStorage.getItem("dp_avatar_url");
    const cachedRole = localStorage.getItem("dp_role");

    setUsername(cachedUsername ? cachedUsername : null);
    setAvatarUrl(cachedAvatarUrl ? cachedAvatarUrl : null);
    setRole(cachedRole ? cachedRole : null);

    const updateViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsProfileCompact(width < 1280 && (pathname ?? "").startsWith("/profile"));
      setIsChallengesCompact(width < 1280 && (pathname ?? "").startsWith("/challenges"));
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    setChecked(true);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, [pathname]);

  useEffect(() => {
    if (!hasToken) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/users/me", { method: "GET" }, true);
        if (!res.ok) return;

        const data = await res.json();
        const user = safeGetUserFromMe(data);

        if (cancelled) return;

        if (user.username) {
          setUsername(user.username);
          localStorage.setItem("dp_username", user.username);
        } else {
          setUsername(null);
          localStorage.removeItem("dp_username");
        }

        if (user.avatarUrl) {
          setAvatarUrl(user.avatarUrl);
          localStorage.setItem("dp_avatar_url", user.avatarUrl);
        } else {
          setAvatarUrl(null);
          localStorage.removeItem("dp_avatar_url");
        }

        if (user.role) {
          setRole(user.role);
          localStorage.setItem("dp_role", user.role);
        } else {
          setRole(null);
          localStorage.removeItem("dp_role");
        }

        setTotalXp(Number(user.totalXp ?? 0));
        setLevel(Number(user.level ?? 1));
      } catch {
        // Navbar darf nie crashen
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasToken, pathname]);

  useEffect(() => {
    if (!languageMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!localeMenuRef.current) return;
      if (!localeMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [languageMenuOpen]);

  const t = useMemo(() => {
    if (locale === "en") {
      return {
        challenges: "Challenges",
        leaderboard: "Leaderboard",
        myChallenges: "My Challenges",
        create: "Create",
        help: "Help",
        admin: "Admin",
        profile: "Profile",
        openProfile: "Open profile",
        logout: "Logout",
        login: "Login",
        register: "Register",
        levelShort: "Lvl",
        xp: "XP",
      };
    }

    if (locale === "es") {
      return {
        challenges: "Retos",
        leaderboard: "Clasificación",
        myChallenges: "Mis retos",
        create: "Crear",
        help: "Ayuda",
        admin: "Admin",
        profile: "Perfil",
        openProfile: "Abrir perfil",
        logout: "Cerrar sesión",
        login: "Iniciar sesión",
        register: "Registrarse",
        levelShort: "Lvl",
        xp: "XP",
      };
    }

    if (locale === "fr") {
      return {
        challenges: "Défis",
        leaderboard: "Classement",
        myChallenges: "Mes défis",
        create: "Créer",
        help: "Aide",
        admin: "Admin",
        profile: "Profil",
        openProfile: "Ouvrir le profil",
        logout: "Déconnexion",
        login: "Connexion",
        register: "S’inscrire",
        levelShort: "Lvl",
        xp: "XP",
      };
    }

    return {
      challenges: "Challenges",
      leaderboard: "Leaderboard",
      myChallenges: "Meine Challenges",
      create: "Erstellen",
      help: "Hilfe",
      admin: "Admin",
      profile: "Profil",
      openProfile: "Profil öffnen",
      logout: "Logout",
      login: "Login",
      register: "Registrieren",
      levelShort: "Lvl",
      xp: "XP",
    };
  }, [locale]);

  const activeLocaleOption =
    localeOptions.find((option) => option.value === locale) ?? localeOptions[0];

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      setLanguageMenuOpen(false);
      return;
    }

    localStorage.setItem("app_locale", nextLocale);
    setLocale(nextLocale);
    setLanguageMenuOpen(false);
    window.location.reload();
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("dp_username");
    localStorage.removeItem("dp_avatar_url");
    localStorage.removeItem("dp_role");
    setHasToken(false);
    setUsername(null);
    setAvatarUrl(null);
    setRole(null);
    setTotalXp(0);
    setLevel(1);
    router.replace("/auth/login");
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  const nav: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { href: "/challenges", label: t.challenges },
      { href: "/leaderboard", label: t.leaderboard },
      { href: "/challenges/me", label: t.myChallenges },
      { href: "/challenges/create", label: t.create },
      { href: "/hilfe", label: t.help },
    ];

    if ((role ?? "").toLowerCase() === "admin") {
      base.push({ href: "/admin/payments", label: t.admin });
    }

    return base;
  }, [role, t]);

  if (!checked) return null;

  // WICHTIG:
  // Eingeloggt + Mobile = globale Navbar komplett ausblenden.
  // So kann jede App-Seite ihre eigene mobile Top-Bar haben.
  if (hasToken && (isMobile || isProfileCompact || isChallengesCompact)) {
    return null;
  }

  // Ausgeloggt + Mobile = sehr schlanke Top-Bar
  if (!hasToken && isMobile) {
    return (
      <div
        style={{
          borderBottom: "1px solid rgba(226,232,240,0.8)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href="/auth/login"
            style={{
              fontWeight: 900,
              fontSize: 16,
              textDecoration: "none",
              color: "black",
              flexShrink: 0,
            }}
          >
            Norek
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div ref={localeMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setLanguageMenuOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid #d6dae1",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#0f172a",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={activeLocaleOption.flagSrc}
                    alt={activeLocaleOption.native}
                    width={18}
                    height={12}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                </span>
                <span>{activeLocaleOption.short}</span>
              </button>

              {languageMenuOpen ? (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    minWidth: 180,
                    padding: 8,
                    borderRadius: 18,
                    border: "1px solid #d6dae1",
                    background: "white",
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                    zIndex: 100,
                  }}
                >
                  {localeOptions.map((option) => {
                    const active = option.value === locale;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => changeLocale(option.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                          padding: "12px 14px",
                          border: "none",
                          borderRadius: 12,
                          background: active ? "#f3f4f6" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            style={{
                              width: 18,
                              height: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={option.flagSrc}
                              alt={option.native}
                              width={18}
                              height={12}
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                              }}
                            />
                          </span>
                          <span
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                              {option.short}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                              {option.native}
                            </span>
                          </span>
                        </span>

                        {active ? <span style={{ fontWeight: 900 }}>✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <Link
              href="/auth/login"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                color: "black",
                whiteSpace: "nowrap",
                background: "white",
              }}
            >
              {t.login}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderBottom: "1px solid #e5e7eb",
        background: "white",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          href={hasToken ? "/challenges" : "/auth/login"}
          style={{
            fontWeight: 900,
            fontSize: 16,
            textDecoration: "none",
            color: "black",
            flexShrink: 0,
          }}
        >
          Norek
        </Link>

        {hasToken ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
                minWidth: 0,
              }}
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: "none",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid transparent",
                    background: "transparent",
                    color: isActive(item.href) ? "#0b1320" : "#1f2937",
                    fontWeight: isActive(item.href) ? 900 : 800,
                    whiteSpace: "nowrap",
                    fontSize: 14,
                    lineHeight: 1.1,
                    boxShadow: isActive(item.href)
                      ? "inset 0 -2px 0 #0f172a"
                      : "none",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <div ref={localeMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setLanguageMenuOpen((prev) => !prev)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid #d6dae1",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#0f172a",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={activeLocaleOption.flagSrc}
                      alt={activeLocaleOption.native}
                      width={18}
                      height={12}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </span>
                  <span>{activeLocaleOption.short}</span>
                </button>

                {languageMenuOpen ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      minWidth: 180,
                      padding: 8,
                      borderRadius: 18,
                      border: "1px solid #d6dae1",
                      background: "white",
                      boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                      zIndex: 100,
                    }}
                  >
                    {localeOptions.map((option) => {
                      const active = option.value === locale;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => changeLocale(option.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            width: "100%",
                            padding: "12px 14px",
                            border: "none",
                            borderRadius: 12,
                            background: active ? "#f3f4f6" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span
                              style={{
                                width: 18,
                                height: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                borderRadius: 2,
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={option.flagSrc}
                                alt={option.native}
                                width={18}
                                height={12}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "block",
                                  objectFit: "cover",
                                }}
                              />
                            </span>
                            <span
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                                {option.short}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                                {option.native}
                              </span>
                            </span>
                          </span>

                          {active ? <span style={{ fontWeight: 900 }}>✓</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <Link
                href="/profile"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 16,
                  border: isActive("/profile") ? "1px solid #d7dbe2" : "1px solid #e5e7eb",
                  background: isActive("/profile") ? "#f6f7f9" : "white",
                  color: "black",
                  minWidth: 0,
                  maxWidth: 220,
                }}
                title={t.openProfile}
              >
                <UserAvatar username={username} avatarUrl={avatarUrl} size={36} />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minWidth: 0,
                    lineHeight: 1.15,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#0f172a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {username ? `@${username}` : t.profile}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.levelShort} {level} · {totalXp} {t.xp}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t.logout}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div ref={localeMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setLanguageMenuOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid #d6dae1",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#0f172a",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={activeLocaleOption.flagSrc}
                    alt={activeLocaleOption.native}
                    width={18}
                    height={12}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />
                </span>
                <span>{activeLocaleOption.short}</span>
              </button>

              {languageMenuOpen ? (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    minWidth: 180,
                    padding: 8,
                    borderRadius: 18,
                    border: "1px solid #d6dae1",
                    background: "white",
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                    zIndex: 100,
                  }}
                >
                  {localeOptions.map((option) => {
                    const active = option.value === locale;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => changeLocale(option.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                          padding: "12px 14px",
                          border: "none",
                          borderRadius: 12,
                          background: active ? "#f3f4f6" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            style={{
                              width: 18,
                              height: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={option.flagSrc}
                              alt={option.native}
                              width={18}
                              height={12}
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                              }}
                            />
                          </span>
                          <span
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                              {option.short}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                              {option.native}
                            </span>
                          </span>
                        </span>

                        {active ? <span style={{ fontWeight: 900 }}>✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <Link
              href="/auth/login"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontWeight: 800,
                fontSize: 15,
                textDecoration: "none",
                color: "black",
                whiteSpace: "nowrap",
              }}
            >
              {t.login}
            </Link>

            <Link
              href="/auth/register"
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid black",
                background: "black",
                color: "white",
                fontWeight: 800,
                fontSize: 15,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {t.register}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}