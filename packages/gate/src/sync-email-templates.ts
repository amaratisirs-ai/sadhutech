#!/usr/bin/env node
/**
 * Idempotent one-time setup: publishes each definition in email-templates.ts
 * to Resend as a native Template (create + publish), keyed by its stable
 * `alias`. Safe to re-run — by default, templates that already exist (by
 * alias) are left untouched so manual dashboard edits aren't clobbered. Pass
 * `--update` to instead push this file's html/subject/name to templates that
 * already exist (e.g. right after a design change here).
 *
 * Usage: RESEND_FULL_API=... pnpm --filter @genesis/gate sync-templates [-- --update]
 * (or add RESEND_FULL_API to the repo-root .env and just run the script —
 * it's loaded the same way server.ts loads it.)
 *
 * IMPORTANT — key scoping: Resend only allows domain-restricting a
 * `sending_access` key; a `full_access` key (required here, to create/publish
 * templates) can never be domain-restricted. So this script reads a SEPARATE
 * env var, RESEND_FULL_API — the full-access key — and never touches
 * RESEND_API_KEY, which should hold a `sending_access` key restricted to the
 * sadhutech.com domain (Resend dashboard → API Keys → Create → Permission:
 * Sending access → Domain: sadhutech.com) and is the only key the deployed
 * gate ever uses to actually send. Templates themselves aren't domain-scoped
 * — only which domain a key may send *from*.
 */

try {
  process.loadEnvFile(new URL("../../../.env", import.meta.url));
} catch {
  // no root .env file (e.g. CI/production, where the env var is set directly)
}

import { EMAIL_TEMPLATES } from "./email-templates.js";

// Deliberately separate from RESEND_API_KEY (the sending-only, domain-restricted
// key the deployed gate uses) — creating/publishing templates requires full_access,
// which Resend can't domain-restrict, so that key is kept out of the running server.
const RESEND_API_KEY = process.env.RESEND_FULL_API || process.env.RESEND_API_KEY || process.env.RESENT_API_KEY || "";

interface ResendTemplateListItem {
  id: string;
  alias?: string;
  status: string;
}

async function listExisting(): Promise<Map<string, string>> {
  const byAlias = new Map<string, string>();
  let after: string | undefined;
  for (;;) {
    const url = new URL("https://api.resend.com/templates");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } });
    if (!res.ok) throw new Error(`Failed to list templates: HTTP ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: ResendTemplateListItem[]; has_more: boolean };
    for (const t of body.data) if (t.alias) byAlias.set(t.alias, t.id);
    if (!body.has_more || body.data.length === 0) break;
    const last = body.data[body.data.length - 1];
    if (!last) break;
    after = last.id;
  }
  return byAlias;
}

async function publish(id: string, alias: string): Promise<void> {
  const publishRes = await fetch(`https://api.resend.com/templates/${id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!publishRes.ok) throw new Error(`Publish failed for ${alias}: HTTP ${publishRes.status} ${await publishRes.text()}`);
}

async function createAndPublish(def: (typeof EMAIL_TEMPLATES)[string]): Promise<void> {
  const createRes = await fetch("https://api.resend.com/templates", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      name: def.name,
      alias: def.alias,
      subject: def.subject,
      html: def.html,
      variables: def.variables.map((v) => ({ key: v.key, type: v.type, fallback_value: v.fallbackValue })),
    }),
  });
  if (!createRes.ok) throw new Error(`Create failed for ${def.alias}: HTTP ${createRes.status} ${await createRes.text()}`);
  const created = (await createRes.json()) as { id: string };
  await publish(created.id, def.alias);
}

async function updateAndPublish(id: string, def: (typeof EMAIL_TEMPLATES)[string]): Promise<void> {
  const updateRes = await fetch(`https://api.resend.com/templates/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      name: def.name,
      subject: def.subject,
      html: def.html,
      variables: def.variables.map((v) => ({ key: v.key, type: v.type, fallback_value: v.fallbackValue })),
    }),
  });
  if (!updateRes.ok) throw new Error(`Update failed for ${def.alias}: HTTP ${updateRes.status} ${await updateRes.text()}`);
  await publish(id, def.alias);
}

async function main(): Promise<void> {
  if (!RESEND_API_KEY) {
    console.error("[sync-templates] ERROR: RESEND_FULL_API (full-access key) not set.");
    process.exit(1);
  }

  const shouldUpdate = process.argv.includes("--update");
  const existing = await listExisting();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const def of Object.values(EMAIL_TEMPLATES)) {
    const existingId = existing.get(def.alias);
    if (existingId) {
      if (shouldUpdate) {
        console.log(`[sync-templates] Updating + republishing "${def.alias}"...`);
        await updateAndPublish(existingId, def);
        updated++;
      } else {
        console.log(`[sync-templates] Skipping "${def.alias}" (already exists — pass --update to push code changes).`);
        skipped++;
      }
      continue;
    }
    console.log(`[sync-templates] Creating + publishing "${def.alias}"...`);
    await createAndPublish(def);
    created++;
  }

  console.log(`[sync-templates] Done. Created ${created}, updated ${updated}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error("[sync-templates] Failed:", err);
  process.exit(1);
});
