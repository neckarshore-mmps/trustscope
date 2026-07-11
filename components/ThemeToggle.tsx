"use client";

import { useSyncExternalStore } from "react";

type Mode = "light" | "dark";

const STORAGE_KEY = "ts-mode";

/**
 * Light/dark toggle — mirrors the md-viewer pattern.
 *
 * The no-FOUC script in app/layout.tsx sets data-mode on <html> before first
 * paint (stored choice, else system preference). This component treats that
 * attribute as the single source of truth: it reads it via useSyncExternalStore
 * (so the icon stays in sync even if the mode changes elsewhere) and flips it on
 * click, persisting the choice to localStorage. The icon shows the CURRENT mode
 * (moon = dark, sun = light), matching the reference.
 *
 * useSyncExternalStore is the React-sanctioned way to read external mutable
 * state (a DOM attribute) without a setState-in-effect sync. The server
 * snapshot is "dark" — the :root CSS default — so SSR and the first hydration
 * render agree; the store then resolves to the real attribute on the client.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Mode {
  return document.documentElement.getAttribute("data-mode") === "light"
    ? "light"
    : "dark";
}

function getServerSnapshot(): Mode {
  return "dark";
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = mode === "dark";

  function toggle() {
    const next: Mode = isDark ? "light" : "dark";
    // Setting the attribute drives the CSS instantly and notifies the store via
    // the MutationObserver, which re-renders this button with the new icon.
    document.documentElement.setAttribute("data-mode", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private mode / blocked storage; the toggle
      // still works for this session, it just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle light/dark"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-surface-2/60 text-foreground/75 transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span suppressHydrationWarning>{isDark ? <MoonIcon /> : <SunIcon />}</span>
    </button>
  );
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
