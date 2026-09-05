import type { ReactNode } from "react";

/** The GENESIS wordmark, styled with the same script font used in the nav logo. */
export function Genesis() {
  return <span className="font-script">GENESIS</span>;
}

/**
 * Splits a plain string on the word "GENESIS" and re-inserts the styled wordmark,
 * so existing string-driven copy (FAQ answers, card descriptions, etc.) can reuse
 * the same brand treatment without being rewritten as JSX by hand.
 */
export function withGenesisStyle(text: string): ReactNode {
  if (!text.includes("GENESIS")) return text;
  const segments = text.split("GENESIS");
  const nodes: ReactNode[] = [];
  segments.forEach((segment, i) => {
    if (i > 0) nodes.push(<Genesis key={i} />);
    if (segment) nodes.push(segment);
  });
  return nodes;
}
