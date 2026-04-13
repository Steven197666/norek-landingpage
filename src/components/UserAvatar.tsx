"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveAvatarUrl } from "@/lib/avatar";

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  href?: string | null;
};

function getInitials(username?: string | null) {
  const clean = String(username ?? "")
    .replace(/^@/, "")
    .trim();

  if (!clean) return "?";

  return clean.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  username,
  avatarUrl,
  size = 40,
  className = "",
  href,
}: Props) {
  const cleanUsername = String(username ?? "").replace(/^@/, "").trim();
  const initials = getInitials(cleanUsername);
  const src = resolveAvatarUrl(avatarUrl);

  const content = (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 ${className}`}
      style={{ width: size, height: size }}
      title={cleanUsername ? `@${cleanUsername}` : "User"}
    >
      {src ? (
        <Image
          src={src}
          alt={cleanUsername ? `Profilbild von @${cleanUsername}` : "Profilbild"}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-700">
          {initials}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}