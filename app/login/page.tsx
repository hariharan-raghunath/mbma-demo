"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/tracker");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: "var(--gold)", borderColor: "rgba(245,197,24,0.2)", width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg)",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        opacity: 0.3,
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, background: "var(--gold)", borderRadius: 12,
            marginBottom: 20,
          }}>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 24, color: "#000", letterSpacing: 1 }}>M</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 36, color: "var(--text)", lineHeight: 1 }}>EDUTRACK</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6, fontFamily: "'Barlow Condensed'", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            MBMA · Teacher Lesson Tracker
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ textAlign: "center" }}>
          <p className="section-label" style={{ marginBottom: 24 }}>Sign in to continue</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/home" })}
            style={{
              width: "100%",
              background: "#fff",
              color: "#1a1a1a",
              border: "none",
              borderRadius: 8,
              padding: "13px 20px",
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1 7.3 2.7l5.7-5.7C33.7 7.1 29.1 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.4 1 7.3 2.7l5.7-5.7C33.7 7.1 29.1 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-5.9-5c-2 1.4-4.4 2.2-7 2.2-5.3 0-9.7-3.5-11.3-8.2l-6.6 5.1C8 39.5 15.5 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l5.9 5c-.4.4 6.1-4.5 6.1-13.7 0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>
            Access is restricted to MBMA staff only.<br />
            Contact your administrator if you cannot sign in.
          </p>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-dim)", fontSize: 11, marginTop: 32, fontFamily: "'Barlow Condensed'", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          MBMA · Data synced to Google Drive & Sheets
        </p>
      </div>
    </div>
  );
}