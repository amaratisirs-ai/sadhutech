"use client";

import { useEffect, useState } from "react";

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

export const FONT_OPTIONS = [
  { id: "sans-serif", label: "Sans Serif", stack: "var(--font-inter), Arial, sans-serif" },
  { id: "serif", label: "Serif", stack: "var(--font-merriweather), Georgia, serif" },
  { id: "display", label: "Display", stack: "var(--font-playfair), Georgia, serif" },
  { id: "handwriting", label: "Handwriting", stack: "var(--font-dancing-script), cursive" },
  { id: "monospace", label: "Monospace", stack: "var(--font-roboto-mono), monospace" },
  { id: "easy-read", label: "Easy Read", stack: "var(--font-atkinson), Arial, sans-serif" },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

function applyBrightness(value: number): void {
  document.documentElement.style.setProperty("--foreground", toHex(value));
}

function applyFont(id: FontId): void {
  const opt = FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
  document.documentElement.style.setProperty("--font-choice", opt.stack);
  // Belt-and-suspenders: a plain inline style directly on body always wins over any
  // stylesheet rule (Tailwind's own base/preflight styles included), regardless of how
  // CSS cascade layers order things - the CSS variable alone wasn't reliably taking effect.
  document.body.style.fontFamily = opt.stack;
}

/** Reads and re-applies saved brightness/font preferences. Called from LayoutClient (every
 * page, via the root layout) so a preference set once on /settings still applies no matter
 * which page loads first - the /settings page itself is just one place that can change it. */
export function applySavedDisplaySettings(): void {
  const savedBrightness = Number(localStorage.getItem(BRIGHTNESS_KEY));
  applyBrightness(Number.isFinite(savedBrightness) && savedBrightness >= 0 && savedBrightness <= 100 ? savedBrightness : DEFAULT_BRIGHTNESS);

  const savedFont = localStorage.getItem(FONT_KEY) as FontId | null;
  applyFont(FONT_OPTIONS.some((f) => f.id === savedFont) ? (savedFont as FontId) : "sans-serif");
}

/** Shared state + persistence for the /settings page - text brightness and font choice,
 * both user-adjustable instead of one fixed value guessed to suit everyone's eyes. */
export function useDisplaySettings() {
  const [brightness, setBrightnessState] = useState(DEFAULT_BRIGHTNESS);
  const [font, setFontState] = useState<FontId>("sans-serif");

  useEffect(() => {
    const savedBrightness = Number(localStorage.getItem(BRIGHTNESS_KEY));
    const initialBrightness =
      Number.isFinite(savedBrightness) && savedBrightness >= 0 && savedBrightness <= 100 ? savedBrightness : DEFAULT_BRIGHTNESS;
    setBrightnessState(initialBrightness);

    const savedFont = localStorage.getItem(FONT_KEY) as FontId | null;
    const initialFont = FONT_OPTIONS.some((f) => f.id === savedFont) ? (savedFont as FontId) : "sans-serif";
    setFontState(initialFont);
    // Applying is handled globally by applySavedDisplaySettings() (see LayoutClient) - this
    // effect only needs to sync this page's own slider/button UI to the saved values.
  }, []);

  const setBrightness = (next: number) => {
    setBrightnessState(next);
    applyBrightness(next);
    try {
      localStorage.setItem(BRIGHTNESS_KEY, String(next));
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  };

  const setFont = (next: FontId) => {
    setFontState(next);
    applyFont(next);
    try {
      localStorage.setItem(FONT_KEY, next);
    } catch {
      // ignore storage failures (private browsing, quota, etc.)
    }
  };

  return { brightness, setBrightness, font, setFont };
}
