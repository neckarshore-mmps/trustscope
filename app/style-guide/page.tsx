import type { Metadata } from "next";
import Link from "next/link";

/**
 * Internal design-system reference for TrustScope.
 *
 * Not a customer page — a mirror of the live system so every token can be
 * eyeballed in situ. `noindex, nofollow`; deliberately absent from the sitemap.
 * Reachable only via a discreet "Style Guide" link in the footer meta line.
 * Source of truth for every token: `app/globals.css` (+ config/pillars.ts for the
 * pillar hues). Components live in `components/`; changes happen there, not here.
 */

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Internal design-system reference: colours, type, components.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/style-guide" },
};

type Swatch = {
  name: string;
  token: string;
  dark: string;
  light: string;
  usage: string;
};

const CORE: Swatch[] = [
  { name: "Background", token: "--background", dark: "#090d13", light: "#f6f7f9", usage: "Page ground" },
  { name: "Surface", token: "--surface", dark: "#0f1620", light: "#ffffff", usage: "Cards, header, footer" },
  { name: "Surface 2", token: "--surface-2", dark: "#16202c", light: "#eceef1", usage: "Insets, code chips" },
  { name: "Border", token: "--border", dark: "#223041", light: "#dde1e6", usage: "Hairlines, dividers" },
  { name: "Foreground", token: "--foreground", dark: "#e6edf3", light: "#14181d", usage: "Body text" },
  { name: "Muted", token: "--muted", dark: "#90a1b6", light: "#5f6975", usage: "Secondary text, captions" },
  { name: "Brand", token: "--brand", dark: "#2dd4bf", light: "#0f766e", usage: "Accent, links, primary button" },
  { name: "Brand Strong", token: "--brand-strong", dark: "#14b8a6", light: "#0d9488", usage: "Emphasis, hover fills" },
];

const PILLARS: { name: string; token: string; dark: string; light: string }[] = [
  { name: "Pillar 1 · Emerald", token: "--pillar-text-1", dark: "#6ee7b7", light: "#047857" },
  { name: "Pillar 2 · Sky", token: "--pillar-text-2", dark: "#7dd3fc", light: "#0369a1" },
  { name: "Pillar 3 · Amber", token: "--pillar-text-3", dark: "#fcd34d", light: "#b45309" },
  { name: "Pillar 4 · Slate", token: "--pillar-text-4", dark: "#94a3b8", light: "#475569" },
];

function SwatchCard({ s }: { s: Swatch }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex">
        <div className="flex h-16 flex-1 items-end p-2" style={{ background: s.dark }}>
          <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white">{s.dark}</span>
        </div>
        <div className="flex h-16 flex-1 items-end p-2" style={{ background: s.light }}>
          <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[10px] text-black">{s.light}</span>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium text-foreground">{s.name}</p>
        <p className="font-mono text-xs text-muted">{s.token}</p>
        <p className="mt-1.5 text-xs text-muted">{s.usage}</p>
      </div>
    </div>
  );
}

