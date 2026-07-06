export type NavChild = {
  readonly label: string;
  readonly href: string;
  readonly hint?: string;
};

export type NavItem = {
  readonly label: string;
  readonly href?: string;
  readonly external?: boolean;
  readonly children?: readonly NavChild[];
};

/**
 * Primary header navigation. The "For whom" parent has NO href — its trigger is
 * a button that only opens the disclosure (single responsibility, spec §5 a11y).
 * The /for Overview hub was removed (2026-07-06 redesign); the two persona pages
 * are the destinations. Every entry links to a route that exists.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "For whom",
    children: [
      { label: "Adopters", href: "/for/adopters", hint: "Vet a third-party project" },
      { label: "Maintainers", href: "/for/maintainers", hint: "Check your own project" },
    ],
  },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Feedback", href: "/feedback" },
  {
    label: "GitHub ↗",
    href: "https://github.com/neckarshore-mmps/trustscope",
    external: true,
  },
];
