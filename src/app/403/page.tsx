/**
 * src/app/403/page.tsx
 * UI-DEFECT-001: /403 was returning 404 — page file did not exist.
 *
 * This is a display page rendered when middleware or protected routes
 * redirect to /403. It does not itself set an HTTP 403 status code
 * (Next.js App Router page.tsx cannot set response status directly);
 * status enforcement is the responsibility of the calling middleware.
 */

import Link from "next/link";

export const metadata = {
  title: "403 — Access Forbidden | BNLV Studio",
  description: "You do not have permission to access this resource.",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">

        {/* Status code */}
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Error 403
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Access Forbidden
        </h1>

        {/* Message */}
        <p className="mt-4 text-base text-muted-foreground">
          You do not have permission to access this resource.
          If you believe this is an error, contact your workspace administrator.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/api/auth/logout"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign Out
          </Link>
        </div>

      </div>
    </main>
  );
}
