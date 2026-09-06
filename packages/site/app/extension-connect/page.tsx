"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/src/wallet/useWallet";
import { useProAuth, WalletTimeoutError } from "@/src/wallet/useProAuth";
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

  useEffect(() => {
    if (!isConnected || !address || state !== "connect") return;
    let cancelled = false;

    (async () => {
      setState("signing");
      try {
        const auth = await getProAuth(address);
        if (cancelled) return;

        const runtime = window.chrome?.runtime;
        if (!runtime?.sendMessage) {
          throw new Error("This only works in Chrome with the GENESIS extension installed.");
        }
        await new Promise<void>((resolve, reject) => {
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
        });
        if (cancelled) return;
        setState("done");
        setTimeout(() => window.close(), 1500);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof WalletTimeoutError ? err.message : friendlyWalletError(err));
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address, state, getProAuth]);

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      <div className="flex justify-center text-teal-400"><Icon name="shieldAlert" className="w-12 h-12" /></div>
      <h1 className="text-2xl font-bold text-white">
        Enable Deep Check for the <Genesis /> Extension
      </h1>

      {state === "connect" && (
        <>
          <p className="text-slate-300">
            Connect the wallet you want Deep Check credits spent from. This opens in its own
            tab so your wallet can show the real GENESIS origin, and so it isn't interrupted if
            the wallet's own approval popup takes focus.
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition"
          >
            Connect Wallet
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
