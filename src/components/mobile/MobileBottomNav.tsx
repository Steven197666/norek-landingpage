"use client";

import Link from "next/link";
import { useMemo } from "react";

type ChallengeLocale = "de" | "en" | "es" | "fr";

type Props = {
  pathname?: string;
  locale?: ChallengeLocale;
};

type NavItem = {
  href: string;
  label: string;
  key: string;
  isCenter?: boolean;
};

const LABELS: Record<
  ChallengeLocale,
  {
    overview: string;
    challenges: string;
    create: string;
    leaderboard: string;
    wallet: string;
  }
> = {
  de: {
    overview: "Übersicht",
    challenges: "Challenges",
    create: "Erstellen",
    leaderboard: "Leaderboard",
    wallet: "Wallet",
  },
  en: {
    overview: "Overview",
    challenges: "Challenges",
    create: "Create",
    leaderboard: "Leaderboard",
    wallet: "Wallet",
  },
  es: {
    overview: "Inicio",
    challenges: "Challenges",
    create: "Crear",
    leaderboard: "Leaderboard",
    wallet: "Wallet",
  },
  fr: {
    overview: "Aperçu",
    challenges: "Challenges",
    create: "Créer",
    leaderboard: "Leaderboard",
    wallet: "Wallet",
  },
};

function isActivePath(currentPath: string, href: string) {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavIcon({
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
        <rect
          x="4"
          y="4"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="14"
          y="4"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="4"
          y="14"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="14"
          y="14"
          width="6"
          height="6"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
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
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 10H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CenterPlusButton() {
  return (
    <div className="relative -mt-[14px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#2F7BFF_0%,#1E5EFF_100%)] shadow-[0_10px_22px_rgba(24,94,255,0.30),0_0_0_4px_rgba(6,11,19,0.96)] ring-1 ring-white/10">
      <div className="pointer-events-none absolute inset-[5px] rounded-full border border-white/14" />
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function MobileBottomNav({
  pathname = "",
  locale = "de",
}: Props) {
  const labels = LABELS[locale] ?? LABELS.de;

  const items: NavItem[] = useMemo(
    () => [
      { key: "overview", href: "/profile", label: labels.overview },
      { key: "challenges", href: "/challenges", label: labels.challenges },
      {
        key: "create",
        href: "/challenges/create",
        label: labels.create,
        isCenter: true,
      },
      { key: "leaderboard", href: "/leaderboard", label: labels.leaderboard },
      { key: "wallet", href: "/wallet", label: labels.wallet },
    ],
    [labels]
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-26 bg-[linear-gradient(to_top,rgba(4,9,16,0.92),rgba(4,9,16,0))]" />

      <nav className="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-18px)] max-w-[390px] pb-[env(safe-area-inset-bottom)]">
        <div className="relative overflow-visible rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,18,30,0.90)_0%,rgba(7,13,22,0.96)_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.44)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          <div className="pointer-events-none absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1E5EFF]/20 to-transparent" />

          <div className="grid h-[70px] grid-cols-5 items-end px-1 pb-1.5 pt-1">
            {items.map((item) => {
              if (item.isCenter) {
                return (
                  <div
                    key={item.key}
                    className="flex h-full items-start justify-center"
                  >
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className="inline-flex items-start justify-center"
                    >
                      <CenterPlusButton />
                    </Link>
                  </div>
                );
              }

              const active = isActivePath(pathname, item.href);
              const iconName = item.key as
                | "overview"
                | "challenges"
                | "leaderboard"
                | "wallet";

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex h-full flex-col items-center justify-end gap-[4px] rounded-[16px] px-1 pb-[2px] pt-2"
                >
                  <div
                    className={
                      active ? "text-[#6AA8FF]" : "text-[#596474]"
                    }
                  >
                    <NavIcon name={iconName} />
                  </div>

                  <span
                    className={
                      active
                        ? "text-[9px] font-medium leading-none text-[#78B2FF]"
                        : "text-[8px] font-medium leading-none text-[#667180]"
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}