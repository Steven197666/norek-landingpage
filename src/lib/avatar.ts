export function resolveAvatarUrl(avatarUrl?: string | null) {
  const raw = String(avatarUrl ?? "").trim();
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

  if (!base) return raw.startsWith("/") ? raw : `/${raw}`;

  return raw.startsWith("/") ? `${base}${raw}` : `${base}/${raw}`;
}