import type { MetadataRoute } from "next";
import { PRODUCT_SUBDOMAIN } from "@/config/product";

const BASE = `https://${PRODUCT_SUBDOMAIN}`;

// B5 (launch hygiene): robots.txt used to 404. Allow everything — /report carries its
// own `robots: { index: false }` meta, and the per-report OG route lives under it, so we
// deliberately do NOT Disallow /report (that would also block social unfurlers + the card).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
