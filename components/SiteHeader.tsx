import Link from "next/link";
import { PRODUCT_NAME } from "@/config/product";
import { NAV_ITEMS } from "@/config/nav";
import { LoginButton } from "@/components/LoginButton";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-surface/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-brand ring-1 ring-brand/30">
            <ShieldIcon />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-5">
          <nav aria-label="Primary" className="flex items-center gap-5">
            {NAV_ITEMS.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <LoginButton />
        </div>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
