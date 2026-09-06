import { isAddress, recoverMessageAddress } from "viem";
import { ADMIN_WALLETS } from "@genesis/shared";

export interface AdminAuthBody {
  wallet?: string;
  message?: string;
  signature?: string;
}

export type AdminAuthResult = { ok: true; wallet: string } | { ok: false; status: number; error: string };

/**
 * Shared signed-wallet auth for every /v1/admin/* endpoint - same pattern as the
 * Pro deep-check flow (sign a message, recover the address), but a tighter 1h
 * freshness window since these endpoints expose internal data, not just spend credits.
 */
export async function verifyAdminAuth(body: AdminAuthBody | undefined): Promise<AdminAuthResult> {
  const { wallet, message, signature } = body ?? {};
  if (!wallet || !isAddress(wallet) || !message || !signature) {
    return { ok: false, status: 400, error: "Signed admin request required." };
  }
  if (!ADMIN_WALLETS.has(wallet.toLowerCase())) {
    return { ok: false, status: 403, error: "Not an admin wallet." };
  }
  let signer: string;
  try {
    signer = await recoverMessageAddress({ message, signature: signature as `0x${string}` });
  } catch {
    return { ok: false, status: 401, error: "Bad signature." };
  }
  const tsMatch = /ts:\s*(\S+)/.exec(message);
  const timestamp = tsMatch?.[1];
  const freshnessWindowMs = 60 * 60 * 1000;
  const fresh = timestamp ? Math.abs(Date.now() - Date.parse(timestamp)) < freshnessWindowMs : false;
  if (
    signer.toLowerCase() !== wallet.toLowerCase() ||
    !fresh ||
    !message.toLowerCase().includes(wallet.toLowerCase()) ||
    !message.toLowerCase().includes("admin")
  ) {
    return { ok: false, status: 401, error: "Invalid or expired signature." };
  }
  return { ok: true, wallet: wallet.toLowerCase() };
}
