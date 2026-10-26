const DEFAULT_API_URL = "http://localhost:3001/api/v1";

/** Base URL of the peladeiro-api instance. Server-side only. */
export function getApiBaseUrl(): string {
  return process.env.PELADEIRO_API_URL ?? DEFAULT_API_URL;
}

/** Session cookies must be Secure outside development. */
export function isSecureCookiesEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}
