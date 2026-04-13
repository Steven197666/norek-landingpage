"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AppLocale = "de" | "en" | "es" | "fr";

function getLocale(): AppLocale {
  if (typeof window === "undefined") return "de";
  const raw = (localStorage.getItem("app_locale") || "de").toLowerCase();
  if (raw === "en" || raw === "es" || raw === "fr") return raw;
  return "de";
}

export default function LegalFooter() {
  const [isMobile, setIsMobile] = useState(false);
  const [isCompactDesktop, setIsCompactDesktop] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const locale = useMemo(() => getLocale(), []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsCompactDesktop(window.innerWidth < 1280);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    const token = localStorage.getItem("access_token");
    setHasToken(!!token);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const footerText =
    locale === "en"
      ? {
          imprint: "Imprint",
          privacy: "Privacy",
          terms: "Terms",
          withdrawal: "Withdrawal",
          pricing: "Prices & Fees",
          payout: "Payout Policy",
        }
      : locale === "es"
        ? {
            imprint: "Aviso legal",
            privacy: "Privacidad",
            terms: "Términos",
            withdrawal: "Desistimiento",
            pricing: "Precios y comisiones",
            payout: "Política de pagos",
          }
        : locale === "fr"
          ? {
              imprint: "Mentions légales",
              privacy: "Confidentialité",
              terms: "CGV",
              withdrawal: "Rétractation",
              pricing: "Prix et frais",
              payout: "Politique de versement",
            }
          : {
              imprint: "Impressum",
              privacy: "Datenschutz",
              terms: "AGB",
              withdrawal: "Widerruf",
              pricing: "Preise & Gebühren",
              payout: "Auszahlungsrichtlinie",
            };

  // Wichtig:
  // Auf Mobile + eingeloggt soll der Footer verschwinden,
  // damit die App-Ansicht nicht kaputt gemacht wird.
  if (isMobile && hasToken) {
    return null;
  }

  const needsBottomDockSpacing = hasToken && isCompactDesktop;

  return (
    <footer
      className={`border-t border-white/10 bg-slate-950 ${
        needsBottomDockSpacing
          ? "pb-[calc(env(safe-area-inset-bottom)+96px)]"
          : "pb-[env(safe-area-inset-bottom)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-3 px-6 py-5 text-sm text-slate-400">
        <Link href="/impressum" className="transition hover:text-white">
          {footerText.imprint}
        </Link>
        <Link href="/datenschutz" className="transition hover:text-white">
          {footerText.privacy}
        </Link>
        <Link href="/agb" className="transition hover:text-white">
          {footerText.terms}
        </Link>
        <Link href="/widerruf" className="transition hover:text-white">
          {footerText.withdrawal}
        </Link>
        <Link href="/preise" className="transition hover:text-white">
          {footerText.pricing}
        </Link>
        <Link href="/auszahlungsrichtlinie" className="transition hover:text-white">
          {footerText.payout}
        </Link>
      </div>
    </footer>
  );
}