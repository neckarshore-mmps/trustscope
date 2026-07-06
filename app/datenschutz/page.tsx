// DRAFT — muss von dr-sommer/james + Founder rechtlich abgenommen werden, bevor verbindlich.
import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/config/product";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: `Wie ${PRODUCT_NAME} personenbezogene Daten verarbeitet — anonyme Nutzung, öffentliche GitHub-Daten, Hosting bei Vercel, optionaler GitHub-Login. Kein Tracking.`,
  robots: { index: true, follow: true },
};

const LINK =
  "text-foreground/80 underline decoration-border underline-offset-4 hover:text-brand";
const CODE =
  "rounded bg-surface-2 px-1 py-0.5 text-[13px] text-foreground/80";

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
            verarbeitet: kein Tracking, keine Analyse-Cookies, kein Newsletter und kein
            verpflichtendes Konto. Bewertet werden öffentliche Repositories, nicht Sie.
          </p>
        </div>
      </section>

      {/*
        << V2-Update nötig, sobald PERSISTENTE Nutzerkonten oder E-Mail-Versand hinzukommen — D7 >>
        Der optionale GitHub-Login ("file as yourself") ist bereits live (GITHUB_CLIENT_ID/SECRET
        in Prod gesetzt, verifiziert 2026-07-03 via `vercel env ls production`) und in § 5
        beschrieben. Kommen darüber hinaus gespeicherte Konten, Kontaktdaten oder E-Mail-Versand
        hinzu, müssen die betroffenen Verarbeitungen hier ergänzt werden.
      */}

      {/* § 1 Verantwortlicher */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 1 · Verantwortlicher
        </h2>
        <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-foreground/90">
          <p>Verantwortlich im Sinne der DSGVO ist:</p>
          <p className="font-medium">
            German Rauhut IT Consulting &amp; Digital Ventures
          </p>
          <p>Einzelunternehmen — Inhaber: German Rauhut</p>
          <p>Rotebühlstraße 176, 70197 Stuttgart, Deutschland</p>
          <p>
            E-Mail:{" "}
            <a className={LINK} href="mailto:info@neckarshore.ai">
              info@neckarshore.ai
            </a>
          </p>
          <p>
            Telefon:{" "}
            <a className={LINK} href="tel:+491603859135">
              +49 160 385 9135
            </a>
          </p>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Ein/e Datenschutzbeauftragte/r ist gesetzlich nicht bestellungspflichtig
          (Art. 37 DSGVO, § 38 BDSG) und daher nicht benannt. Für alle Anliegen zum
          Datenschutz erreichen Sie uns unter den vorstehenden Kontaktdaten.
        </p>
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
          Bereitstellen des Angebots (Art. 6 Abs. 1 lit. f DSGVO). Die Verarbeitung
          erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags nach Art. 28 DSGVO,
          den wir mit Vercel geschlossen haben.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Dabei können Daten in die USA übermittelt werden. Grundlage der Übermittlung
          sind die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO); zusätzlich
          ist Vercel unter dem EU-U.S. Data Privacy Framework zertifiziert. Ein Zugriff
          US-amerikanischer Behörden lässt sich trotz dieser Garantien nicht vollständig
          ausschließen.
        </p>
        {/* << Sign-off Founder/Dr.Sommer (vor Entfernen des DRAFT-Markers): den AVV nach
            Art. 28 DSGVO mit Vercel sowie die aktuelle DPF-Zertifizierung final
            gegenbestätigen. >> */}
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
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Speicherdauer (Art. 13 Abs. 2 lit. a DSGVO): Diese Zugriffsdaten werden nur so
          lange gespeichert, wie es für die genannten Zwecke erforderlich ist, und
          anschließend gelöscht. Serverseitige Zugriffsprotokolle unseres
          Hosting-Anbieters werden regelmäßig kurzfristig vorgehalten und automatisch
          überschrieben; darüber hinaus führen wir selbst keine dauerhaften Logfiles.
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
          <code className={CODE}>owner/repo</code>), rufen wir öffentlich zugängliche
          Daten über die GitHub-API ab und lassen die OpenSSF Scorecard darauf laufen.
          Verarbeitet werden ausschließlich bereits öffentliche Informationen des
          jeweiligen Projekts — dazu können auch personenbezogene Daten von Maintainern
          und Mitwirkenden gehören (etwa Namen, GitHub-Benutzernamen oder Angaben aus
          Governance-Dateien).
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Rechtsgrundlage ist unser berechtigtes Interesse sowie das der Nutzer an einer
          nachvollziehbaren Sicherheits- und Vertrauensbewertung von Open-Source-Software
          vor deren Einsatz (Art. 6 Abs. 1 lit. f DSGVO). Es werden nur Daten verarbeitet,
          die die Projekte selbst öffentlich bereitstellen. Betroffene können der
          Verarbeitung unter den Voraussetzungen des Art. 21 DSGVO widersprechen.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Die erzeugten Berichte werden deterministisch aus den öffentlichen Daten
          abgeleitet und lediglich kurzzeitig zwischengespeichert (technischer Cache,
          Richtwert 24 Stunden), um wiederholte Abrufe zu beschleunigen; danach werden
          sie bei erneuter Anfrage neu erzeugt. Eine dauerhafte Profilbildung findet
          nicht statt.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Da wir diese Daten nicht bei den betroffenen Personen selbst, sondern aus der
          öffentlich zugänglichen Quelle GitHub erheben, erfolgt die Information nach
          Art. 14 DSGVO über diese Datenschutzerklärung. Eine gesonderte Benachrichtigung
          jeder einzelnen betroffenen Person wäre nur mit unverhältnismäßigem Aufwand
          möglich (Art. 14 Abs. 5 lit. b DSGVO), zumal ausschließlich bereits
          veröffentlichte Informationen verarbeitet werden.
        </p>
      </section>

      {/* § 5 Anmeldung mit GitHub (optional "file as yourself") */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 5 · Anmeldung mit GitHub (optional)
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          {PRODUCT_NAME} funktioniert vollständig ohne Anmeldung. Optional können Sie
          sich mit Ihrem GitHub-Konto anmelden, um einen Verbesserungsvorschlag direkt
          als GitHub-Issue in Ihrem Namen zu eröffnen („file as yourself“). Ohne
          Anmeldung stehen gleichwertige Alternativen bereit — Markdown kopieren oder ein
          vorbefülltes Issue-Formular öffnen; dabei werden keine Anmeldedaten verarbeitet.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Melden Sie sich an, nutzen wir GitHub OAuth (Auth.js/NextAuth) mit dem minimalen
          Berechtigungsumfang <code className={CODE}>read:user public_repo</code>. Im Zuge
          der Anmeldung übermittelt GitHub Angaben zu Ihrer GitHub-Identität (u. a.
          Benutzername, numerische Nutzer-ID, angezeigter Name, Avatar-URL sowie, sofern bei
          GitHub öffentlich, Ihre E-Mail-Adresse). Davon speichert {PRODUCT_NAME}{" "}
          ausschließlich das für die Funktion Notwendige — Ihre Nutzer-ID und ein
          Access-Token, das allein dazu dient, das von Ihnen ausgelöste Issue in Ihrem Namen
          bei GitHub zu erstellen (Datenminimierung, Art. 5 Abs. 1 lit. c DSGVO). Empfänger
          des Tokens ist GitHub. Diese Daten werden in einer technisch notwendigen,
          verschlüsselten Session (Cookie via NextAuth) gehalten und nicht dauerhaft in einer
          Datenbank gespeichert; mit Abmeldung oder Ablauf der Session endet die Nutzung
          durch {PRODUCT_NAME}.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Rechtsgrundlage ist die Durchführung der von Ihnen angeforderten Funktion
          (Art. 6 Abs. 1 lit. b DSGVO) sowie unser berechtigtes Interesse an deren
          sicherer Umsetzung (Art. 6 Abs. 1 lit. f DSGVO); das notwendige Session-Cookie
          stützt sich auf § 25 Abs. 2 Nr. 2 TDDDG. Unabhängig davon setzt{" "}
          {PRODUCT_NAME} keine Analyse- oder Tracking-Cookies und bindet keine Werbe- oder
          Tracking-Dienste Dritter ein.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          GitHub wird von der GitHub, Inc. (USA) als eigenständig Verantwortliche betrieben.
          Mit der Anmeldung und dem Erstellen des Issues werden daher personenbezogene Daten
          in die USA übermittelt. Diese Übermittlung erfolgt, weil Sie sie durch die von
          Ihnen angeforderte Funktion selbst veranlassen und sie zu deren Durchführung
          erforderlich ist (Art. 49 Abs. 1 lit. b DSGVO); ergänzend ist GitHub, Inc. unter
          dem EU-U.S. Data Privacy Framework zertifiziert (Art. 45 DSGVO).
        </p>
        {/* << Rechtlicher Stand (Dr. Sommer, DPO-Gutachten 2026-07-05) — Sign-off durch
            Founder + Dr. Sommer vor Entfernen des DRAFT-Markers:
            - Verhältnis zu GitHub: eigenständige/getrennte Verantwortliche (relying-party/IdP-
              Split), NICHT gemeinsame Verantwortlichkeit (Art. 26) oder Auftragsverarbeitung
              (Art. 28). § 5 nennt GitHub als "Empfänger des Tokens" -> Art. 13(1)(e) erfüllt.
            - Token-Custody: JWT-Session-Cookie, KEIN DB-Adapter (auth.ts + types/next-auth.d.ts
              verifiziert); NextAuth-Default 30 Tage rollierend. TrustScope-seitige Nutzung endet
              mit Cookie-Ablauf/Logout; das GitHub-OAuth-App-Token bleibt GitHub-seitig gültig,
              bis der Nutzer es widerruft.
            - Datenminimierung (Art. 5(1)(c)): der jwt-Callback strippt name/email/avatar;
              persistiert werden nur Access-Token + opake Nutzer-ID (sub).
            - GitHub-OAuth-Login ist in Produktion AKTIV (GITHUB_CLIENT_ID/SECRET gesetzt,
              verifiziert 2026-07-03 via `vercel env ls production`).
            - OFFENE DPO-Frage vor Sign-off: US-Transfer-Primärgrundlage — Art. 49(1)(b)
              (nutzerveranlasst, immun gegen DPF-Status-Drift) vs. Art. 45 (DPF-Angemessenheit).
              GitHub, Inc. ist EU-U.S.-DPF-selbstzertifiziert (participant/6174; "Active" beim
              Sign-off am DPF-Register gegenprüfen). Dr. Sommer entscheidet die Primärgrundlage. — D7 >> */}
      </section>

      {/* § 6 Lokale Speicherung (Recently Viewed) */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 6 · Lokale Speicherung (zuletzt angesehene Repositories)
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Damit Sie zuletzt angesehene Repositories schnell wiederfinden, speichert{" "}
          {PRODUCT_NAME} eine kurze Liste dieser Projekte ausschließlich lokal in Ihrem
          Browser (<code className={CODE}>localStorage</code>, Schlüssel{" "}
          <code className={CODE}>trustscope:recent-repos</code>, maximal acht Einträge).
          Gespeichert werden nur die von Ihnen selbst aufgerufenen Repository-Kennungen
          (<code className={CODE}>owner/repo</code>) samt Zeitpunkt — keine
          personenbezogenen Daten über Sie.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Diese Angaben verbleiben auf Ihrem Gerät und werden nicht an unseren Server
          oder an Dritte übermittelt. Es handelt sich um eine unbedingt für die von Ihnen
          gewünschte Komfortfunktion erforderliche Speicherung im Sinne des § 25 Abs. 2
          Nr. 2 TDDDG; eine Einwilligung ist dafür nicht erforderlich. Sie können den
          Eintrag jederzeit löschen, indem Sie die Liste in der Oberfläche zurücksetzen
          oder die Websitedaten in Ihrem Browser leeren.
        </p>
      </section>

      {/* § 7 Ihre Rechte */}
      <section className="mx-auto max-w-3xl px-5 pb-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 7 · Ihre Rechte
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

      {/* § 8 Beschwerderecht */}
      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
          § 8 · Beschwerderecht
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
