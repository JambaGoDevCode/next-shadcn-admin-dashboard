import { getApiBaseUrl } from "./env";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "unknown_error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object" && "message" in record.error) {
    const nested = (record.error as { message?: unknown }).message;
    if (typeof nested === "string") return nested;
  }
  return null;
}

function extractCode(payload: unknown): string {
  if (payload && typeof payload === "object" && "code" in payload && typeof payload.code === "string") {
    return payload.code;
  }
  // Envelope de erro da API: `{ success, error: { message, code } }` guarda o código dentro de `error`.
  if (payload && typeof payload === "object" && "error" in payload) {
    const nested: unknown = (payload as { error: unknown }).error;
    if (nested && typeof nested === "object" && "code" in nested) {
      const nestedCode: unknown = (nested as { code: unknown }).code;
      if (typeof nestedCode === "string") return nestedCode;
    }
  }
  return "unknown_error";
}

/** Minimal fetch wrapper for the peladeiro-api. Throws `ApiError` on non-2xx responses. */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, cache = "no-store" } = options;

  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    cache,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = extractMessage(payload) ?? `Request to ${path} failed with status ${response.status}.`;
    throw new ApiError(message, response.status, extractCode(payload));
  }

  return payload as T;
}

/** The API returns flat objects for single resources and sometimes wraps lists in `{ data }`. */
export function extractData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
