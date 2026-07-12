export type FaqItem = { readonly q: string; readonly a: string };

/**
 * General, product-wide FAQ. Persona-specific questions live on the /for pages
 * (config/personas.ts → spoke.faqs). The faq-dedup test guards that no question
 * string appears in more than one set.
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "What is TrustScope?",
    a: "TrustScope reads a public GitHub repository across three pillars — Security & Supply Chain, Trust & Governance, and Community & Sustainability — and gives a verdict per pillar, with no misleading single score.",
  },
  {
    q: "What is an adopter, and what is a maintainer?",
    a: "An adopter is evaluating someone else's project before depending on it; a maintainer runs their own project to see and close the trust gaps adopters look for. Both read the same three-pillar report from opposite directions.",
  },
  {
    q: "Do I need an account to read a report?",
    a: "No. Reading any report is anonymous and needs no sign-in. Accounts (to save history and email reports) are coming later.",
  },
  {
    q: "Why is there no single score?",
    a: "Each pillar answers a different question. Collapsing security, governance and community into one number hides the exact trade-off you are trying to weigh — so TrustScope keeps them separate.",
  },
  {
    q: "Where does the data come from?",
    a: "The full OpenSSF Scorecard plus public GitHub governance and lifecycle signals. The same repository always produces the same report — it is deterministic, with no LLM in the loop.",
  },
  {
    q: "What are the due-diligence notes in a report?",
    a: "Alongside the three pillars, a report surfaces a few quiet due-diligence notes — calm nudges derived from existing data, never a score. One example is install scripts: some npm packages run their own steps the moment they are installed (preinstall / install / postinstall), so arbitrary code runs during npm install. Often legitimate (native builds), but worth a look before adopting — the note points you to a constructive next step (npm install --ignore-scripts to inspect first) and never accuses.",
  },
  {
    q: "Does TrustScope store my data?",
    a: "Reading a report stores nothing about you. It is self-hosted, GDPR-clean, with no third-party trackers.",
  },
];
