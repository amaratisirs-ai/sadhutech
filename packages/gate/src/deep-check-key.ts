import { createHash } from "node:crypto";
import type { AnalyzeRequest } from "@genesis/shared";

function canonicalize(value: unknown): unknown {
  if (typeof value === "string") {
    return /^0x[0-9a-f]+$/i.test(value) ? value.toLowerCase() : value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

export function deepCheckRequestKey(request: AnalyzeRequest): string {
  const analysisRequest = { tx: request.tx, autonomy: request.autonomy };
  return createHash("sha256").update(JSON.stringify(canonicalize(analysisRequest))).digest("hex");
}