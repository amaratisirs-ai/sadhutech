import { afterEach, describe, expect, it, vi } from "vitest";
import { getLatestNews, parseNewsFeed } from "./news-feed.js";

const source = { name: "The Record", host: "therecord.media", category: "Security" as const };
const now = Date.parse("2026-10-02T12:00:00Z");
const feed = (items: string) => `<rss><channel>${items}</channel></rss>`;
const item = (title: string, link: string, date = "Thu, 01 Oct 2026 20:15:00 GMT") =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate></item>`;

afterEach(() => vi.restoreAllMocks());

describe("news feed", () => {
  it("only exposes recent, relevant stories from the configured publisher", () => {
    const xml = feed(
      item("Wallet phishing campaign", "https://therecord.media/wallet-phishing") +
      item("General technology news", "https://therecord.media/general") +
      item("Security breach", "https://other.example/breach") +
      item("Old ransomware", "https://therecord.media/old", "Mon, 01 Jun 2026 12:00:00 GMT") +
      item("Future security alert", "https://therecord.media/future", "Sat, 03 Oct 2026 12:00:00 GMT")
    );
    expect(parseNewsFeed(xml, source, now)).toEqual([{
      title: "Wallet phishing campaign",
      url: "https://therecord.media/wallet-phishing",
      source: "The Record",
      category: "Security",
      publishedAt: "2026-10-01T20:15:00.000Z",
    }]);
  });

  it("returns valid stories when another publisher fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("therecord.media")) return new Response(feed(item("New ransomware attack", "https://therecord.media/ransomware")));
      throw new Error("offline");
    }));
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      expect((await getLatestNews()).map((story) => story.title)).toEqual(["New ransomware attack"]);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});