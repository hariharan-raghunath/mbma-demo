"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, FileVideo, Search, LayoutGrid } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";

interface Row { [key: string]: string }

function formatDate(dateStr: string) { return dateStr || "—"; }

function firstUrl(text: string): string | null {
  if (!text) return null;
  for (const part of text.split(/\s*\|\s*/)) {
    if (part.startsWith("http")) return part;
  }
  return null;
}

function downloadCSV(rows: Row[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row => headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mbma-submissions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/tracker");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/history")
      .then(r => r.json())
      .then(d => setRows(d.rows || []))
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = rows.filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row["Faculty / Teachers"]?.toLowerCase().includes(q) ||
      row["School"]?.toLowerCase().includes(q) ||
      row["Class Session Brief"]?.toLowerCase().includes(q) ||
      row["Teacher Email"]?.toLowerCase().includes(q)
    );
  });

  const uniqueTeachers = new Set(rows.map(r => r["Teacher Email"])).size;
  const uniqueSchools = new Set(rows.map(r => r["School"])).size;
  const withVideo = rows.filter(r => firstUrl(r["Class Video / Pics Links"] || "")).length;

  return (
    <div className="page">
      <TopBar />

      <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 32, color: "var(--gold)", lineHeight: 1 }}>SUBMISSION SHEETS</h1>
            <p className="section-label" style={{ marginTop: 4 }}>Consolidated history & data · across all faculty</p>
          </div>
          <button className="btn-ghost" onClick={() => downloadCSV(filtered)}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Sessions", value: rows.length },
            { label: "Active Teachers", value: uniqueTeachers },
            { label: "Schools Covered", value: uniqueSchools },
            { label: "Videos Uploaded", value: withVideo },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: "16px 20px" }}>
              <div className="section-label" style={{ marginBottom: 6 }}>{stat.label}</div>
              <div className="font-display" style={{ fontSize: 28, color: "var(--gold)" }}>{loading ? "—" : stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input className="input" style={{ paddingLeft: 38 }}
            placeholder="Search by teacher, school, or topic..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <div className="spinner" style={{ width: 28, height: 28, borderTopColor: "var(--gold)", borderColor: "rgba(245,197,24,0.2)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <LayoutGrid size={40} strokeWidth={1} />
              <div className="font-display" style={{ fontSize: 22 }}>NO SUBMISSIONS FOUND</div>
              <p style={{ fontSize: 13 }}>{search ? "Try a different search" : "Start logging to see data here"}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Teacher</th>
                    <th>School</th>
                    <th>Period</th>
                    <th>Class</th>
                    <th>Topic</th>
                    <th>Att.</th>
                    <th>Highlighters</th>
                    <th>Media</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const videoUrl = firstUrl(row["Class Video / Pics Links"] || "");
                    const linkParts = (row["Class Video / Pics Links"] || "").split(/\s*\|\s*/).filter(Boolean);
                    const externalUrl = linkParts.length > 1 ? linkParts[1] : null;
                    return (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: 12 }}>
                          {formatDate(row["Date"])}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{row["Faculty / Teachers"]}</div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{row["Teacher Email"]}</div>
                        </td>
                        <td style={{ maxWidth: 140 }}>{row["School"]}</td>
                        <td style={{ color: "var(--gold)", fontWeight: 600, textAlign: "center" }}>{row["Period"]}</td>
                        <td>{row["Class & Div"]}</td>
                        <td style={{ maxWidth: 200 }}>{row["Class Session Brief"]}</td>
                        <td style={{ color: "var(--text-muted)" }}>{row["Attendance"] || "—"}</td>
                        <td style={{ color: "var(--text-muted)", maxWidth: 140 }}>{row["\"Highlighters\" Talented & Gifted"] || "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            {videoUrl && (
                              <a href={videoUrl} target="_blank" rel="noopener noreferrer"
                                title="View video" style={{ color: "var(--gold)" }}>
                                <FileVideo size={14} />
                              </a>
                            )}
                            {externalUrl && (
                              <a href={externalUrl} target="_blank" rel="noopener noreferrer"
                                title="External link" style={{ color: "var(--text-muted)" }}>
                                <ExternalLink size={14} />
                              </a>
                            )}
                            {!videoUrl && !externalUrl && (<span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="section-label" style={{ marginTop: 12, textAlign: "right" }}>
            Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
