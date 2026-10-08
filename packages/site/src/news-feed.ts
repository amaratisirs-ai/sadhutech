import { XMLParser } from "fast-xml-parser";
import { convert } from "html-to-text";

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  category: "Crypto safety" | "Security";
  publishedAt: string;
}

const sources = [
  { name: "Chainalysis", url: "https://www.chainalysis.com/blog/feed/", host: "www.chainalysis.com", category: "Crypto safety" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss/tag/security", host: "cointelegraph.com", category: "Crypto safety" },
  { name: "Decrypt", url: "https://decrypt.co/feed", host: "decrypt.co", category: "Crypto safety" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", host: "www.bleepingcomputer.com", category: "Security" },
  { name: "The Record", url: "https://therecord.media/feed", host: "therecord.media", category: "Security" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", host: "thehackernews.com", category: "Security" },
  { name: "SecurityWeek", url: "https://www.securityweek.com/feed/", host: "www.securityweek.com", category: "Security" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/", host: "krebsonsecurity.com", category: "Security" },
] as const;

const relevant = /hack|breach|exploit|vulnerab|phish|scam|fraud|ransomware|malware|wallet|drain|theft|stolen|steal|attack|security|zero.day|compromis|launder|sanction|backdoor|credential|data leak|data expos|cyberattack/i;
const parser = new XMLParser({ ignoreAttributes: false });

function summarize(description: unknown): string {
  if (typeof description !== "string") return "";
  const text = convert(description, { wordwrap: false, selectors: [
    { selector: "img", format: "skip" },
    { selector: "a", options: { ignoreHref: true } },
    { selector: "p", options: { leadingLineBreaks: 0, trailingLineBreaks: 0 } },
  ] }).split(/The post .+ appeared first on /i)[0]
    .replace(/\s+/g, " ").replace(/\s*\[\.\.\.\]\s*$/, "").trim().replace(/^Summary\s+/i, "");
  if (text.length <= 220) return text;
  return `${text.slice(0, 220).replace(/\s+\S*$/, "").trimEnd()}...`;
}

export function parseNewsFeed(xml: string, source: { name: string; host: string; category: NewsItem["category"] }, now = Date.now()): NewsItem[] {
  const channel = parser.parse(xml)?.rss?.channel;
  const items = channel?.item;
  if (!items) return [];
  return (Array.isArray(items) ? items : [items]).flatMap((item: Record<string, unknown>) => {
    if (typeof item.title !== "string" || typeof item.link !== "string" || typeof item.pubDate !== "string") return [];
    const title = convert(item.title, { wordwrap: false }).trim();
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
    return [{ title, summary: summarize(item.description), url: url.toString(), source: source.name, category: source.category, publishedAt: publishedAt.toISOString() }];
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
    .slice(0, 100);
}