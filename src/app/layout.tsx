import type { Metadata } from "next";
import "./globals.css";
import StudioShell from "@/components/StudioShell"; // Import remains same
import SessionHeader from "@/components/SessionHeaderC"; // Updated to match your file name
import { PreferencesProvider } from "@/components/Preferences";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  applicationName: "BMS (Business Management Solutions) — A BNLV Group of Company",
  appleWebApp: { capable: true, title: "BMS Studio", statusBarStyle: "default" },
  title: "BMS — Business Management Solutions | A BNLV Group of Company",
  description:
    "True Professional Enterprise SaaS Studio by BNLV Group of Company: visual builder, Claude Fable 5 AI routing engine, multi-tenant RBAC, CI/CD deployments, and cross-platform app readiness.",
};

const themeInit = `try{var t=localStorage.getItem("forge-theme");if(t)document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-sand-50 text-slate-700 antialiased">
        <PreferencesProvider>
          <PwaRegister />
          {/* Passing SessionHeaderC as a component prop solves the Server/Client conflict */}
          <StudioShell header={<SessionHeader />}>
            {children}
          </StudioShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}