// src/lib/api.ts

function getBaseUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL fehlt (.env.local).");
  }

  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${normalized}/api`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function toHeaders(init?: HeadersInit): Headers {
  if (init instanceof Headers) return new Headers(init);
  return new Headers(init ?? {});
}

function hasHeader(headers: HeadersInit | Headers, key: string): boolean {
  const lower = key.toLowerCase();

  if (headers instanceof Headers) {
    for (const [k] of headers.entries()) {
      if (k.toLowerCase() === lower) return true;
    }
    return false;
  }

  if (Array.isArray(headers)) {
    return headers.some(([k]) => String(k).toLowerCase() === lower);
  }

  return Object.keys(headers ?? {}).some((k) => k.toLowerCase() === lower);
}

function isJsonBody(body: BodyInit | null | undefined): boolean {
  if (body == null) return false;
  if (typeof body === "string") return true;

  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false;

  return false;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  auth: boolean = false
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const finalPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${finalPath}`;

  const method = String(options.method ?? "GET").toUpperCase();
  const headers = toHeaders(options.headers);
  const body = options.body;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (
    method !== "GET" &&
    method !== "HEAD" &&
    !isFormData &&
    body != null &&
    isJsonBody(body) &&
    !hasHeader(headers, "Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (!token) throw new Error("NO_TOKEN");
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  options: RequestInit = {},
  auth: boolean = false
): Promise<T> {
  const res = await apiFetch(path, options, auth);

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => null);
      const msg =
        (err &&
          (Array.isArray(err.message)
            ? err.message.filter(Boolean).join(", ")
            : err.message || err.error)) ||
        `HTTP_${res.status}`;
      throw new Error(msg);
    } else {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP_${res.status}`);
    }
  }

  if (isJson) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "INVALID_JSON");
  }
}