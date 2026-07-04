"use client";

import { useState } from "react";

/**
 * Placeholder for TS6 Accounts/Login (a V2 feature not yet built). It is a
 * <button>, not a link — it never navigates; it reveals a "Coming soon" hint
 * on click or keyboard focus and hides it on blur or Escape.
 *
 * onClick OPENS (does not toggle): a real click fires focus first (open), so a
 * toggling onClick would immediately close the hint again and hide it. Open-only
 * keeps click and keyboard focus both revealing the hint. Blur / Escape close it.
 */
export function LoginButton() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        aria-describedby={open ? "login-soon" : undefined}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Log in
      </button>
      {open && (
        <span
          id="login-soon"
          role="status"
          className="absolute right-0 top-9 z-10 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow"
        >
          Coming soon
        </span>
      )}
    </span>
  );
}
