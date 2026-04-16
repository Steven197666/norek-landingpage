export function normalizeProfileHandle(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/^@+/, "").trim();
  if (!cleaned) return null;

  return cleaned;
}

export function toPublicProfilePath(value: unknown): string | null {
  const handle = normalizeProfileHandle(value);
  if (!handle) return null;

  return `/users/${encodeURIComponent(handle)}`;
}
