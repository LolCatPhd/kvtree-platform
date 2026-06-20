import type { Metadata } from "next";
import Link from "next/link";
import Gallery from "./gallery";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "A selection of recent KV Tree projects — tree felling, stump grinding, site clearing, pruning and emergency response across the East Rand.",
  alternates: { canonical: "/portfolio" },
};

export default function Portfolio() {
  return (
    <>
      <section className="bg-forest-950 py-20 text-white sm:py-24">
        <div className="wrap max-w-3xl">
          <span className="eyebrow text-lime-accent">Our work</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Recent projects across the East Rand
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-forest-100">
            A selection of our tree felling, stump grinding, site clearing and emergency work around
            Kempton Park and the surrounding suburbs.
          </p>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="wrap">
          <Gallery />
        </div>
      </section>

      <section className="bg-sand-50 py-16">
        <div className="wrap flex flex-col items-center gap-5 text-center">
          <h2 className="font-display text-3xl font-semibold text-forest-900">Your project could be next</h2>
          <p className="max-w-xl text-forest-600">
            Tell us what you need and we&apos;ll provide a free, no-obligation quote — usually within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-7 py-3.5 font-semibold text-white transition hover:bg-forest-800"
          >
            Request a free quote <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
