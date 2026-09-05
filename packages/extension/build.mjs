// Bundles each entry point separately (MV3 needs plain, non-module scripts for content scripts),
// then copies static assets (manifest, popup HTML, icons) into dist/.
import * as esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outdir = join(__dirname, "dist");
const watch = process.argv.includes("--watch");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const entryPoints = [
  "src/inject.ts", // runs in the page's MAIN world - wraps window.ethereum
  "src/content-script.ts", // isolated world - bridges inject.ts <-> background.ts
  "src/background.ts", // service worker - calls the GENESIS gate
  "src/popup.ts", // extension toolbar popup
];

const buildOptions = {
  entryPoints,
  outdir,
  bundle: true,
  format: "iife", // MV3 content/background scripts are plain scripts, not ES modules
  target: "es2022",
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[extension] watching for changes...");
} else {
  await esbuild.build(buildOptions);
}

cpSync(join(__dirname, "public"), outdir, { recursive: true });
console.log(`[extension] built to ${outdir}`);
