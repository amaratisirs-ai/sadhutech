-- Admin-only build/roadmap tracker (todo list) shown on /admin/todos.
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
