"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiJson } from "@/lib/api";

type PayoutDetailResponse = {
  payout: {
    id: string;
    challengeId: string;
    winnerUserId: string;
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
  };
  challenge?: {
    id: string;
    title?: string | null;
    status?: string | null;
    payoutLocked?: boolean;
    payoutCompleted?: boolean;
    payoutCompletedAt?: string | null;
  } | null;
  winnerUser?: {
    id: string;
    username?: string | null;
    email?: string | null;
  } | null;
  evidence?: {
    provider?: string | null;
    providerTransferId?: string | null;
    providerPayoutId?: string | null;
    paidAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  history?: Array<{
    type: string;
    at?: string | null;
    title: string;
    text: string;
  }>;
};

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("de-DE");
}

function formatAmount(amount?: string | number, currency?: string) {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) {
    return `${amount ?? "0"} ${String(currency || "").toUpperCase()}`;
  }

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: String(currency || "EUR").toUpperCase(),
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${String(currency || "").toUpperCase()}`;
  }
}

function formatProvider(value?: string | null) {
  if (!value) return "—";
  const v = String(value).trim();
  if (!v) return "—";
  if (v.toLowerCase() === "stripe") return "Stripe";
  return v;
}

function formatPayoutStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "ready") return "Bereit";
  if (s === "paid") return "Ausgezahlt";
  if (s === "pending") return "Ausstehend";
  if (s === "failed") return "Fehlgeschlagen";
  if (s === "processing") return "In Bearbeitung";
  if (s === "canceled") return "Abgebrochen";

  return status || "—";
}

function formatChallengeStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "funding") return "Funding";
  if (s === "active") return "Aktiv";
  if (s === "voting") return "Voting";
  if (s === "completed") return "Abgeschlossen";

  return status || "—";
}

function currencyCode(value?: string | null) {
  return String(value || "EUR").toUpperCase();
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const content = value ?? children;

  return (
    <div className="grid gap-1 border-t border-neutral-200 py-3 first:border-t-0 first:pt-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="break-all text-sm text-neutral-950">{content}</div>
    </div>
  );
}

export default function AdminPayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [data, setData] = useState<PayoutDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const result = await apiJson<PayoutDetailResponse>(
        `/payments/admin/payouts/${id}`,
        { method: "GET" },
        true
      );
      setData(result);
    } catch (err: any) {
      setError(String(err?.message || "Payout konnte nicht geladen werden."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const payout = data?.payout ?? null;
  const challenge = data?.challenge ?? null;
  const winnerUser = data?.winnerUser ?? null;
  const evidence = data?.evidence ?? null;
  const history = useMemo(() => data?.history ?? [], [data]);
  const printHistory = history.slice(0, 2);

  if (!id) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Fehlende Payout-ID.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          Lade Auszahlungsdetails...
        </div>
      </main>
    );
  }

  if (error || !payout) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Auszahlung nicht gefunden."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-6 print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-medium text-neutral-500">
              <Link href="/admin/payments" className="hover:underline">
                Admin
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/payouts" className="hover:underline">
                Auszahlungen
              </Link>
              <span className="mx-2">/</span>
              <span>Details</span>
            </div>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
              Auszahlungsdetails
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Detailansicht einer Auszahlung. Die zentrale Hauptseite bleibt die Challenge-Akte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Einzahlungen
            </Link>
            <Link
              href="/admin/payouts"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Auszahlungen
            </Link>
            <Link
              href={`/admin/cases/${payout.challengeId}`}
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Challenge-Akte
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex h-11 items-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Drucken / PDF
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Auszahlungs-ID
              </div>
              <div className="mt-1 break-all text-lg font-extrabold text-neutral-950">
                {payout.id}
              </div>
            </div>

            <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-semibold text-neutral-700">
              Status: {formatPayoutStatus(payout.status)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-950">
              Auszahlung
            </h2>
            <div className="mt-4">
              <Row label="Brutto">
                {formatAmount(payout.grossAmount, payout.currency)}
              </Row>
              <Row label="Plattformgebühr">
                {formatAmount(payout.platformFeeAmount, payout.currency)}
              </Row>
              <Row label="Netto Gewinner">
                {formatAmount(payout.netAmount, payout.currency)}
              </Row>
              <Row label="Währung">{currencyCode(payout.currency)}</Row>
              <Row label="Anbieter">{formatProvider(payout.provider)}</Row>
              <Row label="Erstellt">{fmtDate(payout.createdAt)}</Row>
              <Row label="Zuletzt geändert">{fmtDate(payout.updatedAt)}</Row>
              <Row label="Ausgezahlt am">{fmtDate(payout.paidAt)}</Row>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-neutral-950">
              Bezug zur Challenge
            </h2>
            <div className="mt-4">
              <Row label="Challenge-Titel">{challenge?.title || "—"}</Row>
              <Row label="Challenge-ID">{challenge?.id || payout.challengeId}</Row>
              <Row
                label="Challenge-Status"
                value={formatChallengeStatus(challenge?.status)}
              />
              <Row label="Gewinner Benutzername">
                {winnerUser?.username || "—"}
              </Row>
              <Row label="Gewinner E-Mail">{winnerUser?.email || "—"}</Row>
              <Row label="Gewinner Benutzer-ID">
                {winnerUser?.id || payout.winnerUserId}
              </Row>
              <Row
                label="Zentrale Seite"
                value={
                  <Link
                    href={`/admin/cases/${payout.challengeId}`}
                    className="text-blue-600 hover:underline"
                  >
                    Zur Challenge-Akte
                  </Link>
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-neutral-950">
            Anbieter-Referenzen / Nachweis
          </h2>

          <div className="mt-4">
            <Row label="Anbieter">{formatProvider(evidence?.provider)}</Row>
            <Row label="Anbieter-Transfer-ID">
              {evidence?.providerTransferId || "—"}
            </Row>
            <Row label="Anbieter-Payout-ID">
              {evidence?.providerPayoutId || "—"}
            </Row>
            <Row label="Payout erstellt">{fmtDate(evidence?.createdAt)}</Row>
            <Row label="Payout aktualisiert">{fmtDate(evidence?.updatedAt)}</Row>
            <Row label="Payout ausgezahlt">{fmtDate(evidence?.paidAt)}</Row>
            <Row label="Hinweis">
              {payout.failureReason?.trim()
                ? payout.failureReason
                : "Kein Fehlerhinweis vorhanden."}
            </Row>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-neutral-950">Historie</h2>

          {history.length === 0 ? (
            <div className="mt-4 text-sm text-neutral-500">
              Keine Historie vorhanden.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {history.map((entry, index) => (
                <div
                  key={`${entry.type}-${index}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="font-semibold text-neutral-950">
                      {entry.title}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {fmtDate(entry.at)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-700">
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="print-only hidden">
        <div className="print-page">
          <section className="print-card">
            <h1 className="print-title">Auszahlungsdetails</h1>
            <p className="print-subtitle">DarePay · Detailansicht einer Auszahlung</p>

            <div className="print-badges">
              <span className="print-badge">
                Status: {formatPayoutStatus(payout.status)}
              </span>
              <span className="print-badge">
                Netto: {formatAmount(payout.netAmount, payout.currency)}
              </span>
              <span className="print-badge">
                Anbieter: {formatProvider(payout.provider)}
              </span>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Auszahlung</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Auszahlungs-ID</div>
                <div className="print-value">{payout.id}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Challenge-ID</div>
                <div className="print-value">
                  {challenge?.id || payout.challengeId}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Brutto</div>
                <div className="print-value">
                  {formatAmount(payout.grossAmount, payout.currency)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Plattformgebühr</div>
                <div className="print-value">
                  {formatAmount(payout.platformFeeAmount, payout.currency)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Netto Gewinner</div>
                <div className="print-value">
                  {formatAmount(payout.netAmount, payout.currency)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Währung</div>
                <div className="print-value">{currencyCode(payout.currency)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Anbieter</div>
                <div className="print-value">{formatProvider(payout.provider)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Ausgezahlt am</div>
                <div className="print-value">{fmtDate(payout.paidAt)}</div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Bezug / Gewinner</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Challenge-Titel</div>
                <div className="print-value">{challenge?.title || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Challenge-Status</div>
                <div className="print-value">
                  {formatChallengeStatus(challenge?.status)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner Benutzername</div>
                <div className="print-value">{winnerUser?.username || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner E-Mail</div>
                <div className="print-value">{winnerUser?.email || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Gewinner Benutzer-ID</div>
                <div className="print-value">
                  {winnerUser?.id || payout.winnerUserId}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Fehlerhinweis</div>
                <div className="print-value">
                  {payout.failureReason?.trim()
                    ? payout.failureReason
                    : "Kein Fehlerhinweis vorhanden."}
                </div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Anbieter-Referenzen</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Anbieter</div>
                <div className="print-value">{formatProvider(evidence?.provider)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Transfer-ID</div>
                <div className="print-value">
                  {evidence?.providerTransferId || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Anbieter-Payout-ID</div>
                <div className="print-value">
                  {evidence?.providerPayoutId || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Payout erstellt</div>
                <div className="print-value">{fmtDate(evidence?.createdAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Payout aktualisiert</div>
                <div className="print-value">{fmtDate(evidence?.updatedAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Payout ausgezahlt</div>
                <div className="print-value">{fmtDate(evidence?.paidAt)}</div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Historie</div>
            {printHistory.length === 0 ? (
              <div className="print-value">Keine Historie vorhanden.</div>
            ) : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Titel</th>
                    <th>Zeitpunkt</th>
                    <th>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {printHistory.map((entry, index) => (
                    <tr key={`${entry.type}-${index}`}>
                      <td>{entry.title}</td>
                      <td>{fmtDate(entry.at)}</td>
                      <td>{entry.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}