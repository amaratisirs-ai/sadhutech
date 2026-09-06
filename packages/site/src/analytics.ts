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
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // telemetry must never break the app
  }
}
