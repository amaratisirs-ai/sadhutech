import type { QueryClient } from "@tanstack/react-query";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

export interface CreditStatus {
  credits: number;
  premium?: boolean;
}

export const creditStatusKey = (address: string) => ["wallet-credits", address.toLowerCase()] as const;

export function creditStatusOptions(address: string) {
  return {
    queryKey: creditStatusKey(address),
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CreditStatus> => {
      const response = await fetch(`${GATE_URL}/v1/pro/status/${address.toLowerCase()}`, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Credit balance unavailable");
      const status = await response.json();
      if (!Number.isSafeInteger(status.credits) || status.credits < 0) throw new Error("Invalid credit balance");
      return { credits: status.credits, premium: status.premium };
    },
  };
}

export async function updateCreditBalance(client: QueryClient, address: string, credits: number) {
  if (!Number.isSafeInteger(credits) || credits < 0) return;
  const queryKey = creditStatusKey(address);
  await client.cancelQueries({ queryKey, exact: true });
  client.setQueryData<CreditStatus>(queryKey, (previous) => ({ ...previous, credits }));
}