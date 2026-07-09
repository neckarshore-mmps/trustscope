import type { MetadataRoute } from "next";
import { PRODUCT_SUBDOMAIN } from "@/config/product";

const BASE = `https://${PRODUCT_SUBDOMAIN}`;
const ROUTES = [
  "",
  "/for/adopters",
  "/for/maintainers",
  "/how-it-works",
  "/about",
  "/faq",
  "/feedback",
  "/impressum",
  "/datenschutz",
];

// Deterministic: no lastModified (no Date.now) — the same build always emits the
// same sitemap, matching the estate's stable-date practice.
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: "monthly",
    priority: r === "" ? 1 : 0.7,
  }));
}
