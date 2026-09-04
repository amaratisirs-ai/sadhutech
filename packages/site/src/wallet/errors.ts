/** Maps raw wallet/RPC errors (viem/wagmi) to a plain-English message, never leaking raw JSON-RPC text. */
export function friendlyWalletError(err: unknown): string {
  // viem/wagmi errors are often wrapped several levels deep (SendTransactionError ->
  // TransactionExecutionError -> RpcRequestError -> InvalidParamsRpcError, etc.),
  // so walk the full .cause chain instead of only checking the top-level error.
  const codes: number[] = [];
  const texts: string[] = [];
  let current: any = err;
  for (let i = 0; i < 6 && current; i++) {
    if (typeof current.code === "number") codes.push(current.code);
    if (typeof current.name === "string") texts.push(current.name.toLowerCase());
    if (typeof current.shortMessage === "string") texts.push(current.shortMessage.toLowerCase());
    if (typeof current.message === "string") texts.push(current.message.toLowerCase());
    current = current.cause;
  }
  const hasCode = (c: number) => codes.includes(c);
  const hasText = (s: string) => texts.some((t) => t.includes(s));

  if (hasCode(4001) || hasText("userrejected") || hasText("reject") || hasText("denied") || hasText("cancel")) {
    return "You cancelled the request in your wallet.";
  }
  if (hasCode(4902) || hasText("unrecognized chain") || hasText("add ethereum chain")) {
    return "Your wallet doesn't have this network added yet. Add it and try again.";
  }
  if (hasCode(-32602) || hasText("invalid param") || hasText("missing or invalid")) {
    return "Your wallet couldn't process this request. Try reconnecting your wallet and try again.";
  }
  if (hasCode(-32601) || hasText("not supported") || hasText("method not found")) {
    return "Your wallet doesn't support this action. Try a different wallet.";
  }
  return "Something went wrong. Please try again.";
}
