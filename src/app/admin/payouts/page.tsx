"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/api";

type AdminPayout = {
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
  challenge?: {
    id: string;
    title?: string | null;
    status?: string | null;
  } | null;
  winnerUser?: {
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

function formatPayoutStatus(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "ready") return "Bereit";
  if (s === "paid") return "Ausgezahlt";
  if (s === "pending") return "Ausstehend";
  if (s === "failed") return "Fehlgeschlagen";
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

function formatProvider(value?: string | null) {
  if (!value) return "—";
  const v = String(value).trim();
  if (!v) return "—";
  if (v.toLowerCase() === "stripe") return "Stripe";
  return v;
}

function payoutStatusBadge(status: string) {
  const s = String(status || "").toLowerCase();

  if (s === "ready") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "paid") return "bg-green-100 text-green-700 border-green-200";
  if (s === "failed") return "bg-red-100 text-red-700 border-red-200";
  if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "canceled") return "bg-neutral-200 text-neutral-700 border-neutral-300";
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
}

function KpiCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const toneClass =
    tone === "green"
      ? "border-green-200 bg-green-50"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "red"
      ? "border-red-200 bg-red-50"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50"
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

export default function AdminPayoutsPage() {
  const [items, setItems] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  async function load(currentStatus = status, currentQ = q) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (currentStatus) params.set("status", currentStatus);
      if (currentQ.trim()) params.set("q", currentQ.trim());

      const query = params.toString()
        ? `/payments/admin/payouts?${params.toString()}`
        : "/payments/admin/payouts";

      const data = await apiJson<AdminPayout[]>(query, { method: "GET" }, true);
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

  async function markAsPaid(id: string) {
    const ok = window.confirm("Diesen Auszahlungsvorgang wirklich als ausgezahlt markieren?");
    if (!ok) return;

    try {
      setProcessingId(id);
      setActionError("");
      setActionSuccess("");

      await apiJson(
        `/payments/admin/payouts/${id}/mark-paid`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        true
      );

      setActionSuccess("Auszahlung wurde als ausgezahlt markiert.");
      await load();
    } catch (err: any) {
      const msg = String(err?.message || "");
      setActionError(msg || "Auszahlung konnte nicht aktualisiert werden.");
    } finally {
      setProcessingId(null);
    }
  }

  async function backfillMissingPayouts() {
    const ok = window.confirm(
      "Fehlende Auszahlungen für bereits abgeschlossene Challenges jetzt nachziehen?"
    );
    if (!ok) return;

    try {
      setBackfilling(true);
      setActionError("");
      setActionSuccess("");

      const result = await apiJson<{
        checked: number;
        created: number;
        skipped: number;
        errors?: Array<{ challengeId: string; reason: string }>;
      }>(
        "/payments/admin/payouts/backfill-missing",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        true
      );

      setActionSuccess(
        `Backfill fertig. Geprüft: ${result.checked}, erstellt: ${result.created}, übersprungen: ${result.skipped}.`
      );

      await load();
    } catch (err: any) {
      const msg = String(err?.message || "");
      setActionError(msg || "Backfill konnte nicht gestartet werden.");
    } finally {
      setBackfilling(false);
    }
  }

  function exportVisibleRows() {
    const rows = items.map((item) => ({
      auszahlung_id: item.id,
      status: item.status,
      challenge_id: item.challengeId,
      challenge_titel: item.challenge?.title ?? "",
      challenge_status: item.challenge?.status ?? "",
      gewinner_user_id: item.winnerUserId,
      gewinner_username: item.winnerUser?.username ?? "",
      gewinner_email: item.winnerUser?.email ?? "",
      brutto_betrag: item.grossAmount,
      plattformgebuehr: item.platformFeeAmount,
      netto_betrag: item.netAmount,
      waehrung: item.currency,
      provider: item.provider,
      provider_transfer_id: item.providerTransferId ?? "",
      provider_payout_id: item.providerPayoutId ?? "",
      ausgezahlt_am: item.paidAt ?? "",
      erstellt_am: item.createdAt ?? "",
      aktualisiert_am: item.updatedAt ?? "",
      fehlergrund: item.failureReason ?? "",
    }));

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`auszahlungen-export-${stamp}.csv`, rows);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const ready = items.filter((x) => x.status === "ready").length;
    const paid = items.filter((x) => x.status === "paid").length;
    const failed = items.filter((x) => x.status === "failed").length;
    const totalNet = items.reduce((sum, x) => sum + Number(x.netAmount || 0), 0);
    const totalFee = items.reduce(
      (sum, x) => sum + Number(x.platformFeeAmount || 0),
      0
    );

    return {
      total: items.length,
      ready,
      paid,
      failed,
      totalNet,
      totalFee,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-medium text-neutral-500">
                Admin <span className="mx-2">/</span> Auszahlungen
              </div>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-950">
                Auszahlungen
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Arbeitsübersicht für vorbereitete und bereits ausgezahlte Gewinner-Auszahlungen.
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
                className="inline-flex h-11 items-center rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Auszahlungen
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen nach Challenge, Gewinner, E-Mail oder ID..."
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none transition focus:border-neutral-500"
            >
              <option value="">Alle Status</option>
              <option value="ready">Bereit</option>
              <option value="paid">Ausgezahlt</option>
              <option value="pending">Ausstehend</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="canceled">Abgebrochen</option>
            </select>

            <button
              onClick={exportVisibleRows}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              CSV Export
            </button>

            <button
              onClick={backfillMissingPayouts}
              disabled={backfilling}
              className="h-11 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {backfilling ? "Ziehe nach..." : "Fehlende Auszahlungen nachziehen"}
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
          <KpiCard label="Bereit" value={stats.ready} tone="blue" />
          <KpiCard label="Ausgezahlt" value={stats.paid} tone="green" />
          <KpiCard label="Fehlgeschlagen" value={stats.failed} tone="red" />
          <KpiCard
            label="Netto gesamt"
            value={formatAmount(stats.totalNet, "EUR")}
            tone="green"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <KpiCard
            label="Plattformgebühren gesamt"
            value={formatAmount(stats.totalFee, "EUR")}
            tone="amber"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {actionError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}

        {actionSuccess ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {actionSuccess}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Challenge</th>
                  <th className="px-4 py-3 font-semibold">Gewinner</th>
                  <th className="px-4 py-3 font-semibold">Brutto</th>
                  <th className="px-4 py-3 font-semibold">Gebühr</th>
                  <th className="px-4 py-3 font-semibold">Netto</th>
                  <th className="px-4 py-3 font-semibold">Anbieter</th>
                  <th className="px-4 py-3 font-semibold">Ausgezahlt</th>
                  <th className="px-4 py-3 font-semibold">Hinweis</th>
                  <th className="px-4 py-3 font-semibold">Aktionen</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={10}>
                      Lade Auszahlungen...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-neutral-500" colSpan={10}>
                      Keine Auszahlungen gefunden.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-neutral-200 align-top transition hover:bg-neutral-50/80"
                    >
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${payoutStatusBadge(
                            item.status
                          )}`}
                        >
                          {formatPayoutStatus(item.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-[240px]">
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
                        <div className="max-w-[220px]">
                          <div className="font-semibold text-neutral-950">
                            {item.winnerUser?.username || "—"}
                          </div>
                          <div className="mt-1 break-all text-xs text-neutral-500">
                            {item.winnerUser?.email || item.winnerUserId}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-semibold text-neutral-950">
                        {formatAmount(item.grossAmount, item.currency)}
                      </td>

                      <td className="px-4 py-4 text-neutral-700">
                        {formatAmount(item.platformFeeAmount, item.currency)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-neutral-950">
                        {formatAmount(item.netAmount, item.currency)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900">
                          {formatProvider(item.provider)}
                        </div>
                        <div className="mt-1 break-all text-xs text-neutral-500">
                          {item.providerTransferId || item.providerPayoutId || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs text-neutral-600">
                        {fmtDate(item.paidAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-[220px] text-sm text-neutral-700">
                          {item.failureReason || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/payouts/${item.id}`}
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

                          {item.status === "ready" ? (
                            <button
                              onClick={() => markAsPaid(item.id)}
                              disabled={processingId === item.id}
                              className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processingId === item.id
                                ? "Speichert..."
                                : "Als ausgezahlt markieren"}
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}