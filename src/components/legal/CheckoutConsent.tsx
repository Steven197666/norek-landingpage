"use client";

import Link from "next/link";
import { useMemo } from "react";

type AppLocale = "de" | "en" | "es" | "fr";

function getLocale(): AppLocale {
  if (typeof window === "undefined") return "de";
  const raw = (localStorage.getItem("app_locale") || "de").toLowerCase();
  if (raw === "en" || raw === "es" || raw === "fr") return raw;
  return "de";
}

export default function CheckoutConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const locale = useMemo(() => getLocale(), []);

  const t = useMemo(() => {
    if (locale === "en") {
      return {
        textBefore: "I accept the ",
        agb: "Terms",
        privacy: "Privacy Policy",
        withdrawal: "Withdrawal Policy",
        pricing: "Price / Fee Overview",
        payout: "Payout Policy",
        textAfter:
          ". I expressly request that DarePay begins performance before the withdrawal period expires. I understand that my right of withdrawal expires early once the service has been fully provided.",
      };
    }

    if (locale === "es") {
      return {
        textBefore: "Acepto los ",
        agb: "Términos",
        privacy: "Política de privacidad",
        withdrawal: "Política de desistimiento",
        pricing: "Resumen de precios / comisiones",
        payout: "Política de pagos",
        textAfter:
          ". Solicito expresamente que DarePay comience la prestación antes de que expire el plazo de desistimiento. Sé que mi derecho de desistimiento expira anticipadamente una vez que el servicio se haya prestado por completo.",
      };
    }

    if (locale === "fr") {
      return {
        textBefore: "J’accepte les ",
        agb: "CGV",
        privacy: "Politique de confidentialité",
        withdrawal: "Politique de rétractation",
        pricing: "Aperçu des prix / frais",
        payout: "Politique de versement",
        textAfter:
          ". Je demande expressément que DarePay commence l’exécution avant l’expiration du délai de rétractation. Je sais que mon droit de rétractation s’éteint de manière anticipée une fois la prestation entièrement fournie.",
      };
    }

    return {
      textBefore: "Ich akzeptiere die ",
      agb: "AGB",
      privacy: "Datenschutzerklärung",
      withdrawal: "Widerrufsbelehrung",
      pricing: "Preis-/Gebührenübersicht",
      payout: "Auszahlungsrichtlinie",
      textAfter:
        ". Ich verlange ausdrücklich, dass DarePay vor Ablauf der Widerrufsfrist mit der Ausführung beginnt. Mir ist bekannt, dass mein Widerrufsrecht bei vollständiger Leistungserbringung vorzeitig erlöschen kann.",
    };
  }, [locale]);

  return (
    <label className="flex items-start gap-3 text-sm leading-7 text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>
        {t.textBefore}
        <Link href="/agb" className="underline">
          {t.agb}
        </Link>
        {", "}
        <Link href="/datenschutz" className="underline">
          {t.privacy}
        </Link>
        {", "}
        <Link href="/widerruf" className="underline">
          {t.withdrawal}
        </Link>
        {", "}
        <Link href="/preise" className="underline">
          {t.pricing}
        </Link>
        {" "}
        {locale === "en"
          ? "and the "
          : locale === "es"
            ? "y la "
            : locale === "fr"
              ? "et la "
              : "sowie die "}
        <Link href="/auszahlungsrichtlinie" className="underline">
          {t.payout}
        </Link>
        {t.textAfter}
      </span>
    </label>
  );
}