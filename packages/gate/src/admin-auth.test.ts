import { describe, it, expect } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { verifyAdminAuth } from "./admin-auth.js";

// Freshly generated per test run - not a real admin wallet, just used to exercise the signature path.
const TEST_KEY = generatePrivateKey();

async function sign(wallet: string, admin = true, tsOverride?: string) {
  const account = privateKeyToAccount(TEST_KEY);
  const ts = tsOverride ?? new Date().toISOString();
  const message = `${admin ? "SadhuTech admin" : "SadhuTech pro check"}\nwallet: ${wallet}\nts: ${ts}`;
  const signature = await account.signMessage({ message });
  return { message, signature };
}

describe("verifyAdminAuth", () => {
  it("rejects a missing wallet/message/signature", async () => {
    const result = await verifyAdminAuth({});
    expect(result).toEqual({ ok: false, status: 400, error: "Signed admin request required." });
  });

  it("rejects a wallet not on the admin list", async () => {
    const account = privateKeyToAccount(TEST_KEY);
    const { message, signature } = await sign(account.address);
    const result = await verifyAdminAuth({ wallet: account.address, message, signature });
    expect(result).toEqual({ ok: false, status: 403, error: "Not an admin wallet." });
  });

  it("rejects a bad signature", async () => {
    const result = await verifyAdminAuth({
      wallet: "0xd38721F0A0515C9aA1c291ea24512b66992feDaF",
      message: "SadhuTech admin\nwallet: 0xd38721F0A0515C9aA1c291ea24512b66992feDaF\nts: 2026-01-01T00:00:00.000Z",
      signature: "0xdeadbeef",
    });
    expect(result).toEqual({ ok: false, status: 401, error: "Bad signature." });
  });

  it("rejects a stale timestamp", async () => {
    const admin = "0xd38721F0A0515C9aA1c291ea24512b66992feDaF";
    const account = privateKeyToAccount(TEST_KEY);
    const message = `SadhuTech admin\nwallet: ${admin}\nts: 2020-01-01T00:00:00.000Z`;
    const signature = await account.signMessage({ message });
    const result = await verifyAdminAuth({ wallet: admin, message, signature });
    expect(result).toEqual({ ok: false, status: 401, error: "Invalid or expired signature." });
  });
});
