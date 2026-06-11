import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boardsmith",
  description: "Private MVP for validated woodworking project plans.",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/projects/new", label: "New Project" },
  { href: "/settings", label: "Settings" },
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="no-print border-b border-sawdust bg-shop/95">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
            <Link href="/" className="text-xl font-semibold tracking-tight text-ink">
              Boardsmith
            </Link>
            <nav className="flex flex-wrap gap-1.5 text-sm sm:gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 font-medium text-ink/75 transition hover:bg-sawdust hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}
