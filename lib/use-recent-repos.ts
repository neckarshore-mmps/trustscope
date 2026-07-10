"use client";

import { useSyncExternalStore } from "react";
import {
  addRecentRepo,
  browserRecentStore,
  clearRecentRepos,
  getRecentRepos,
  removeRecentRepo,
  type RecentRepo,
} from "./recent-repos";

/**
 * React binding for the client-local recent-repos list via useSyncExternalStore
 * — the blessed hydration-safe way to read an external mutable store (localStorage)
 * without a setState-in-effect. Server snapshot is a stable empty array, so the
 * strip renders nothing on the server and populates on the client after hydration.
 */

const EMPTY: RecentRepo[] = [];
const listeners = new Set<() => void>();

// Cache keyed on the raw stored string so getSnapshot returns a referentially
// stable array while storage is unchanged (a fresh array each call would loop).
let cachedRaw: string | null = null;
let cachedList: RecentRepo[] = EMPTY;

function getSnapshot(): RecentRepo[] {
  const store = browserRecentStore();
  let raw: string | null;
  try {
    raw = store.read();
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  cachedList = getRecentRepos(store);
  return cachedList;
}

function getServerSnapshot(): RecentRepo[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Cross-tab writes.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify(): void {
  cachedRaw = null; // force recompute on next snapshot
  for (const l of listeners) l();
}

export function useRecentRepos(): RecentRepo[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Record a viewed repo (canonical owner/repo) and notify subscribers. */
export function recordRecentRepo(owner: string, repo: string, now: string): void {
  addRecentRepo(browserRecentStore(), { owner, repo }, now);
  notify();
}

/** Remove a single repo from the recent list and notify subscribers. */
export function removeRecentRepoAndNotify(owner: string, repo: string): void {
  removeRecentRepo(browserRecentStore(), { owner, repo });
  notify();
}

/** Clear the recent list and notify subscribers. */
export function clearRecentReposAndNotify(): void {
  clearRecentRepos(browserRecentStore());
  notify();
}
