"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiJson } from "@/lib/api";

type EvidencePackage = {
  challenge: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    result?: string | null;
    owner?: {
      id: string;
      username?: string | null;
      email?: string | null;
    } | null;
    minAmount?: string | null;
    currentAmount?: string | null;
    confirmedPotAmount?: string | null;
    platformFeeAmount?: string | null;
    winnerPayoutAmount?: string | null;
    payoutLocked?: boolean;
    payoutCompleted?: boolean;
    payoutCompletedAt?: string | null;
    winnerAttemptId?: string | null;
    winnerUserId?: string | null;
    winnerPlaybackId?: string | null;
    votingEndsAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  summary: {
    paymentCount: number;
    paidPaymentCount: number;
    totalIncoming: string;
    paidIncoming: string;
    refundedIncoming: string;
    payoutExists: boolean;
    payoutStatus?: string | null;
  };
  payments: Array<{
    id: string;
    status: string;
    amount: string;
    currency: string;
    payerUserId: string;
    payerUser?: {
      id: string;
      username?: string | null;
      email?: string | null;
    } | null;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    stripeChargeId?: string | null;
    stripeEventId?: string | null;
    receiptUrl?: string | null;
    paymentMethodType?: string | null;
    legalVersion?: string | null;
    legalAcceptedAt?: string | null;
    paidAt?: string | null;
    refundedAt?: string | null;
    failureReason?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
  payout: {
    id: string;
    challengeId: string;
    winnerUserId: string;
    winnerUser?: {
      id: string;
      username?: string | null;
      email?: string | null;
    } | null;
    grossAmount: string;
    platformFeeAmount: string;
    netAmount: string;
    currency: string;
    provider: string;
    status: string;
    providerTransferId?: string | null;
    providerPayoutId?: string | null;
    failureReason?: string | null;
    paidAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
};

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("de-DE");
}

function toNumber(v: any): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(amount?: string | number | null, currency?: string) {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) {
    return `${amount ?? "0"} ${String(currency || "EUR").toUpperCase()}`;
  }

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: String(currency || "EUR").toUpperCase(),
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${String(currency || "EUR").toUpperCase()}`;
  }
}

function formatChallengeStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "funding") return "Funding";
  if (s === "active") return "Aktiv";
  if (s === "voting") return "Voting";
  if (s === "completed") return "Abgeschlossen";

  return status || "—";
}

function formatPaymentStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "paid") return "Bezahlt";
  if (s === "processed") return "Verarbeitet";
  if (s === "pending") return "Ausstehend";
  if (s === "received") return "Eingegangen";
  if (s === "refunded") return "Erstattet";
  if (s === "failed") return "Fehlgeschlagen";

  return status || "—";
}

function formatPayoutStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "ready") return "Bereit";
  if (s === "paid") return "Ausgezahlt";
  if (s === "pending") return "Ausstehend";
  if (s === "failed") return "Fehlgeschlagen";
  if (s === "processing") return "In Bearbeitung";

  return status || "—";
}

function formatProvider(value?: string | null) {
  if (!value) return "—";
  const v = String(value).trim();
  if (!v) return "—";
  if (v.toLowerCase() === "stripe") return "Stripe";
  return v;
}

function statusBadge(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "paid" || s === "completed" || s === "processed") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (s === "ready" || s === "voting") {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (
    s === "pending" ||
    s === "funding" ||
    s === "active" ||
    s === "received"
  ) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (s === "failed" || s === "refunded") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function InfoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-bold uppercase tracking-wide text-neutral-500">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-neutral-200 py-3 first:border-t-0 first:pt-0">
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      <div className="break-all text-right text-sm font-semibold text-neutral-950">
        {value}
      </div>
    </div>
  );
}

type IntegrityMessage = {
  title: string;
  detail: string;
};

export default function AdminCaseEvidencePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
      ? rawId[0] || ""
      : "";

  const [data, setData] = useState<EvidencePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        if (!cancelled) {
          setError("Keine Challenge-ID in der URL gefunden.");
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const result = await apiJson<EvidencePackage>(
          `/payments/admin/challenges/${id}/evidence-package`,
          { method: "GET" },
          true
        );

        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            String(err?.message || "Challenge-Akte konnte nicht geladen werden.")
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const paymentTotal = useMemo(() => {
    if (!data) return 0;
    return data.payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  }, [data]);

  const paidPayments = useMemo(() => {
    if (!data) return [];
    return data.payments.filter(
      (p) => String(p.status).toLowerCase() === "paid"
    );
  }, [data]);

  const paidIncoming = useMemo(() => {
    return paidPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  }, [paidPayments]);

  const integrityMessages = useMemo<IntegrityMessage[]>(() => {
    if (!data) return [];

    const messages: IntegrityMessage[] = [];
    const confirmedPot = toNumber(data.challenge.confirmedPotAmount);
    const currentAmount = toNumber(data.challenge.currentAmount);
    const summaryPaidIncoming = toNumber(data.summary.paidIncoming);
    const payoutGross = toNumber(data.payout?.grossAmount);

    if (data.payout && paidPayments.length === 0) {
      messages.push({
        title: "Auszahlung vorhanden, aber keine bezahlten Einzahlungen gefunden",
        detail: `Es existiert bereits eine Auszahlung über ${formatAmount(
          payoutGross,
          data.payout?.currency || "EUR"
        )}, aber in den geladenen Payment-Datensätzen wurde keine bezahlte Einzahlung gefunden.`,
      });
    }

    if (Math.abs(summaryPaidIncoming - paidIncoming) > 0.01) {
      messages.push({
        title: "Summary stimmt nicht mit Payment-Tabelle überein",
        detail: `Summary bezahlt: ${formatAmount(
          summaryPaidIncoming,
          "EUR"
        )} • bezahlte Payments aus Tabelle: ${formatAmount(
          paidIncoming,
          "EUR"
        )} • Differenz: ${formatAmount(
          Math.abs(summaryPaidIncoming - paidIncoming),
          "EUR"
        )}`,
      });
    }

    if (Math.abs(confirmedPot - paidIncoming) > 0.01) {
      messages.push({
        title: "Bestätigter Pot stimmt nicht mit bezahlten Einzahlungen überein",
        detail: `Bestätigter Pot: ${formatAmount(
          confirmedPot,
          "EUR"
        )} • bezahlte Einzahlungen: ${formatAmount(
          paidIncoming,
          "EUR"
        )} • Differenz: ${formatAmount(
          Math.abs(confirmedPot - paidIncoming),
          "EUR"
        )}`,
      });
    }

    if (Math.abs(currentAmount - paidIncoming) > 0.01) {
      messages.push({
        title: "Aktueller Pot stimmt nicht mit bezahlten Einzahlungen überein",
        detail: `Aktueller Pot: ${formatAmount(
          currentAmount,
          "EUR"
        )} • bezahlte Einzahlungen: ${formatAmount(
          paidIncoming,
          "EUR"
        )} • Differenz: ${formatAmount(
          Math.abs(currentAmount - paidIncoming),
          "EUR"
        )}`,
      });
    }

    if (data.payout && Math.abs(payoutGross - paidIncoming) > 0.01) {
      messages.push({
        title: "Brutto-Auszahlung passt nicht zu den bezahlten Einzahlungen",
        detail: `Brutto-Auszahlung: ${formatAmount(
          payoutGross,
          data.payout?.currency || "EUR"
        )} • bezahlte Einzahlungen: ${formatAmount(
          paidIncoming,
          "EUR"
        )} • Differenz: ${formatAmount(
          Math.abs(payoutGross - paidIncoming),
          "EUR"
        )}`,
      });
    }

    return messages;
  }, [data, paidIncoming, paidPayments]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          Lade Challenge-Akte...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error || "Keine Daten"}
        </div>
      </main>
    );
  }

  const challengeStatus = formatChallengeStatus(data.challenge.status);
  const payoutStatus = data.payout
    ? formatPayoutStatus(data.payout.status)
    : null;

  const printPaidCount = paidPayments.length;
  const printConfirmedPot = toNumber(data.challenge.confirmedPotAmount);
  const printCurrentPot = toNumber(data.challenge.currentAmount);
  const printPayoutGross = toNumber(data.payout?.grossAmount);

  return (
    <main className="min-h-screen bg-neutral-50 p-6 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl space-y-6 print:hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-medium text-neutral-500">
              <Link href="/admin/payments" className="hover:underline">
                Admin
              </Link>
              <span className="mx-2">/</span>
              <span>Challenge-Akte</span>
            </div>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
              Challenge-Akte
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Zentrale Admin-Akte mit Challenge, Beteiligten, Einzahlungen und
              Auszahlung.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Einzahlungen
            </Link>

            <Link
              href="/admin/payouts"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Auszahlungen
            </Link>

            <button
              onClick={() => window.print()}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Drucken / PDF
            </button>
          </div>
        </div>

        {integrityMessages.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-900">
                Kritisch
              </span>
              <div className="font-bold uppercase tracking-wide text-red-900">
                Datenstatus
              </div>
            </div>

            <p className="mt-3 text-red-800">
              Es wurden echte Datenabweichungen zwischen Challenge, Zahlungen und
              Auszahlung erkannt.
            </p>

            <div className="mt-4 space-y-4">
              {integrityMessages.map((message, index) => (
                <div key={`${message.title}-${index}`}>
                  <div className="font-semibold text-red-900">
                    • {message.title}
                  </div>
                  <div className="mt-1 text-red-700">{message.detail}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-900">
                Konsistent
              </span>
              <div className="font-bold uppercase tracking-wide text-green-900">
                Datenstatus
              </div>
            </div>

            <p className="mt-3">
              Challenge, bezahlte Einzahlungen und Auszahlung wirken in den
              geladenen Daten konsistent.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                Challenge
              </div>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-950">
                {data.challenge.title}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                    data.challenge.status
                  )}`}
                >
                  Status: {challengeStatus}
                </span>

                {payoutStatus ? (
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                      data.payout?.status
                    )}`}
                  >
                    Auszahlung: {payoutStatus}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    Keine Auszahlung angelegt
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-900">
                  Challenge-ID:
                </span>{" "}
                <span className="break-all">{data.challenge.id}</span>
              </div>
              <div className="mt-1">
                <span className="font-semibold text-neutral-900">Stand:</span>{" "}
                {fmtDate(new Date().toISOString())}
              </div>
            </div>
          </div>

          {data.challenge.description ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
              {data.challenge.description}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <InfoCard
            title="1. Challenge"
            subtitle="Stammdaten und Status dieser Challenge"
          >
            <MetricRow label="Status" value={challengeStatus} />
            <MetricRow label="Ergebnis" value={data.challenge.result || "—"} />
            <MetricRow
              label="Ersteller"
              value={data.challenge.owner?.username || "—"}
            />
            <MetricRow
              label="Ersteller E-Mail"
              value={data.challenge.owner?.email || "—"}
            />
            <MetricRow
              label="Mindestziel"
              value={formatAmount(data.challenge.minAmount, "EUR")}
            />
            <MetricRow
              label="Aktueller Pot"
              value={formatAmount(data.challenge.currentAmount, "EUR")}
            />
            <MetricRow
              label="Bestätigter Pot"
              value={formatAmount(data.challenge.confirmedPotAmount, "EUR")}
            />
            <MetricRow label="Erstellt" value={fmtDate(data.challenge.createdAt)} />
            <MetricRow
              label="Aktualisiert"
              value={fmtDate(data.challenge.updatedAt)}
            />
          </InfoCard>

          <InfoCard
            title="2. Geldfluss"
            subtitle="Zahlungsdaten und Summen dieser Challenge"
          >
            <MetricRow label="Einzahlungen gesamt" value={data.summary.paymentCount} />
            <MetricRow label="Davon bezahlt" value={data.summary.paidPaymentCount} />
            <MetricRow
              label="Gesamtvolumen"
              value={formatAmount(data.summary.totalIncoming, "EUR")}
            />
            <MetricRow
              label="Bezahlt gesamt"
              value={formatAmount(data.summary.paidIncoming, "EUR")}
            />
            <MetricRow
              label="Bezahlt aus Tabelle"
              value={formatAmount(paidIncoming, "EUR")}
            />
            <MetricRow
              label="Erstattet gesamt"
              value={formatAmount(data.summary.refundedIncoming, "EUR")}
            />
            <MetricRow
              label="Rechnerische Summe"
              value={formatAmount(paymentTotal, "EUR")}
            />
          </InfoCard>

          <InfoCard
            title="3. Beteiligte & Auszahlung"
            subtitle="Gewinner, Auszahlungsstatus und Auszahlungssumme"
          >
            <MetricRow
              label="Gewinner"
              value={data.payout?.winnerUser?.username || "—"}
            />
            <MetricRow
              label="Gewinner E-Mail"
              value={data.payout?.winnerUser?.email || "—"}
            />
            <MetricRow label="Auszahlung vorhanden" value={data.payout ? "Ja" : "Nein"} />
            <MetricRow
              label="Auszahlungsstatus"
              value={data.payout ? formatPayoutStatus(data.payout.status) : "—"}
            />
            <MetricRow
              label="Anbieter"
              value={formatProvider(data.payout?.provider)}
            />
            <MetricRow
              label="Brutto"
              value={formatAmount(
                data.payout?.grossAmount,
                data.payout?.currency || "EUR"
              )}
            />
            <MetricRow
              label="Gebühr"
              value={formatAmount(
                data.payout?.platformFeeAmount,
                data.payout?.currency || "EUR"
              )}
            />
            <MetricRow
              label="Netto"
              value={formatAmount(
                data.payout?.netAmount,
                data.payout?.currency || "EUR"
              )}
            />
            <MetricRow label="Ausgezahlt am" value={fmtDate(data.payout?.paidAt)} />
          </InfoCard>
        </div>

        <InfoCard
          title="4. Einzahlungen"
          subtitle="Alle Zahlungen, die zu dieser Challenge gehören"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Betrag</th>
                  <th className="px-3 py-2 font-semibold">Einzahler</th>
                  <th className="px-3 py-2 font-semibold">Methode / Beleg</th>
                  <th className="px-3 py-2 font-semibold">Zeitpunkte</th>
                  <th className="px-3 py-2 font-semibold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-neutral-500">
                      Keine Einzahlungen vorhanden.
                    </td>
                  </tr>
                ) : (
                  data.payments.map((p) => (
                    <tr key={p.id} className="border-t border-neutral-200 align-top">
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            p.status
                          )}`}
                        >
                          {formatPaymentStatus(p.status)}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-semibold text-neutral-950">
                        {formatAmount(p.amount, p.currency)}
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-semibold text-neutral-950">
                          {p.payerUser?.username || "—"}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {p.payerUser?.email || p.payerUserId}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-xs text-neutral-700">
                        <div>
                          <span className="font-semibold">Methode:</span>{" "}
                          {p.paymentMethodType || "—"}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Beleg:</span>{" "}
                          {p.receiptUrl ? (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              öffnen
                            </a>
                          ) : (
                            "—"
                          )}
                        </div>
                        {p.failureReason ? (
                          <div className="mt-1 text-red-700">
                            <span className="font-semibold">Hinweis:</span>{" "}
                            {p.failureReason}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3 text-xs text-neutral-700">
                        <div>
                          <span className="font-semibold">Erstellt:</span>{" "}
                          {fmtDate(p.createdAt)}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Bezahlt:</span>{" "}
                          {fmtDate(p.paidAt)}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Erstattet:</span>{" "}
                          {fmtDate(p.refundedAt)}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/payments/${p.id}`}
                            className="text-sm font-semibold text-blue-600 hover:underline"
                          >
                            Zahlungsdetails
                          </Link>

                          {p.receiptUrl ? (
                            <a
                              href={p.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-neutral-700 hover:underline"
                            >
                              Beleg öffnen
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </InfoCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <InfoCard
            title="5. Auszahlung"
            subtitle="Nur relevant, wenn bereits eine Auszahlung angelegt wurde"
          >
            {!data.payout ? (
              <div className="text-sm text-neutral-500">
                Für diese Challenge wurde noch keine Auszahlung angelegt.
              </div>
            ) : (
              <div className="space-y-0">
                <MetricRow label="Payout-ID" value={data.payout.id} />
                <MetricRow
                  label="Status"
                  value={formatPayoutStatus(data.payout.status)}
                />
                <MetricRow
                  label="Anbieter"
                  value={formatProvider(data.payout.provider)}
                />
                <MetricRow
                  label="Brutto"
                  value={formatAmount(data.payout.grossAmount, data.payout.currency)}
                />
                <MetricRow
                  label="Gebühr"
                  value={formatAmount(
                    data.payout.platformFeeAmount,
                    data.payout.currency
                  )}
                />
                <MetricRow
                  label="Netto"
                  value={formatAmount(data.payout.netAmount, data.payout.currency)}
                />
                <MetricRow label="Ausgezahlt am" value={fmtDate(data.payout.paidAt)} />
                <MetricRow
                  label="Transfer-ID"
                  value={data.payout.providerTransferId || "—"}
                />
                <MetricRow
                  label="Payout-ID Anbieter"
                  value={data.payout.providerPayoutId || "—"}
                />
                <MetricRow
                  label="Hinweis"
                  value={data.payout.failureReason || "—"}
                />

                <div className="pt-4">
                  <Link
                    href={`/admin/payouts/${data.payout.id}`}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Auszahlungsdetails öffnen
                  </Link>
                </div>
              </div>
            )}
          </InfoCard>

          <InfoCard
            title="6. Technische Referenzen"
            subtitle="Sekundäre IDs und technische Zuordnung dieser Challenge"
          >
            <div className="space-y-0">
              <MetricRow
                label="Gewinner Benutzer-ID"
                value={data.challenge.winnerUserId || "—"}
              />
              <MetricRow
                label="Gewinner Attempt-ID"
                value={data.challenge.winnerAttemptId || "—"}
              />
              <MetricRow
                label="Gewinner Playback-ID"
                value={data.challenge.winnerPlaybackId || "—"}
              />
              <MetricRow
                label="Voting endet"
                value={fmtDate(data.challenge.votingEndsAt)}
              />
              <MetricRow label="Bezahlte Zahlungen" value={paidPayments.length} />
            </div>
          </InfoCard>
        </div>
      </div>

      <div className="print-only hidden">
        <div className="print-page">
          <section className="print-card">
            <h1 className="print-title">Challenge-Akte</h1>
            <p className="print-subtitle">Norek · Kompakte Druckansicht</p>

            <div className="print-badges">
              <span className="print-badge">Challenge: {challengeStatus}</span>
              <span className="print-badge">
                Auszahlung: {payoutStatus || "Nicht angelegt"}
              </span>
              <span className="print-badge">
                Pot: {formatAmount(data.challenge.confirmedPotAmount, "EUR")}
              </span>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Datenstatus</div>

            {integrityMessages.length === 0 ? (
              <div className="print-value">Keine Auffälligkeiten erkannt.</div>
            ) : (
              <div className="space-y-2">
                {integrityMessages.slice(0, 4).map((message, index) => (
                  <div key={`${message.title}-${index}`} className="print-value">
                    <strong>{message.title}:</strong> {message.detail}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="print-card">
            <div className="print-section-title">Challenge</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Titel</div>
                <div className="print-value">{data.challenge.title}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Challenge-ID</div>
                <div className="print-value">{data.challenge.id}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Status</div>
                <div className="print-value">{challengeStatus}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Ergebnis</div>
                <div className="print-value">{data.challenge.result || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Ersteller</div>
                <div className="print-value">
                  {data.challenge.owner?.username || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Ersteller E-Mail</div>
                <div className="print-value">
                  {data.challenge.owner?.email || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Mindestziel</div>
                <div className="print-value">
                  {formatAmount(data.challenge.minAmount, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Aktueller Pot</div>
                <div className="print-value">
                  {formatAmount(data.challenge.currentAmount, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Bestätigter Pot</div>
                <div className="print-value">
                  {formatAmount(data.challenge.confirmedPotAmount, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Stand</div>
                <div className="print-value">{fmtDate(new Date().toISOString())}</div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Geldfluss</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Einzahlungen gesamt</div>
                <div className="print-value">{data.summary.paymentCount}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Davon bezahlt</div>
                <div className="print-value">{data.summary.paidPaymentCount}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Bezahlt aus Tabelle</div>
                <div className="print-value">{printPaidCount}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gesamtvolumen</div>
                <div className="print-value">
                  {formatAmount(data.summary.totalIncoming, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Bezahlt gesamt</div>
                <div className="print-value">
                  {formatAmount(data.summary.paidIncoming, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Bezahlt aus Tabelle</div>
                <div className="print-value">
                  {formatAmount(paidIncoming, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Confirmed Pot</div>
                <div className="print-value">
                  {formatAmount(printConfirmedPot, "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Current Pot</div>
                <div className="print-value">
                  {formatAmount(printCurrentPot, "EUR")}
                </div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Auszahlung</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Auszahlung vorhanden</div>
                <div className="print-value">{data.payout ? "Ja" : "Nein"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Auszahlungsstatus</div>
                <div className="print-value">{payoutStatus || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner</div>
                <div className="print-value">
                  {data.payout?.winnerUser?.username || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner E-Mail</div>
                <div className="print-value">
                  {data.payout?.winnerUser?.email || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Anbieter</div>
                <div className="print-value">
                  {formatProvider(data.payout?.provider)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Brutto</div>
                <div className="print-value">
                  {formatAmount(printPayoutGross, data.payout?.currency || "EUR")}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Gebühr</div>
                <div className="print-value">
                  {formatAmount(
                    data.payout?.platformFeeAmount,
                    data.payout?.currency || "EUR"
                  )}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Netto</div>
                <div className="print-value">
                  {formatAmount(
                    data.payout?.netAmount,
                    data.payout?.currency || "EUR"
                  )}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Ausgezahlt am</div>
                <div className="print-value">{fmtDate(data.payout?.paidAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Payout-ID</div>
                <div className="print-value">{data.payout?.id || "—"}</div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Technische Referenzen</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Gewinner Benutzer-ID</div>
                <div className="print-value">{data.challenge.winnerUserId || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner Attempt-ID</div>
                <div className="print-value">{data.challenge.winnerAttemptId || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner Playback-ID</div>
                <div className="print-value">{data.challenge.winnerPlaybackId || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Voting endet</div>
                <div className="print-value">{fmtDate(data.challenge.votingEndsAt)}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}