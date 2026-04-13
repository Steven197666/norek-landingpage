"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CheckoutConsent from "@/components/legal/CheckoutConsent";

// --- Types ---

type ChallengeLocale = "de" | "en" | "es" | "fr";

type ChallengeInfo = {
  id: string;
  title: string;
  titleTranslations: Record<string, string> | null;
  status: string;
  currentAmount: number | null;
  minAmount: number | null;
};

type CheckoutSessionResponse = {
  paymentTransactionId?: string;
  checkoutSessionId?: string;
  checkoutUrl?: string | null;
  paymentSource?: "wallet" | "stripe" | "mixed";
  walletAmountUsed?: string;
  stripeAmountUsed?: string;
};

type WalletOverview = {
  availableBalance: string;
  pendingBalance: string;
};

// --- Utilities ---

function normalizeLocale(input: string | null | undefined): ChallengeLocale {
  const raw = String(input ?? "").trim().toLowerCase().slice(0, 2);
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

async function getErrorMessageFromResponse(res: Response): Promise<string> {
  const fallback = `Request fehlgeschlagen (${res.status})`;
  try {
    const data = await res.clone().json();
    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }
    if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
    if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  } catch {}
  try {
    const txt = await res.text();
    if (txt?.trim()) return txt.trim();
  } catch {}
  return fallback;
}

async function readApi(resOrJson: unknown) {
  if (
    resOrJson &&
    typeof resOrJson === "object" &&
    typeof (resOrJson as { ok: boolean }).ok === "boolean"
  ) {
    const res = resOrJson as Response;
    if (!res.ok) {
      const msg = await getErrorMessageFromResponse(res);
      return { ok: false, status: res.status, json: null, errorText: msg };
    }
    const json = await res.json().catch(() => null);
    return { ok: true, status: res.status, json };
  }
  return { ok: true, status: 200, json: resOrJson };
}

const QUICK_AMOUNTS = [5, 10, 25, 50];

// --- Page ---

