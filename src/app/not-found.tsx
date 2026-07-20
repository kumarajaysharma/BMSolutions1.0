import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-lg shadow-sand-200/60">
        <div className="font-mono text-5xl font-bold text-navy-200">404</div>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-navy-800">
          This page isn&apos;t in the studio
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The route may have moved. Use the navigation below or press{" "}
          <kbd className="rounded-md bg-sand-100 px-1.5 py-0.5 font-mono text-[10px] text-navy-600">⌘K</kbd>{" "}
          anywhere to jump.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-semibold text-sand-50 shadow-md shadow-navy-200 transition hover:bg-navy-600"
          >
            Home
          </Link>
          <Link
            href="/studio"
            className="rounded-xl border border-sand-300 bg-sand-50 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-sand-100"
          >
            Studio Overview
          </Link>
          <Link
            href="/audit"
            className="rounded-xl border border-sand-300 bg-sand-50 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-sand-100"
          >
            Enterprise Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
