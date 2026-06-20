import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Fraunces } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthProvider } from "@/lib/auth";
import { SITE_URL, localBusinessJsonLd } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Elegant serif for display headings — gives the brand a premium, crafted feel.
const fraunces = Fraunces({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KV Tree — Tree Felling & Stump Removal Experts in Kempton Park",
    template: "%s | KV Tree",
  },
  description:
    "Certified, fully-insured tree felling, stump grinding, site clearing, pruning and 24/7 emergency tree care across Kempton Park and the greater East Rand.",
  keywords: [
    "tree felling Kempton Park",
    "stump grinding East Rand",
    "tree removal Johannesburg",
    "arborist Kempton Park",
    "emergency tree service",
  ],
  openGraph: {
    title: "KV Tree — Tree Felling & Stump Removal Experts",
    description:
      "Certified, fully-insured tree care across Kempton Park and the greater East Rand. Free quotes within 24 hours.",
    url: SITE_URL,
    siteName: "KV Tree",
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "KV Tree — Tree Felling & Stump Removal Experts",
    description:
      "Certified, fully-insured tree care across Kempton Park and the greater East Rand. Free quotes within 24 hours.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-forest-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
        />
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
