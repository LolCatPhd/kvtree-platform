import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { photos } from "@/lib/photos";
import { ShieldIcon, AwardIcon, LeafIcon, ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "KV Tree has served Kempton Park and the greater East Rand for over 20 years with certified, fully-insured tree care.",
  alternates: { canonical: "/about" },
};

const stats = [
  { value: "20+", label: "Years of experience" },
  { value: "1,000+", label: "Projects completed" },
  { value: "100%", label: "Satisfaction guarantee" },
  { value: "Fully", label: "Insured & certified" },
];

const values = [
  {
    Icon: ShieldIcon,
    title: "Safety first, always",
    body: "We work to the highest safety standards in the industry — trained crews, the right equipment, and a careful plan for every job.",
  },
  {
    Icon: AwardIcon,
    title: "Certified experts",
    body: "Our arborists are certified by recognised industry bodies and keep learning to stay current with best practice.",
  },
  {
    Icon: LeafIcon,
    title: "Environmental care",
    body: "We recycle wood waste into mulch and firewood, and recommend replanting whenever a tree has to come down.",
  },
];

const team = [
  { name: "Pieter Bekker", role: "Founder & Chief Arborist", photo: photos.founder, initials: "PB" },
  { name: "Thandiwe Mokoena", role: "Operations Manager", initials: "TM" },
  { name: "Jaco Botha", role: "Lead Arborist", initials: "JB" },
];

export default function About() {
  return (
    <>
      {/* Hero / story */}
      <section className="py-20 sm:py-24">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="eyebrow">Our story</span>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-forest-900 sm:text-5xl">
              A family name the East Rand has trusted for 20 years
            </h1>
            <div className="mt-6 space-y-4 text-forest-600">
              <p>
                KV Tree has served the Kempton Park and greater East Rand community for over two decades.
                What started as a small, family-run business has grown into a trusted name in tree care —
                known for our commitment to safety, professionalism and environmental stewardship.
              </p>
              <p>
                Our founder, Pieter Bekker, began with a passion for arboriculture and a dedication
                to honest, reliable service. Today we carry that legacy forward with a team of certified
                arborists and skilled technicians who share the same values.
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest-800"
            >
              Work with us <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-sm ring-1 ring-forest-100">
              <Image
                src={photos.founder}
                alt="Pieter Bekker, founder of KV Tree"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-6 rounded-2xl bg-forest-900 px-6 py-4 text-white shadow-xl">
              <p className="font-display text-lg font-semibold">Pieter Bekker</p>
              <p className="text-sm text-forest-200">Founder &amp; Chief Arborist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-forest-950 py-14 text-white">
        <div className="wrap grid grid-cols-2 gap-y-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-semibold sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-forest-200">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-sand-50 py-20 sm:py-24">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">What we stand for</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
              Our commitment to safety &amp; excellence
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-forest-100">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-700">
                  <v.Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-forest-900">{v.title}</h3>
                <p className="mt-2 text-sm text-forest-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-24">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Meet the team</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
              The people behind every job
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <div key={m.name} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-100">
                <div className="relative aspect-[4/3] bg-forest-900">
                  {m.photo ? (
                    <Image
                      src={m.photo}
                      alt={m.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-4xl font-semibold text-lime-accent">
                      {m.initials}
                    </div>
                  )}
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-display text-lg font-semibold text-forest-900">{m.name}</h3>
                  <p className="text-sm text-forest-500">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
