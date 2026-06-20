import type { Metadata } from "next";

// The contact page itself is a Client Component (forms, uploads, Places
// autocomplete), so its SEO metadata lives here on the route segment instead.
export const metadata: Metadata = {
  title: "Contact & Free Quote",
  description:
    "Request a free tree-felling quote within 24 hours. Call KV Tree on +27 83 302 2877 or send photos of your site for an accurate estimate across Kempton Park and the East Rand.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
