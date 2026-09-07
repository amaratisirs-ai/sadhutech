import { describe, it, expect, vi } from "vitest";
import { AdminTodosService, SEED_TODOS } from "./admin-todos.js";

function fakePool(queryImpl?: (...args: unknown[]) => unknown) {
  return { query: vi.fn(queryImpl ?? (async () => ({ rows: [] }))) } as any;
}

describe("AdminTodosService", () => {
  it("initialize() creates the table and seeds every curated item when none exist yet", async () => {
    const queries: string[] = [];
    const pool = fakePool((...args: unknown[]) => {
      const sql = args[0] as string;
      queries.push(sql);
      if (sql.includes("SELECT 1 FROM admin_todos WHERE title")) return { rows: [] }; // no existing row for any title
      if (sql.includes("INSERT INTO admin_todos")) return { rows: [{ id: 1, title: "x", description: null, category: null, status: "not-started", effort: null, estimate_hours: null, sort_order: 0, created_at: "now", updated_at: "now" }] };
      return { rows: [] };
    });
    const svc = new AdminTodosService(pool);
    await svc.initialize();
    const inserts = queries.filter((q) => q.includes("INSERT INTO admin_todos"));
    expect(inserts.length).toBe(SEED_TODOS.length); // one per seed todo
  });

  it("initialize() skips seed items that already exist by title", async () => {
    const queries: string[] = [];
    const pool = fakePool((...args: unknown[]) => {
      const sql = args[0] as string;
      queries.push(sql);
      if (sql.includes("SELECT 1 FROM admin_todos WHERE title")) return { rows: [{ "?column?": 1 }] }; // every title already exists
    });
    const svc = new AdminTodosService(pool);
    await svc.initialize();
    expect(queries.some((q) => q.includes("INSERT INTO admin_todos"))).toBe(false);
  });

  it("list() maps snake_case rows to camelCase", async () => {
    const pool = fakePool(async () => ({
      rows: [
        { id: 1, title: "Plugin scaffolding", description: "desc", category: "cat", status: "in-progress", effort: "Low", estimate_hours: "2-4 hrs", sort_order: 0, created_at: "2026-01-01", updated_at: "2026-01-02" },
      ],
    }));
    const svc = new AdminTodosService(pool);
    const todos = await svc.list();
    expect(todos).toEqual([
      { id: 1, title: "Plugin scaffolding", description: "desc", category: "cat", status: "in-progress", effort: "Low", estimateHours: "2-4 hrs", sortOrder: 0, createdAt: "2026-01-01", updatedAt: "2026-01-02" },
    ]);
  });

  it("create() inserts with the given fields", async () => {
    const pool = fakePool(async () => ({
      rows: [{ id: 2, title: "New item", description: null, category: null, status: "not-started", effort: null, estimate_hours: null, sort_order: 1, created_at: "now", updated_at: "now" }],
    }));
    const svc = new AdminTodosService(pool);
    const todo = await svc.create({ title: "New item" });
    expect(todo.id).toBe(2);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO admin_todos"), ["New item", null, null, null, null, null]);
  });

  it("updateStatus() returns null when no row matched", async () => {
    const pool = fakePool(async () => ({ rows: [] }));
    const svc = new AdminTodosService(pool);
    expect(await svc.updateStatus(999, "done")).toBeNull();
  });

  it("remove() deletes by id", async () => {
    const pool = fakePool();
    const svc = new AdminTodosService(pool);
    await svc.remove(5);
    expect(pool.query).toHaveBeenCalledWith("DELETE FROM admin_todos WHERE id = $1", [5]);
  });
});
