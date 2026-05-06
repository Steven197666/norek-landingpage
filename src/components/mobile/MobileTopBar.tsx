"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import NotificationsBell from "@/components/NotificationsBell";

export type MobileTopBarMenuItem = {
  label: string;
  href?: string;
  onClick?: () => void | Promise<void>;
  closeOnClick?: boolean;
};

type MobileTopBarProps = {
  title: string;
  onRefresh?: () => void | Promise<void>;
  refreshLabel?: string;
  settingsHref?: string | null;
  settingsLabel?: string;
  menuItems?: MobileTopBarMenuItem[];
  className?: string;
};

export default function MobileTopBar({
  title,
  onRefresh,
  refreshLabel = "Aktualisieren",
  settingsHref = "/einstellungen",
  settingsLabel = "Einstellungen",
  menuItems = [],
  className = "",
}: MobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;

    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
      setMenuOpen(false);
    }
  };

  const handleActionItem = async (item: MobileTopBarMenuItem) => {
    if (!item.onClick) {
      if (item.closeOnClick !== false) {
        setMenuOpen(false);
      }
      return;
    }

    try {
      setBusyLabel(item.label);
      await item.onClick();
    } finally {
      setBusyLabel(null);
      if (item.closeOnClick !== false) {
        setMenuOpen(false);
      }
    }
  };

  const showRefresh = typeof onRefresh === "function";
  const showSettings = typeof settingsHref === "string" && settingsHref.trim().length > 0;

  return (
    <div className={`border-b border-white/7 px-3 pb-4 pt-4 ${className}`}>
      <div className="relative mb-3 flex items-center justify-end text-slate-300">
        <div className="pointer-events-none absolute inset-x-0 text-center text-[1.03rem] font-extrabold tracking-tight text-white md:text-lg">
          {title}
        </div>

        <div className="relative flex items-center gap-2">
          <NotificationsBell buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06]" />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-lg text-slate-200"
              aria-label="Menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              ⋯
            </button>

            {menuOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[170px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] p-1.5 shadow-[0_16px_34px_rgba(0,0,0,0.45)]"
                role="menu"
                aria-label="Quick menu"
              >
                {showRefresh ? (
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                    role="menuitem"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? `${refreshLabel}...` : refreshLabel}
                  </button>
                ) : null}

                {menuItems.map((item, index) => {
                  const key = `${item.label}-${index}`;

                  if (item.href) {
                    return (
                      <Link
                        key={key}
                        href={item.href}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        role="menuitem"
                        onClick={() => {
                          if (item.closeOnClick !== false) {
                            setMenuOpen(false);
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-60"
                      role="menuitem"
                      onClick={() => handleActionItem(item)}
                      disabled={busyLabel === item.label}
                    >
                      {busyLabel === item.label ? `${item.label}...` : item.label}
                    </button>
                  );
                })}

                {showSettings ? (
                  <Link
                    href={settingsHref!}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    {settingsLabel}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}