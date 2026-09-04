/** Maps raw wallet/RPC errors (viem/wagmi) to a plain-English message, never leaking raw JSON-RPC text. */
export function friendlyWalletError(err: unknown): string {
  const anyErr = err as { code?: number; name?: string; shortMessage?: string; cause?: { code?: number }; message?: string } | null;
  const code = anyErr?.code ?? anyErr?.cause?.code;
  const name = anyErr?.name ?? "";
  const short = (anyErr?.shortMessage ?? anyErr?.message ?? "").toLowerCase();

  if (code === 4001 || name.includes("UserRejected") || short.includes("reject") || short.includes("denied") || short.includes("cancel")) {
    return "You cancelled the request in your wallet.";
  }
  if (code === 4902) {
    return "Your wallet doesn't have this network added yet. Add it and try again.";
  }
  if (code === -32602) {
    return "Your wallet couldn't process this request. Try reconnecting your wallet and try again.";
  }
  if (code === -32601) {
    return "Your wallet doesn't support this action. Try a different wallet.";
  }
  return "Something went wrong. Please try again.";
}
