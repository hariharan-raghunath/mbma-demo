"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ClipboardList, MapPin, ChevronRight, Lock } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderTopColor: "var(--gold)", borderColor: "rgba(245,197,24,0.2)" }} />
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Teacher";

  return (
    <div className="page">
      <TopBar />

      <div style={{ padding: "32px 20px", maxWidth: 600, margin: "0 auto" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>Good to see you,</p>
          <h1 className="font-display" style={{ fontSize: 38, color: "var(--text)", lineHeight: 1 }}>
            {firstName.toUpperCase()}
          </h1>
          <p className="section-label" style={{ marginTop: 6 }}>What would you like to do today?</p>
        </div>

        {/* Feature tiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* FTU Tracker — active */}
          <Link href="/tracker" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 20,
              position: "relative",
              overflow: "hidden",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold)";
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLDivElement).style.background = "var(--surface)";
              }}
            >
              {/* Gold accent bar */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: 4, background: "var(--gold)", borderRadius: "12px 0 0 12px",
              }} />

              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: "rgba(245,197,24,0.12)",
                border: "1px solid rgba(245,197,24,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <ClipboardList size={24} color="var(--gold)" strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontSize: 22, color: "var(--gold)", lineHeight: 1, marginBottom: 6 }}>
                  LESSON TRACKER
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Log your daily class sessions, topics covered, and student highlights.
                </p>
              </div>

              <ChevronRight size={18} color="var(--text-dim)" />
            </div>
          </Link>

          {/* Punch In — coming soon */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "24px",
            cursor: "not-allowed",
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 20,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Dimmed accent bar */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: 4, background: "var(--border-bright)", borderRadius: "12px 0 0 12px",
            }} />

            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <MapPin size={24} color="var(--text-dim)" strokeWidth={1.8} />
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div className="font-display" style={{ fontSize: 22, color: "var(--text-dim)", lineHeight: 1 }}>
                  ATTENDANCE
                </div>
                <div style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontFamily: "'Barlow Condensed'",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <Lock size={9} /> Coming Soon
                </div>
              </div>
              <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Punch in and out with your current location for attendance tracking.
              </p>
            </div>
          </div>


           {/* Punch In — coming soon */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "24px",
            cursor: "not-allowed",
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 20,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Dimmed accent bar */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: 4, background: "var(--border-bright)", borderRadius: "12px 0 0 12px",
            }} />

            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <MapPin size={24} color="var(--text-dim)" strokeWidth={1.8} />
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div className="font-display" style={{ fontSize: 22, color: "var(--text-dim)", lineHeight: 1 }}>
                  EVENTS
                </div>
                <div style={{
                  background: "var(--surface-3)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontFamily: "'Barlow Condensed'",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-dim)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <Lock size={9} /> Coming Soon
                </div>
              </div>
              <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Log event details 
              </p>
            </div>
          </div>


        </div>

        {/* Footer note */}
        <p className="section-label" style={{ textAlign: "center", marginTop: 40 }}>
          MBMA · Data synced to Google Drive & Sheets
        </p>
      </div>

      <BottomNav />
    </div>
  );
}