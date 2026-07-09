"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/config/nav";

/**
 * Desktop dropdown modelled as a disclosure (button + aria-expanded controlling
 * a group of plain links) — deliberately NOT a WAI-ARIA `menu`, so we don't ship
 * half of that pattern's required arrow-key semantics. Escape + click-outside
 * close it and return focus to the trigger. (spec §5 a11y; report a11y decision.)
 */
function DesktopItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!item.children) {
    return item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {item.label}
      </a>
    ) : (
      <Link
        href={item.href!}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {item.label} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-20 min-w-52 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
          {item.children.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm hover:bg-surface-2"
            >
              <span className="font-medium">{c.label}</span>
              {c.hint && <span className="block text-xs text-muted">{c.hint}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavMenu({ items }: { items: readonly NavItem[] }) {
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawer(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-5 sm:flex">
        {items.map((it) => (
          <DesktopItem key={it.label} item={it} />
        ))}
      </nav>
      <button
        type="button"
        aria-label={drawer ? "Close menu" : "Open menu"}
        aria-expanded={drawer}
        onClick={() => setDrawer((v) => !v)}
        className="rounded-md border border-border px-3 py-1.5 text-sm text-muted sm:hidden"
      >
        {drawer ? "Close" : "Menu"}
      </button>
      {drawer && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface p-4 sm:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {items.flatMap((it) =>
              it.children
                ? [
                    <span
                      key={it.label}
                      className="px-2 pt-2 text-xs uppercase tracking-wider text-muted"
                    >
                      {it.label}
                    </span>,
                    ...it.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setDrawer(false)}
                        className="rounded-md px-2 py-2 text-sm hover:bg-surface-2"
                      >
                        {c.label}
                      </Link>
                    )),
                  ]
                : [
                    it.external ? (
                      <a
                        key={it.label}
                        href={it.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md px-2 py-2 text-sm hover:bg-surface-2"
                      >
                        {it.label}
                      </a>
                    ) : (
                      <Link
                        key={it.label}
                        href={it.href!}
                        onClick={() => setDrawer(false)}
                        className="rounded-md px-2 py-2 text-sm hover:bg-surface-2"
                      >
                        {it.label}
                      </Link>
                    ),
                  ],
            )}
          </nav>
        </div>
      )}
    </>
  );
}
