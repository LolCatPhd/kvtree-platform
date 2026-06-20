import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/services";
import { photos } from "@/lib/photos";
import { getGoogleReviews, googleMapsReviewUrl } from "@/lib/reviews";
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  ClockIcon,
  AwardIcon,
  LeafIcon,
  StarIcon,
  PhoneIcon,
} from "@/components/icons";

export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const stats = [
  { value: "20+", label: "Years of experience" },
  { value: "1,000+", label: "Projects completed" },
  { value: "24/7", label: "Emergency response" },
  { value: "100%", label: "Fully insured" },
];

const reasons = [
  {
    Icon: ShieldIcon,
    title: "Fully insured & certified",
    body: "Comprehensive liability cover and certified arborists on every job — total peace of mind.",
  },
  {
    Icon: AwardIcon,
    title: "Two decades of experience",
    body: "Serving Kempton Park and the East Rand since the early 2000s, one happy customer at a time.",
  },
  {
    Icon: ClockIcon,
    title: "Fast, reliable turnaround",
    body: "Free quotes within 24 hours and crews that show up on time and clean up after themselves.",
  },
  {
    Icon: LeafIcon,
    title: "Responsible & tidy",
    body: "We chip and reuse green waste, recommend replanting, and leave your property spotless.",
  },
];

const process = [
  { step: "01", title: "Request a quote", body: "Send us a few details and photos. We respond within 24 hours." },
  { step: "02", title: "On-site assessment", body: "We assess the tree, the risks and the access — then give a clear, fixed price." },
  { step: "03", title: "The job, done right", body: "Our certified crew arrives on time, works safely and tidies up completely." },
];

const testimonials = [
  {
    quote:
      "They removed a massive blue gum leaning over our roof without so much as a scratch on the house. Professional from quote to clean-up.",
    name: "Marlene D.",
    place: "Kempton Park",
  },
  {
    quote:
      "Called them at midnight when a tree came down in the storm. The crew was on site within the hour. Absolute lifesavers.",
    name: "Sipho M.",
    place: "Benoni",
  },
  {
    quote:
      "Fair price, friendly team, and they ground the stumps and took every last branch away. Highly recommend KV Tree.",
    name: "Andre & Lize V.",
    place: "Edenvale",
  },
];

