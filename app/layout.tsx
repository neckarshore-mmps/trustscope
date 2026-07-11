import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  PRODUCT_NAME,
  PRODUCT_SUBDOMAIN,
  PRODUCT_TAGLINE,
} from "@/config/product";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
    // og:image tags are emitted automatically from app/opengraph-image.png
    // (Next file-based metadata convention).
  },
  twitter: {
    // twitter:image tags are emitted automatically from app/twitter-image.png;
    // this block only sets the card type + text so the unfurl renders large.
    card: "summary_large_image",
    title: `${PRODUCT_NAME} — open-source trust reports`,
    description: PRODUCT_TAGLINE,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/*
         * No-FOUC theme init — runs synchronously before first paint, so the
         * resolved mode (stored choice, else system preference) is applied on
         * the initial render and the page never flashes the wrong theme.
         * Mirrors the md-viewer pattern. Dark stays the default if this fails.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("ts-mode");if(m!=="light"&&m!=="dark"){m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-mode",m);}catch(e){}})();`,
          }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
