"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Rotating hero headline. Twelve loss-framed CTAs — six for adopters (evaluating a
 * tool, teal accent) and six for maintainers (maintaining one, amber accent) —
 * swap every 5s with a calm opacity crossfade. Order alternates adopter <-> maintainer,
 * random within each pool, never repeating the last line of that pool.
 *
 * SSR renders the deterministic anchor (index 0) so the H1 is stable for crawlers and
 * there is no hydration mismatch; rotation starts client-side after mount. Honours
 * prefers-reduced-motion by staying on the anchor.
 */

type Persona = "adopter" | "maintainer";
type Line = { persona: Persona; pre: string; hi: string; post: string };

const LINES: Line[] = [
  { persona: "adopter", pre: `Don't build on code `, hi: `you haven't vetted`, post: `.` },
  { persona: "adopter", pre: `That dependency could be your `, hi: `next breach`, post: `.` },
  { persona: "adopter", pre: `Stars won't stop a `, hi: `supply-chain attack`, post: `.` },
  { persona: "adopter", pre: `You're one install from a `, hi: `hidden backdoor`, post: `.` },
  { persona: "adopter", pre: `You're trusting a stranger's `, hi: `weekend project`, post: `.` },
  { persona: "adopter", pre: `Ship it unvetted and `, hi: `get f***ed`, post: `.` },
  { persona: "maintainer", pre: `Your repo has gaps you `, hi: `haven't found yet`, post: `.` },
  { persona: "maintainer", pre: `Without proof, adopters assume `, hi: `the worst`, post: `.` },
  { persona: "maintainer", pre: `"Trust me" isn't a `, hi: `security posture`, post: `.` },
  { persona: "maintainer", pre: `Find your supply-chain gaps `, hi: `before attackers do`, post: `.` },
  { persona: "maintainer", pre: `Silence looks like `, hi: `something to hide`, post: `.` },
  { persona: "maintainer", pre: `Ignore the gaps and `, hi: `get f***ed`, post: `.` },
];

const ANCHOR = 0;
const HOLD_MS = 5000;
const FADE_MS = 700;

function accent(persona: Persona): string {
  return persona === "adopter" ? "text-brand" : "text-amber-400 light:text-amber-700";
}

export function RotatingHeadline() {
  const [idx, setIdx] = useState(ANCHOR);
  const [visible, setVisible] = useState(true);
  const idxRef = useRef(ANCHOR);
  const lastOf = useRef<Record<Persona, number>>({ adopter: ANCHOR, maintainer: -1 });

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let swap: ReturnType<typeof setTimeout>;
    const tick = () => {
      setVisible(false); // fade out
      swap = setTimeout(() => {
        const next: Persona =
          LINES[idxRef.current].persona === "adopter" ? "maintainer" : "adopter";
        const pool = LINES.map((l, i) => ({ l, i })).filter(
          ({ l, i }) => l.persona === next && i !== lastOf.current[next],
        );
        const pick = pool[Math.floor(Math.random() * pool.length)].i;
        lastOf.current[next] = pick;
        idxRef.current = pick;
        setIdx(pick);
        setVisible(true); // fade in
      }, FADE_MS);
    };

    const interval = setInterval(tick, HOLD_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(swap);
    };
  }, []);

  const line = LINES[idx];

  return (
    <h1 className="mx-auto grid min-h-[2.55em] max-w-4xl place-items-center text-center text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
      <span
        style={{ transition: `opacity ${FADE_MS}ms ease-in-out`, opacity: visible ? 1 : 0 }}
      >
        {line.pre}
        <span className={accent(line.persona)}>{line.hi}</span>
        {line.post}
      </span>
    </h1>
  );
}
