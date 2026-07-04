export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
};

/**
 * Primary header navigation. Later plans append items as their target pages
 * ship (For-whom dropdown + /faq + /explore in Plan 2/3), so the nav never
 * links to a route that does not exist yet. Plan 3 Task 5 owns the final
 * shape and APPENDS to this base — it never rewrites these entries.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "How it works", href: "/about" }, // Plan 3 renames href -> /how-it-works
  {
    label: "GitHub ↗",
    href: "https://github.com/neckarshore-mmps/trustscope",
    external: true,
  },
];
