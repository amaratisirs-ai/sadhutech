import { describe, expect, it } from "vitest";
import type { NewsItem } from "./news-feed.js";
import { getNewsPage } from "./news-pagination.js";

const stories: NewsItem[] = Array.from({ length: 25 }, (_, index) => ({
  title: `Security report ${index + 1}`,
  summary: "A recent security report.",
  url: `https://example.com/news/${index + 1}`,
  source: index % 2 === 0 ? "Decrypt" : "SecurityWeek",
  category: index % 2 === 0 ? "Crypto safety" : "Security",
  publishedAt: "2026-10-01T20:15:00.000Z",
}));

describe("news pagination", () => {
  it("shows ten stories per page without overlap", () => {
    const first = getNewsPage(stories, 1);
    const second = getNewsPage(stories, 2);
    expect(first.items).toEqual(stories.slice(0, 10));
    expect(second.items).toEqual(stories.slice(10, 20));
    expect(first).toMatchObject({ page: 1, pageCount: 3, total: 25, start: 1, end: 10 });
    expect(second).toMatchObject({ page: 2, start: 11, end: 20 });
  });

  it("shows the remaining stories on the last page", () => {
    expect(getNewsPage(stories, 3)).toMatchObject({
      items: stories.slice(20), page: 3, start: 21, end: 25,
    });
  });

  it("clamps out-of-range pages", () => {
    expect(getNewsPage(stories, 99).page).toBe(3);
    expect(getNewsPage(stories, -1).page).toBe(1);
    expect(getNewsPage(stories, Number.NaN).page).toBe(1);
  });

  it("filters by category and publisher before paginating", () => {
    const result = getNewsPage(stories, 1, "Crypto safety", "Decrypt");
    expect(result.total).toBe(13);
    expect(result.items).toHaveLength(10);
    expect(result.items.every((story) => story.category === "Crypto safety" && story.source === "Decrypt")).toBe(true);
    expect(getNewsPage(stories, 3, "Security").page).toBe(2);
    expect(getNewsPage(stories, 1, "All", "SecurityWeek").total).toBe(12);
  });

  it("handles empty feeds and filters with no matches", () => {
    expect(getNewsPage([], 1)).toEqual({ items: [], page: 1, pageCount: 1, total: 0, start: 0, end: 0 });
    expect(getNewsPage(stories, 1, "Security", "Decrypt").total).toBe(0);
  });
});