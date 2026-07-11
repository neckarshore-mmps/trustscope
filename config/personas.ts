import type { FaqItem } from "./faq";

export type PersonaId = "adopter" | "maintainer";

/** One step of the "Who does what — and why" flow. `you` toggles the actor label. */
export type WhoWhatWhyStep = {
  readonly role: string;
  readonly you: boolean; // true → "You", false → "TrustScope"
  readonly text: string;
};

/** Per-pillar, persona-worded question + blurb (color + title come from PILLARS_META). */
export type PersonaPillar = { readonly q: string; readonly blurb: string };

export type Persona = {
  readonly id: PersonaId;
  readonly tag: string;
  readonly spokeHref: string;
  readonly spoke: {
    readonly title: string;
    // --- shared /for template (2026-07-06 redesign) ---
    readonly heroTitle: string;
    readonly heroLede: string;
    readonly submitLabel: string;
    readonly placeholder: string;
    readonly accentHex: string;
    // Darker accent for text on the light-mode ground — the vivid accentHex fails
    // WCAG contrast as text on light; this teal-700/amber-700 passes AA (~4.9:1).
    readonly accentHexLight: string;
    readonly accentInk: string;
    readonly whoWhatWhy: readonly WhoWhatWhyStep[];
    readonly helpsSub: string;
    readonly nsaHeading: string;
    readonly verdictCaption: string | null;
    readonly pillars: readonly PersonaPillar[]; // exactly 4, aligned to PILLARS_META
    readonly faqs: readonly FaqItem[];
    readonly crossLinkLead: string;
  };
};

export const PERSONAS: Record<PersonaId, Persona> = {
  adopter: {
    id: "adopter",
    tag: "Adopter",
    spokeHref: "/for/adopters",
    spoke: {
      title: "TrustScope for adopters",
      heroTitle: "Before you depend on a project, know how far to trust it.",
      heroLede:
        "Secure, well-governed, and still maintained next year? Check any repo before you take on the dependency.",
      submitLabel: "Assess →",
      placeholder: "ossf/scorecard  ·  https://github.com/owner/repo",
      accentHex: "#2dd4bf",
      accentHexLight: "#0f766e",
      accentInk: "#04211d",
      whoWhatWhy: [
        {
          role: "the adopter",
          you: true,
          text: "Evaluating a third-party library, framework or tool before you take on the dependency.",
        },
        {
          role: "reads the repo",
          you: false,
          text: "Runs the full OpenSSF Scorecard and reads three pillars separately — never averaging the trade-offs away.",
        },
        {
          role: "decide, then act",
          you: true,
          text: "Adopt, proceed with caution, or avoid — and file constructive fixes upstream, as yourself.",
        },
      ],
      helpsSub:
        "Three questions, answered separately — so the trade-off you're weighing stays visible instead of collapsing into one grade.",
      nsaHeading: "No single aggregate score. A verdict per pillar — the decision stays yours.",
      verdictCaption: null,
      pillars: [
        {
          q: "Is it built securely?",
          blurb: "The full OpenSSF Scorecard — where the xz pattern hides.",
        },
        {
          q: "Can I trust the project behind it?",
          blurb: "Ownership, licensing & security policy.",
        },
        { q: "Will it be here in a year?", blurb: "Activity & contributor lifecycle." },
      ],
      faqs: [
        {
          q: "What does TrustScope do for adopters?",
          a: "It assesses a third-party open-source project before you depend on it, reading three pillars separately — Security & Supply Chain, Trust & Governance, and Community & Sustainability — so you can decide adopt, proceed, or avoid.",
        },
        {
          q: "How is this different from a star count or a green badge?",
          a: "Stars and badges signal popularity, not risk. TrustScope reads the full OpenSSF Scorecard plus governance and community signals, and keeps the trade-offs visible instead of averaging them into one number.",
        },
        {
          q: 'What is the "xz pattern", and how does TrustScope surface it?',
          a: "The xz backdoor showed how supply-chain risk stays invisible until it detonates. The Security & Supply Chain pillar reads the full Scorecard signals so the risk is legible before you take the dependency.",
        },
      ],
      crossLinkLead: "Maintaining your own project instead?",
    },
  },
  maintainer: {
    id: "maintainer",
    tag: "Maintainer",
    spokeHref: "/for/maintainers",
    spoke: {
      title: "TrustScope for maintainers",
      heroTitle: "Before you publish, see your project the way evaluators will.",
      heroLede:
        "The same three-pillar report an adopter gets on your repo — plus a friendly, concrete list of what to harden.",
      submitLabel: "Check →",
      placeholder: "your-org/your-repo",
      accentHex: "#fbbf24",
      accentHexLight: "#b45309",
      accentInk: "#2a1c00",
      whoWhatWhy: [
        {
          role: "the maintainer",
          you: true,
          text: "You maintain your own project and want people to trust it — without guessing what evaluators look for.",
        },
        {
          role: "mirrors your repo",
          you: false,
          text: "Shows the same three-pillar report an adopter would see — nothing about how you're perceived is a surprise.",
        },
        {
          role: "harden, then file",
          you: true,
          text: "Every finding comes with a constructive, rule-based fix you can file as an issue on your own project.",
        },
      ],
      helpsSub:
        "The three questions evaluators actually ask — each answered separately, so you know exactly what to harden.",
      nsaHeading: "No single aggregate score — and never a badge. A verdict per pillar.",
      verdictCaption:
        "The verdict an adopter reaches on your repo — close the gaps before they do.",
      pillars: [
        {
          q: "Is it built securely?",
          blurb: "The full OpenSSF Scorecard — the surface adopters scrutinise most.",
        },
        {
          q: "Can they trust the project behind it?",
          blurb: "Ownership, licensing & security policy.",
        },
        { q: "Will it be here in a year?", blurb: "Activity & contributor lifecycle." },
      ],
      faqs: [
        {
          q: "What does TrustScope do for maintainers?",
          a: "It shows the same three-pillar report an adopter sees on your repo — Security & Supply Chain, Trust & Governance, and Community & Sustainability — plus a constructive fix-list you can file as issues.",
        },
        {
          q: "Will TrustScope give my project a badge or score?",
          a: "No. No badge, no single score. It is a mirror and a hardening guide — findings with fixes, never a grade.",
        },
        {
          q: "What do evaluators actually look for?",
          a: "The three pillars — the full OpenSSF Scorecard plus governance and community signals. TrustScope makes each one legible so nothing is a surprise.",
        },
        {
          q: "How do I fix a finding?",
          a: 'Every finding carries a constructive, rule-based fix you can file as an issue on your own project, as yourself — carrying a "via TrustScope" attribution footer.',
        },
      ],
      crossLinkLead: "Evaluating someone else's code instead?",
    },
  },
};

/** Default display order on /for. Swapping = reorder this array (the config seam;
 *  foundation for the V3 persona-weighting slider). Never hardcode order elsewhere. */
export const PERSONA_ORDER: readonly PersonaId[] = ["adopter", "maintainer"];
