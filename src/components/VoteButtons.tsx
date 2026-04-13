"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type VoteValue = -1 | 0 | 1;

type Props = {
  attemptId: string;
  status?: string;
  votingOver?: boolean;
  upVotes?: number;
  downVotes?: number;
  score?: number;
  myVote?: VoteValue;
  onVoted?: (next: {
    upVotes: number;
    downVotes: number;
    score: number;
    myVote: VoteValue;
  }) => void;
};

async function getErrorMessage(res: Response) {
  try {
    const clone = res.clone();
    const data = await clone.json();

    if (Array.isArray(data?.message)) {
      const joined = data.message.filter(Boolean).join(", ").trim();
      if (joined) return joined;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message.trim();
    }

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {}

  try {
    const txt = await res.text();
    if (txt?.trim()) return txt.trim();
  } catch {}

  return `Vote fehlgeschlagen (${res.status})`;
}

function getVotingStateMeta(status?: string, votingOver?: boolean) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (normalizedStatus !== "voting") {
    return {
      canVote: false,
      helperText: "Voting ist erst aktiv, sobald die Challenge im Voting-Status ist.",
      badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
      badgeLabel: "Nicht aktiv",
    };
  }

  if (votingOver) {
    return {
      canVote: false,
      helperText: "Voting ist bereits abgelaufen.",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      badgeLabel: "Abgelaufen",
    };
  }

  return {
    canVote: true,
    helperText: "Stimme jetzt mit 👍 oder 👎 ab.",
    badgeClassName: "border-purple-200 bg-purple-50 text-purple-800",
    badgeLabel: "Aktiv",
  };
}

export default function VoteButtons({
  attemptId,
  status,
  votingOver = false,
  upVotes = 0,
  downVotes = 0,
  score = 0,
  myVote = 0,
  onVoted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const votingMeta = useMemo(
    () => getVotingStateMeta(status, votingOver),
    [status, votingOver]
  );

  const canVote = votingMeta.canVote;
  const upActive = myVote === 1;
  const downActive = myVote === -1;

  function nextVote(dir: 1 | -1): VoteValue {
    if (dir === 1) return myVote === 1 ? 0 : 1;
    return myVote === -1 ? 0 : -1;
  }

  async function doVote(dir: 1 | -1) {
    if (!canVote) return;

    try {
      setLoading(true);
      setError("");

      const value = nextVote(dir);

      const res = await apiFetch(
        `/attempts/${attemptId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        },
        true
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Bitte einloggen, um zu voten.");
        } else {
          setError(await getErrorMessage(res));
        }
        return;
      }

      const json = await res.json();
      const next = {
        upVotes: Number(json?.upVotes ?? upVotes),
        downVotes: Number(json?.downVotes ?? downVotes),
        score: Number(json?.score ?? score),
        myVote: Number(json?.myVote ?? value) as VoteValue,
      };

      onVoted?.(next);
    } catch {
      setError("Vote hat nicht geklappt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-slate-900 sm:text-lg">
            Voting
          </div>
          <div className="mt-1 text-sm text-slate-600">{votingMeta.helperText}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`rounded-full border px-3 py-1 text-xs font-extrabold ${votingMeta.badgeClassName}`}
          >
            {votingMeta.badgeLabel}
          </div>

          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
            Score: {score}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => doVote(1)}
          disabled={loading || !canVote}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
            loading || !canVote
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : upActive
                ? "border-green-600 bg-green-600 text-white ring-2 ring-green-200"
                : "border-slate-300 bg-white text-slate-900 hover:bg-green-50"
          }`}
          title={
            !canVote
              ? "Voting aktuell nicht möglich"
              : upActive
                ? "Upvote entfernen"
                : "Upvote geben"
          }
          type="button"
        >
          👍 Upvote{" "}
          <span className={upActive ? "text-white/80" : "text-slate-500"}>
            ({upVotes})
          </span>
        </button>

        <button
          onClick={() => doVote(-1)}
          disabled={loading || !canVote}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
            loading || !canVote
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : downActive
                ? "border-red-600 bg-red-600 text-white ring-2 ring-red-200"
                : "border-slate-300 bg-white text-slate-900 hover:bg-red-50"
          }`}
          title={
            !canVote
              ? "Voting aktuell nicht möglich"
              : downActive
                ? "Downvote entfernen"
                : "Downvote geben"
          }
          type="button"
        >
          👎 Downvote{" "}
          <span className={downActive ? "text-white/80" : "text-slate-500"}>
            ({downVotes})
          </span>
        </button>

        {loading && <div className="text-sm font-medium text-slate-500">Sende Vote…</div>}
      </div>

      {error && <div className="mt-3 text-sm font-semibold text-red-600">{error}</div>}
    </div>
  );
}