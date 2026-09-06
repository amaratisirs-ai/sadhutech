"use client";

import { useDisplaySettings, FONT_OPTIONS } from "@/src/useDisplaySettings";
import { Icon } from "@/components/Icon";

export default function SettingsPage() {
  const { brightness, setBrightness, font, setFont } = useDisplaySettings();

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Icon name="settings" className="w-8 h-8 text-teal-400" />
          <h1 className="text-3xl font-black">Display Settings</h1>
        </div>
        <p className="text-slate-300">
          Make the site easier on your eyes. These preferences are saved on this device and apply everywhere on
          sadhutech.com.
        </p>
      </header>

      <section className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Text brightness</h2>
          <span className="text-sm font-semibold text-teal-300">{brightness}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full accent-teal-400"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Softer (easier on the eyes)</span>
          <span>Brighter (more contrast)</span>
        </div>
        <p className="text-sm text-slate-400">
          Lower this if bright white text on our dark background feels harsh or hard to read for long stretches.
        </p>
      </section>

      <section className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">Font</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFont(opt.id)}
              style={{ fontFamily: opt.stack }}
              className={`px-4 py-4 rounded-xl border text-sm transition-colors ${
                font === opt.id
                  ? "border-teal-400 bg-teal-500/10 text-teal-200"
                  : "border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              <div className="text-xl mb-1">Aa</div>
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          "Easy Read" uses Atkinson Hyperlegible, a font designed by the Braille Institute specifically to keep
          similarly-shaped letters (like "l", "I", and "1") easy to tell apart.
        </p>
      </section>
    </div>
  );
}
