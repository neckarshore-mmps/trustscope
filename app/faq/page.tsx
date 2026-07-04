import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/config/faq";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about TrustScope — accounts, the no-single-score design, data sources, and privacy.",
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

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd data={FAQ_SCHEMA} />
      <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      <dl className="mt-8 space-y-8">
        {FAQ_ITEMS.map((f) => (
          <div key={f.q}>
            <dt>
              <h2 className="text-lg font-semibold tracking-tight">{f.q}</h2>
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
