"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import MobileTopBar from "@/components/mobile/MobileTopBar";

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

type WalletTab = "transactions" | "supports" | "wins" | "payouts";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>("transactions");

  const locale = useMemo(() => {
    if (typeof window === "undefined") return "de-DE";
    const raw = String(localStorage.getItem("app_locale") || "de").toLowerCase();
    if (raw.startsWith("en")) return "en-GB";
    if (raw.startsWith("es")) return "es-ES";
    if (raw.startsWith("fr")) return "fr-FR";
    return "de-DE";
  }, []);

  const loadWallet = useCallback(async () => {
    const [walletRes, txRes] = await Promise.all([
      apiFetch("/wallet/me", { method: "GET" }, true),
      apiFetch("/wallet/transactions?limit=40", { method: "GET" }, true),
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
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await loadWallet();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Wallet konnte nicht geladen werden.";
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
      const message = e instanceof Error ? e.message : "Auszahlungsanfrage fehlgeschlagen.";
      setActionMessage(message || "Auszahlungsanfrage fehlgeschlagen.");
    } finally {
      setActionBusy(false);
    }
  };

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
      (tx) => tx.type === "payout_request_debit" || tx.type === "payout_reversal_credit"
    );
  }, [activeTab, transactions]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6">
          Wallet wird geladen...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#050d1a] px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-400/30 bg-rose-400/10 p-6 text-rose-100">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#040b16] px-4 pb-24 pt-4 text-slate-100 md:px-8 md:pt-8">
      {/* MobileTopBar nur mobil sichtbar */}
      <div className="md:hidden">
        <MobileTopBar title="Wallet" onRefresh={loadWallet} />
      </div>
      <div className="mx-auto max-w-[440px] md:max-w-[760px]">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#091427_0%,#061024_100%)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] md:rounded-[34px] md:p-7">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xl text-white/80 md:h-11 md:w-11 md:text-2xl"
              aria-label="Zurück"
            >
              ‹
            </button>
            <div className="text-[15px] font-extrabold tracking-tight text-white md:text-[20px]">Wallet</div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-lg text-white/80 md:h-11 md:w-11 md:text-xl"
              aria-label="Optionen"
            >
              ⋯
            </button>
          </div>

          <div className="mt-5 text-center md:mt-7">
            <div className="text-[35px] font-black leading-none text-white md:text-[50px]">{formatMoney(available, locale)}</div>
            <div className="mt-1 text-[12px] text-slate-400 md:text-[14px]">Verfügbar</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:mt-6 md:gap-3">
            <button
              type="button"
              onClick={() => {
                setActionMessage("Einzahlen erfolgt aktuell über den Support-Checkout einer Challenge.");
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
                  disabled={actionBusy}
                  className="h-10 rounded-lg border border-blue-300/30 bg-blue-500/20 px-3 text-xs font-bold text-blue-100 disabled:opacity-60"
                >
                  Senden
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 md:p-3.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">Ausstehend</div>
              <div className="mt-1 text-[15px] font-extrabold text-slate-100 md:text-[22px]">{formatMoney(pending, locale)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 md:p-3.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 md:text-[11px]">Auszahlung</div>
              <div className="mt-1 text-[15px] font-extrabold text-slate-100 md:text-[22px]">{formatMoney(paidOut, locale)}</div>
            </div>
          </div>

          {actionMessage ? <div className="mt-3 text-xs text-slate-300">{actionMessage}</div> : null}

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
            <div className="text-[11px] text-slate-500">Gewinne: {formatMoney(earned, locale)}</div>
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

                    <div className={`text-[13px] font-extrabold md:text-[15px] ${positive ? "text-emerald-300" : "text-rose-300"}`}>
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
  );
}
