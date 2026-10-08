"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { withGenesisStyle } from "@/components/Genesis";
import { Icon } from "@/components/Icon";
import type { NewsItem } from "@/src/news-feed";
import { getNewsPage } from "@/src/news-pagination";

type Tab = "news" | "threats" | "articles" | "tips" | "stats";

interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author: string;
  tags: string[];
  featured: boolean;
}

interface Threat {
  address: string;
  category: string;
  severity: "high" | "medium" | "low";
  reports: number;
  reporters: number;
  firstSeen: string;
  lastSeen: string;
  trusted: boolean;
  hoursOld: number;
}

interface ThreatsLatestResponse {
  timestamp: string;
  parameters: { limit: number; offset: number; hoursBack: number };
  pagination: { offset: number; limit: number; total: number; hasMore: boolean };
  stats: { total: number; returned: number; byCategory: Record<string, number> };
  threats: Threat[];
}

const categoryInfo = {
  drainer: {
    color: "bg-red-500/20 text-red-300 border-red-500/20",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Wallet Drainer",
    description: "Exploits designed to drain wallet funds",
  },
  "malicious-contract": {
    color: "bg-orange-500/20 text-orange-300 border-orange-500/20",
    icon: "M12 9v2m0 4v2m0 5v.01M7.08 6.24l1.41 1.41m2.83-2.83l1.41-1.41m4.24 4.24l1.41 1.41m2.83-2.83l1.41-1.41M7.08 17.76l1.41-1.41m2.83 2.83l1.41 1.41m4.24-4.24l1.41-1.41m2.83 2.83l1.41 1.41",
    label: "Malicious Contract",
    description: "Code designed to steal funds or exploit tokens",
  },
  "decoy-tripwire": {
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/20",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    label: "Decoy/Honeypot",
    description: "Fake tokens or contracts that trap users",
  },
  phishing: {
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/20",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    label: "Phishing",
    description: "Social engineering attacks and scams",
  },
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatPostDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const PAGE_SIZE = 25; // Load 25 threats per page

export default function NewsPage() {
  const [allThreats, setAllThreats] = useState<Threat[]>([]); // Accumulated threats
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<number>(168);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [newsPage, setNewsPage] = useState(1);
  const [newsCategory, setNewsCategory] = useState<NewsItem["category"] | "All">("All");
  const [newsPublisher, setNewsPublisher] = useState("All");
  const [newsReload, setNewsReload] = useState(0);
  const newsSection = useRef<HTMLElement>(null);

  // Fetch threats with pagination
  const fetchThreats = async (fetchOffset: number = 0) => {
    try {
      if (fetchOffset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const gateUrl = process.env.NEXT_PUBLIC_GATE_URL || "https://genesis-gate.onrender.com";
      const url = new URL(`${gateUrl}/v1/threats/latest`);
      url.searchParams.set("limit", PAGE_SIZE.toString());
      url.searchParams.set("offset", fetchOffset.toString());
      url.searchParams.set("hours", timeWindow.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const json: ThreatsLatestResponse = await response.json();

      // On initial load, reset. On "Load More", append.
      if (fetchOffset === 0) {
        setAllThreats(json.threats);
      } else {
        setAllThreats((prev) => [...prev, ...json.threats]);
      }

      setStats(json.stats);
      setOffset(fetchOffset + json.threats.length);
      setHasMore(json.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load threats");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch when component mounts or timeWindow changes
  useEffect(() => {
    if (activeTab !== "threats") return;
    setOffset(0);
    setAllThreats([]);
    setHasMore(true);
    fetchThreats(0);
  }, [timeWindow, activeTab]);

  // Articles come from our own content/blog markdown files, not the gate API.
  useEffect(() => {
    fetch("/api/blog")
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((j) => setPosts(j.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/news", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("News unavailable");
        return response.json();
      })
      .then((data: { items: NewsItem[] }) => {
        if (!controller.signal.aborted) setNews(data.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setNewsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setNewsLoading(false);
      });
    return () => controller.abort();
  }, [newsReload]);

  // Load more handler
  const handleLoadMore = () => {
    fetchThreats(offset);
  };

  const filteredThreats = filter ? allThreats.filter((t) => t.category === filter) : allThreats;
  const newsResults = getNewsPage(news, newsPage, newsCategory, newsPublisher);
  const publishers = [...new Set(news.map((story) => story.source))].sort();

  const changeNewsPage = (page: number) => {
    setNewsPage(page);
    newsSection.current?.focus({ preventScroll: true });
    newsSection.current?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Icon name="newspaper" className="h-7 w-7 shrink-0 text-teal-400" />
          <h1 className="text-3xl font-bold text-white sm:text-4xl">News &amp; Articles</h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          The latest in crypto safety and cybersecurity. Independent reporting, GENESIS research, and practical perspectives.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 border-b border-slate-700 sm:flex" role="group" aria-label="News and research">
        {[
          { id: "news" as Tab, label: "Latest News", icon: "newspaper" },
          { id: "articles" as Tab, label: "Articles & Research", icon: "document" },
          { id: "tips" as Tab, label: "Safety Tips", icon: "shield" },
        ].map((tab) => (
          <button
            key={tab.id}
            aria-pressed={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFilter(null);
            }}
            className={`flex min-h-14 items-center justify-center gap-2 border-b-2 px-2 py-3 text-xs font-semibold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-teal-400 sm:px-5 sm:text-sm ${
              activeTab === tab.id
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            <Icon name={tab.icon} className="hidden h-4 w-4 shrink-0 sm:block" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "news" && (
        <section ref={newsSection} tabIndex={-1} className="scroll-mt-28 space-y-6" aria-labelledby="latest-news-heading" aria-busy={newsLoading}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-teal-400">Security briefing</p>
              <h2 id="latest-news-heading" className="text-2xl font-semibold text-white">Latest headlines</h2>
            </div>
            {!newsLoading && !newsError && (
              <p className="text-xs text-slate-400">{news.length} stories <span aria-hidden="true">/</span> {publishers.length} publishers</p>
            )}
          </div>

          <div className="flex flex-col gap-4 border-y border-slate-700/80 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="News category" className="grid grid-cols-3 gap-1 rounded-md bg-slate-900/70 p-1 sm:flex">
              {(["All", "Crypto safety", "Security"] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={newsCategory === category}
                  onClick={() => { setNewsCategory(category); setNewsPage(1); }}
                  className={`min-h-10 rounded px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-teal-400 sm:text-sm ${newsCategory === category ? "bg-teal-400 text-slate-950" : "text-slate-300 hover:bg-slate-700"}`}
                >
                  {category === "All" ? "All news" : category}
                </button>
              ))}
            </div>
            <select
              aria-label="News publisher"
              value={newsPublisher}
              onChange={(event) => { setNewsPublisher(event.target.value); setNewsPage(1); }}
              className="min-h-11 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 focus-visible:outline-2 focus-visible:outline-teal-400 sm:w-52"
            >
              <option value="All">All publishers</option>
              {publishers.map((publisher) => <option key={publisher} value={publisher}>{publisher}</option>)}
            </select>
          </div>

          {newsLoading && (
            <div role="status" className="divide-y divide-slate-700/60">
              <span className="sr-only">Loading latest news...</span>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} aria-hidden="true" className="space-y-3 py-6 motion-safe:animate-pulse">
                  <div className="h-3 w-36 rounded bg-slate-700" />
                  <div className="h-5 w-4/5 rounded bg-slate-700" />
                  <div className="h-3 w-3/5 rounded bg-slate-800" />
                </div>
              ))}
            </div>
          )}
          {newsError && (
            <div role="alert" className="flex flex-col items-start gap-3 border-l-2 border-amber-400 py-4 pl-5">
              <p className="text-sm text-slate-300">News feeds are temporarily unavailable.</p>
              <button type="button" onClick={() => { setNewsError(false); setNewsLoading(true); setNewsReload((value) => value + 1); }} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-teal-400">
                <Icon name="refresh" className="h-4 w-4" /> Try again
              </button>
            </div>
          )}
          {!newsLoading && !newsError && newsResults.total === 0 && (
            <div className="py-10 text-center">
              <Icon name="newspaper" className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="font-medium text-slate-200">{news.length === 0 ? "No recent stories right now" : "No stories match these filters"}</p>
              {news.length > 0 && <button type="button" onClick={() => { setNewsCategory("All"); setNewsPublisher("All"); setNewsPage(1); }} className="mt-3 min-h-11 text-sm font-semibold text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-400">Clear filters</button>}
            </div>
          )}

          {!newsLoading && !newsError && newsResults.total > 0 && (
            <>
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400" role="status" aria-live="polite">
                <span>{newsResults.start}-{newsResults.end} of {newsResults.total} stories</span>
                <span>Newest first</span>
              </div>
              <div className="divide-y divide-slate-700/70 border-b border-slate-700/70">
                {newsResults.items.map((story, index) => (
                  <article key={story.url} data-news-story className="group py-6">
                    <a href={story.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-400 sm:gap-6">
                      <span aria-hidden="true" className="hidden w-7 shrink-0 pt-1 font-mono text-sm text-slate-500 sm:block">{String(newsResults.start + index).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                          <span className="inline-flex items-center gap-2 font-semibold text-slate-200">
                            <Image src={`https://www.google.com/s2/favicons?domain=${new URL(story.url).hostname}&sz=64`} width={18} height={18} alt="" unoptimized className="h-[18px] w-[18px] rounded-sm object-contain" />
                            {story.source}
                          </span>
                          <span className={story.category === "Crypto safety" ? "text-teal-300" : "text-amber-300"}>{story.category}</span>
                          <time dateTime={story.publishedAt} className="text-slate-400">{new Date(story.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
                        </div>
                        <h3 className="max-w-3xl break-words text-lg font-semibold leading-snug text-white transition-colors group-hover:text-teal-300 sm:text-xl">{story.title}</h3>
                        {story.summary && <p className="mt-2 max-w-3xl break-words text-sm leading-relaxed text-slate-400">{story.summary}</p>}
                      </div>
                      <Icon name="arrowRight" className="mt-1 h-5 w-5 shrink-0 -rotate-45 text-slate-500 transition-colors group-hover:text-teal-300" />
                    </a>
                  </article>
                ))}
              </div>
              <nav aria-label="News pagination" className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-400">Page {newsResults.page} of {newsResults.pageCount}</p>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous news page" title="Previous news page" disabled={newsResults.page === 1} onClick={() => changeNewsPage(newsResults.page - 1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-600 text-slate-200 transition-colors hover:border-teal-400 hover:text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-400 disabled:cursor-not-allowed disabled:opacity-30">
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                  </button>
                  <select aria-label="News page" value={newsResults.page} onChange={(event) => changeNewsPage(Number(event.target.value))} className="h-11 rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 focus-visible:outline-2 focus-visible:outline-teal-400">
                    {Array.from({ length: newsResults.pageCount }, (_, index) => <option key={index + 1} value={index + 1}>Page {index + 1}</option>)}
                  </select>
                  <button type="button" aria-label="Next news page" title="Next news page" disabled={newsResults.page === newsResults.pageCount} onClick={() => changeNewsPage(newsResults.page + 1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-600 text-slate-200 transition-colors hover:border-teal-400 hover:text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-400 disabled:cursor-not-allowed disabled:opacity-30">
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </button>
                </div>
              </nav>
              <p className="border-t border-slate-700/60 pt-4 text-xs text-slate-500">Independent reporting. Links open the original publisher; GENESIS does not independently verify these stories.</p>
            </>
          )}
        </section>
      )}

      {/* Tab: Breaking Threats */}
      {activeTab === "threats" && (
        <div className="space-y-6">
          {loading && <p className="text-slate-400">Loading latest threats...</p>}
          {error && <p role="alert" className="text-red-300">Failed to load threats: {error}</p>}
          {!loading && !error && allThreats.length === 0 && (
            <p className="text-slate-400">No threats detected in the past {timeWindow / 24} days.</p>
          )}
          {/* Time Window Filter */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700">
            <span className="text-sm font-medium text-slate-400">Time:</span>
            {[24, 72, 168, 720].map((hours) => (
              <button
                key={hours}
                onClick={() => setTimeWindow(hours)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeWindow === hours
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {hours === 24 ? "1d" : hours === 72 ? "3d" : hours === 168 ? "7d" : "30d"}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/30 rounded-lg border border-slate-700 p-4">
                <div className="text-sm text-slate-400 mb-1">Total in Database</div>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-slate-900/30 rounded-lg border border-slate-700 p-4">
                <div className="text-sm text-slate-400 mb-1">Loaded So Far</div>
                <div className="text-3xl font-bold text-white">{allThreats.length}</div>
              </div>
              <div className="bg-slate-900/30 rounded-lg border border-slate-700 p-4">
                <div className="text-sm text-slate-400 mb-1">High Severity</div>
                <div className="text-3xl font-bold text-red-600">{allThreats.filter((t) => t.severity === "high").length}</div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          {stats && (
            <div className="bg-slate-900/30 rounded-lg border border-slate-700 p-6">
              <h2 className="font-semibold text-white mb-4">Filter by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <button
                    key={category}
                    onClick={() => setFilter(filter === category ? null : category)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      filter === category
                        ? (categoryInfo[category as keyof typeof categoryInfo]?.color || "bg-slate-700")
                        : "bg-slate-800 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="font-medium text-sm">{categoryInfo[category as keyof typeof categoryInfo]?.label || category}</div>
                    <div className="text-xs opacity-70 mt-1">{count} threats</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Threat Cards */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">
                {filter ? `${categoryInfo[filter as keyof typeof categoryInfo]?.label} (${filteredThreats.length})` : `Latest Threats (${filteredThreats.length})`}
              </h3>
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
            {filteredThreats.map((threat) => {
              const info = categoryInfo[threat.category as keyof typeof categoryInfo];
              const severityColor =
                threat.severity === "high"
                  ? "bg-red-500/20 text-red-300"
                  : threat.severity === "medium"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-green-500/20 text-green-300";
              return (
                <div key={threat.address} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {info && (
                      <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${info.color}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={info.icon} />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 mb-1">
                        <div className="font-mono text-sm font-semibold text-white">{truncateAddress(threat.address)}</div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${severityColor}`}>{threat.severity.toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">{info?.label || threat.category}</div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Reports</span> <span className="font-semibold text-white">{threat.reports}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Reporters</span> <span className="font-semibold text-white">{threat.reporters}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">First Seen</span> <span className="text-slate-300">{formatTime(threat.firstSeen)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Last Seen</span> <span className="text-slate-300">{formatTime(threat.lastSeen)}</span>
                        </div>
                      </div>
                      {threat.trusted && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-medium">
                          ✓ Verified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    `Load More (${allThreats.length}/${stats?.total || 0})`
                  )}
                </button>
              </div>
            )}

            {!hasMore && allThreats.length > 0 && (
              <div className="text-center py-4 text-slate-400">
                ✓ All {allThreats.length} threats loaded
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Articles */}
      {activeTab === "articles" && (
        <div className="space-y-4">
          {postsLoading && <p className="text-slate-400">Loading articles…</p>}
          {!postsLoading && posts.length === 0 && (
            <p className="text-slate-400">No articles published yet.</p>
          )}
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`/news/${post.slug}`}
              className="block bg-slate-900/30 border border-slate-700 rounded-lg p-4 hover:shadow-md hover:border-indigo-500 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-semibold text-white">
                  {post.featured && <span className="mr-2 text-xs font-bold uppercase tracking-wide text-indigo-500">Featured</span>}
                  {post.title}
                </h3>
                <span className="text-xs text-slate-500 flex-shrink-0">{formatPostDate(post.pubDate)}</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{post.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">{post.author}</span>
                <span className="text-indigo-400 text-sm font-semibold">Read →</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Tab: Tips */}
      {activeTab === "tips" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <Icon name="link" className="w-6 h-6" />, title: "Open the official site yourself", desc: "Type a known address or use a saved bookmark. Do not trust a sponsored search result or DM link." },
            { icon: <Icon name="key" className="w-6 h-6" />, title: "Keep recovery phrases offline", desc: "Never type a seed phrase into a website or send it to support. No legitimate claim requires it." },
            { icon: <Icon name="warning" className="w-6 h-6" />, title: "Read the spender and amount", desc: "Before approving a token, check the contract address and whether the allowance is unlimited." },
            { icon: <Icon name="document" className="w-6 h-6" />, title: "Inspect gasless signatures", desc: "A free-to-sign permit can still grant spending rights. Read the domain, spender, value, and deadline." },
            { icon: <Icon name="wallet" className="w-6 h-6" />, title: "Review old permissions", desc: "Inspect token and NFT approvals with a trusted explorer; revoke permissions you no longer need." },
            { icon: <Icon name="globe" className="w-6 h-6" />, title: "Check the network", desc: "Confirm the chain and destination address in your wallet, not just in the website's preview." },
            { icon: <Icon name="search" className="w-6 h-6" />, title: "Verify urgent news", desc: "Cross-check incident instructions against the project's official site before signing a rescue transaction." },
            { icon: <Icon name="lock" className="w-6 h-6" />, title: "Use a separate wallet", desc: "Keep long-term holdings apart from the wallet you use to try unfamiliar apps." },
            { icon: <Icon name="refresh" className="w-6 h-6" />, title: "Update devices and wallets", desc: "Install browser, OS, and wallet updates from their official channels, not pop-up prompts." },
            { icon: <Icon name="block" className="w-6 h-6" />, title: "Stop when pressured", desc: "Scammers use fake deadlines. Pause and verify independently before signing or transferring funds." },
            { icon: <Icon name="shield" className="w-6 h-6" />, title: "Check before signing", desc: "Use a transaction checker for another view of the action; a clean result is not proof of safety." },
            { icon: <Icon name="bell" className="w-6 h-6" />, title: "Act on a compromised key", desc: "If a recovery phrase was exposed, create a new wallet and move remaining assets. Revoking approvals is not enough." },
          ].map((tip, i) => (
            <div key={i} className="bg-slate-900/30 border border-slate-700 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-teal-400 flex-shrink-0">{tip.icon}</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{withGenesisStyle(tip.title)}</h3>
                  <p className="text-sm text-slate-400">{tip.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Statistics */}
      {activeTab === "stats" && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Total Database</div>
              <div className="text-3xl font-bold text-white">4,122</div>
              <div className="text-xs text-slate-500 mt-1">All time threats</div>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Loaded</div>
              <div className="text-3xl font-bold text-white">{allThreats.length}</div>
              <div className="text-xs text-slate-500 mt-1">Recent threats</div>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Categories</div>
              <div className="text-3xl font-bold text-white">{Object.keys(stats.byCategory).length}</div>
              <div className="text-xs text-slate-500 mt-1">Types detected</div>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">High Risk</div>
              <div className="text-3xl font-bold text-red-600">{allThreats.filter((t) => t.severity === "high").length}</div>
              <div className="text-xs text-slate-500 mt-1">Verified exploits</div>
            </div>
          </div>

          {/* Category Chart */}
          <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-6">
            <h3 className="font-semibold text-white mb-4">Breakdown by Category</h3>
            <div className="space-y-3">
              {Object.entries(stats.byCategory).map(([category, count]) => {
                const percentage = (count / stats.total) * 100;
                const colors: Record<string, string> = {
                  drainer: "bg-red-500",
                  "malicious-contract": "bg-orange-500",
                  "decoy-tripwire": "bg-indigo-500",
                  phishing: "bg-cyan-500",
                };
                return (
                  <div key={category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-300">
                        {categoryInfo[category as keyof typeof categoryInfo]?.label || category}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`h-full rounded-full transition-all ${colors[category] || "bg-slate-500"}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
