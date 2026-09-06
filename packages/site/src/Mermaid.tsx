"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Renders a Mermaid diagram client-side. Isolated per-instance id so multiple diagrams on one page don't collide. */
export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "strict" });
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to render diagram");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return <pre className="text-xs text-rose-300 bg-rose-900/20 border border-rose-800 rounded-lg p-4 overflow-x-auto">{error}</pre>;
  }

  return <div ref={ref} className="mermaid-diagram overflow-x-auto [&_svg]:mx-auto" />;
}
