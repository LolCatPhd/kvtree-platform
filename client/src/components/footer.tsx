import Link from "next/link";
import {
  LeafIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  ArrowRightIcon,
} from "./icons";

const SERVICES = [
  "Tree Felling",
  "Stump Grinding",
  "Site Clearing",
  "Pruning & Trimming",
  "Wood Sales",
  "Emergency Response",
];

const AREAS = ["Kempton Park", "Benoni", "Boksburg", "Edenvale", "Germiston", "Modderfontein"];

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-forest-100">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="wrap flex flex-col items-start gap-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Got a tree that needs sorting?</h2>
            <p className="mt-1 text-forest-200">Free, no-obligation quotes — usually within 24 hours.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-lime-accent px-6 py-3 font-semibold text-forest-950 transition hover:brightness-95"
          >
            Get your free quote <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="wrap grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-lime-accent">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold text-white">KV Tree</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-forest-200">
            Certified, fully-insured tree care serving Kempton Park and the greater East Rand for over 20 years.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { Icon: FacebookIcon, href: "https://facebook.com", label: "Facebook" },
              { Icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
              { Icon: WhatsAppIcon, href: "https://wa.me/27833022877", label: "WhatsApp" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-forest-100 transition hover:bg-lime-accent hover:text-forest-950"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SERVICES.map((s) => (
              <li key={s}>
                <Link href="/services" className="text-forest-200 transition hover:text-lime-accent">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Service areas</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {AREAS.map((a) => (
              <li key={a} className="text-forest-200">{a}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="mt-4 space-y-3.5 text-sm">
            <li>
              <a href="tel:+27833022877" className="flex items-start gap-2.5 text-forest-200 transition hover:text-lime-accent">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0" /> +27 83 302 2877
              </a>
            </li>
            <li>
              <a href="mailto:info@kvtree.co.za" className="flex items-start gap-2.5 text-forest-200 transition hover:text-lime-accent">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0" /> info@kvtree.co.za
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-forest-200">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" /> Aston Manor, Kempton Park
            </li>
            <li className="flex items-start gap-2.5 text-forest-200">
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" /> Mon–Fri 7:00–17:00 · Sat 8:00–13:00
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-6 text-xs text-forest-300 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} KV Tree. All rights reserved.</p>
          <p className="flex gap-4">
            <Link href="/" className="hover:text-lime-accent">Privacy Policy</Link>
            <Link href="/" className="hover:text-lime-accent">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
