"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import UserLink from "@/components/UserLink";

type CommentAuthor = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author?: CommentAuthor;
};

type Props = {
  challengeId: string;
  placeholderText?: string;
  sendText?: string;
  noCommentsEyebrow?: string;
  noCommentsTitle?: string;
  noCommentsText?: string;
  noReactionsYet?: string;
  communityArea?: string;
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();

  if (!Number.isFinite(diffMs)) return "";

  const minutes = Math.max(0, Math.floor(diffMs / 1000 / 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  if (days < 7) return `vor ${days} Tg.`;

  return date.toLocaleDateString("de-DE");
}

export default function Comments({
  challengeId,
  placeholderText = "Kommentar hinzufügen…",
  sendText = "Senden",
  noCommentsEyebrow = "NOCH KEINE KOMMENTARE",
  noCommentsTitle = "Hier startet später die Diskussion",
  noCommentsText =
    "Sobald jemand reagiert, Fragen stellt oder die ersten Einschätzungen zur Challenge teilt, erscheinen die Kommentare genau hier.",
  noReactionsYet = "Noch keine Reaktionen",
  communityArea = "Community-Bereich",
}: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiFetch(
        `/challenges/${challengeId}/comments?page=1&limit=20`,
        { method: "GET" }
      );

      if (!res.ok) {
        setComments([]);
        return;
      }

      const json = await res.json();

      const arr: Comment[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];

      setComments(arr);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    if (!text.trim()) return;

    try {
      setSending(true);
      setError("");

      const res = await apiFetch(
        `/challenges/${challengeId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        },
        true
      );

      if (!res.ok) {
        const txt = await res.text();
        setError(txt || "Kommentar konnte nicht gesendet werden");
        return;
      }

      setText("");
      await load();
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NO_TOKEN") {
        setError("Bitte einloggen, um zu kommentieren.");
      } else {
        setError("Kommentar konnte nicht gesendet werden");
      }
    } finally {
      setSending(false);
    }
  }

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });
  }, [comments]);

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholderText}
            disabled={sending}
            className="min-w-0 h-12 w-full flex-1 resize-none whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-[14px] border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/25 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
          />

          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className={[
              "inline-flex h-12 w-12 items-center justify-center rounded-[14px] border text-lg font-bold transition",
              sending || !text.trim()
                ? "cursor-not-allowed border-white/8 bg-white/[0.04] text-slate-600"
                : "border-blue-500/20 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] hover:bg-blue-500",
            ].join(" ")}
            title={sendText}
          >
            ↗
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-[14px] border border-red-500/20 bg-red-500/[0.08] px-3 py-2 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
          Lade Kommentare…
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {noCommentsEyebrow}
          </div>

          <div className="mt-3 text-[18px] font-extrabold leading-tight text-white">
            {noCommentsTitle}
          </div>

          <div className="mt-3 text-[15px] leading-7 text-slate-400">
            {noCommentsText}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-400">
              {noReactionsYet}
            </div>
            <div className="rounded-full border border-blue-500/20 bg-blue-500/[0.08] px-3 py-1 text-xs font-semibold text-blue-300">
              {communityArea}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedComments.map((c) => (
            <div
              key={c.id}
              className="min-w-0 overflow-hidden rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {c.author?.username ? (
                    <UserLink
                      username={c.author.username}
                      avatarUrl={c.author.avatarUrl}
                      avatarSize={34}
                    />
                  ) : (
                    <div className="truncate text-sm font-semibold text-white">@user</div>
                  )}
                </div>

                <div className="shrink-0 text-[11px] font-medium text-slate-500">
                  {formatRelativeTime(c.createdAt)}
                </div>
              </div>

              <p className="mt-2 min-w-0 pl-[2px] text-sm leading-6 text-white whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}