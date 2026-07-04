export type PersonaId = "adopter" | "maintainer";

export type Persona = {
  readonly id: PersonaId;
  readonly tag: string;
  readonly recognition: string;
  readonly youIf: string;
  readonly ctaLabel: string;
  readonly ctaHref: string; // repo input lives on the landing page
  readonly spokeHref: string;
  readonly accent: string; // tailwind border-top accent
  readonly spoke: {
    readonly title: string;
    readonly jtbd: string;
    readonly pains: readonly string[];
    readonly perPillar: string;
    readonly walkthrough: string;
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
    },
  },
};

/** Default display order on /for. Swapping = reorder this array (the config seam;
 *  foundation for the V3 persona-weighting slider). Never hardcode order elsewhere. */
export const PERSONA_ORDER: readonly PersonaId[] = ["adopter", "maintainer"];
