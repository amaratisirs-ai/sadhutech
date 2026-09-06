"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const BRIGHTNESS_KEY = "genesis_text_brightness";
const FONT_KEY = "genesis_font_choice";
const DEFAULT_BRIGHTNESS = 65;

// 0 = softest (a muted gray, easiest on the eyes) -> 100 = pure white (maximum contrast).
const SOFT_RGB: [number, number, number] = [148, 163, 184]; // slate-400
const BRIGHT_RGB: [number, number, number] = [255, 255, 255];

function toHex(value: number): string {
  const t = Math.min(100, Math.max(0, value)) / 100;
  const rgb = SOFT_RGB.map((soft, i) => Math.round(soft + t * (BRIGHT_RGB[i] - soft)));
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const FONT_OPTIONS = [
  { id: "default", label: "Default", stack: "var(--font-inter), Arial, sans-serif" },
  { id: "rounded", label: "Rounded", stack: "var(--font-nunito), Arial, sans-serif" },
  { id: "serif", label: "Serif", stack: "var(--font-merriweather), Georgia, serif" },
  { id: "easy-read", label: "Easy Read", stack: "var(--font-atkinson), Arial, sans-serif" },
] as const;

type FontId = (typeof FONT_OPTIONS)[number]["id"];

function applyBrightness(value: number): void {
  document.documentElement.style.setProperty("--foreground", toHex(value));
}

function applyFont(id: FontId): void {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  document.documentElement.style.setProperty("--font-choice", opt.stack);
}

/** Floating display-settings panel - text brightness and font choice, both user-adjustable
 * instead of us guessing one fixed value that works for everyone's eyes/preferences. */
export function DisplaySettings() {
  const [open, setOpen] = useState(false);
  const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
  const [font, setFont] = useState<FontId>("default");

  useEffect(() => {
    const savedBrightness = Number(localStorage.getItem(BRIGHTNESS_KEY));
    const initialBrightness =
      Number.isFinite(savedBrightness) && savedBrightness >= 0 && savedBrightness <= 100 ? savedBrightness : DEFAULT_BRIGHTNESS;
    setBrightness(initialBrightness);
    applyBrightness(initialBrightness);

    const savedFont = localStorage.getItem(FONT_KEY) as FontId | null;
    const initialFont = FONT_OPTIONS.some((f) => f.id === savedFont) ? (savedFont as FontId) : "default";
    setFont(initialFont);
    applyFont(initialFont);
  }, []);

  const handleBrightnessChange = (next: number) => {
    setBrightness(next);
    applyBrightness(next);
    try {
      localStorage.setItem(BRIGHTNESS_KEY, String(next));
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  };

  const handleFontChange = (next: FontId) => {
    setFont(next);
    applyFont(next);
    try {
      localStorage.setItem(FONT_KEY, next);
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {open && (
        <div className="mb-3 w-64 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur p-4 shadow-xl space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Text brightness</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
            <p className="text-[11px] text-slate-500">Lower it if bright text on dark backgrounds is hard on your eyes.</p>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <span className="text-xs font-semibold text-slate-300">Font</span>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFontChange(opt.id)}
                  style={{ fontFamily: opt.stack }}
                  className={`px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                    font === opt.id
                      ? "border-teal-400 bg-teal-500/10 text-teal-200"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">"Easy Read" uses Atkinson Hyperlegible, a font designed for readability.</p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Display settings"
        title="Display settings"
        className="w-10 h-10 flex items-center justify-center rounded-lg border border-teal-400/40 bg-slate-900/90 text-teal-300 shadow-lg backdrop-blur transition-all hover:border-teal-300 hover:bg-slate-800 hover:text-white"
      >
        <Icon name="eye" className="w-5 h-5" />
      </button>
    </div>
  );
}
