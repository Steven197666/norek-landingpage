"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    url?: string;
    challengeId?: string;
    commentId?: string;
    walletTransactionId?: string;
    payoutRequestId?: string;
    [key: string]: unknown;
  } | null;
};

type Props = {
  buttonClassName: string;
  panelClassName?: string;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsBell({
  buttonClassName,
  panelClassName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const unreadCountFromItems = useMemo(
    () => items.filter((item) => !item.isRead).length,
    [items]
  );

  useEffect(() => {
    if (open) return;

    let stopped = false;

    const loadUnreadCount = async () => {
      try {
        const res = await apiFetch(
          "/notifications/me/unread-count",
          { method: "GET" },
          true
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!stopped) {
          setUnreadCount(Number(data?.count ?? 0));
        }
      } catch {
        // silent on background polling
      }
    };

    void loadUnreadCount();
    const timer = window.setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch(
        "/notifications/me?limit=25",
        { method: "GET" },
        true
      );

      if (!res.ok) {
        setError("Benachrichtigungen konnten nicht geladen werden.");
        return;
      }

      const data = (await res.json()) as NotificationItem[];
      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      setUnreadCount(nextItems.filter((item) => !item.isRead).length);
    } catch {
      setError("Benachrichtigungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);

    if (next) {
      await loadItems();
    }
  };

  const markAsReadOnly = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    void apiFetch(`/notifications/${id}/read`, { method: "PATCH" }, true).catch(
      () => {
        // optimistic
      }
    );
  };

  const markAllAsRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await apiFetch("/notifications/me/read-all", { method: "PATCH" }, true);
    } catch {
      // optimistic
    }
  };

  const resolveNotificationUrl = (item: NotificationItem) => {
    const directUrl =
      typeof item.metadata?.url === "string" && item.metadata.url.trim().length > 0
        ? item.metadata.url.trim()
        : null;

    if (directUrl) {
      if (item.type === "comment_new" && item.metadata?.commentId) {
        return `${directUrl}#comments`;
      }
      return directUrl;
    }

    if (
      (item.type === "comment_new" ||
        item.type === "challenge_supported" ||
        item.type === "challenge_status") &&
      typeof item.metadata?.challengeId === "string" &&
      item.metadata.challengeId.trim().length > 0
    ) {
      const base = `/challenges/${item.metadata.challengeId}`;
      return item.type === "comment_new" ? `${base}#comments` : base;
    }

    if (item.type === "wallet_credit" || item.type === "payout_status") {
      return "/wallet";
    }

    return "/activity";
  };

  const openNotification = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsReadOnly(item.id);
    }

    const targetUrl = resolveNotificationUrl(item);
    setOpen(false);
    router.push(targetUrl);
  };

  const visibleUnreadCount = open ? unreadCountFromItems : unreadCount;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className={buttonClassName}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
          <path
            d="M7.5 9.2C7.5 6.7 9.52 4.68 12 4.68C14.48 4.68 16.5 6.7 16.5 9.2V11.35C16.5 12.08 16.76 12.78 17.24 13.33L18.1 14.32C18.77 15.1 18.21 16.3 17.18 16.3H6.82C5.79 16.3 5.23 15.1 5.9 14.32L6.76 13.33C7.24 12.78 7.5 12.08 7.5 11.35V9.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.15 18.2C10.53 18.84 11.22 19.27 12 19.27C12.78 19.27 13.47 18.84 13.85 18.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>

        {visibleUnreadCount > 0 ? (
          <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-rose-400" />
        ) : null}
      </button>

      {open ? (
        <div
          className={
            panelClassName ??
            "absolute right-0 top-[calc(100%+8px)] z-40 w-[320px] max-w-[85vw] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
          }
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div className="text-xs font-semibold text-slate-200">Benachrichtigungen</div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-sky-200 hover:text-sky-100"
            >
              Alle gelesen
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                Lädt...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-3 text-xs text-rose-100">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
                Keine Benachrichtigungen vorhanden.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item)}
                    className={`block w-full rounded-xl border p-3 text-left transition ${
                      item.isRead
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-sky-300/25 bg-sky-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-100">{item.title}</div>
                      <div className="shrink-0 text-[10px] text-slate-400">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-300">
                      {item.message}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}