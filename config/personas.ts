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
  readonly recognition: string;
  readonly youIf: string;
  readonly ctaLabel: string;
  readonly ctaHref: string; // repo input lives on the landing page
  readonly spokeHref: string;
  readonly accent: string; // tailwind border-top accent (PersonaCard)
  readonly spoke: {
    readonly title: string;
    readonly jtbd: string;
    readonly pains: readonly string[];
    readonly perPillar: string;
    readonly walkthrough: string;
    // --- shared /for template (2026-07-06 redesign) ---
    readonly heroTitle: string;
    readonly heroLede: string;
    readonly submitLabel: string;
    readonly placeholder: string;
    readonly accentHex: string;
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
    recognition: "You're about to build on someone else's code.",
    youIf:
      "You're evaluating a third-party library, framework or tool before taking on the dependency.",
    ctaLabel: "Assess a repo you're evaluating",
    ctaHref: "/",
    spokeHref: "/for/adopters",
    accent: "border-t-sky-400/70",
    spoke: {
      title: "TrustScope for adopters",
      jtbd: "Before you depend on a project, decide how much to trust it — is it built securely, well-governed, and likely to be maintained in a year?",
      pains: [
        "Raw Scorecard output is cryptic and hard to act on.",
        "A star count or a green badge says nothing about real risk.",
        "The trade-offs stay hidden behind one number.",
        "Supply-chain risk (the xz pattern) is invisible until it isn't.",
      ],
      perPillar:
        "TrustScope reads all four pillars separately — security & supply chain (the full OpenSSF Scorecard), governance, community — and keeps the trade-offs visible instead of averaging them away.",
      walkthrough:
        "You get a verdict and the trade-off behind it, so you can decide adopt / proceed with caution / avoid — and file constructive fixes upstream as yourself.",
      heroTitle: "Before you depend on a project, know how far to trust it.",
      heroLede:
        "Secure, well-governed, and still maintained next year? Check any repo before you take on the dependency.",
      submitLabel: "Assess →",
      placeholder: "ossf/scorecard  ·  https://github.com/owner/repo",
      accentHex: "#2dd4bf",
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
          text: "Runs the full OpenSSF Scorecard and reads four pillars separately — never averaging the trade-offs away.",
        },
        {
          role: "decide, then act",
          you: true,
          text: "Adopt, proceed with caution, or avoid — and file constructive fixes upstream, as yourself.",
        },
      ],
      helpsSub:
        "Four questions, answered separately — so the trade-off you're weighing stays visible instead of collapsing into one grade.",
      nsaHeading: "No single aggregate score. A verdict per pillar — the decision stays yours.",
      verdictCaption: null,
      pillars: [
        { q: "Is it well-built?", blurb: "Testing, CI, review & build signals." },
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
          a: "It assesses a third-party open-source project before you depend on it, reading four pillars separately — Functional Quality, Security & Supply Chain, Trust & Governance, and Community & Sustainability — so you can decide adopt, proceed, or avoid.",
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
    recognition: "You want people to trust your code.",
    youIf:
      "You maintain your own project and want to see — and close — the trust gaps adopters look for.",
    ctaLabel: "Check how your own project looks",
    ctaHref: "/",
    spokeHref: "/for/maintainers",
    accent: "border-t-violet-400/70",
    spoke: {
      title: "TrustScope for maintainers",
      jtbd: "See your own project the way an evaluator does — and get a friendly, concrete list of what to harden.",
      pains: [
        "You don't always know what evaluators actually look for.",
        "Scorecard can feel intimidating rather than actionable.",
        "You want a fix-list, not a verdict.",
      ],
      perPillar:
        "TrustScope shows the same four-pillar report an adopter would see on your repo — security & supply chain, governance, community — so nothing about how you're perceived is a surprise.",
      walkthrough:
        "Every finding comes with a constructive, rule-based fix you can file as an issue on your own project. It's a mirror and a hardening guide — never a badge.",
      heroTitle: "Before you publish, see your project the way evaluators will.",
      heroLede:
        "The same four-pillar report an adopter gets on your repo — plus a friendly, concrete list of what to harden.",
      submitLabel: "Check →",
      placeholder: "your-org/your-repo",
      accentHex: "#fbbf24",
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
          text: "Shows the same four-pillar report an adopter would see — nothing about how you're perceived is a surprise.",
        },
        {
          role: "harden, then file",
          you: true,
          text: "Every finding comes with a constructive, rule-based fix you can file as an issue on your own project.",
        },
      ],
      helpsSub:
        "The four questions evaluators actually ask — each answered separately, so you know exactly what to harden.",
      nsaHeading: "No single aggregate score — and never a badge. A verdict per pillar.",
      verdictCaption:
        "The verdict an adopter reaches on your repo — close the gaps before they do.",
      pillars: [
        { q: "Is it well-built?", blurb: "Testing, CI, review & build signals." },
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
          a: "It shows the same four-pillar report an adopter sees on your repo — Functional Quality, Security & Supply Chain, Trust & Governance, Community & Sustainability — plus a constructive fix-list you can file as issues.",
        },
        {
          q: "Will TrustScope give my project a badge or score?",
          a: "No. No badge, no single score. It is a mirror and a hardening guide — findings with fixes, never a grade.",
        },
        {
          q: "What do evaluators actually look for?",
          a: "The four pillars — the full OpenSSF Scorecard plus governance and community signals. TrustScope makes each one legible so nothing is a surprise.",
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
