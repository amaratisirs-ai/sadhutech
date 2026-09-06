"use client";

import { useState } from "react";
import { useWallet } from "@/src/wallet/useWallet";
import { useProAuth, WalletTimeoutError, withTimeout } from "@/src/wallet/useProAuth";
import { friendlyWalletError } from "@/src/wallet/errors";
import { Icon } from "@/components/Icon";
import { Genesis } from "@/components/Genesis";

// Fixed via manifest.json's "key" field so this ID stays stable across reloads of the
// unpacked dev extension (Chrome otherwise assigns a new random ID on every load).
const EXTENSION_ID = "enibhabpohaallafhaobpojlmpcedehp";

type State = "connect" | "signing" | "done" | "error";

declare global {
  interface Window {
    chrome?: { runtime?: { sendMessage: (id: string, message: unknown, cb: (response: unknown) => void) => void } };
  }
}

export default function ExtensionConnectPage() {
  const { address, isConnected, connect } = useWallet();
  const { getProAuth } = useProAuth();
  const [state, setState] = useState<State>("connect");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Signing is triggered from a direct button click (not an effect) - some wallet extensions
  // silently drop a signature request that isn't tied to a recent user gesture, which left this
  // page spinning forever with no visible prompt when the wallet was already connected on load.
  const signAndConnect = async () => {
    if (!address) return;
    setState("signing");
    try {
      const auth = await getProAuth(address);

      const runtime = window.chrome?.runtime;
      if (!runtime?.sendMessage) {
        throw new Error("This only works in Chrome with the GENESIS extension installed.");
      }
      // A mismatched extension ID or an origin missing from manifest.json's
      // "externally_connectable" can leave the callback never firing at all rather than
      // erroring - a timeout guarantees this never spins forever.
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          runtime.sendMessage(
            EXTENSION_ID,
            { type: "genesis-connect-result", address: auth.address, authMessage: auth.message, signature: auth.signature },
            (response) => {
              const err = (globalThis as any).chrome?.runtime?.lastError;
              if (err) reject(new Error("Couldn't reach the GENESIS extension. Is it installed and enabled?"));
              else if (!(response as { ok?: boolean } | undefined)?.ok) reject(new Error("The extension rejected the connection. Try again."));
              else resolve();
            }
          );
        }),
        10_000,
        "Couldn't reach the GENESIS extension. Make sure it's installed and enabled, then try again."
      );
      setState("done");
      setTimeout(() => window.close(), 1500);
    } catch (err) {
      setErrorMsg(err instanceof WalletTimeoutError ? err.message : friendlyWalletError(err));
      setState("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      <div className="flex justify-center text-teal-400"><Icon name="shieldAlert" className="w-12 h-12" /></div>
      <h1 className="text-2xl font-bold text-white">
        Enable Deep Check for the <Genesis /> Extension
      </h1>

      {state === "connect" && !isConnected && (
        <>
          <p className="text-slate-300">
            Connect your wallet to turn on Deep Check.
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
          >
            Connect Wallet
          </button>
        </>
      )}

      {state === "connect" && isConnected && (
        <>
          <p className="text-slate-300">
            Wallet connected. Click below and sign in your wallet to finish.
          </p>
          <button
            onClick={signAndConnect}
            className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
          >
            Sign &amp; Enable Deep Check
          </button>
        </>
      )}

      {state === "signing" && (
        <>
          <div className="flex justify-center text-teal-400"><Icon name="refresh" className="w-10 h-10 animate-spin" /></div>
          <p className="text-slate-300">Check your wallet for a signature request…</p>
        </>
      )}

      {state === "done" && (
        <>
          <div className="flex justify-center text-emerald-400"><Icon name="checkCircle" className="w-16 h-16" /></div>
          <h2 className="text-xl font-bold text-white">Connected</h2>
          <p className="text-slate-300">Deep Check is enabled. This tab will close automatically — you can also close it now.</p>
        </>
      )}

      {state === "error" && (
        <>
          <div className="flex justify-center text-amber-400"><Icon name="warning" className="w-16 h-16" /></div>
          <h2 className="text-xl font-bold text-white">Couldn't connect</h2>
          <p className="text-slate-300">{errorMsg}</p>
          <button
            onClick={() => {
              setErrorMsg(null);
              setState("connect");
            }}
            className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