function SectionHead({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <header className="mb-8 border-b border-border pb-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">{n}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
      {note && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{note}</p>}
    </header>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-brand">{children}</code>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Internal · Design System</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Style Guide</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        The live design-system reference for TrustScope — every colour, type step and
        component in situ. Dark is the base; flip Light/Dark in the header to check both.
        Not linked in the nav, <Code>noindex</Code>, not in the sitemap.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Source of truth: <Code>app/globals.css</Code> and <Code>config/pillars.ts</Code>
        {" "}(pillar hues). Components live in <Code>components/</Code> — change them there,
        not here.
      </p>

      {/* 01 Colours */}
      <section className="mt-16">
        <SectionHead
          n="01 · Colour"
          title="Palette"
          note="Two grounds per token — dark (left half of each chip) and light (right half). Brand teal deepens from #2dd4bf to teal-700 #0f766e in light mode so it clears WCAG AA as text."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE.map((s) => (
            <SwatchCard key={s.token} s={s} />
          ))}
        </div>

        <h3 className="mt-10 mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Pillar accent text · dark / light
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.token} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-md" style={{ background: p.dark }} aria-hidden />
                <span className="h-8 w-8 rounded-md border border-border" style={{ background: p.light }} aria-hidden />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{p.name}</p>
              <p className="font-mono text-xs text-muted">{p.token}</p>
              <p className="font-mono text-[11px] text-muted">{p.dark} · {p.light}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-10 mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
          CTA gradient · dual-role (adopt ↔ maintain)
        </h3>
        <div className="cta-fade flex h-16 items-center justify-center rounded-lg font-semibold">
          teal → amber → teal · one fixed dark ink clears AA across the sweep
        </div>
      </section>

      {/* 02 Typography */}
      <section className="mt-16">
        <SectionHead
          n="02 · Type"
          title="Typography"
          note="Geist Sans for everything, Geist Mono for code, versions and tokens. Tight tracking on headings; relaxed body."
        />
        <div className="space-y-8">
          <div>
            <p className="mb-1 font-mono text-xs text-muted">h1 · text-4xl→5xl · font-semibold · tracking-tight</p>
            <p className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Open-source trust reports.</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-xs text-muted">h2 · text-3xl · font-semibold</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">Evidence, not a single score.</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-xs text-muted">h3 · text-xl · font-semibold</p>
            <p className="text-xl font-semibold text-foreground">Four pillars of maintenance</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-xs text-muted">Body · text-lg · leading-relaxed · text-muted</p>
            <p className="max-w-2xl text-lg leading-relaxed text-muted">
              TrustScope builds on the OpenSSF Scorecard and reports the evidence per pillar —
              no single aggregate number to game.
            </p>
          </div>
          <div>
            <p className="mb-1 font-mono text-xs text-muted">Mono · font-mono</p>
            <p className="font-mono text-sm text-muted">TrustScope v0.3.0 · a1b2c3d</p>
          </div>
        </div>
      </section>

      {/* 03 Buttons */}
      <section className="mt-16">
        <SectionHead
          n="03 · Buttons"
          title="Buttons & CTAs"
          note="Primary is a solid brand fill with dark ink. The dual-role CTA uses the teal↔amber gradient. Ghost is a plain link; brand chips carry a ring."
        />
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Run a report
          </button>
          <button type="button" className="cta-fade inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold">
            Adopt or maintain →
          </button>
          <button type="button" className="inline-flex items-center rounded-lg border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand/40">
            Secondary
          </button>
          <Link href="/style-guide" className="text-sm font-medium text-brand underline decoration-border underline-offset-4 hover:text-brand-strong">
            Ghost link
          </Link>
          <span className="inline-flex items-center rounded-lg bg-brand/15 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/25">
            Brand chip
          </span>
        </div>
      </section>

      {/* 04 Components */}
      <section className="mt-16">
        <SectionHead
          n="04 · Surfaces"
          title="Cards & Components"
          note="Two card families: neutral surface cards and brand-tinted highlight cards. Hairline borders throughout; rounded-lg is the one radius."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-foreground">Surface card</p>
            <p className="mt-2 text-sm text-muted">border-border · bg-surface. Default content surface.</p>
          </div>
          <div className="rounded-lg border border-brand/20 bg-brand/[0.04] p-5">
            <p className="text-sm font-semibold text-brand">Brand highlight</p>
            <p className="mt-2 text-sm text-muted">border-brand/20 · bg-brand/[0.04]. Callouts, selected states.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-5">
            <p className="text-sm font-semibold text-foreground">Surface-2 inset</p>
            <p className="mt-2 text-sm text-muted">bg-surface-2. Insets, code blocks, quiet panels.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-sm font-semibold text-brand ring-1 ring-brand/25">1</span>
          <span className="inline-flex items-center gap-2 text-sm text-muted"><span className="h-1.5 w-1.5 rounded-full bg-brand" />brand dot</span>
          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">pill · uppercase</span>
        </div>
      </section>

      {/* 05 Spacing */}
      <section className="mt-16">
        <SectionHead
          n="05 · Layout"
          title="Spacing & Layout"
          note="Content columns at max-w-3xl, wide grids at max-w-5xl. rounded-lg everywhere. Section rhythm in 4rem (mt-16) steps."
        />
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Container", "mx-auto max-w-3xl (prose) · max-w-5xl (grids)"],
            ["Section rhythm", "mt-16 (4rem) between major sections"],
            ["Radius", "rounded-lg — one radius, no pills except tags"],
            ["Border", "border-border / border-border/70 hairlines"],
            ["Focus", "native focus-visible ring (color-scheme aware)"],
            ["Selection", "::selection teal (brand @ 25%)"],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border border-border bg-surface p-4">
              <dt className="font-mono text-xs text-muted">{t}</dt>
              <dd className="mt-2 text-sm text-foreground">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-16 border-t border-border pt-6">
        <Link href="/" className="text-sm font-medium text-brand underline decoration-border underline-offset-4 hover:text-brand-strong">
          ← Back to TrustScope
        </Link>
      </div>
    </div>
  );
}
