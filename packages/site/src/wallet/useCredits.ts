"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { creditStatusOptions, updateCreditBalance } from "./credits";

export function useCredits(address?: string) {
  const client = useQueryClient();
  const query = useQuery({
    ...creditStatusOptions(address ?? ""),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    retry: 1,
  });

  return {
    credits: address ? query.data?.credits ?? null : null,
    refreshStatus: async (wallet: string) => {
      try {
        return await client.fetchQuery({ ...creditStatusOptions(wallet), staleTime: 0 });
      } catch {
        return null;
      }
    },
    updateCredits: (wallet: string, credits: number) => updateCreditBalance(client, wallet, credits),
  };
}