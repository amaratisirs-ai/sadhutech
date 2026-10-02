import { XMLParser } from "fast-xml-parser";

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: "Crypto safety" | "Security";
  publishedAt: string;
}

const sources = [
  { name: "Chainalysis", url: "https://www.chainalysis.com/blog/feed/", host: "www.chainalysis.com", category: "Crypto safety" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss/tag/security", host: "cointelegraph.com", category: "Crypto safety" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", host: "www.bleepingcomputer.com", category: "Security" },
  { name: "The Record", url: "https://therecord.media/feed", host: "therecord.media", category: "Security" },
] as const;

const relevant = /hack|breach|exploit|vulnerab|phish|scam|fraud|ransomware|malware|wallet|drain|theft|stolen|steal|attack|security|zero.day|compromis|launder|sanction|backdoor|credential|data leak|data expos|cyberattack/i;
const parser = new XMLParser({ ignoreAttributes: false });

export function parseNewsFeed(xml: string, source: { name: string; host: string; category: NewsItem["category"] }, now = Date.now()): NewsItem[] {
  const channel = parser.parse(xml)?.rss?.channel;
  const items = channel?.item;
  if (!items) return [];
  return (Array.isArray(items) ? items : [items]).flatMap((item: Record<string, unknown>) => {
    if (typeof item.title !== "string" || typeof item.link !== "string" || typeof item.pubDate !== "string") return [];
    const title = item.title.trim().replace(/&#(?:0*38|x0*26);/gi, "&");
    const publishedAt = new Date(item.pubDate);
    let url: URL;
    try {
      url = new URL(item.link);
    } catch {
      return [];
    }
    if (!relevant.test(title) || url.protocol !== "https:" || url.hostname !== source.host ||
        !Number.isFinite(publishedAt.getTime()) || publishedAt.getTime() > now ||
        now - publishedAt.getTime() > 30 * 24 * 60 * 60 * 1000) return [];
    return [{ title, url: url.toString(), source: source.name, category: source.category, publishedAt: publishedAt.toISOString() }];
  });
}

export async function getLatestNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(sources.map(async (source) => {
    const response = await fetch(source.url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`${source.name} feed unavailable`);
    return parseNewsFeed(await response.text(), source);
  }));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  if (results.every((result) => result.status === "rejected")) throw new Error("News feeds unavailable");
  return [...new Map(items.map((item) => [item.url, item])).values()]
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
    .slice(0, 24);
}