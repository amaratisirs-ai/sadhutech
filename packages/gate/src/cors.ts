import type { FastifyReply, FastifyRequest } from "fastify";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:8787",
  "https://sadhutech-site.vercel.app",
  "https://sadhutech.com",
  "https://www.sadhutech.com",
  "https://genesis-gate.onrender.com",
]);

export async function corsMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const origin = request.headers.origin;
  reply.header("vary", "Origin");
  if (origin && allowedOrigins.has(origin)) {
    reply.header("access-control-allow-origin", origin);
  } else if (!origin) {
    reply.header("access-control-allow-origin", "*");
  }
  reply.header("access-control-allow-headers", "content-type, x-api-key");
  reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
  if (request.method === "OPTIONS") reply.status(204).send();
}