export default function SupportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [fundConsentChecked, setFundConsentChecked] = useState(false);
  const [fundConsentError, setFundConsentError] = useState("");
  const [funding, setFunding] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"stripe" | "wallet" | "mixed">("stripe");
  const [walletInfo, setWalletInfo] = useState<WalletOverview | null>(null);
  const [walletAmountInput, setWalletAmountInput] = useState("");
  const [walletLoading, setWalletLoading] = useState(true);
  const [hasWalletToken, setHasWalletToken] = useState(false);

  const activeLocale = useMemo(() => getActiveChallengeLocale(), []);

  const loginRedirectHref = useMemo(() => {
    if (!id) return "/auth/login";
    return `/auth/login?redirect=${encodeURIComponent(`/challenges/${id}/support`)}`;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/challenges/${id}`, { method: "GET" });
        const parsed = await readApi(res);
        if (!parsed.ok) throw new Error(parsed.errorText || "Challenge nicht gefunden");
        const raw = parsed.json?.data ?? parsed.json;
        setChallenge({
          id: String(raw.id),
          title: raw.title ?? "",
          titleTranslations: raw.titleTranslations ?? raw.title_translations ?? null,
          status: String(raw.status ?? ""),
          currentAmount: raw.currentAmount != null ? Number(raw.currentAmount) : null,
          minAmount: raw.minAmount != null ? Number(raw.minAmount) : null,
        });
      } catch (e) {
        setLoadError(getErrorMessage(e, "Challenge konnte nicht geladen werden."));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
      setHasWalletToken(Boolean(token));
      if (!token) {
        setWalletInfo(null);
        setWalletLoading(false);
        return;
      }

      try {
        setWalletLoading(true);
        const res = await apiFetch("/wallet/me", { method: "GET" }, true);
        if (!res.ok) {
          setWalletInfo(null);
          setWalletLoading(false);
          return;
        }

        const json = await res.json();
        setWalletInfo({
          availableBalance: String(json?.availableBalance ?? "0"),
          pendingBalance: String(json?.pendingBalance ?? "0"),
        });
      } catch {
        setWalletInfo(null);
      } finally {
        setWalletLoading(false);
      }
    })();
  }, []);

  const canFund = useMemo(() => {
    if (!challenge) return false;
    const s = String(challenge.status).toLowerCase();
    return s === "funding" || s === "active";
  }, [challenge]);

  const selectedPreset = useMemo(() => {
    const v = Number(amountInput.replace(",", "."));
    return QUICK_AMOUNTS.find((q) => q === v) ?? null;
  }, [amountInput]);

  const parsedAmount = Number(amountInput.replace(",", "."));
  const isFundAmountValid =
    amountInput.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount >= 5;

  const localizedTitle = useMemo(() => {
    if (!challenge) return "";
    const t = challenge.titleTranslations?.[activeLocale];
    if (t && t.trim()) return t.trim();
    return challenge.title;
  }, [challenge, activeLocale]);

  const walletAvailable = useMemo(() => {
    return Number(String(walletInfo?.availableBalance ?? "0").replace(",", "."));
  }, [walletInfo]);

  const handleFund = async () => {
    if (!id || !canFund) return;

    if (!fundConsentChecked) {
      setFundConsentError(
        activeLocale === "en"
          ? "Please confirm the legal notice first."
          : activeLocale === "es"
            ? "Primero confirma el aviso legal."
            : activeLocale === "fr"
              ? "Merci de confirmer d'abord l'avis légal."
              : "Bitte bestätige zuerst die rechtlichen Hinweise."
      );
      return;
    }

    const raw = amountInput.trim();
    const amount = Number(raw.replace(",", "."));

    if (!raw) {
      setAmountError(
        activeLocale === "en"
          ? "Please enter an amount."
          : activeLocale === "es"
            ? "Introduce una cantidad."
            : activeLocale === "fr"
              ? "Merci de saisir un montant."
              : "Bitte Betrag eingeben."
      );
      return;
    }

    if (!Number.isFinite(amount) || amount < 5) {
      setAmountError(
        activeLocale === "en"
          ? "Please enter at least €5."
          : activeLocale === "es"
            ? "Introduce al menos 5 €."
            : activeLocale === "fr"
              ? "Merci de saisir au moins 5 €."
              : "Bitte mindestens 5 € eingeben."
      );
      return;
    }

    let walletAmount = 0;
    if (paymentMode === "wallet") {
      walletAmount = amount;
    } else if (paymentMode === "mixed") {
      walletAmount = Number(walletAmountInput.replace(",", "."));
      if (!Number.isFinite(walletAmount) || walletAmount <= 0) {
        setAmountError(
          activeLocale === "en"
            ? "Please enter a valid wallet amount for mixed payment."
            : "Bitte einen gültigen Wallet-Betrag für Mixed angeben."
        );
        return;
      }
    }

    walletAmount = Number(Math.max(0, Math.min(amount, walletAmount)).toFixed(2));

    if (walletAmount > walletAvailable + 1e-6) {
      setAmountError(
        activeLocale === "en"
          ? "Not enough wallet balance."
          : "Nicht genug Wallet-Guthaben verfügbar."
      );
      return;
    }

    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
    if (!token) {
      router.replace(loginRedirectHref);
      return;
    }

    try {
      setFunding(true);
      setAmountError("");

      const resOrJson = await apiFetch(
        `/challenges/${id}/fund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, walletAmount }),
        },
        true
      );
      const parsed = await readApi(resOrJson);
      if (!parsed.ok)
        throw new Error(parsed.errorText || "Checkout konnte nicht gestartet werden.");

      const json = (parsed.json?.data ?? parsed.json) as CheckoutSessionResponse;
      const checkoutUrl = String(json?.checkoutUrl ?? "").trim();
      if (!checkoutUrl) {
        setFundConsentChecked(false);
        router.replace(`/challenges/${id}?payment=success`);
        return;
      }

      setFundConsentChecked(false);
      window.location.assign(checkoutUrl);
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Checkout konnte nicht gestartet werden.");
      if (message === "NO_TOKEN" || message === "UNAUTHORIZED") {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("access_token");
        }
        router.replace(loginRedirectHref);
        return;
      }
      setAmountError(message);
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060E18]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
      </div>
    );
  }

  if (loadError || !challenge) {
    return (
      <div className="min-h-screen bg-[#060E18] px-4 pt-12 text-white">
        <div className="text-sm text-red-400">{loadError || "Challenge nicht gefunden."}</div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-400 underline"
        >
          {activeLocale === "en" ? "Back" : "Zurück"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060E18] text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.06] bg-[#060E18]/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 truncate text-[14px] font-semibold text-white">
          {activeLocale === "en"
            ? "Support pot"
            : activeLocale === "es"
              ? "Apoyar bote"
              : activeLocale === "fr"
                ? "Soutenir la cagnotte"
                : "Pot unterstützen"}
        </div>
      </div>

      <div className="mx-auto max-w-[430px] space-y-3 px-4 pb-20 pt-4">
        {/* Challenge info card */}
        <div className="rounded-[18px] border border-white/10 bg-[rgba(11,21,38,0.72)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Challenge
          </div>
          <div className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-white">
            {localizedTitle}
          </div>
          {challenge.currentAmount != null && (
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[22px] font-extrabold text-white">
                {formatMoneyEUR(challenge.currentAmount, activeLocale)}
              </span>
              <span className="text-[12px] text-slate-500">
                {activeLocale === "en"
                  ? "current pot"
                  : activeLocale === "es"
                    ? "bote actual"
                    : activeLocale === "fr"
                      ? "cagnotte actuelle"
                      : "im Pot"}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-[18px] border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-200/80">
            {activeLocale === "en"
              ? "Wallet"
              : activeLocale === "es"
                ? "Wallet"
                : activeLocale === "fr"
                  ? "Wallet"
                  : "Wallet"}
          </div>

          {walletLoading ? (
            <div className="mt-2 text-[13px] text-blue-100/80">
              {activeLocale === "en"
                ? "Loading wallet balance..."
                : activeLocale === "es"
                  ? "Cargando saldo de wallet..."
                  : activeLocale === "fr"
                    ? "Chargement du solde wallet..."
                    : "Wallet-Guthaben wird geladen..."}
            </div>
          ) : hasWalletToken ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[22px] font-extrabold text-white">
                  {formatMoneyEUR(walletAvailable || 0, activeLocale)}
                </span>
                <span className="text-[12px] text-blue-100/70">
                  {activeLocale === "en"
                    ? "available"
                    : activeLocale === "es"
                      ? "disponible"
                      : activeLocale === "fr"
                        ? "disponible"
                        : "verfügbar"}
                </span>
              </div>
              <div className="mt-1 text-[12px] text-blue-100/70">
                {activeLocale === "en"
                  ? "This amount can be used to support the pot immediately."
                  : activeLocale === "es"
                    ? "Este importe se puede usar para apoyar el bote al instante."
                    : activeLocale === "fr"
                      ? "Ce montant peut être utilisé immédiatement pour soutenir la cagnotte."
                      : "Diesen Betrag kannst du direkt für die Pot-Unterstützung nutzen."}
              </div>
            </>
          ) : (
            <div className="mt-2 text-[13px] text-blue-100/80">
              {activeLocale === "en"
                ? "Log in to view your wallet balance."
                : activeLocale === "es"
                  ? "Inicia sesión para ver tu saldo wallet."
                  : activeLocale === "fr"
                    ? "Connecte-toi pour voir ton solde wallet."
                    : "Logge dich ein, um dein Wallet-Guthaben zu sehen."}
            </div>
          )}
        </div>

        {/* Support closed */}
        {!canFund && (
          <div className="rounded-[18px] border border-amber-400/20 bg-amber-400/[0.07] px-4 py-4">
            <div className="text-sm font-bold text-amber-200">
              {activeLocale === "en"
                ? "Support closed"
                : activeLocale === "es"
                  ? "Soporte cerrado"
                  : activeLocale === "fr"
                    ? "Soutien fermé"
                    : "Unterstützung geschlossen"}
            </div>
            <div className="mt-1 text-[13px] text-amber-100/70">
              {activeLocale === "en"
                ? "This challenge no longer accepts new contributions."
                : activeLocale === "es"
                  ? "Este reto ya no acepta nuevas aportaciones."
                  : activeLocale === "fr"
                    ? "Ce défi n'accepte plus de nouvelles contributions."
                    : "Diese Challenge nimmt keine neuen Beiträge mehr an."}
            </div>
          </div>
        )}

        {/* Fund form */}
        {canFund && (
          <div className="space-y-3 rounded-[18px] border border-white/10 bg-[rgba(11,21,38,0.72)] p-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmountInput(String(value));
                    setAmountError("");
                  }}
                  className={`rounded-[14px] border py-2.5 text-[13px] font-extrabold transition ${
                    selectedPreset === value
                      ? "border-blue-400/25 bg-blue-500/15 text-blue-100 ring-4 ring-blue-500/10"
                      : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {formatMoneyEUR(value, activeLocale)}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <input
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setAmountError("");
              }}
              placeholder={
                activeLocale === "en"
                  ? "Custom amount (min. €5)"
                  : activeLocale === "es"
                    ? "Cantidad personalizada (mín. 5 €)"
                    : activeLocale === "fr"
                      ? "Montant libre (min. 5 €)"
                      : "Eigener Betrag (min. 5 €)"
              }
              inputMode="decimal"
              className={`h-11 w-full rounded-xl border bg-white/[0.04] px-3 text-white outline-none transition placeholder:text-slate-500 ${
                amountError
                  ? "border-red-400/30 focus:border-red-400/40 focus:ring-4 focus:ring-red-500/10"
                  : "border-white/10 focus:border-blue-400/30 focus:ring-4 focus:ring-blue-500/10"
              }`}
            />
            {amountError && (
              <div className="text-xs font-semibold text-red-400">{amountError}</div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Zahlungsart
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("stripe")}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    paymentMode === "stripe"
                      ? "bg-blue-500/25 text-blue-100"
                      : "bg-white/[0.04] text-slate-300"
                  }`}
                >
                  Karte / Stripe
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("wallet")}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    paymentMode === "wallet"
                      ? "bg-blue-500/25 text-blue-100"
                      : "bg-white/[0.04] text-slate-300"
                  }`}
                >
                  Nur Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("mixed")}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    paymentMode === "mixed"
                      ? "bg-blue-500/25 text-blue-100"
                      : "bg-white/[0.04] text-slate-300"
                  }`}
                >
                  Wallet + Stripe
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                {activeLocale === "en"
                  ? `Available in wallet: ${formatMoneyEUR(walletAvailable || 0, activeLocale)}`
                  : activeLocale === "es"
                    ? `Disponible en wallet: ${formatMoneyEUR(walletAvailable || 0, activeLocale)}`
                    : activeLocale === "fr"
                      ? `Disponible dans le wallet: ${formatMoneyEUR(walletAvailable || 0, activeLocale)}`
                      : `Verfügbar im Wallet: ${formatMoneyEUR(walletAvailable || 0, activeLocale)}`}
              </div>

              {paymentMode === "mixed" ? (
                <input
                  value={walletAmountInput}
                  onChange={(e) => {
                    setWalletAmountInput(e.target.value);
                    setAmountError("");
                  }}
                  placeholder="Wallet-Anteil in EUR"
                  inputMode="decimal"
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
                />
              ) : null}
            </div>

            {/* Consent */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <CheckoutConsent
                checked={fundConsentChecked}
                onChange={(v) => {
                  setFundConsentChecked(v);
                  setFundConsentError("");
                }}
              />
            </div>
            {fundConsentError && (
              <div className="text-xs font-semibold text-red-400">{fundConsentError}</div>
            )}

            {/* Submit */}
            <PrimaryButton
              type="button"
              variant="dark"
              onClick={handleFund}
              disabled={funding || !fundConsentChecked || !isFundAmountValid}
              loading={funding}
              loadingText={
                activeLocale === "en"
                  ? "Loading…"
                  : activeLocale === "es"
                    ? "Cargando…"
                    : activeLocale === "fr"
                      ? "Chargement…"
                      : "Lade…"
              }
              className="w-full"
            >
              {activeLocale === "en"
                ? paymentMode === "wallet"
                  ? "Pay with wallet"
                  : "Continue to checkout"
                : activeLocale === "es"
                  ? paymentMode === "wallet"
                    ? "Pagar con wallet"
                    : "Continuar al pago"
                  : activeLocale === "fr"
                    ? paymentMode === "wallet"
                      ? "Payer avec wallet"
                      : "Continuer vers le paiement"
                    : paymentMode === "wallet"
                      ? "Mit Wallet bezahlen"
                      : "Weiter zur Zahlung"}
            </PrimaryButton>
          </div>
        )}

        {/* Back link */}
        <Link
          href={`/challenges/${id}`}
          className="block text-center text-[13px] text-slate-500 underline underline-offset-2"
        >
          {activeLocale === "en"
            ? "Back to challenge"
            : activeLocale === "es"
              ? "Volver al reto"
              : activeLocale === "fr"
                ? "Retour au défi"
                : "Zurück zur Challenge"}
        </Link>
      </div>
    </div>
  );
}
