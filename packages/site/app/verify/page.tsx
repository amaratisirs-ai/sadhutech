"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";

function VerifyContent() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setMessage("Missing confirmation token.");
      return;
    }
    fetch("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          setState("ok");
        } else {
          setState("error");
          setMessage(d.error || "Confirmation failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Something went wrong. Please try the link again.");
      });
  }, [params]);

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-16">
      {state === "loading" && (
        <>
          <div className="flex justify-center text-teal-400"><Icon name="refresh" className="w-12 h-12 animate-spin" /></div>
          <h1 className="text-2xl font-bold text-white">Confirming your report…</h1>
        </>
      )}
      {state === "ok" && (
        <>
          <div className="flex justify-center text-emerald-400"><Icon name="checkCircle" className="w-16 h-16" /></div>
          <h1 className="text-3xl font-black text-white">Report confirmed</h1>
          <p className="text-slate-300">
            Thank you for helping protect the community. Your report is now in the GENESIS threat feed and will be trusted
            once other reporters confirm it.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <a href="/report" className="px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition">Report another</a>
            <a href="/community" className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-100 hover:border-teal-400 transition">See the community</a>
          </div>
        </>
      )}
      {state === "error" && (
        <>
          <div className="flex justify-center text-amber-400"><Icon name="warning" className="w-16 h-16" /></div>
          <h1 className="text-3xl font-black text-white">Couldn't confirm</h1>
          <p className="text-slate-300">{message}</p>
          <a href="/report" className="inline-block px-5 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition">Back to report</a>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-300">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
