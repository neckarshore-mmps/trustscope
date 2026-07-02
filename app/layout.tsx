import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import {
  PRODUCT_NAME,
  PRODUCT_ORG,
  PRODUCT_SUBDOMAIN,
  PRODUCT_TAGLINE,
} from "@/config/product";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${PRODUCT_SUBDOMAIN}`),
  title: {
    default: `${PRODUCT_NAME} — open-source trust reports`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: PRODUCT_TAGLINE,
  applicationName: PRODUCT_NAME,
  openGraph: {
    title: `${PRODUCT_NAME} — open-source trust reports`,
    description: PRODUCT_TAGLINE,
    siteName: PRODUCT_NAME,
    type: "website",
  },
  robots: { index: true, follow: true },
};

function Header() {
  return (
    <header className="border-b border-border/70 bg-surface/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-brand ring-1 ring-brand/30">
            <ShieldIcon />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/about"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <a
            href="https://github.com/neckarshore-mmps/trustscope"
            className="text-sm text-muted transition-colors hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto max-w-5xl px-5 py-6 text-sm text-muted">
        <p>
          {PRODUCT_NAME} builds on the{" "}
          <a
            className="text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand"
            href="https://securityscorecards.dev"
            target="_blank"
            rel="noreferrer"
          >
            OpenSSF Scorecard
          </a>
          . A reputation surface by {PRODUCT_ORG}. No single aggregate score — by design.
        </p>
      </div>
    </footer>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
