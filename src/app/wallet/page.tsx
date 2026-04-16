"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import LegalFooter from "@/components/legal/LegalFooter";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import NotificationsBell from "@/components/NotificationsBell";

type WalletOverview = {
  id: string;
  userId: string;
  currency: string;
  availableBalance: string;
  pendingBalance: string;
  totalPaidOut: string;
  totalEarned: string;
  createdAt: string;
  updatedAt: string;
};

type WalletTx = {
  id: string;
  type: string;
  amount: string;
  direction: "credit" | "debit";
  status: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  balanceAfter: string;
  createdAt: string;
};

type PayoutSetupStatusResponse = {
  hasStripeAccount: boolean;
  stripeAccountId: string | null;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  defaultCurrency: string | null;
  country: string | null;
  requirementsCurrentlyDue: string[];
  requirementsEventuallyDue: string[];
};

type WalletTab = "transactions" | "supports" | "wins" | "payouts";
type AppLocale = "de" | "en" | "es" | "fr";

function toNumber(v: unknown) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getTxLabel(type: string) {
  if (type === "challenge_win_credit") return "Gewinn aus Challenge";
  if (type === "support_wallet_debit") return "Support aus Wallet";
  if (type === "payout_request_debit") return "Auszahlung beantragt";
  if (type === "payout_reversal_credit") return "Auszahlung rückgebucht";
  return type;
}

