export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "taskmanager.token";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Skip the global 401 -> /login redirect (used by auth endpoints themselves). */
  skipAuthRedirect?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken();
  // FormData passes through untouched — the browser sets the multipart boundary
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.", "NETWORK_ERROR");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: { error?: { message?: string; code?: string; details?: { path: string; message: string }[] } } | null =
    null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response body
  }

  if (!res.ok) {
    // Session expired or token invalid: drop it and send the user to login
    if (res.status === 401 && !options.skipAuthRedirect && typeof window !== "undefined") {
      clearStoredToken();
      if (!["/login", "/signup"].includes(window.location.pathname)) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      res.status,
      payload?.error?.message ?? `Request failed with status ${res.status}`,
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return payload as T;
}
