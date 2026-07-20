"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fdfbf7",
          color: "#2e4468",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center", padding: 32 }}>
          <div
            style={{
              margin: "0 auto 20px",
              width: 54,
              height: 54,
              borderRadius: 16,
              background: "#3a5680",
              color: "#fdfbf7",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            F
          </div>
          <h1 style={{ fontSize: 26, margin: "0 0 10px" }}>
            Forge Studio hit an unexpected error
          </h1>
          <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>
            The application shell recovered safely. Reload to continue — no data
            was lost.
          </p>
          {error?.digest && (
            <p style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 18,
              border: 0,
              borderRadius: 12,
              padding: "12px 22px",
              background: "#2e4468",
              color: "#fdfbf7",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
