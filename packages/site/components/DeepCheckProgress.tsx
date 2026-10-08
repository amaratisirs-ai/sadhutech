import { Icon } from "./Icon";

export type DeepCheckPhase = "credits" | "wallet" | "checking";

export const deepCheckProgress = {
  credits: { label: "Checking credits...", message: "Checking your credit balance before starting." },
  wallet: { label: "Confirm in wallet", message: "Open your wallet and confirm the signature request to authorize your deep check. If you connected on your phone, open the wallet app there. This is a message signature, not an on-chain transaction." },
  checking: { label: "Checking address...", message: "Authorization ready. Checking this address against additional threat sources." },
} satisfies Record<DeepCheckPhase, { label: string; message: string }>;

export function DeepCheckProgress({ phase }: { phase: DeepCheckPhase }) {
  return (
    <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-lg border border-teal-500/30 bg-teal-950/20 p-4">
      <Icon name={phase === "wallet" ? "wallet" : "refresh"} className={`mt-0.5 h-5 w-5 shrink-0 text-teal-300 ${phase === "wallet" ? "" : "motion-safe:animate-spin"}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-teal-200">{deepCheckProgress[phase].label}</p>
        <p className="mt-1 text-sm text-slate-300">{deepCheckProgress[phase].message}</p>
      </div>
    </div>
  );
}