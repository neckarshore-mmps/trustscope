// DRAFT — muss von dr-sommer/james + Founder rechtlich abgenommen werden, bevor verbindlich.
import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/config/product";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: `Wie ${PRODUCT_NAME} personenbezogene Daten verarbeitet — anonyme Nutzung, öffentliche GitHub-Daten, Hosting bei Vercel. Keine Konten, kein Tracking.`,
  robots: { index: true, follow: true },
};

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand";

export default function DatenschutzPage() {
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
            Datenschutzerklärung
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            {PRODUCT_NAME} ist so gebaut, dass es fast keine personenbezogenen Daten
            verarbeitet: keine Konten, kein Tracking, keine Newsletter. Bewertet werden
            öffentliche Repositories, nicht Sie.
          </p>
        </div>
      </section>

      {/*
        << V2-Update nötig, sobald Accounts/E-Mail/OAuth live sind — D7 >>
        Diese Erklärung beschreibt den aktuellen anonymen Stand. Kommen Nutzerkonten,
        E-Mail-Versand oder ein aktiver OAuth-Login hinzu, müssen die betroffenen
        Verarbeitungen (Identität, Kontaktdaten, Session-Cookies, Auftragsverarbeiter)
        hier ergänzt werden.
      */}

      {/* § 1 Verantwortlicher */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 1 · Verantwortlicher
        </h2>
        <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-foreground/90">
          <p>Verantwortlich im Sinne der DSGVO ist:</p>
          <p className="font-medium">German Rauhut</p>
          <p>Stuttgart, Deutschland</p>
          <p>
            E-Mail:{" "}
            <a className={LINK} href="mailto:german@rauhut.com">
              german@rauhut.com
            </a>
          </p>
        </div>
        {/* << TODO: Founder/DPO — sobald ein/e Datenschutzbeauftragte/r benannt ist (TS24),
            hier Kontaktdaten ergänzen. Vollständige Anschrift wie im Impressum. >> */}
      </section>

      {/* § 2 Hosting */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 2 · Hosting (Vercel)
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {PRODUCT_NAME} wird bei der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
          USA, gehostet. Beim Aufruf der Seiten verarbeitet Vercel technisch notwendige
          Verbindungsdaten (siehe § 3) als Auftragsverarbeiter für uns. Rechtsgrundlage
          ist unser berechtigtes Interesse an einem sicheren und leistungsfähigen
          Bereitstellen des Angebots (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Dabei können Daten in die USA übermittelt werden. Grundlage der Übermittlung
          sind die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO); zusätzlich
          ist Vercel unter dem EU-U.S. Data Privacy Framework zertifiziert. Ein Zugriff
          US-amerikanischer Behörden lässt sich trotz dieser Garantien nicht vollständig
          ausschließen.
        </p>
        {/* << TODO: Founder/DPO — Auftragsverarbeitungsvertrag (AVV/DPA) mit Vercel prüfen und
            als abgeschlossen bestätigen. DPF-Zertifizierung von Vercel vor Verbindlichkeit
            gegenprüfen. >> */}
      </section>

      {/* § 3 Server-Logfiles */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 3 · Server-Logfiles
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Beim Aufruf der Seiten fallen bei unserem Hosting-Anbieter technisch
          notwendige Zugriffsdaten an — insbesondere IP-Adresse, Zeitpunkt der Anfrage,
          angeforderte URL sowie übermittelter Browser- und Betriebssystem-Typ. Diese
          Daten dienen der Auslieferung, Sicherheit und Stabilität des Angebots und
          werden nicht mit anderen Datenquellen zusammengeführt. Rechtsgrundlage ist
          unser berechtigtes Interesse am sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      {/* § 4 Verarbeitung öffentlicher Repository-Daten — the core processing */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 4 · Verarbeitung öffentlicher Repository-Daten
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Die Kernfunktion von {PRODUCT_NAME} ist das Bewerten öffentlicher
          GitHub-Repositories. Geben Sie ein Repository ein (URL oder{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[13px] text-foreground/80">
            owner/repo
          </code>
          ), rufen wir öffentlich zugängliche Daten über die GitHub-API ab und lassen die
          OpenSSF Scorecard darauf laufen. Verarbeitet werden ausschließlich bereits
          öffentliche Informationen des jeweiligen Projekts — dazu können auch
          personenbezogene Daten von Maintainern und Mitwirkenden gehören (etwa Namen,
          GitHub-Benutzernamen oder Angaben aus Governance-Dateien).
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Rechtsgrundlage ist unser berechtigtes Interesse sowie das der Nutzer an einer
          nachvollziehbaren Sicherheits- und Vertrauensbewertung von Open-Source-Software
          vor deren Einsatz (Art. 6 Abs. 1 lit. f DSGVO). Es werden nur Daten verarbeitet,
          die die Projekte selbst öffentlich bereitstellen. Betroffene können der
          Verarbeitung unter den Voraussetzungen des Art. 21 DSGVO widersprechen.
        </p>
        {/* << TODO: Founder/DPO — Aufbewahrung/Caching der erzeugten Reports beschreiben,
            sobald festgelegt (aktuell: deterministisch aus öffentlichen Daten neu erzeugt).
            Prüfen, ob eine Info-Pflicht/Interessenabwägung nach Art. 14 DSGVO gegenüber
            Maintainern zu dokumentieren ist. >> */}
      </section>

      {/* § 5 Keine Konten, kein Tracking */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 5 · Keine Konten, kein Tracking
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {PRODUCT_NAME} funktioniert ohne Benutzerkonto. Es gibt derzeit keine
          Registrierung, kein Login und keine Newsletter-Anmeldung. Wir setzen keine
          Analyse- oder Tracking-Cookies und binden keine Werbe- oder Tracking-Dienste
          Dritter ein.
        </p>
        {/*
          << TODO Founder/DPO — WICHTIG: Der Code enthält bereits einen env-gated
             GitHub-OAuth-Flow ("file as yourself", Route /api/file-issue, next-auth,
             Scope "read:user public_repo"). Ist GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET in
             Produktion gesetzt, ist der Login AKTIV und es MUSS hier beschrieben werden:
             Verarbeitung der GitHub-Identität + Access-Token (nur zum Öffnen des Issues
             als der Nutzer, Session-Cookie via next-auth), Empfänger GitHub, Rechtsgrundlage
             Art. 6 Abs. 1 lit. b/f. Ist die Variable NICHT gesetzt, ist der Flow dormant —
             dann bitte hier bestätigen. Vor Verbindlichkeit klären. — D7 >>
        */}
      </section>

      {/* § 6 Ihre Rechte */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 6 · Ihre Rechte
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Sie haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft
          (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO),
          Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit
          (Art. 20 DSGVO) sowie ein Widerspruchsrecht gegen Verarbeitungen auf Grundlage
          von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO). Wenden Sie sich dafür an die in
          § 1 genannte Kontaktadresse.
        </p>
      </section>

      {/* § 7 Beschwerderecht */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 7 · Beschwerderecht
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Unbeschadet anderweitiger Rechtsbehelfe haben Sie das Recht, sich bei einer
          Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO), insbesondere in dem
          Mitgliedstaat Ihres Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts des
          mutmaßlichen Verstoßes.
        </p>
      </section>
    </div>
  );
}
