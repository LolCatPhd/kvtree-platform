'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LeafIcon, PhoneIcon, MenuIcon, CloseIcon } from "./icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const PHONE = "+27 11 123 4567";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const dashboardHref = user?.role === "client" ? "/portal" : "/admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-md shadow-forest-950/5" : ""
      }`}
    >
      {/* Thin utility bar */}
      <div className="hidden md:block bg-forest-950 text-forest-100 text-xs">
        <div className="wrap flex h-9 items-center justify-between">
          <span className="opacity-80">Kempton Park &amp; the greater East Rand • Free quotes in 24 hours</span>
          <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-lime-accent transition">
            <PhoneIcon className="h-3.5 w-3.5" /> {PHONE}
          </a>
        </div>
      </div>

      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-lime-accent">
            <LeafIcon className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold text-forest-900">KV Tree</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-forest-500">Tree Care Experts</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-forest-100 text-forest-900"
                    : "text-forest-700 hover:bg-forest-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-full px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50 transition"
              >
                {user.role === "client" ? "My Account" : "Dashboard"}
              </Link>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="rounded-full border border-forest-200 px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50 transition"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50 transition"
            >
              Log in
            </Link>
          )}
          <Link
            href="/contact"
            className="rounded-full bg-forest-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 transition"
          >
            Get a free quote
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden grid h-10 w-10 place-items-center rounded-lg text-forest-900 hover:bg-forest-50"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-forest-100 bg-white">
          <nav className="wrap flex flex-col py-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2.5 text-base font-medium ${
                    active ? "bg-forest-50 text-forest-900" : "text-forest-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 flex flex-col gap-2 border-t border-forest-100 pt-3">
              {user ? (
                <>
                  <Link href={dashboardHref} className="rounded-lg px-3 py-2.5 font-semibold text-forest-800">
                    {user.role === "client" ? "My Account" : "Dashboard"}
                  </Link>
                  <button
                    onClick={() => { logout(); router.push("/"); }}
                    className="rounded-lg px-3 py-2.5 text-left font-semibold text-forest-800"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-2.5 font-semibold text-forest-800">
                  Log in
                </Link>
              )}
              <Link
                href="/contact"
                className="rounded-full bg-forest-900 px-5 py-3 text-center font-semibold text-white"
              >
                Get a free quote
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
