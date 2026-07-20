/**
 * src/components/LoginForm.tsx
 *
 * Client Component — handles login form state, submission, and localStorage caching.
 * Extracted from the Server Component page to ensure the page wrapper has no JS overhead.
 * 
 * Implements the BNLV Premium Navy/Gold/Cream design system.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, AlertCircle, Eye, EyeOff, Mail, Building, ArrowRight, Loader2 } from "lucide-react";

const TENANT_CACHE_KEY = "bnlv_tenant_slug";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  // Pre-fill workspace from localStorage on mount to improve UX
  useEffect(() => {
    try {
      const savedTenant = localStorage.getItem(TENANT_CACHE_KEY);
      if (savedTenant) {
        setTenantSlug(savedTenant);
        // Move focus to email so the user can tab straight through
        emailRef.current?.focus();
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — silent fallback
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password, 
          tenantSlug: tenantSlug.trim().toLowerCase() 
        }),
      });

      if (res.ok) {
        // Cache the workspace slug for the next visit
        try {
          localStorage.setItem(TENANT_CACHE_KEY, tenantSlug.trim().toLowerCase());
        } catch { /* ignore */ }
        
        // Extract 'next' parameter safely, default to /admin
        const next = searchParams.get("next");
        const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
        
        router.push(destination);
        return; // Keep loading state true while navigating to prevent double-clicks
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials. Please verify your workspace and password.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("A network error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Workspace / Tenant Slug */}
        <div>
          <label htmlFor="tenantSlug" className="block text-sm font-bold text-slate-900 mb-1.5">
            Workspace ID
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="tenantSlug"
              type="text"
              required
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              disabled={isLoading}
              className="block w-full pl-11 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900 disabled:opacity-60"
              placeholder="e.g., bnlv-hq"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">.studio.bnlv.com</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Your unique organization identifier.</p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-1.5">
            Email Address
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              ref={emailRef}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="block w-full pl-11 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900 disabled:opacity-60"
              placeholder="admin@bnlvconsulting.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-1.5">
            Password
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50/50 transition-colors font-medium text-slate-900 disabled:opacity-60"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-60"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !email || !password || !tenantSlug}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-amber-50 bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-amber-500" />
                Authenticating...
              </>
            ) : (
              <>
                Secure Login
                <ArrowRight size={18} className="text-amber-500" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}