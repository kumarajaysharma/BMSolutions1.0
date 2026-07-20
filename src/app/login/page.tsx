/**
 * src/app/login/page.tsx
 *
 * BNLV Studio — Branded Login Page
 * ==================================
 * Implements the premium Navy/Gold/Cream design system.
 * 
 * BUSINESS UX DECISIONS:
 *   - tenantSlug is cached in localStorage so repeat visitors see it pre-filled.
 *   - Error messages handle invalid states securely without exposing user enumeration.
 *   - Successful login redirects to the "next" query parameter, falling back to /admin.
 *   - The form is progressively disabled during submission to prevent double-POST.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { Lock, AlertCircle, Eye, EyeOff, Mail, Building, ArrowRight, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Separate the form into an inner component so we can wrap it in Suspense 
// (required by Next.js when using useSearchParams in a Client Component)
function LoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load previously used tenant slug to improve UX
  useEffect(() => {
    const savedTenant = localStorage.getItem("bnlv_tenant_slug");
    if (savedTenant) setTenantSlug(savedTenant);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tenantSlug }),
      });

      if (res.ok) {
        localStorage.setItem("bnlv_tenant_slug", tenantSlug);
        
        // Extract 'next' parameter from URL if it exists, otherwise default to admin
        const nextUrl = searchParams.get("next") || "/admin";
        window.location.href = nextUrl;
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials. Please verify your workspace and password.");
      }
    } catch (err) {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md z-10">
      {/* Premium Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 border border-amber-100 p-8 sm:p-10">
        
        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-700">
            <Lock className="text-amber-500 w-8 h-8" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            BNLV Studio
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Enter your secure enterprise workspace
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Workspace / Tenant Slug */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Workspace ID
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900"
                placeholder="e.g., bnlv-hq"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <span className="text-slate-400 sm:text-sm font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">.studio.bnlv.com</span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Email Address
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900"
                placeholder="admin@bnlvconsulting.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !email || !password || !tenantSlug}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-amber-50 bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-60 transition-all"
            >
              {isLoading ? "Authenticating..." : "Secure Login"}
              {!isLoading && <ArrowRight size={18} className="text-amber-500" />}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            Zero-Trust Authenticated Environment
          </div>
          <p className="text-xs text-slate-400">
            BMS — A BNLV Group Company
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient brand gradient blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-slate-200/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-200/40 blur-3xl" />
      </div>

      <Suspense fallback={<div className="z-10 text-slate-500 font-medium animate-pulse">Loading workspace...</div>}>
        <LoginClient />
      </Suspense>
    </main>
  );
}