function getTxIcon(type: string) {
  if (type === "challenge_win_credit") return "★";
  if (type === "support_wallet_debit") return "↗";
  if (type === "payout_request_debit") return "↓";
  if (type === "payout_reversal_credit") return "↺";
  return "•";
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [payoutSetup, setPayoutSetup] =
    useState<PayoutSetupStatusResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>("transactions");
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [startingBankSetup, setStartingBankSetup] = useState(false);
  const [openingBankDashboard, setOpeningBankDashboard] = useState(false);
  const [refreshingBankStatus, setRefreshingBankStatus] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const appLocale = useMemo<AppLocale>(() => {
    if (typeof window === "undefined") return "de";
    const raw = String(localStorage.getItem("app_locale") || "de").toLowerCase();
    if (raw.startsWith("en")) return "en";
    if (raw.startsWith("es")) return "es";
    if (raw.startsWith("fr")) return "fr";
    return "de";
  }, []);

  const locale = useMemo(() => {
    if (appLocale === "en") return "en-GB";
    if (appLocale === "es") return "es-ES";
    if (appLocale === "fr") return "fr-FR";
    return "de-DE";
  }, [appLocale]);

  useEffect(() => {
    const updateMobileNav = () => {
      const hasToken = Boolean(localStorage.getItem("access_token"));
      setShowMobileNav(window.innerWidth < 768 && hasToken);
    };

    updateMobileNav();
    window.addEventListener("resize", updateMobileNav);

    return () => window.removeEventListener("resize", updateMobileNav);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const refreshPayoutSetupStatus = useCallback(async () => {
    const res = await apiFetch(
      "/payments/me/payout-setup-status",
      { method: "GET" },
      true
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = (await res.json()) as PayoutSetupStatusResponse;
    setPayoutSetup(data);
  }, []);

  const loadWallet = useCallback(async () => {
    const [walletRes, txRes, payoutStatusRes] = await Promise.all([
      apiFetch("/wallet/me", { method: "GET" }, true),
      apiFetch("/wallet/transactions?limit=40", { method: "GET" }, true),
      apiFetch("/payments/me/payout-setup-status", { method: "GET" }, true),
    ]);

    if (!walletRes.ok) {
      throw new Error(await walletRes.text());
    }

    if (!txRes.ok) {
      throw new Error(await txRes.text());
    }

    const walletJson = await walletRes.json();
    const txJson = await txRes.json();

    setWallet(walletJson);
    setTransactions(Array.isArray(txJson) ? txJson : []);

    if (payoutStatusRes.ok) {
      const payoutJson = (await payoutStatusRes.json()) as PayoutSetupStatusResponse;
      setPayoutSetup(payoutJson);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await loadWallet();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Wallet konnte nicht geladen werden.";
        setError(message || "Wallet konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadWallet]);

  const onRequestPayout = async () => {
    const amount = toNumber(payoutAmount);

    if (amount < 10) {
      setActionMessage("Mindestbetrag für Auszahlung ist 10 €.");
      return;
    }

    if (!payoutSetup?.payoutsEnabled) {
      setActionMessage(
        "Bitte hinterlege zuerst deine Bankverbindung über Stripe und schließe das Onboarding ab."
      );
      return;
    }

    try {
      setActionBusy(true);
      setActionMessage("");

      const res = await apiFetch(
        "/wallet/payout-requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        },
        true
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Auszahlungsanfrage fehlgeschlagen.");
      }

      setActionMessage("Auszahlungsanfrage erstellt.");
      setPayoutAmount("");
      await loadWallet();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Auszahlungsanfrage fehlgeschlagen.";
      setActionMessage(message || "Auszahlungsanfrage fehlgeschlagen.");
    } finally {
      setActionBusy(false);
    }
  };

  const startBankSetup = async () => {
    try {
      setStartingBankSetup(true);
      setActionMessage("");

      const res = await apiFetch(
        "/payments/me/payout-onboarding-link",
        { method: "POST" },
        true
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Stripe-Onboarding konnte nicht gestartet werden.");
      }

      const data = (await res.json()) as { url?: string };
      if (!data?.url) {
        throw new Error("Stripe-Onboarding-Link fehlt.");
      }

      window.location.href = data.url;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Stripe-Onboarding konnte nicht gestartet werden.";
      setActionMessage(message || "Stripe-Onboarding konnte nicht gestartet werden.");
    } finally {
      setStartingBankSetup(false);
    }
  };

  const openBankDashboard = async () => {
    try {
      setOpeningBankDashboard(true);
      setActionMessage("");

      const res = await apiFetch(
        "/payments/me/payout-dashboard-link",
        { method: "POST" },
        true
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Stripe-Dashboard-Link konnte nicht erstellt werden.");
      }

      const data = (await res.json()) as { url?: string };
      if (!data?.url) {
        throw new Error("Stripe-Dashboard-Link fehlt.");
      }

      window.location.href = data.url;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Stripe-Dashboard-Link konnte nicht geöffnet werden.";
      setActionMessage(
        message || "Stripe-Dashboard-Link konnte nicht geöffnet werden."
      );
    } finally {
      setOpeningBankDashboard(false);
    }
  };

  const refreshBankStatusNow = async () => {
    try {
      setRefreshingBankStatus(true);
      setActionMessage("");
      await refreshPayoutSetupStatus();
      setActionMessage("Auszahlungsstatus aktualisiert.");
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Auszahlungsstatus konnte nicht aktualisiert werden.";
      setActionMessage(message || "Auszahlungsstatus konnte nicht aktualisiert werden.");
    } finally {
      setRefreshingBankStatus(false);
    }
  };

  const onRefreshWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setActionMessage("");
      await loadWallet();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Wallet konnte nicht geladen werden.";
      setError(message || "Wallet konnte nicht geladen werden.");
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }, [loadWallet]);

  const available = toNumber(wallet?.availableBalance);
  const pending = toNumber(wallet?.pendingBalance);
  const earned = toNumber(wallet?.totalEarned);
  const paidOut = toNumber(wallet?.totalPaidOut);

  const tabs: Array<{ id: WalletTab; label: string }> = [
    { id: "transactions", label: "Transaktionen" },
    { id: "supports", label: "Supports" },
    { id: "wins", label: "Gewinne" },
    { id: "payouts", label: "Auszahlung" },
  ];

  const filteredTransactions = useMemo(() => {
    if (activeTab === "transactions") return transactions;
    if (activeTab === "supports") {
      return transactions.filter((tx) => tx.type === "support_wallet_debit");
    }
    if (activeTab === "wins") {
      return transactions.filter((tx) => tx.type === "challenge_win_credit");
    }
    return transactions.filter(
      (tx) =>
        tx.type === "payout_request_debit" ||
        tx.type === "payout_reversal_credit"
    );
  }, [activeTab, transactions]);

  if (loading) {
    return (
      <>
        <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6">
            Wallet wird geladen...
          </div>
        </main>
        <LegalFooter />
        {showMobileNav ? (
          <div className="md:hidden">
            <MobileBottomNav pathname="/wallet" locale={appLocale} />
          </div>
        ) : null}
      </>
    );
  }

  if (error) {
    return (
      <>
        <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-slate-100">
          <div className="mx-auto max-w-3xl rounded-3xl border border-rose-400/30 bg-rose-400/10 p-6 text-rose-100">
            {error}
          </div>
        </main>
        <LegalFooter />
        {showMobileNav ? (
          <div className="md:hidden">
            <MobileBottomNav pathname="/wallet" locale={appLocale} />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#040b16] px-4 pb-24 pt-4 text-slate-100 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[440px] md:max-w-[760px]">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#091427_0%,#061024_100%)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] md:rounded-[34px] md:p-7">
            <div className="relative flex items-center justify-end">
              <div className="pointer-events-none absolute inset-x-0 text-center text-[15px] font-extrabold tracking-tight text-white md:text-[20px]">
                Wallet
              </div>

              <div className="relative flex items-center gap-2">
                <NotificationsBell buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] md:h-11 md:w-11" />

                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-slate-200 md:h-11 md:w-11 md:text-xl"
                    aria-label="Optionen"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    ⋯
                  </button>

                  {menuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
                      role="menu"
                      aria-label="Wallet Optionen"
                    >
                      <button
                        type="button"
                        onClick={onRefreshWallet}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        role="menuitem"
                      >
                        Aktualisieren
                      </button>
                      <Link
                        href="/einstellungen"
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        Einstellungen
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center md:mt-7">
              <div className="text-[35px] font-black leading-none text-white md:text-[50px]">
                {formatMoney(available, locale)}
              </div>
              <div className="mt-1 text-[12px] text-slate-400 md:text-[14px]">
                Verfügbar
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 md:mt-6 md:gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionMessage(
                    "Einzahlen erfolgt aktuell über den Support-Checkout einer Challenge."
                  );
                  router.push("/challenges");
                }}
                className="h-10 rounded-xl bg-[#2F78FF] text-[13px] font-bold text-white md:h-12 md:text-[15px]"
              >
                Einzahlen
              </button>
              <button
                type="button"
                onClick={() => setShowPayoutForm((s) => !s)}
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] text-[13px] font-bold text-white md:h-12 md:text-[15px]"
              >
                Auszahlen
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <h2 className="text-lg font-bold text-white">
                Bankverbindung / Stripe-Auszahlung
              </h2>

              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-300">Stripe-Konto</span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        payoutSetup?.hasStripeAccount
                          ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                          : "border-amber-300/30 bg-amber-500/15 text-amber-100"
                      }`}
                    >
                      {payoutSetup?.hasStripeAccount
                        ? "Vorhanden"
                        : "Nicht eingerichtet"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-300">Onboarding</span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        payoutSetup?.onboardingComplete
                          ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                          : "border-amber-300/30 bg-amber-500/15 text-amber-100"
                      }`}
                    >
                      {payoutSetup?.onboardingComplete
                        ? "Abgeschlossen"
                        : "Offen"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-slate-300">Auszahlungen</span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        payoutSetup?.payoutsEnabled
                          ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                          : "border-rose-300/30 bg-rose-500/15 text-rose-100"
                      }`}
                    >
                      {payoutSetup?.payoutsEnabled ? "Aktiv" : "Noch nicht aktiv"}
                    </span>
                  </div>

                  {payoutSetup?.requirementsCurrentlyDue?.length ? (
                    <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      Es fehlen noch Stripe-Angaben:{" "}
                      {payoutSetup.requirementsCurrentlyDue.join(", ")}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startBankSetup}
                    disabled={startingBankSetup}
                    className="h-10 rounded-xl bg-[#2F78FF] px-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {startingBankSetup
                      ? "Öffnet..."
                      : payoutSetup?.hasStripeAccount
                        ? "Bankdaten bei Stripe vervollständigen"
                        : "Bankverbindung hinterlegen"}
                  </button>

                  <button
                    type="button"
                    onClick={openBankDashboard}
                    disabled={openingBankDashboard || !payoutSetup?.hasStripeAccount}
                    className="h-10 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-slate-100 disabled:opacity-50"
                  >
                    {openingBankDashboard
                      ? "Öffnet..."
                      : "Stripe-Auszahlungsdaten bearbeiten"}
                  </button>

                  <button
                    type="button"
                    onClick={refreshBankStatusNow}
                    disabled={refreshingBankStatus}
                    className="h-10 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-slate-100 disabled:opacity-50"
                  >
                    {refreshingBankStatus ? "Prüft..." : "Status aktualisieren"}
                  </button>
                </div>

                <p className="text-xs leading-5 text-slate-400">
                  Deine Bankdaten werden nicht direkt in DarePay gespeichert,
                  sondern sicher über Stripe hinterlegt.
                </p>
              </div>
            </div>

            {showPayoutForm ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Betrag in EUR (min. 10)"
                    inputMode="decimal"
                    className="h-10 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={onRequestPayout}
                    disabled={actionBusy || !payoutSetup?.payoutsEnabled}
                    className="h-10 rounded-lg border border-blue-300/30 bg-blue-500/20 px-3 text-xs font-bold text-blue-100 disabled:opacity-60"
                  >
                    {actionBusy ? "Sendet..." : "Senden"}
                  </button>
                </div>

                {!payoutSetup?.payoutsEnabled ? (
                  <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Bevor du auszahlen kannst, musst du zuerst deine
                    Bankverbindung über Stripe hinterlegen und das Onboarding
                    abschließen.
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2 md:gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 md:p-3.5">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">
                  Ausstehend
                </div>
                <div className="mt-1 text-[15px] font-extrabold text-slate-100 md:text-[22px]">
                  {formatMoney(pending, locale)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 md:p-3.5">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">
                  Auszahlung
                </div>
                <div className="mt-1 text-[15px] font-extrabold text-slate-100 md:text-[22px]">
                  {formatMoney(paidOut, locale)}
                </div>
              </div>
            </div>

            {actionMessage ? (
              <div className="mt-3 text-xs text-slate-300">{actionMessage}</div>
            ) : null}

            <div className="mt-4 md:mt-6">
              <div className="grid grid-cols-4 gap-1 md:gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-8 rounded-full px-1 text-[11px] font-bold transition md:h-10 md:text-[13px] ${
                      activeTab === tab.id
                        ? "bg-[#2F78FF] text-white"
                        : "border border-white/10 bg-white/[0.03] text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between md:mt-6">
              <div className="text-[13px] font-extrabold text-white">
                {tabs.find((t) => t.id === activeTab)?.label || "Transaktionen"}
              </div>
              <div className="text-[11px] text-slate-500">
                Gewinne: {formatMoney(earned, locale)}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                Keine Einträge in diesem Tab.
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {filteredTransactions.map((tx) => {
                  const amount = toNumber(tx.amount);
                  const positive = tx.direction === "credit";

                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-white/10 bg-[#081327] px-2.5 py-2.5 md:gap-3 md:px-3.5 md:py-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black md:h-10 md:w-10 md:text-sm ${
                          positive
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {getTxIcon(tx.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-white md:text-[15px]">
                          {tx.description || getTxLabel(tx.type)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500 md:text-[12px]">
                          {new Date(tx.createdAt).toLocaleDateString(locale, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </div>
                      </div>

                      <div
                        className={`text-[13px] font-extrabold md:text-[15px] ${
                          positive ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {positive ? "+" : "-"}
                        {formatMoney(amount, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/challenges"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white/90 md:mt-6 md:h-12 md:text-[15px]"
            >
              Active Challenges ansehen
            </Link>
          </div>
        </div>
      </main>
      <LegalFooter />
      {showMobileNav ? (
        <>
          <div className="h-28 md:hidden" />
          <div className="md:hidden">
            <MobileBottomNav pathname="/wallet" locale={appLocale} />
          </div>
        </>
      ) : null}
    </>
  );
}