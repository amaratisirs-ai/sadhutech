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
      summary: "",
      url: "https://therecord.media/wallet-phishing",
      source: "The Record",
      category: "Security",
      publishedAt: "2026-10-01T20:15:00.000Z",
    }]);
  });

  it("decodes publisher headline entities as plain text", () => {
    const xml = feed(item("Security training isn&amp;#8217;t dead &amp;amp; needs &amp;quot;context&amp;quot;", "https://therecord.media/training"));
    expect(parseNewsFeed(xml, source, now)[0].title).toBe('Security training isn\u2019t dead & needs "context"');
  });

  it("extracts a short plain-text excerpt without images or publisher boilerplate", () => {
    const description = `<p><img src="https://example.com/cover.jpg" alt="Cover"></p><p>Summary Attackers used a fake site &amp; stolen credentials to target users.</p><p>The post <a href="https://therecord.media/attack">Security report</a> appeared first on The Record.</p>`;
    const xml = feed(`<item><title>Security attack report</title><link>https://therecord.media/attack</link><pubDate>Thu, 01 Oct 2026 20:15:00 GMT</pubDate><description><![CDATA[${description}]]></description></item>`);
    expect(parseNewsFeed(xml, source, now)[0].summary).toBe("Attackers used a fake site & stolen credentials to target users.");

    const longDescription = "Attackers targeted wallets with phishing links. ".repeat(12);
    const longXml = feed(`<item><title>Wallet phishing</title><link>https://therecord.media/wallets</link><pubDate>Thu, 01 Oct 2026 20:15:00 GMT</pubDate><description>${longDescription}</description></item>`);
    const summary = parseNewsFeed(longXml, source, now)[0].summary;
    expect(summary.length).toBeLessThanOrEqual(223);
    expect(summary).toMatch(/\.\.\.$/);
  });

  it.each([
    { name: "Decrypt", url: "https://decrypt.co/feed", host: "decrypt.co", category: "Crypto safety" },
    { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", host: "thehackernews.com", category: "Security" },
    { name: "SecurityWeek", url: "https://www.securityweek.com/feed/", host: "www.securityweek.com", category: "Security" },
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", host: "krebsonsecurity.com", category: "Security" },
  ])("loads $name stories only from its HTTPS publisher domain", async (publisher) => {
    const storyUrl = `https://${publisher.host}/wallet-phishing`;
    const fetchMock = vi.fn(async (url: string) => {
      if (url !== publisher.url) throw new Error("offline");
      return new Response(feed(
        item("Wallet phishing campaign", storyUrl) +
        item("Wallet phishing campaign", storyUrl) +
        item("Security breach", `https://${publisher.host}.example/breach`) +
        item("Security alert", `http://${publisher.host}/alert`) +
        item("General technology news", `https://${publisher.host}/general`)
      ));
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      expect(await getLatestNews()).toEqual([{
        title: "Wallet phishing campaign",
        summary: "",
        url: storyUrl,
        source: publisher.name,
        category: publisher.category,
        publishedAt: "2026-10-01T20:15:00.000Z",
      }]);
      expect(fetchMock).toHaveBeenCalledWith(publisher.url, expect.objectContaining({
        next: { revalidate: 900 },
      }));
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it("keeps up to 100 recent stories for ten-story pagination", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (!url.includes("therecord.media")) throw new Error("offline");
      return new Response(feed(Array.from({ length: 105 }, (_, index) =>
        item(`Security report ${index}`, `https://therecord.media/report-${index}`)
      ).join("")));
    }));
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      expect(await getLatestNews()).toHaveLength(100);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
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