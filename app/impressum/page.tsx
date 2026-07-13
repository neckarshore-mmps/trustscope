import Link from "next/link";
import type { Metadata } from "next";
import { PRODUCT_NAME, PRODUCT_ORG } from "@/config/product";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Anbieterkennzeichnung nach § 5 DDG für ${PRODUCT_NAME} — eine Reputationsoberfläche von ${PRODUCT_ORG}.`,
  robots: { index: true, follow: true },
};

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand";

export default function ImpressumPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Rechtliches
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Impressum
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Anbieterkennzeichnung nach § 5 DDG für {PRODUCT_NAME} — eine
            Reputationsoberfläche von {PRODUCT_ORG}.
          </p>
        </div>
      </section>

      {/* Angaben gemäß § 5 DDG */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Angaben gemäß § 5 DDG
        </h2>
        <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-foreground/90">
          <p className="font-medium">
            German Rauhut IT Consulting &amp; Digital Ventures
          </p>
          <p>Einzelunternehmen — Inhaber: German Rauhut</p>
          <p>Rotebühlstraße 176</p>
          <p>70197 Stuttgart</p>
          <p>Deutschland</p>
        </div>
        {/*
          Diensteanbieter-Block spiegelt neckarshore.ai/impressum (TrustScope ist ein
          Neckarshore-AI-Produkt) — von MASCHIN 2026-07-05 gegen neckarshore.ai/impressum
          abgeglichen. German Rauhut betreibt als Einzelunternehmen — keine eingetragene
          Gesellschaft, daher keine Handelsregister-Angaben. § 27a UStG verlangt eine
          USt-IdNr. nur, wenn eine vergeben ist — sie wird hier erst genannt, sobald sie
          existiert (kein Platzhalter; CodeRabbit-Legal-Thread #46, Founder-Sign-off).
        */}
      </section>

      {/* Kontakt */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Kontakt
        </h2>
        <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Telefon:{" "}
            <a className={LINK} href="tel:+491603859135">
              +49 160 385 9135
            </a>
          </p>
          <p>
            E-Mail:{" "}
            <a className={LINK} href="mailto:info@neckarshore.ai">
              info@neckarshore.ai
            </a>
          </p>
          {/* Zwei schnelle Kontaktkanäle nach § 5 DDG (E-Mail + Telefon).
              info@neckarshore.ai spiegelt die kanonische neckarshore.ai-Kontaktadresse. */}
        </div>
      </section>

      {/* Verantwortlich für den Inhalt */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">
          German Rauhut, Anschrift wie oben.
        </p>
      </section>

      {/* Haftung für Inhalte */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Haftung für Inhalte
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf
          diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10
          DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
          gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
          forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
          Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
          Gesetzen bleiben hiervon unberührt.
        </p>
      </section>

      {/* Haftung für Links */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Haftung für Links
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
          wir keinen Einfluss haben — unter anderem auf GitHub und die Dokumentation der
          OpenSSF Scorecard. Deshalb können wir für diese fremden Inhalte auch keine
          Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
          Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von
          Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>
      </section>

      {/* Datenschutz cross-link */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          Datenschutz
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
          <Link className={LINK} href="/datenschutz">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
