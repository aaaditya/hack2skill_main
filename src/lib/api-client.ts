/**
 * Typed client-side helpers for JSON POST requests to internal API routes.
 * Eliminates duplicated fetch/error-cast boilerplate across AI panels.
 */

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * POST JSON to an internal API route and parse the typed response.
 * Throws with the server's error message on non-2xx responses.
 */
export async function postJson<TResponse>(
  url: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new Error(errData.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<TResponse>;
}
