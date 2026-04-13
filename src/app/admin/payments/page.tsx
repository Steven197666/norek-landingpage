"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/api";

type AdminPayment = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  challengeId: string;
  payerUserId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  receiptUrl?: string | null;
  paymentMethodType?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  stripeEventId?: string | null;
  failureReason?: string | null;
  challenge?: {
    id: string;
    title?: string | null;
    status?: string | null;
  } | null;
  payerUser?: {
    id: string;
    username?: string | null;
    email?: string | null;
  } | null;
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

function formatPaymentStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "paid") return "Bezahlt";
  if (s === "pending") return "Ausstehend";
  if (s === "refunded") return "Erstattet";
  if (s === "failed") return "Fehlgeschlagen";
  if (s === "processed") return "Verarbeitet";
  if (s === "received") return "Eingegangen";

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

function needsAttention(item: AdminPayment) {
  if (item.status === "failed") return true;
  if (item.status === "pending") return true;

  if (item.status === "paid") {
    if (!item.stripeChargeId) return true;
    if (!item.receiptUrl) return true;
    if (!item.paymentMethodType) return true;
  }

  return false;
}

function getAttentionLabel(item: AdminPayment) {
  if (item.status === "failed") return "Fehler";
  if (item.status === "pending") return "Offen";
  if (item.status === "paid" && !item.stripeChargeId) return "Charge fehlt";
  if (item.status === "paid" && !item.receiptUrl) return "Beleg fehlt";
  if (item.status === "paid" && !item.paymentMethodType) return "Methode fehlt";
  return null;
}

function KpiCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-green-200 bg-green-50"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "red"
      ? "border-red-200 bg-red-50"
      : "border-neutral-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-950">
        {value}
      </div>
    </div>
  );
}

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const raw = row[key] ?? "";
          const value = String(raw).replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(";")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  async function load(currentStatus = status, currentQ = q) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (currentStatus) params.set("status", currentStatus);
      if (currentQ.trim()) params.set("q", currentQ.trim());

      const query = params.toString()
        ? `/payments/admin/list?${params.toString()}`
        : "/payments/admin/list";

      const data = await apiJson<AdminPayment[]>(query, { method: "GET" }, true);
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = String(err?.message || "");

      if (msg.includes("NO_TOKEN") || msg.includes("UNAUTHORIZED")) {
        setError("Du bist nicht eingeloggt oder deine Sitzung ist abgelaufen.");
      } else {
        setError(msg || "Unbekannter Fehler");
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function exportVisibleRows() {
    const rows = items.map((item) => ({
      einzahlung_id: item.id,
      status: item.status,
      challenge_id: item.challengeId,
      challenge_titel: item.challenge?.title ?? "",
      challenge_status: item.challenge?.status ?? "",
      user_id: item.payerUserId,
      username: item.payerUser?.username ?? "",
      email: item.payerUser?.email ?? "",
      betrag: item.amount,
      waehrung: item.currency,
      payment_intent_id: item.stripePaymentIntentId ?? "",
      charge_id: item.stripeChargeId ?? "",
      receipt_url: item.receiptUrl ?? "",
      zahlungsmethode: item.paymentMethodType ?? "",
      paid_at: item.paidAt ?? "",
      refunded_at: item.refundedAt ?? "",
      failure_reason: item.failureReason ?? "",
      created_at: item.createdAt ?? "",
      updated_at: item.updatedAt ?? "",
    }));

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`einzahlungen-export-${stamp}.csv`, rows);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const paid = items.filter((x) => x.status === "paid");
    const pending = items.filter((x) => x.status === "pending").length;
    const failed = items.filter((x) => x.status === "failed").length;
    const attention = items.filter((x) => needsAttention(x)).length;
    const paidVolume = paid.reduce((sum, x) => sum + Number(x.amount || 0), 0);

    return {
      total: items.length,
      paid: paid.length,
      pending,
      failed,
      attention,
      paidVolume,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-medium text-neutral-500">
                <span>Admin</span>
                <span className="mx-2">/</span>
                <span>Einzahlungen</span>
              </div>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
                Einzahlungen
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Operative Übersicht über Zahlungen, Einzahler und Challenges.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/payments"
                className="inline-flex h-11 items-center rounded-xl border border-neutral-900 bg-neutral-900 px-4 text-sm font-semibold text-white"
              >
                Einzahlungen
              </Link>

              <Link
                href="/admin/payouts"
                className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                Auszahlungen
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-end">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen nach Challenge, Nutzer, E-Mail oder ID..."
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-500"
            >
              <option value="">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="paid">Bezahlt</option>
              <option value="refunded">Erstattet</option>
              <option value="failed">Fehlgeschlagen</option>
            </select>
            <button
              onClick={exportVisibleRows}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              CSV Export
            </button>
            <button
              onClick={() => load()}
              className="h-11 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Gesamt" value={stats.total} />
          <KpiCard label="Bezahlt" value={stats.paid} tone="green" />
          <KpiCard label="Offen" value={stats.pending} tone="amber" />
          <KpiCard label="Fehler" value={stats.failed} tone="red" />
          <KpiCard
            label="Volumen bezahlt"
            value={formatAmount(stats.paidVolume, "EUR")}
            tone="green"
          />
        </div>

        {stats.attention > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Achtung: <span className="font-semibold">{stats.attention}</span> Einzahlung(en)
            brauchen Aufmerksamkeit.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Betrag</th>
                  <th className="px-4 py-3 font-semibold">Challenge</th>
                  <th className="px-4 py-3 font-semibold">Einzahler</th>
                  <th className="px-4 py-3 font-semibold">Methode / Beleg</th>
                  <th className="px-4 py-3 font-semibold">Bezahlt am</th>
                  <th className="px-4 py-3 font-semibold">Aktionen</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={7}>
                      Lade Einzahlungen...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={7}>
                      Keine Einzahlungen gefunden.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const attention = getAttentionLabel(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-neutral-200 align-top transition hover:bg-neutral-50/80"
                      >
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                                item.status
                              )}`}
                            >
                              {formatPaymentStatus(item.status)}
                            </span>

                            {attention ? (
                              <span className="text-xs font-medium text-amber-700">
                                {attention}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-neutral-950">
                            {formatAmount(item.amount, item.currency)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[260px]">
                            <div className="font-semibold text-neutral-950">
                              {item.challenge?.title || "—"}
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">
                              {formatChallengeStatus(item.challenge?.status)}
                            </div>
                            <div className="mt-1 break-all text-xs text-neutral-400">
                              {item.challengeId}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[240px]">
                            <div className="font-semibold text-neutral-950">
                              {item.payerUser?.username || "—"}
                            </div>
                            <div className="mt-1 break-all text-xs text-neutral-500">
                              {item.payerUser?.email || item.payerUserId}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-neutral-900">
                              {item.paymentMethodType || "—"}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {item.receiptUrl ? "Beleg vorhanden" : "Kein Beleg"}
                            </div>
                            {item.failureReason ? (
                              <div className="max-w-[220px] text-xs text-red-700">
                                {item.failureReason}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs text-neutral-600">
                          {fmtDate(item.paidAt)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/admin/payments/${item.id}`}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                              Details
                            </Link>

                            <Link
                              href={`/admin/cases/${item.challengeId}`}
                              className="text-sm font-medium text-neutral-700 hover:underline"
                            >
                              Challenge-Akte
                            </Link>

                            {item.receiptUrl ? (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-neutral-700 hover:underline"
                              >
                                Beleg öffnen
                              </a>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}