import fs from "node:fs";
import path from "node:path";

// content/blog lives at the repo root, two levels up from packages/site (this package's cwd).
const BLOG_DIR = path.join(process.cwd(), "..", "..", "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author: string;
  tags: string[];
  featured: boolean;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
}

interface BlogIndexEntry {
  slug: string;
  featured?: boolean;
}

function readIndex(): BlogIndexEntry[] {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, "index.json"), "utf-8");
    const parsed = JSON.parse(raw) as { posts?: BlogIndexEntry[] };
    return parsed.posts ?? [];
  } catch {
    return [];
  }
}

// Frontmatter here is a flat, hand-written subset of YAML: quoted strings, a
// bracketed string array (tags), and one boolean (draft) - a full YAML parser
// isn't needed for content we author ourselves.
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, frontmatter, body] = match;
  const data: Record<string, unknown> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (value === "true" || value === "false") {
      data[key] = value === "true";
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body: body.trim() };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal markdown -> HTML for our own hand-authored posts (headings, bold,
// italic, paragraphs, bullet lists). Not a general-purpose renderer.
function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const htmlBlocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  const flushParagraph = () => {
    if (paragraph.length) {
      htmlBlocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      htmlBlocks.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    const listItem = line.match(/^-\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      htmlBlocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
    } else if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return htmlBlocks.join("\n");
}

function loadPost(slug: string, featured: boolean): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), "utf-8");
    const { data, body } = parseFrontmatter(raw);
    if (data.draft) return null;
    return {
      slug: (data.slug as string) || slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      pubDate: (data.pubDate as string) || "",
      author: (data.author as string) || "GENESIS",
      tags: (data.tags as string[]) || [],
      featured,
      html: renderMarkdown(body),
    };
  } catch {
    return null;
  }
}

export function listPosts(): BlogPostMeta[] {
  return readIndex()
    .map((entry) => loadPost(entry.slug, !!entry.featured))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.featured === b.featured ? b.pubDate.localeCompare(a.pubDate) : a.featured ? -1 : 1))
    .map(({ html, ...meta }) => meta);
}

export function getPost(slug: string): BlogPost | null {
  const entry = readIndex().find((e) => e.slug === slug);
  return loadPost(slug, !!entry?.featured);
}
