"use client";

import React from "react";

type PrimaryButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: "dark" | "teal" | "secondary" | "danger";
  className?: string;
  title?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PrimaryButton({
  children,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  variant = "dark",
  className = "",
  title,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const baseClasses =
    "inline-flex items-center justify-center rounded-[16px] border px-4 text-sm font-semibold transition focus:outline-none focus:ring-4";

  const sizeClasses = "h-12";

  const variantClasses = (() => {
    if (variant === "teal") {
      return isDisabled
        ? "cursor-not-allowed border-white/8 bg-white/[0.04] text-slate-500 focus:ring-white/5"
        : "border-blue-500/20 bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.30)] hover:bg-blue-500 focus:ring-blue-500/10";
    }

    if (variant === "secondary") {
      return isDisabled
        ? "cursor-not-allowed border-white/8 bg-white/[0.04] text-slate-500 focus:ring-white/5"
        : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] focus:ring-white/5";
    }

    if (variant === "danger") {
      return isDisabled
        ? "cursor-not-allowed border-white/8 bg-white/[0.04] text-slate-500 focus:ring-white/5"
        : "border-red-500/20 bg-red-500/[0.08] text-red-200 hover:bg-red-500/[0.12] focus:ring-red-500/10";
    }

    return isDisabled
      ? "cursor-not-allowed border-white/8 bg-white/[0.04] text-slate-500 focus:ring-white/5"
      : "border-blue-500/20 bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.30)] hover:bg-blue-500 focus:ring-blue-500/10";
  })();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={cx(baseClasses, sizeClasses, variantClasses, className)}
    >
      {loading ? loadingText || "Lädt…" : children}
    </button>
  );
}