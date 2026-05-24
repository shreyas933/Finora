"use client";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          marginBottom: "1.5rem",
          boxShadow: "0 0 40px rgba(124,58,237,0.4)",
        }}
      >
        📡
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        You&apos;re Offline
      </h1>
      <p style={{ color: "#94a3b8", maxWidth: 360, lineHeight: 1.6, marginBottom: "2rem" }}>
        FINORA needs an internet connection to sync your latest transactions and AI insights.
        Your cached data is still available.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          border: "none",
          borderRadius: "0.75rem",
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
