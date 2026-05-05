import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Source_Serif_4 } from "next/font/google";
import { AdminPanel } from "@/components/AdminPanel";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Notion Community Dashboard",
  description: "Notion community reach across ambassadors, campus leaders, and groups",
};

function NotionMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 126" width={size} height={size} aria-hidden className="text-ink">
      <path
        fill="currentColor"
        d="M22.5 7.6L77.4 3.5c6.7-.6 8.4-.2 12.6 2.9l17.5 12.3c2.9 2.1 3.9 2.7 3.9 5v83.4c0 4.3-1.6 6.8-7 7.2L40 118.6c-4.1.2-6.1-.4-8.3-3.2L18.6 98.6c-2.4-3.3-3.4-5.7-3.4-8.6V14.7c0-3.5 1.6-6.4 7.3-7.1z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M77.4 11.3L24.5 15.3c-2.7.2-3.3 1.6-2.3 2.6L34.6 27c2.6 1.9 6 1.7 9.1 1.5l49.2-2.9c2.1-.2 4.4-1 4.4-2.7 0-1.7-1-2.5-3.7-4.4L80.1 11.4c-.7-.5-1.5-.5-2.7 0M30 32.6v55.5c0 3 1.5 4.1 4.9 3.9l54.2-3.1c3.4-.2 3.9-2.2 3.9-4.6V29.1c0-2.4-.9-3.7-3-3.5l-56.6 3.3c-2.3.2-3.4 1.4-3.4 3.7m54 3c.4 1.7 0 3.4-1.7 3.6l-2.6.5v38.3c-2.3 1.2-4.4 2-6.2 2-2.9 0-3.6-.9-5.7-3.6L51.2 51.9v25.1l5.4 1.2s0 3.2-4.4 3.2L40 82.1c-.4-.7 0-2.5 1.2-2.9l3.1-.9V44.4l-4.3-.4c-.4-1.7.5-4.1 3.2-4.3l13.7-.9 18.7 28.7v-25.4l-4.5-.5c-.4-2.1 1.2-3.6 3-3.7L84 35.7z"
      />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <header className="sticky top-0 z-10 border-b border-rule bg-paper">
          <div className="mx-auto max-w-screen-2xl px-8 pt-4 pb-0">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex shrink-0 items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink">
                <NotionMark />
                <span className="hidden sm:inline">Community Dashboard</span>
              </Link>
              <AdminPanel />
            </div>
            <nav className="scrollbar-none mt-2 flex items-center gap-5 overflow-x-auto text-xs text-muted pb-3">
              <Link href="/" className="transition-colors hover:text-ink">Reach</Link>
              <Link href="/ambassadors" className="transition-colors hover:text-ink">Ambassadors</Link>
              <Link href="/campus-leaders" className="transition-colors hover:text-ink">Campus Leaders</Link>
              <Link href="/groups" className="transition-colors hover:text-ink">Groups</Link>
              <Link href="/events" className="transition-colors hover:text-ink">Events</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl px-8 py-12">{children}</main>
        <footer className="border-t border-rule">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-8 py-6 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <NotionMark size={14} /> Made with Notion
            </span>
            <span>© Notion Labs, Inc.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