export default async function Home() {
  const googleData = await getGoogleReviews();
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-forest-950">
        <Image
          src={photos.hero}
          alt="KV Tree arborist felling a large tree in a Kempton Park garden"
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/70 to-forest-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />

        <div className="wrap relative grid min-h-[88vh] items-center py-24">
          <div className="max-w-2xl text-white">
            <span className="animate-rise eyebrow text-lime-accent">
              <LeafIcon className="h-4 w-4" /> Kempton Park &amp; the greater East Rand
            </span>
            <h1 className="animate-rise mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Tree felling &amp; stump removal, done the safe way.
            </h1>
            <p className="animate-rise-200 mt-6 max-w-xl text-lg text-forest-100">
              Certified, fully-insured arborists for residential and commercial properties.
              Free quotes within 24 hours — and a crew that leaves your place spotless.
            </p>
            <div className="animate-rise-400 mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-lime-accent px-7 py-3.5 font-semibold text-forest-950 shadow-lg shadow-black/20 transition hover:brightness-95"
              >
                Get a free quote <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a
                href="tel:+27833022877"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <PhoneIcon className="h-4 w-4" /> +27 83 302 2877
              </a>
            </div>
            <div className="animate-rise-400 mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-forest-100">
              {["Fully insured", "Certified arborists", "24/7 emergency call-outs"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-lime-accent" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-forest-100 bg-white">
        <div className="wrap grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-forest-600">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Services                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-sand-50 py-20 sm:py-24">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">What we do</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
              Complete tree care, under one roof
            </h2>
            <p className="mt-4 text-forest-600">
              From a single overhanging branch to clearing an entire site, our crews have the skills and kit to handle it safely.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href="/services"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-950/5"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={s.image}
                    alt={s.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/40 to-transparent" />
                  <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/95 text-forest-800 shadow-sm">
                    <s.Icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold text-forest-900">{s.title}</h3>
                  <p className="mt-1 text-sm font-medium text-forest-500">{s.tagline}</p>
                  <p className="mt-3 flex-1 text-sm text-forest-600">{s.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800">
                    Learn more
                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why choose — split with image                                     */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image
                src={photos.teamGrinding}
                alt="A KV Tree team member at work in a suburban garden"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 hidden rounded-2xl bg-forest-900 px-6 py-5 text-white shadow-xl sm:block">
              <div className="flex items-center gap-1 text-lime-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4" />
                ))}
              </div>
              <p className="mt-1 text-sm font-medium">Rated 5 stars by East Rand homeowners</p>
            </div>
          </div>

          <div>
            <span className="eyebrow">Why KV Tree</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
              The team your neighbours already trust
            </h2>
            <p className="mt-4 text-forest-600">
              We&apos;ve built our reputation over 20 years on doing careful, professional work and treating every property like our own.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {reasons.map((r) => (
                <div key={r.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">
                    <r.Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-forest-900">{r.title}</h3>
                    <p className="mt-1 text-sm text-forest-600">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Process                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-forest-950 py-20 text-white sm:py-24">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow text-lime-accent">How it works</span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">From quote to clean-up in three steps</h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {process.map((p) => (
              <div key={p.step} className="relative rounded-2xl border border-white/10 bg-white/5 p-8">
                <span className="font-display text-5xl font-semibold text-white/15">{p.step}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-forest-200">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Recent work preview                                               */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-24">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="eyebrow">Recent work</span>
              <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
                Real jobs, around the East Rand
              </h2>
            </div>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-forest-200 px-5 py-2.5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50"
            >
              View full portfolio <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { img: photos.treeFelling, title: "Large tree felling", place: "Kempton Park" },
              { img: photos.siteClearing, title: "Site clearing", place: "Benoni" },
              { img: photos.emergency, title: "Storm emergency response", place: "Boksburg" },
              { img: photos.stumpGrinding, title: "Stump grinding", place: "Edenvale" },
              { img: photos.woodSales, title: "Seasoned firewood", place: "Year-round" },
              { img: photos.pruning, title: "Crown pruning", place: "Modderfontein" },
            ].map((p, i) => (
              <div
                key={p.title}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={p.img}
                    alt={`${p.title} in ${p.place}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/10 to-transparent" />
                <div className="absolute bottom-0 p-5 text-white">
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm text-forest-100">{p.place}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Reviews / Testimonials                                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-sand-50 py-20 sm:py-24">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">What customers say</span>
            {googleData ? (
              <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
                Rated{" "}
                <span className="text-forest-700">{googleData.rating.toFixed(1)} / 5</span>
                {" "}on Google
              </h2>
            ) : (
              <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
                Homeowners across the East Rand
              </h2>
            )}
            {googleData && (
              <p className="mt-2 text-forest-500">
                Based on{" "}
                <a
                  href={googleMapsReviewUrl(googleData.place_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-forest-700 underline hover:text-forest-900"
                >
                  {googleData.user_ratings_total} Google reviews
                </a>
              </p>
            )}
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {googleData
              ? googleData.reviews.slice(0, 3).map((r) => (
                  <figure
                    key={r.author_name}
                    className="flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-forest-100"
                  >
                    <div className="flex gap-1 text-lime-accent">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-forest-700">
                      &ldquo;{r.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-5 border-t border-forest-100 pt-4">
                      <span className="font-semibold text-forest-900">{r.author_name}</span>
                      <span className="block text-sm text-forest-500">
                        {r.relative_time_description}
                      </span>
                    </figcaption>
                  </figure>
                ))
              : testimonials.map((t) => (
                  <figure key={t.name} className="flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-forest-100">
                    <div className="flex gap-1 text-lime-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-forest-700">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-5 border-t border-forest-100 pt-4">
                      <span className="font-semibold text-forest-900">{t.name}</span>
                      <span className="block text-sm text-forest-500">{t.place}</span>
                    </figcaption>
                  </figure>
                ))}
          </div>
          {googleData && (
            <div className="mt-10 text-center">
              <a
                href={googleMapsReviewUrl(googleData.place_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-forest-200 px-6 py-2.5 text-sm font-semibold text-forest-800 transition hover:bg-forest-50"
              >
                Read all reviews on Google <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-20 sm:py-24">
        <div className="wrap">
          <div className="relative overflow-hidden rounded-3xl bg-forest-900 px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 opacity-20">
              <Image src={photos.siteClearing} alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="relative mx-auto max-w-2xl text-white">
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready to get that tree sorted?</h2>
              <p className="mt-4 text-forest-100">
                Tell us what you need and we&apos;ll come back with a free, no-obligation quote — usually within 24 hours.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-lime-accent px-7 py-3.5 font-semibold text-forest-950 transition hover:brightness-95"
                >
                  Request your free quote <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a
                  href="tel:+27833022877"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  <PhoneIcon className="h-4 w-4" /> Call us now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
