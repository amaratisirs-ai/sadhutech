import type { MetadataRoute } from "next";

const SITE_URL = "https://sadhutech.com";

// Static, publicly-indexable marketing/content routes. Deliberately excludes
// functional/callback pages (verify, unsubscribe, connected, response,
// after-install, extension-connect, admin, settings) — see robots.ts.
const STATIC_ROUTES = [
  "",
  "/products",
  "/pricing",
  "/pro",
  "/demo",
  "/threats",
  "/news",
  "/community",
  "/developers",
  "/help",
  "/partners",
  "/extension",
  "/snap-install",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/threats" || route === "/news" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}

