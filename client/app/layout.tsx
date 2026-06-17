import './globals.css';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-full flex flex-col bg-white dark:bg-black">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
