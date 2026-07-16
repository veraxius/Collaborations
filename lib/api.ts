const TOKEN_KEY = "fg_token";

export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(
  path: string,
  options: RequestInit & { formData?: FormData } = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;
  if (options.formData) {
    body = options.formData;
  } else if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    if (typeof body !== "string") body = JSON.stringify(body);
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
    body,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`) as Error & {
      status?: number;
      data?: any;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}
