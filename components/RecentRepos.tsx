"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  browserRecentStore,
  clearRecentRepos,
  getRecentRepos,
  type RecentRepo,
} from "@/lib/recent-repos";

function ago(iso: string, now: number): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function RecentRepos() {
  const [items, setItems] = useState<RecentRepo[]>([]);
  useEffect(() => {
    setItems(getRecentRepos(browserRecentStore()));
  }, []);
  if (items.length === 0) return null;
  const now = Date.now();
  return (
    <div className="mx-auto mt-8 max-w-xl text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={() => {
            clearRecentRepos(browserRecentStore());
            setItems([]);
          }}
          className="text-xs text-muted hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((r) => (
          <li key={`${r.owner}/${r.repo}`}>
            <Link
              href={`/report?repo=${encodeURIComponent(`${r.owner}/${r.repo}`)}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 px-4 py-2 text-sm transition-colors hover:border-brand/30"
            >
              <span className="font-mono text-foreground">
                {r.owner}/{r.repo}
              </span>
              <span className="text-xs text-muted">{ago(r.viewedAt, now)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted/70">Saved only in your browser.</p>
    </div>
  );
}
