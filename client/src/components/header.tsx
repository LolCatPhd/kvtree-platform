'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const dashboardHref = user?.role === 'client' ? '/portal' : '/admin';

  return (
    <header className="bg-green-900 text-white py-4">
      <div className="container mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">KV Tree</span>
          <span className="text-sm opacity-75">Tree Felling Experts</span>
        </Link>
        <nav>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/services" className="hover:underline">Services</Link></li>
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
            <li><Link href="/portfolio" className="hover:underline">Portfolio</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            {user ? (
              <>
                <li>
                  <Link href={dashboardHref} className="hover:underline font-semibold">
                    {user.role === 'client' ? 'My Account' : 'Dashboard'}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="bg-green-200 text-green-900 px-3 py-1 rounded-full hover:bg-green-300 transition"
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="bg-green-200 text-green-900 px-4 py-2 rounded-full hover:bg-green-300 transition"
                >
                  Client Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
