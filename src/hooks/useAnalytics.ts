"use client";

export function trackEvent(
  event: string,
  meta?: Record<string, string | number>
): void {
  // Fire-and-forget — never block the UI, never throw
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, meta }),
  }).catch(() => {});
}
