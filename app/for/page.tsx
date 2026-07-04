import type { Metadata } from "next";
import Link from "next/link";
import { PERSONAS, PERSONA_ORDER } from "@/config/personas";
import { PersonaCard } from "@/components/PersonaCard";

export const metadata: Metadata = {
  title: "Who is TrustScope for? — Adopters & Maintainers",
  description:
    "TrustScope is for two audiences: adopters evaluating a third-party project before they depend on it, and maintainers checking — and closing — their own trust gaps.",
};

export default function ForPage() {
  return (
    <div>
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Who is <span className="text-brand">TrustScope</span> for?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Same tool, same report — two vantage points.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 pb-4 text-center text-[15px] leading-relaxed text-muted">
        Both ask the same question —{" "}
        <em className="text-foreground/90">how trustworthy is this repository?</em> — from opposite
        directions.
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {PERSONA_ORDER.map((id) => (
            <PersonaCard key={id} persona={PERSONAS[id]} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Paste a repo →
        </Link>
      </section>
    </div>
  );
}
