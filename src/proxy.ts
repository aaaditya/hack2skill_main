import { NextRequest, NextResponse } from "next/server";

/**
 * Rate-limiting proxy for AI API routes.
 *
 * Uses sliding-window per-IP limiting (20 req/min).
 * In-memory Map is per-serverless-instance — provides best-effort abuse
 * prevention. For global rate limiting, swap with @upstash/ratelimit.
 *
 * Named "proxy" per Next.js 16 file convention (proxy.ts / export proxy()).
 * Uses next/server types until next/proxy module ships in stable.
 */

export const config = {
  matcher: "/api/:path*",
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

interface RateEntry {
  count: number;
  resetAt: number;
}

const requestStore = new Map<string, RateEntry>();

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export function proxy(request: NextRequest): NextResponse {
  const key = getClientKey(request);
  const now = Date.now();
  const entry = requestStore.get(key);

  if (!entry || now > entry.resetAt) {
    requestStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(MAX_REQUESTS_PER_WINDOW - entry.count)
  );
  return response;
}
