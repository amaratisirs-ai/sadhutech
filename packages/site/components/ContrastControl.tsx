"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const STORAGE_KEY = "genesis_text_brightness";
const DEFAULT_VALUE = 65;
// 0 = softest (a muted gray, easiest on the eyes) -> 100 = pure white (maximum contrast).
const SOFT_RGB: [number, number, number] = [148, 163, 184]; // slate-400
const BRIGHT_RGB: [number, number, number] = [255, 255, 255];

function toHex(value: number): string {
  const t = Math.min(100, Math.max(0, value)) / 100;
  const rgb = SOFT_RGB.map((soft, i) => Math.round(soft + t * (BRIGHT_RGB[i] - soft)));
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function apply(value: number): void {
  document.documentElement.style.setProperty("--foreground", toHex(value));
}

/** Floating "text brightness" slider - lets each visitor dial dark-theme contrast to
 * their own eyes instead of us guessing one fixed value for everyone. */
export function ContrastControl() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(DEFAULT_VALUE);

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    const initial = Number.isFinite(saved) && saved >= 0 && saved <= 100 ? saved : DEFAULT_VALUE;
    setValue(initial);
    apply(initial);
  }, []);

  const handleChange = (next: number) => {
    setValue(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {open && (
        <div className="mb-3 w-56 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Text brightness</span>
            <span>{value}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="w-full accent-teal-400"
          />
          <p className="text-[11px] text-slate-500">Lower it if bright text on dark backgrounds is hard on your eyes.</p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Adjust text brightness"
        title="Adjust text brightness"
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-teal-400/40 bg-slate-900/90 text-teal-300 shadow-lg backdrop-blur transition-all hover:border-teal-300 hover:bg-slate-800 hover:text-white"
      >
        <Icon name="eye" className="w-5 h-5" />
      </button>
    </div>
  );
}
