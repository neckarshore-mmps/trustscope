import type { Metadata } from "next";
import { PERSONAS } from "@/config/personas";
import { PersonaSpoke } from "@/components/PersonaSpoke";

export const metadata: Metadata = {
  title: "TrustScope for adopters",
  description:
    "Vet a third-party open-source project before you depend on it — security, governance and community, with the trade-offs kept visible.",
};

export default function AdoptersPage() {
  return <PersonaSpoke persona={PERSONAS.adopter} other={PERSONAS.maintainer} />;
}
