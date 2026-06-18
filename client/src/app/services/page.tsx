import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/services";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Tree felling, stump grinding, site clearing, pruning, wood sales and 24/7 emergency tree care across Kempton Park and the East Rand.",
};

export default function Services() {
  return (
    <>
      {/* Hero */}
      <section className="bg-forest-950 py-20 text-white sm:py-24">
        <div className="wrap max-w-3xl">
          <span className="eyebrow text-lime-accent">Our services</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Professional tree care, end to end
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-forest-100">
            Whatever the job — a single hazardous limb or an entire site to clear — our certified crews
            handle it safely, cleanly and on time.
          </p>
        </div>
      </section>

      {/* Service blocks */}
      <section className="py-20 sm:py-24">
        <div className="wrap space-y-20 sm:space-y-28">
          {services.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={s.slug}
                id={s.slug}
                className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <div className={`relative ${flip ? "lg:order-2" : ""}`}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-sm ring-1 ring-forest-100">
                    <Image
                      src={s.image}
                      alt={s.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className={flip ? "lg:order-1" : ""}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-700">
                    <s.Icon className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 font-display text-3xl font-semibold text-forest-900">{s.title}</h2>
                  <p className="mt-1 font-medium text-forest-500">{s.tagline}</p>
                  <p className="mt-4 text-forest-600">{s.description}</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-forest-700">
                        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-forest-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-800"
                  >
                    Get a quote for {s.title.toLowerCase()} <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sand-50 py-16">
        <div className="wrap flex flex-col items-center gap-5 text-center">
          <h2 className="font-display text-3xl font-semibold text-forest-900">Not sure what you need?</h2>
          <p className="max-w-xl text-forest-600">
            Send us a photo and a few details — we&apos;ll tell you exactly what&apos;s involved and what it&apos;ll cost, free of charge.
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
