import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, listPosts } from "@/src/blog";

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post ? `${post.title} — GENESIS` : "Article — GENESIS" };
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <Link href="/news" className="text-teal-300 hover:text-white hover:underline text-sm">
        ← Back to News &amp; Articles
      </Link>

      <header className="space-y-3 border-b border-slate-700 pb-6">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-bold uppercase tracking-wide text-teal-300 bg-teal-500/10 border border-teal-500/30 rounded-full px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{post.title}</h1>
        <p className="text-slate-400 text-sm">
          By {post.author} · {formatDate(post.pubDate)}
        </p>
      </header>

      <article
        className="prose prose-invert max-w-none text-slate-200 leading-relaxed space-y-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2 [&_strong]:text-white"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </div>
  );
}
