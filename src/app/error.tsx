"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-lg shadow-sand-200/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-2xl text-maroon-600 ring-1 ring-inset ring-maroon-200">
          ⚠
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-navy-800">
          Something interrupted this view
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The error was contained by the studio&apos;s recovery boundary — the rest of
          the platform is unaffected.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[10px] text-slate-400">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={reset}
            className="rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-semibold text-sand-50 shadow-md shadow-navy-200 transition hover:bg-navy-600"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-sand-300 bg-sand-50 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-sand-100"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
