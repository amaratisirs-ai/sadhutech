import type { NewsItem } from "./news-feed.js";

export const NEWS_PAGE_SIZE = 10;

export function getNewsPage(
  stories: NewsItem[],
  requestedPage: number,
  category: NewsItem["category"] | "All" = "All",
  publisher = "All"
) {
  const filtered = stories.filter((story) =>
    (category === "All" || story.category === category) &&
    (publisher === "All" || story.source === publisher)
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / NEWS_PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(requestedPage) || 1));
  const offset = (page - 1) * NEWS_PAGE_SIZE;

  return {
    items: filtered.slice(offset, offset + NEWS_PAGE_SIZE),
    page,
    pageCount,
    total: filtered.length,
    start: filtered.length === 0 ? 0 : offset + 1,
    end: Math.min(offset + NEWS_PAGE_SIZE, filtered.length),
  };
}