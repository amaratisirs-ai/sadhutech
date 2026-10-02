import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.restoreAllMocks());

describe("published security research", () => {
  it("lists and renders the new articles", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(fileURLToPath(new URL("../", import.meta.url)));
    vi.resetModules();
    const { getPost, listPosts } = await import("./blog.js");

    const slugs = ["read-token-approvals", "phishing-response-playbook", "read-security-incident-reports"];
    const posts = listPosts();
    expect(posts).toHaveLength(6);
    for (const slug of slugs) {
      expect(posts.some((post) => post.slug === slug)).toBe(true);
      expect(getPost(slug)?.html).toContain("<h2>");
    }
  });
});