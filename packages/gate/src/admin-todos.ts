import { Pool } from "pg";

/**
 * Admin-only build/roadmap tracker shown on /admin/todos - lets the admin see and
 * update status on planned work (e.g. the multi-chain decoder plugin phases) without
 * that living only in chat history. Postgres-only; a no-op in in-memory dev mode.
 */
export type TodoStatus = "not-started" | "in-progress" | "done" | "blocked";

export interface AdminTodo {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  status: TodoStatus;
  effort: string | null;
  estimateHours: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  category?: string;
  effort?: string;
  estimateHours?: string;
}

// Seeded once (only if the table is empty) so the multi-chain decoder plugin plan
// discussed on /admin/architecture shows up here immediately instead of an empty list.
const SEED_TODOS: CreateTodoInput[] = [
  {
    title: "Plugin scaffolding (chain-family router + common contract)",
    description: "Add chainFamily to shared types; wrap today's EVM decode.ts as the first plugin behind a router. No behavior change.",
    category: "Multi-chain decoder plugins",
    effort: "Low",
    estimateHours: "2-4 hrs",
  },
  {
    title: "Solana plugin",
    description: "@solana/web3.js instruction parsing, SPL Token/Token-2022 delegate detection, GoPlus Solana lookup module.",
    category: "Multi-chain decoder plugins",
    effort: "Medium",
    estimateHours: "4-8 hrs",
  },
  {
    title: "Sui plugin",
    description: "@mysten/sui PTB parsing, GoPlus Sui integration. Needs a research pass first - Sui's object-capability model has no direct 'unlimited approval' equivalent.",
    category: "Multi-chain decoder plugins",
    effort: "Medium-High",
    estimateHours: "6-10 hrs",
  },
  {
    title: "Bitcoin/Dogecoin plugin",
    description: "bitcoinjs-lib UTXO decode, Dogecoin via custom network params. No GoPlus vendor - relies on community threat-intel address matching.",
    category: "Multi-chain decoder plugins",
    effort: "Low-Medium",
    estimateHours: "3-5 hrs",
  },
  {
    title: "Live wallet interception (non-EVM, per wallet vendor)",
    description: "Extension/Snap capture of real-time signing prompts for Solana/Sui/Bitcoin wallets. Gated by undocumented per-vendor injected-provider APIs; needs real wallet/device testing.",
    category: "Multi-chain decoder plugins",
    effort: "High",
    estimateHours: "8-20+ hrs per vendor",
  },
];

function rowToTodo(r: Record<string, unknown>): AdminTodo {
  return {
    id: Number(r.id),
    title: String(r.title),
    description: (r.description as string | null) ?? null,
    category: (r.category as string | null) ?? null,
    status: r.status as TodoStatus,
    effort: (r.effort as string | null) ?? null,
    estimateHours: (r.estimate_hours as string | null) ?? null,
    sortOrder: Number(r.sort_order),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export class AdminTodosService {
  constructor(private pool: Pool) {}

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS admin_todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'not-started',
        effort TEXT,
        estimate_hours TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS admin_todos_status_idx ON admin_todos (status);
    `);
    const { rows } = await this.pool.query("SELECT COUNT(*) AS count FROM admin_todos");
    if (Number(rows[0]?.count ?? 0) === 0) {
      for (const [i, seed] of SEED_TODOS.entries()) {
        await this.create(seed, i);
      }
    }
  }

  async list(): Promise<AdminTodo[]> {
    const { rows } = await this.pool.query(
      `SELECT id, title, description, category, status, effort, estimate_hours, sort_order, created_at, updated_at
       FROM admin_todos ORDER BY sort_order ASC, id ASC`
    );
    return rows.map(rowToTodo);
  }

  async create(input: CreateTodoInput, sortOrder?: number): Promise<AdminTodo> {
    const { rows } = await this.pool.query(
      `INSERT INTO admin_todos (title, description, category, effort, estimate_hours, sort_order)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM admin_todos)))
       RETURNING id, title, description, category, status, effort, estimate_hours, sort_order, created_at, updated_at`,
      [input.title, input.description ?? null, input.category ?? null, input.effort ?? null, input.estimateHours ?? null, sortOrder ?? null]
    );
    return rowToTodo(rows[0]);
  }

  async updateStatus(id: number, status: TodoStatus): Promise<AdminTodo | null> {
    const { rows } = await this.pool.query(
      `UPDATE admin_todos SET status = $2, updated_at = NOW() WHERE id = $1
       RETURNING id, title, description, category, status, effort, estimate_hours, sort_order, created_at, updated_at`,
      [id, status]
    );
    return rows[0] ? rowToTodo(rows[0]) : null;
  }

  async remove(id: number): Promise<void> {
    await this.pool.query("DELETE FROM admin_todos WHERE id = $1", [id]);
  }
}

export function createAdminTodosService(pool: Pool): AdminTodosService {
  return new AdminTodosService(pool);
}
