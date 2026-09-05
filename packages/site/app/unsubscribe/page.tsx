"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Genesis } from "@/components/Genesis";

const GATE_URL = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";

function UnsubscribeContent() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      return;
    }
    fetch(`${GATE_URL}/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        setState(r.ok && d.ok ? "ok" : "error");
      })
      .catch(() => setState("error"));
  }, [params]);

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      {state === "loading" && (
        <>
          <div className="flex justify-center text-teal-400"><Icon name="refresh" className="w-12 h-12 animate-spin" /></div>
          <h1 className="text-2xl font-bold text-white">Unsubscribing…</h1>
        </>
      )}
      {state === "ok" && (
        <>
          <div className="flex justify-center text-emerald-400"><Icon name="checkCircle" className="w-16 h-16" /></div>
          <h1 className="text-3xl font-black text-white">You&apos;re unsubscribed</h1>
          <p className="text-slate-300">
            You won&apos;t receive any more newsletters or journey emails from <Genesis />. You can resubscribe anytime
            from the footer.
          </p>
          <a href="/" className="inline-block px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition">
            Back to home
          </a>
        </>
      )}
      {state === "error" && (
        <>
          <div className="flex justify-center text-rose-400"><Icon name="block" className="w-16 h-16" /></div>
          <h1 className="text-2xl font-bold text-white">Couldn&apos;t unsubscribe</h1>
          <p className="text-slate-300">That link is invalid or has already been used. Contact security@sadhutech.com if this keeps happening.</p>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
  );
}
