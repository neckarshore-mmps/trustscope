/**
 * Parse whatever the user pastes into { owner, repo }.
 * Accepts: full https URL, git@ SSH, github.com/owner/repo, or bare owner/repo — with or
 * without extra path segments (/tree/main), a trailing .git, or trailing slashes.
 * Returns null for anything that isn't a resolvable GitHub owner/repo pair.
 */
export interface RepoRef {
  owner: string;
  repo: string;
}

// GitHub org/user logins: alphanumeric + hyphen, no dots. Repo names may contain dots/underscores.
const OWNER_RE = /^[A-Za-z0-9][A-Za-z0-9-]*$/;
const REPO_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function parseRepoInput(raw: string): RepoRef | null {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s) return null;

  s = s.replace(/^git@github\.com:/i, "github.com/");
  s = s.replace(/^https?:\/\//i, "");
  s = s.replace(/^www\./i, "");
  s = s.replace(/^github\.com\//i, "");

  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");

  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;
  return { owner, repo };
}
