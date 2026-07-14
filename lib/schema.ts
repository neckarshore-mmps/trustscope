/**
 * Central Schema.org / JSON-LD graph. One canonical entity set, referenced by
 * stable `@id` across every page so search engines and AI systems resolve
 * "Neckarshore AI" and "TrustScope" as single entities rather than per-page
 * duplicates. Values are drawn from config/product.ts — no placeholders, only
 * facts that resolve live (icon.png, opengraph-image.png, the public GitHub org).
 */
import {
  PRODUCT_NAME,
  PRODUCT_ORG,
  PRODUCT_SUBDOMAIN,
  PRODUCT_TAGLINE,
} from "@/config/product";

export const SITE = `https://${PRODUCT_SUBDOMAIN}`;
const ORG_URL = "https://neckarshore.ai";
const GITHUB_ORG = "https://github.com/neckarshore-mmps";
const GITHUB_REPO = "https://github.com/neckarshore-mmps/trustscope";

export const ORG_ID = `${ORG_URL}/#organization`;
export const SOFTWARE_ID = `${SITE}/#software`;
export const WEBSITE_ID = `${SITE}/#website`;

const organizationNode = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: PRODUCT_ORG,
  url: ORG_URL,
  logo: `${SITE}/icon.png`,
  founder: { "@type": "Person", name: "German Rauhut" },
  sameAs: [GITHUB_ORG],
} as const;

const softwareNode = {
  "@type": "SoftwareApplication",
  "@id": SOFTWARE_ID,
  name: PRODUCT_NAME,
  url: SITE,
  description: PRODUCT_TAGLINE,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web-based)",
  image: `${SITE}/opengraph-image.png`,
  publisher: { "@id": ORG_ID },
  // The public report is free to read, no sign-in.
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  sameAs: [GITHUB_REPO],
} as const;

const websiteNode = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: PRODUCT_NAME,
  url: SITE,
  publisher: { "@id": ORG_ID },
} as const;

/** Homepage — the highest-authority URL; anchors product identity + publisher. */
export const HOME_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [organizationNode, websiteNode, softwareNode],
} as const;

/** /about — Organization + SoftwareApplication, correctly typed and cross-linked. */
export const ABOUT_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [organizationNode, softwareNode],
} as const;

/** BreadcrumbList for a deep page. Home item form matches PersonaSpoke (no slash). */
export function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      ...trail.map((t, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: t.name,
        item: `${SITE}${t.path}`,
      })),
    ],
  } as const;
}
