export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readTime: string;
}

const ALL_POSTS: PostMeta[] = [
  {
    slug: "tree-felling-cost-kempton-park",
    title: "How Much Does Tree Felling Cost in Kempton Park? (2025 Guide)",
    date: "2025-06-01",
    excerpt:
      "Prices vary widely depending on tree size, access and species. Here's what you can realistically expect to pay for tree felling in Kempton Park and the East Rand.",
    tags: ["tree felling", "pricing", "Kempton Park"],
    readTime: "4 min read",
  },
  {
    slug: "why-remove-tree-stumps",
    title: "Why Stump Removal is Worth the Extra Cost",
    date: "2025-05-15",
    excerpt:
      "Many homeowners skip stump grinding to save money — then regret it. Here's what a leftover stump actually costs you over time.",
    tags: ["stump grinding", "stump removal", "advice"],
    readTime: "3 min read",
  },
  {
    slug: "emergency-tree-removal-what-to-do",
    title: "Storm Damage & Emergency Tree Removal: What to Do First",
    date: "2025-04-20",
    excerpt:
      "A tree falls on your property at 2 am. Here's the correct order of actions to stay safe and minimise damage while you wait for a crew.",
    tags: ["emergency", "storm damage", "safety"],
    readTime: "3 min read",
  },
];

export function getAllPosts(): PostMeta[] {
  return [...ALL_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPost(slug: string): PostMeta | undefined {
  return ALL_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return ALL_POSTS.map((p) => p.slug);
}
