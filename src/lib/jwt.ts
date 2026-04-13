export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload));
    return json.sub ?? json.id ?? null; // je nachdem wie du dein JWT baust
  } catch {
    return null;
  }
}