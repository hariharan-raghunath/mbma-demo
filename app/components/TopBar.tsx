"use client";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function TopBar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <div className="topbar">
      {/* Left: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: "var(--gold)", borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="font-display" style={{ fontSize: 16, color: "#000" }}>M</span>
        </div>
        <div>
          <div className="font-display" style={{ fontSize: 18, lineHeight: 1 }}>MBMA</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Barlow Condensed'", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {session?.user?.name || "Teacher"}
          </div>
        </div>
      </div>

      {/* Right: Role + Sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="tag">{role === "admin" ? "Admin" : "Teacher"}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center",
          }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
