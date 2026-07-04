export type FaqItem = { readonly q: string; readonly a: string };

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "Do I need an account to read a report?",
    a: "No. Reading any report is anonymous and needs no sign-in. Accounts (to save history and email reports) are coming soon.",
  },
  {
    q: "Is TrustScope for open-source maintainers?",
    a: "Yes. Maintainers and adopters are equal audiences — a maintainer runs their own repo to see the trust gaps adopters look for, and gets constructive fixes to close them.",
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
    q: "Does TrustScope store my data?",
    a: "Reading a report stores nothing about you. It is self-hosted, GDPR-clean, with no third-party trackers.",
  },
];
