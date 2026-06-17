export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} KV Tree. All rights reserved.</p>
        <p>
          <a href="/" className="hover:underline text-green-300">
            Privacy Policy
          </a>
          {" | "}
          <a href="/" className="hover-underline text-green-300">
            Terms of Service
          </a>
        </p>
      </div>
    </footer>
  );
}
