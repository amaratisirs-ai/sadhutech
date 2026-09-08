import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/settings",
        "/api/",
        "/verify",
        "/unsubscribe",
        "/connected",
        "/response",
        "/after-install",
        "/extension-connect",
        "/transaction-check",
        "/check",
        "/report",
        "/add-to-wallet",
      ],
    },
    sitemap: "https://sadhutech.com/sitemap.xml",
  };
}
