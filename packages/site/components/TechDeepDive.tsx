"use client";

import { useState } from "react";

export interface DeepDiveItem {
  title: string;
  simple: string;
  technical: string;
}

export function TechDeepDive({ items }: { items: DeepDiveItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (title: string) => {
    const newSet = new Set(expanded);
    if (newSet.has(title)) newSet.delete(title);
    else newSet.add(title);
    setExpanded(newSet);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition"
        >
          <button
            onClick={() => toggle(item.title)}
            className="w-full px-6 py-4 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition text-left"
          >
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{item.simple}</p>
            </div>
            <div className="ml-4 flex-shrink-0 text-blue-600 dark:text-blue-400">
              <svg
                className={`w-5 h-5 transition transform ${expanded.has(item.title) ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>

          {expanded.has(item.title) && (
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-400">Technical Details:</p>
              <p className="font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.technical}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
