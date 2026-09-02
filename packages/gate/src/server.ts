import Fastify from "fastify";
import { isAddress } from "viem";
import type { AnalyzeRequest, ReportRequest } from "@genesis/shared";
import { analyze } from "./analyze.js";
import { createIntelAsync } from "./index.js";
import { TESTER_HTML } from "./ui.js";

const app = Fastify({ logger: true });

// Permissive CORS for local dev (Snap / separate UI origins).
app.addHook("onRequest", async (req, reply) => {
  reply.header("access-control-allow-origin", "*");
  reply.header("access-control-allow-headers", "content-type");
  reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") reply.status(204).send();
});

app.get("/", async (_req, reply) => {
  reply.header("content-type", "text/html; charset=utf-8");
  return TESTER_HTML;
});

app.get("/health", async () => ({ status: "ok", service: "genesis-gate" }));

// Chakravyuha pre-sign gate: analyze a transaction before the user signs it.
app.post<{ Body: AnalyzeRequest }>("/v1/analyze", async (request, reply) => {
  const intel = await createIntelAsync();
  const body = request.body;
  const tx = body?.tx;
  if (!tx || tx.chainId === undefined) {
    return reply.status(400).send({ error: "tx.chainId is required" });
  }
  if (!isAddress(tx.from ?? "")) {
    return reply.status(400).send({ error: `Invalid 'from' address: ${tx.from ?? "(missing)"}` });
  }
  if (!isAddress(tx.to ?? "")) {
    return reply.status(400).send({ error: `Invalid 'to' address: ${tx.to ?? "(missing)"}` });
  }
  if (tx.data && !/^0x[0-9a-fA-F]*$/.test(tx.data)) {
    return reply.status(400).send({ error: "Invalid 'data': must be 0x-prefixed hex" });
  }
  try {
    return await analyze(body, intel);
  } catch (err) {
    request.log.error(err);
    return reply.status(400).send({ error: "Could not analyze transaction (malformed input)" });
  }
});

// Community "waggle" report: submit a suspected malicious address.
app.post<{ Body: ReportRequest }>("/v1/report", async (request, reply) => {
  const intel = await createIntelAsync();
  const body = request.body as ReportRequest;
  if (!body?.address || !body.category || !body.reporterId) {
    return reply.status(400).send({ error: "address, category and reporterId are required" });
  }
  try {
    return await intel.report(body);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Failed to record report" });
  }
});

// Async startup with proper initialization.
async function start(): Promise<void> {
  try {
    // Pre-warm threat feeds/intel before listening.
    await createIntelAsync();
    const port = Number(process.env.PORT ?? 8787);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`GENESIS gate listening on :${port} with loaded threat intel`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
