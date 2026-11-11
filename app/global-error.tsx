"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f0e6",
          color: "#1e1c19",
          fontFamily: "Segoe UI, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <main
          style={{
            maxWidth: "560px",
            width: "100%",
            background: "#fffdf8",
            border: "1px solid #e1d9cb",
            borderRadius: "28px",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 24px 60px -30px rgba(30,28,25,.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#b45638",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            Error inesperado
          </p>
          <h1
            style={{
              margin: "14px 0 10px",
              fontSize: "34px",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            No pudimos cargar la aplicación.
          </h1>
          <p style={{ margin: 0, color: "#6b665d", lineHeight: 1.6 }}>
            {error.message || "Inténtalo de nuevo. Tu información no se pierde."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              border: 0,
              borderRadius: "999px",
              background: "#2f5d50",
              color: "#fffdf8",
              padding: "14px 24px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
