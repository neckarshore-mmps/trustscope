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
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
