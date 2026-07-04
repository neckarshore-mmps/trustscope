import type { Metadata } from "next";
import { PERSONAS } from "@/config/personas";
import { PersonaSpoke } from "@/components/PersonaSpoke";

export const metadata: Metadata = {
  title: "TrustScope for maintainers",
  description:
    "See — and close — the trust gaps adopters look for in your own project, with constructive rule-based fixes you can file yourself.",
};

export default function MaintainersPage() {
  return <PersonaSpoke persona={PERSONAS.maintainer} other={PERSONAS.adopter} />;
}
