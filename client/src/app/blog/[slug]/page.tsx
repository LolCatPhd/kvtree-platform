import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSlugs, getPost } from "@/lib/posts";
import { ArrowRightIcon } from "@/components/icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

const contentModules: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  "tree-felling-cost-kempton-park": () =>
    import("@/content/blog/tree-felling-cost-kempton-park"),
  "why-remove-tree-stumps": () =>
    import("@/content/blog/why-remove-tree-stumps"),
  "emergency-tree-removal-what-to-do": () =>
    import("@/content/blog/emergency-tree-removal-what-to-do"),
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const loader = contentModules[slug];
  if (!loader) notFound();

  const { default: Content } = await loader();

  const dateFormatted = new Date(post.date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <section className="bg-forest-950 py-16 text-white sm:py-20">
        <div className="wrap max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-forest-300 hover:text-white transition-colors"
          >
            ← Back to blog
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium text-forest-200"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-forest-400">{post.readTime}</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-forest-400">
            KV Tree &middot; {dateFormatted}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="wrap max-w-3xl">
          <div className="blog-body text-forest-700">
            <Content />
          </div>

          <div className="mt-14 rounded-2xl bg-sand-50 p-8">
            <h2 className="font-display text-2xl font-semibold text-forest-900">
              Need a quote?
            </h2>
            <p className="mt-2 text-forest-600">
              Send us a photo and your address — we respond within 24 hours with a
              no-obligation estimate across Kempton Park and the East Rand.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-800"
            >
              Request a free quote <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
