import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-green-900 text-white py-4">
      <div className="container mx-auto flex flex-col items-center sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">KV Tree</span>
          <span className="text-sm opacity-75">Tree Felling Experts</span>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:underline">
                Services
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/portfolio" className="hover:underline">
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
