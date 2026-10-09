import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { creditStatusKey, creditStatusOptions, updateCreditBalance, type CreditStatus } from "./credits";

afterEach(() => vi.unstubAllGlobals());

describe("shared wallet credits", () => {
  it("updates both balance subscribers from 40 to 35", async () => {
    const client = new QueryClient();
    const queryKey = creditStatusKey("0xAbC");
    client.setQueryData(queryKey, { credits: 40, premium: true });
    const header = new QueryObserver<CreditStatus>(client, { queryKey, enabled: false });
    const panel = new QueryObserver<CreditStatus>(client, { queryKey, enabled: false });
    const stopHeader = header.subscribe(() => {});
    const stopPanel = panel.subscribe(() => {});
    await updateCreditBalance(client, "0xabc", 35);
    expect(header.getCurrentResult().data?.credits).toBe(35);
    expect(panel.getCurrentResult().data?.credits).toBe(35);
    expect(panel.getCurrentResult().data?.premium).toBe(true);
    stopHeader(); stopPanel(); client.clear();
  });

  it("cancels an older status request before publishing the authoritative balance", async () => {
    const client = new QueryClient();
    let finish!: (value: CreditStatus) => void;
    const pending = client.fetchQuery({
      queryKey: creditStatusKey("0xabc"),
      queryFn: ({ signal }) => { void signal.aborted; return new Promise<CreditStatus>((resolve) => { finish = resolve; }); },
    }).catch(() => null);
    await updateCreditBalance(client, "0xabc", 35);
    finish({ credits: 40 });
    await pending;
    expect(client.getQueryData(creditStatusKey("0xabc"))).toEqual({ credits: 35 });
    client.clear();
  });

  it("isolates wallets and accepts zero without inventing a balance on failure", async () => {
    const client = new QueryClient();
    client.setQueryData(creditStatusKey("0xdef"), { credits: 9 });
    await updateCreditBalance(client, "0xabc", 0);
    await updateCreditBalance(client, "0xabc", -1);
    expect(client.getQueryData(creditStatusKey("0xabc"))).toEqual({ credits: 0 });
    expect(client.getQueryData(creditStatusKey("0xdef"))).toEqual({ credits: 9 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(client.fetchQuery({ ...creditStatusOptions("0xabc"), retry: false })).rejects.toThrow("unavailable");
    expect(client.getQueryData(creditStatusKey("0xabc"))).toEqual({ credits: 0 });
    client.clear();
  });
});