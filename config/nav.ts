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
 * Primary header navigation. Plan 3 Task 5 owns the final shape. The "For whom"
 * parent has NO href — its trigger is a button that only opens the disclosure
 * (single responsibility, spec §5 a11y); the /for hub is reachable as the first
 * child ("Overview"). Every entry links to a route that exists.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "For whom",
    children: [
      { label: "Overview", href: "/for", hint: "Who is TrustScope for?" },
      { label: "Adopters", href: "/for/adopters", hint: "Vet a third-party project" },
      { label: "Maintainers", href: "/for/maintainers", hint: "Check your own project" },
    ],
  },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  {
    label: "GitHub ↗",
    href: "https://github.com/neckarshore-mmps/trustscope",
    external: true,
  },
];
