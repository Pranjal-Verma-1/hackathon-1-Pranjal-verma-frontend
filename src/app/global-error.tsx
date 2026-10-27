"use client";

export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f3ecdf",
          color: "#102033",
          fontFamily: "sans-serif",
        }}
      >
        <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "2.5rem 1.25rem" }}>
          <h1 style={{ fontSize: "1.875rem", lineHeight: 1.2 }}>A Una Milla hit an unexpected error</h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6, color: "#3c5160" }}>
            Nothing was booked. This app does not send trips to an airline. Try the screen again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1.5rem",
              minHeight: "3rem",
              border: 0,
              borderRadius: "6px",
              background: "#e0ae3a",
              color: "#102033",
              fontWeight: 600,
              padding: "0 1.25rem",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
