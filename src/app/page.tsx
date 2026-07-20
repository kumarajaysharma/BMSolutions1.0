import { LandingPage } from "@/components/LandingPage";

// The root route IS the Home page and the landing page — one shared
// experience rendered from a single source of truth (LandingPage).
export default function RootLanding() {
  return <LandingPage />;
}
