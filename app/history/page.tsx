"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileVideo, Clock } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";

interface Row { [key: string]: string }

function groupRows(rows: Row[]) {
  const map = new Map<string, { meta: Row; periods: Row[] }>();
  for (const row of rows) {
    const id = row["Submission ID"];
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { meta: row, periods: [] });
    }
    map.get(id)!.periods.push(row);
  }
  // Sort by timestamp desc
  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.meta["Timestamp"] || 0).getTime();
    const tb = new Date(b.meta["Timestamp"] || 0).getTime();
    return tb - ta;
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return dateStr;
}

// Extract first URL from a "media link" cell which may contain "url1 | url2"
function firstUrl(text: string): string | null {
  if (!text) return null;
  const parts = text.split(/\s*\|\s*/);
  for (const part of parts) {
    if (part.startsWith("http")) return part;
  }
  return null;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setRows(d.rows || []))
      .finally(() => setLoading(false));
  }, [status]);

  const grouped = groupRows(rows);

  return (
    <div className="page">
      <TopBar />

      <div style={{ padding: "24px 20px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-display" style={{ fontSize: 32, color: "var(--gold)", lineHeight: 1 }}>SUBMISSION HISTORY</h1>
          <p className="section-label" style={{ marginTop: 4 }}>Your last 30 days of activity</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="spinner" style={{ width: 28, height: 28, borderTopColor: "var(--gold)", borderColor: "rgba(245,197,24,0.2)" }} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Clock size={40} strokeWidth={1} />
              <div className="font-display" style={{ fontSize: 22 }}>NO SUBMISSIONS YET</div>
              <p style={{ fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
                Start logging your lessons and they&apos;ll appear here.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {grouped.map(({ meta, periods }) => {
              const videoUrl = firstUrl(meta["Class Video / Pics Links"] || "");
              const linkParts = (meta["Class Video / Pics Links"] || "").split(/\s*\|\s*/).filter(Boolean);
              const externalUrl = linkParts.length > 1 ? linkParts[1] : null;
              return (
                <div key={meta["Submission ID"]} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{
                    padding: "14px 20px", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{meta["School"]}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {meta["Month"]} · {formatDate(meta["Date"])} · {periods.length} period{periods.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {videoUrl && (
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--gold)", fontSize: 12, fontFamily: "'Barlow Condensed'", letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>
                          <FileVideo size={12} /> Video
                        </a>
                      )}
                      {externalUrl && (
                        <a href={externalUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 12, fontFamily: "'Barlow Condensed'", letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>
                          <ExternalLink size={12} /> Link
                        </a>
                      )}
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "'Barlow Condensed'" }}>
                        {meta["Submission ID"]}
                      </span>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Class</th>
                          <th>Time</th>
                          <th>Attendance</th>
                          <th>Topic</th>
                          <th>Highlighters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((p, i) => (
                          <tr key={i}>
                            <td style={{ color: "var(--gold)", fontWeight: 600 }}>{p["Period"]}</td>
                            <td>{p["Class & Div"]}</td>
                            <td style={{ color: "var(--text-muted)" }}>{p["Time (min)"] || "—"}</td>
                            <td style={{ color: "var(--text-muted)" }}>{p["Attendance"] || "—"}</td>
                            <td>{p["Class Session Brief"]}</td>
                            <td style={{ color: "var(--text-muted)" }}>{p["\"Highlighters\" Talented & Gifted"] || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
