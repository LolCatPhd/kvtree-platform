import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Tree Care Blog",
  description:
    "Practical advice on tree felling, stump removal, pruning and emergency tree care from KV Tree's certified arborists in Kempton Park.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <>
      <section className="bg-forest-950 py-20 text-white sm:py-24">
        <div className="wrap max-w-3xl">
          <span className="eyebrow text-lime-accent">Tree care advice</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            The KV Tree blog
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-forest-100">
            Practical guides on tree felling costs, stump removal, storm damage and more —
            written by our arborists for Kempton Park and East Rand homeowners.
          </p>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="wrap max-w-3xl">
          <div className="divide-y divide-forest-100">
            {posts.map((post) => (
              <article key={post.slug} className="py-10 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-forest-50 px-3 py-0.5 text-xs font-medium text-forest-700"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-forest-400">{post.readTime}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-semibold text-forest-900 sm:text-3xl">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-forest-600 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-forest-600">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800 hover:text-forest-600 transition-colors"
                >
                  Read article <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
