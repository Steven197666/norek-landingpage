"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiJson } from "@/lib/api";

type PaymentLog = {
  id: string;
  provider: string;
  eventId?: string | null;
  eventType?: string | null;
  processingStatus?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  payload?: any;
};

type PaymentDetailResponse = {
  payment: {
    id: string;
    status: string;
    amount: string;
    currency: string;
    challengeId: string;
    payerUserId: string;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    stripeChargeId?: string | null;
    stripeEventId?: string | null;
    receiptUrl?: string | null;
    paymentMethodType?: string | null;
    paidAt?: string | null;
    refundedAt?: string | null;
    failureReason?: string | null;
    legalVersion?: string | null;
    legalAcceptedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  logs: PaymentLog[];
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

function short(v?: string | null, len = 30) {
  if (!v) return "—";
  if (v.length <= len) return v;
  return `${v.slice(0, len)}…`;
}

function formatProvider(value?: string | null) {
  if (!value) return "—";
  const v = String(value).trim();
  if (!v) return "—";
  if (v.toLowerCase() === "stripe") return "Stripe";
  return v;
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

function formatLogStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "processed") return "Verarbeitet";
  if (s === "pending") return "Ausstehend";
  if (s === "received") return "Eingegangen";
  if (s === "failed") return "Fehlgeschlagen";

  return status || "—";
}

function currencyCode(value?: string | null) {
  return String(value || "EUR").toUpperCase();
}

function statusBadge(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "paid" || s === "processed") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (s === "pending" || s === "received") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (s === "refunded") {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (s === "failed") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AdminPaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
      ? rawId[0] || ""
      : "";

  const [data, setData] = useState<PaymentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        if (!cancelled) {
          setError("Keine Zahlungs-ID gefunden.");
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const result = await apiJson<PaymentDetailResponse>(
          `/payments/admin/${id}/webhook-logs`,
          { method: "GET" },
          true
        );

        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            String(
              err?.message || "Zahlungsdetails konnten nicht geladen werden."
            )
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

  const logCount = useMemo(() => data?.logs?.length ?? 0, [data]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          Lade Zahlungsdetails...
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

  const payment = data.payment;
  const printLogs = data.logs.slice(0, 3);

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
              <Link href="/admin/payments" className="hover:underline">
                Einzahlungen
              </Link>
              <span className="mx-2">/</span>
              <span>Details</span>
            </div>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
              Zahlungsdetails
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Detailansicht einer einzelnen Einzahlung. Die zentrale Hauptseite bleibt die Challenge-Akte.
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

            <Link
              href={`/admin/cases/${payment.challengeId}`}
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Challenge-Akte
            </Link>

            <button
              onClick={() => window.print()}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Drucken / PDF
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                Einzahlung
              </div>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-950">
                {formatAmount(payment.amount, payment.currency)}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                    payment.status
                  )}`}
                >
                  Status: {formatPaymentStatus(payment.status)}
                </span>

                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  Webhook-Logs: {logCount}
                </span>
              </div>
            </div>

            <div className="text-sm text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-900">
                  Zahlungs-ID:
                </span>{" "}
                <span className="break-all">{payment.id}</span>
              </div>
              <div className="mt-1">
                <span className="font-semibold text-neutral-900">
                  Challenge-ID:
                </span>{" "}
                <span className="break-all">{payment.challengeId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <InfoCard title="Zahlung">
            <div className="grid gap-3 text-sm text-neutral-700">
              <div>
                <span className="font-semibold text-neutral-900">Status:</span>{" "}
                {formatPaymentStatus(payment.status)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Betrag:</span>{" "}
                {formatAmount(payment.amount, payment.currency)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Währung:</span>{" "}
                {currencyCode(payment.currency)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Nutzer-ID:</span>{" "}
                <span className="break-all">{payment.payerUserId}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Erstellt:</span>{" "}
                {fmtDate(payment.createdAt)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Bezahlt:</span>{" "}
                {fmtDate(payment.paidAt)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Erstattet:
                </span>{" "}
                {fmtDate(payment.refundedAt)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Rechtsversion:
                </span>{" "}
                {payment.legalVersion || "—"}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Rechtsstand akzeptiert:
                </span>{" "}
                {fmtDate(payment.legalAcceptedAt)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Fehlergrund:
                </span>{" "}
                {payment.failureReason || "—"}
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Stripe-Referenzen">
            <div className="grid gap-3 text-sm text-neutral-700">
              <div>
                <span className="font-semibold text-neutral-900">
                  Checkout-ID:
                </span>{" "}
                <span className="break-all">
                  {payment.stripeCheckoutSessionId || "—"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  PaymentIntent-ID:
                </span>{" "}
                <span className="break-all">
                  {payment.stripePaymentIntentId || "—"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Charge-ID:
                </span>{" "}
                <span className="break-all">{payment.stripeChargeId || "—"}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Ereignis-ID:
                </span>{" "}
                <span className="break-all">{payment.stripeEventId || "—"}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Zahlungsmethode:
                </span>{" "}
                {payment.paymentMethodType || "—"}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Anbieter:</span>{" "}
                {formatProvider("stripe")}
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Beleg / Nachweis">
            <div className="grid gap-3 text-sm text-neutral-700">
              <div>
                <span className="font-semibold text-neutral-900">Beleg:</span>{" "}
                {payment.receiptUrl ? (
                  <a
                    href={payment.receiptUrl}
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

              <div>
                <span className="font-semibold text-neutral-900">
                  Kurzansicht Checkout-ID:
                </span>{" "}
                {short(payment.stripeCheckoutSessionId, 24)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Kurzansicht PaymentIntent-ID:
                </span>{" "}
                {short(payment.stripePaymentIntentId, 24)}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">
                  Kurzansicht Charge-ID:
                </span>{" "}
                {short(payment.stripeChargeId, 24)}
              </div>
            </div>
          </InfoCard>
        </div>

        <InfoCard title="Webhook-Logs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Ereignistyp</th>
                  <th className="px-3 py-2 font-semibold">Ereignis-ID</th>
                  <th className="px-3 py-2 font-semibold">Erstellt</th>
                  <th className="px-3 py-2 font-semibold">Verarbeitet</th>
                  <th className="px-3 py-2 font-semibold">Fehler</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-neutral-500">
                      Keine Webhook-Logs vorhanden.
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-neutral-200 align-top"
                    >
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                            log.processingStatus
                          )}`}
                        >
                          {formatLogStatus(log.processingStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{log.eventType || "—"}</td>
                      <td className="px-3 py-3 font-mono text-xs break-all">
                        {log.eventId || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-neutral-700">
                        {fmtDate(log.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-xs text-neutral-700">
                        {fmtDate(log.processedAt)}
                      </td>
                      <td className="px-3 py-3 text-xs text-red-700">
                        {log.errorMessage || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </InfoCard>
      </div>

      <div className="print-only hidden">
        <div className="print-page">
          <section className="print-card">
            <h1 className="print-title">Zahlungsdetails</h1>
            <p className="print-subtitle">Norek · Detailansicht einer Einzahlung</p>

            <div className="print-badges">
              <span className="print-badge">
                Status: {formatPaymentStatus(payment.status)}
              </span>
              <span className="print-badge">
                Betrag: {formatAmount(payment.amount, payment.currency)}
              </span>
              <span className="print-badge">Anbieter: {formatProvider("stripe")}</span>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Zahlungsübersicht</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Zahlungs-ID</div>
                <div className="print-value">{payment.id}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Challenge-ID</div>
                <div className="print-value">{payment.challengeId}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Nutzer-ID</div>
                <div className="print-value">{payment.payerUserId}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Zahlungsmethode</div>
                <div className="print-value">
                  {payment.paymentMethodType || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Erstellt</div>
                <div className="print-value">{fmtDate(payment.createdAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Bezahlt</div>
                <div className="print-value">{fmtDate(payment.paidAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Erstattet</div>
                <div className="print-value">{fmtDate(payment.refundedAt)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Währung</div>
                <div className="print-value">{currencyCode(payment.currency)}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Rechtsstand akzeptiert</div>
                <div className="print-value">
                  {fmtDate(payment.legalAcceptedAt)}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Rechtsversion</div>
                <div className="print-value">{payment.legalVersion || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Fehlergrund</div>
                <div className="print-value">
                  {payment.failureReason || "—"}
                </div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Stripe-Referenzen</div>
            <div className="print-grid-2">
              <div className="print-row">
                <div className="print-label">Checkout-ID</div>
                <div className="print-value">
                  {payment.stripeCheckoutSessionId || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">PaymentIntent-ID</div>
                <div className="print-value">
                  {payment.stripePaymentIntentId || "—"}
                </div>
              </div>
              <div className="print-row">
                <div className="print-label">Charge-ID</div>
                <div className="print-value">{payment.stripeChargeId || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Ereignis-ID</div>
                <div className="print-value">{payment.stripeEventId || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Beleg</div>
                <div className="print-value">{payment.receiptUrl || "—"}</div>
              </div>
              <div className="print-row">
                <div className="print-label">Kurz Charge</div>
                <div className="print-value">
                  {short(payment.stripeChargeId, 24)}
                </div>
              </div>
            </div>
          </section>

          <section className="print-card">
            <div className="print-section-title">Letzte Webhook-Logs</div>
            {printLogs.length === 0 ? (
              <div className="print-value">Keine Webhook-Logs vorhanden.</div>
            ) : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Ereignis</th>
                    <th>ID</th>
                    <th>Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {printLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatLogStatus(log.processingStatus)}</td>
                      <td>{log.eventType || "—"}</td>
                      <td>{short(log.eventId, 28)}</td>
                      <td>{fmtDate(log.createdAt)}</td>
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