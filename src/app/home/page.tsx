import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Home — BMS (Business Management Solutions) | A BNLV Group of Company",
  description:
    "BMS Enterprise Home: visual builder, Claude Fable 5 AI routing engine, client request scheduling, CI/CD pipelines, and cross-platform app readiness.",
};

// Dedicated /home route. It renders the exact same experience as the
// root landing page — Home IS the landing page, permanently in sync
// because both routes share the single LandingPage component.
export default function HomePage() {
  return <LandingPage />;
}
