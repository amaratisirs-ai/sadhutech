import { getLatestNews } from "@/src/news-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ items: await getLatestNews() }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ items: [], error: "News is temporarily unavailable" }, { status: 503 });
  }
}