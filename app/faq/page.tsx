import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/config/faq";
import { JsonLd } from "@/components/JsonLd";
import { FaqAccordion } from "@/components/FaqAccordion";
import { breadcrumb } from "@/lib/schema";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about TrustScope — accounts, the no-single-score design, data sources, and privacy.",
  alternates: { canonical: "/faq" },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
} as const;

const FAQ_BREADCRUMB = breadcrumb([{ name: "FAQ", path: "/faq" }]);

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={FAQ_SCHEMA} />
      <JsonLd data={FAQ_BREADCRUMB} />
      <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      <div className="mt-8">
        <FaqAccordion items={FAQ_ITEMS} />
      </div>
    </div>
  );
}
