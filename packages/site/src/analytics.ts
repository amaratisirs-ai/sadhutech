/**
 * Fire-and-forget usage telemetry sent to the gate's /v1/analytics/event -
 * feeds the /admin dashboard (logins, page views, errors, "stuck" flows).
 * Best-effort only: never blocks or throws into a user-facing flow.
 */
const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

export type TrackedEventType = "page_view" | "login" | "error" | "stuck";

export function trackEvent(type: TrackedEventType, data: { wallet?: string; page?: string; chainId?: number; meta?: unknown } = {}): void {
  try {
    const body = JSON.stringify({ type, ...data });
    const url = `${GATE_URL}/v1/analytics/event`;
    // Not sendBeacon: it forces credentials:"include" cross-origin, which the gate's CORS
    // policy (no Access-Control-Allow-Credentials) rejects at the preflight - the request
    // never reaches the server. Plain fetch defaults to credentials:"same-origin"/"omit".
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    // telemetry must never break the app
  }
}
