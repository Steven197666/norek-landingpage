"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  challengeId: string;
  status: string;
};

type AttemptItem = {
  id: string;
  challengeId: string;
  userId: string;

  status: string;
  isLive: boolean;

  playbackId: string | null;

  upVotes: number;
  downVotes: number;
  score: number;

  myVote?: number; // -1 | 0 | 1 (nur bei /attempts/me)
  submittedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function readHasToken() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export default function Voting({ challengeId, status }: Props) {
  const [items, setItems] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hasToken, setHasToken] = useState(false);

  // ✅ Token-Status live halten (Login/Logout merkt die Seite sofort)
  useEffect(() => {
    setHasToken(readHasToken());

    const onStorage = () => setHasToken(readHasToken());
    window.addEventListener("storage", onStorage);

    // Falls du im gleichen Tab login/logout machst (storage event feuert da nicht immer),
    // machen wir zusätzlich einen kleinen "focus" refresh:
    const onFocus = () => setHasToken(readHasToken());
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      // ✅ Wenn eingeloggt -> /attempts/me (mit myVote)
      if (hasToken) {
        const resMe = await apiFetch(
          `/challenges/${challengeId}/attempts/me`,
          { method: "GET" },
          true
        );

        if (resMe.ok) {
          const json = await resMe.json();
          setItems(Array.isArray(json) ? json : []);
          return;
        }

        // Falls Token abgelaufen o.ä. -> fallback public
      }

      // ✅ Fallback / Public
      const res = await apiFetch(`/challenges/${challengeId}/attempts`, {
        method: "GET",
      });

      if (!res.ok) {
        const txt = await res.text();
        setErr(txt || `Konnte Attempts nicht laden (${res.status})`);
        return;
      }

      const json = await res.json();
      setItems(Array.isArray(json) ? json : []);
    } catch {
      setErr("Konnte Attempts nicht laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, hasToken]); // ✅ sobald token wechselt, neu laden (myVote kommt dann rein/raus)

  function nextVote(current: number | undefined, dir: "up" | "down"): 1 | -1 | 0 {
    const cur = Number(current ?? 0) as -1 | 0 | 1;
    if (dir === "up") return cur === 1 ? 0 : 1;
    return cur === -1 ? 0 : -1;
  }

  async function voteAttempt(attemptId: string, dir: "up" | "down") {
    // ✅ UX: ohne Login gar nicht erst versuchen
    if (!hasToken) {
      setErr("Bitte einloggen, um zu voten.");
      return;
    }

    const current = items.find((x) => x.id === attemptId)?.myVote ?? 0;
    const value = nextVote(current, dir);

    // ✅ Optimistic UI
    setItems((prev) =>
      prev.map((a) => {
        if (a.id !== attemptId) return a;

        const prevVote = Number(a.myVote ?? 0) as -1 | 0 | 1;
        const next = value;

        // delta wie im Backend
        const deltaUp = (prevVote === 1 ? -1 : 0) + (next === 1 ? 1 : 0);
        const deltaDown = (prevVote === -1 ? -1 : 0) + (next === -1 ? 1 : 0);

        const upVotes = Math.max(0, Number(a.upVotes ?? 0) + deltaUp);
        const downVotes = Math.max(0, Number(a.downVotes ?? 0) + deltaDown);
        const score = upVotes - downVotes;

        return { ...a, myVote: next, upVotes, downVotes, score };
      })
    );

    try {
      setErr("");

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
        const txt = await res.text();
        setErr(txt || `Vote fehlgeschlagen (${res.status})`);
        // ✅ rollback über reload
        await load();
        return;
      }

      // ✅ Response: { ok, upVotes, downVotes, score, myVote }
      const json = await res.json();
      setItems((prev) =>
        prev.map((a) =>
          a.id === attemptId
            ? {
                ...a,
                upVotes: Number(json?.upVotes ?? a.upVotes ?? 0),
                downVotes: Number(json?.downVotes ?? a.downVotes ?? 0),
                score: Number(json?.score ?? a.score ?? 0),
                myVote: Number(json?.myVote ?? a.myVote ?? 0),
              }
            : a
        )
      );
    } catch {
      setErr("Vote fehlgeschlagen.");
      await load();
    }
  }

  const votingActive = String(status).toLowerCase() === "voting";

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold">Voting</div>

          {!votingActive && (
            <div className="text-sm text-gray-500">
              Voting ist erst im Status „VOTING“ aktiv.
            </div>
          )}

          {!hasToken && (
            <div className="mt-1 text-sm text-gray-500">
              Du bist nicht eingeloggt – du siehst nur die öffentlichen Votes (ohne „myVote“).
            </div>
          )}
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl border px-3 py-1 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          title="Neu laden"
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          Noch keine eingereichten Attempts zum Voten.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const myVote = Number(a.myVote ?? 0) as -1 | 0 | 1;

            const disabled = !votingActive || loading || !hasToken;

            return (
              <div key={a.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-700">
                      Attempt: <span className="font-mono">{a.id}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: <span className="font-bold">{a.score}</span> · 👍 {a.upVotes} · 👎{" "}
                      {a.downVotes}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={disabled}
                      onClick={() => voteAttempt(a.id, "up")}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                        disabled
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : myVote === 1
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      title={
                        !hasToken
                          ? "Bitte einloggen"
                          : myVote === 1
                          ? "Upvote entfernen"
                          : "Upvote"
                      }
                    >
                      👍
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => voteAttempt(a.id, "down")}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                        disabled
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : myVote === -1
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      title={
                        !hasToken
                          ? "Bitte einloggen"
                          : myVote === -1
                          ? "Downvote entfernen"
                          : "Downvote"
                      }
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {err && <div className="mt-3 text-sm font-semibold text-red-600">{err}</div>}
    </div>
  );
}