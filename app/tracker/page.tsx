"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Link as LinkIcon, Send, X, Film } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { Toast } from "../components/Toast";
import { SCHOOLS, GRADES, SECTIONS, GRADES_CURRICULUM, formatTopic } from "../config";

interface Period {
  id: string;
  periodNo: number;
  grade: string;
  section: string;
  duration: string;
  attendance: string;
  sessionNo: string;
  coreTopic: string;
  starStudents: string;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function newPeriod(periodNo: number): Period {
  return {
    id: `${Date.now()}-${Math.random()}`,
    periodNo,
    grade: GRADES[0] || "Class 1",
    section: "A",
    duration: "40",
    attendance: "",
    sessionNo: "",
    coreTopic: "",
    starStudents: "",
  };
}

export default function TrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const [school, setSchool] = useState("");
  const [date, setDate] = useState(today());
  const [periods, setPeriods] = useState<Period[]>([newPeriod(1)]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [externalLink, setExternalLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addPeriod() {
    setPeriods([...periods, newPeriod(periods.length + 1)]);
  }

  function removePeriod(id: string) {
    if (periods.length === 1) return;
    setPeriods(periods.filter(p => p.id !== id).map((p, i) => ({ ...p, periodNo: i + 1 })));
  }

  function updatePeriod(id: string, field: keyof Period, value: string | number) {
    setPeriods(periods.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      // When grade changes, clear topic since the curriculum is different
      if (field === "grade") updated.coreTopic = "";
      return updated;
    }));
  }

  async function handleSubmit() {
    if (!school) { setToast({ message: "Please select a school", type: "error" }); return; }
    if (periods.some(p => !p.coreTopic.trim())) {
      setToast({ message: "Please select a topic for every period", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("school", school);
      fd.append("date", date);
      fd.append("periods", JSON.stringify(periods));
      fd.append("externalLink", externalLink);
      if (videoFile) fd.append("video", videoFile);

      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Submission failed");

      setToast({ message: `Submitted! ID: ${data.submissionId}`, type: "success" });
      setSchool("");
      setDate(today());
      setPeriods([newPeriod(1)]);
      setVideoFile(null);
      setExternalLink("");
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderTopColor: "var(--gold)", borderColor: "rgba(245,197,24,0.2)" }} />
    </div>;
  }

  return (
    <div className="page">
      <TopBar />

      <div style={{ padding: "24px 20px", maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 32, color: "var(--gold)", lineHeight: 1 }}>LESSON TRACKER</h1>
              <p className="section-label" style={{ marginTop: 4 }}>Field Teacher Unit (FTU) Entry · MBMA</p>
            </div>
            <div style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 14px", textAlign: "right",
            }}>
              <div className="section-label">Session</div>
              <div className="font-display" style={{ fontSize: 16, color: "var(--gold)", marginTop: 2 }}>
                {session?.user?.name?.split(" ")[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* School + Date */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="section-label" style={{ display: "block", marginBottom: 8 }}>
                🏫 School Name *
              </label>
              <select className="input" value={school} onChange={e => setSchool(e.target.value)}>
                <option value="">Select school...</option>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label" style={{ display: "block", marginBottom: 8 }}>
                📅 Date of Entry
              </label>
              <input type="date" className="input" value={date}
                onChange={e => setDate(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
          </div>
        </div>

        {/* Periods */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 className="font-display" style={{ fontSize: 22 }}>LESSON DETAILS</h2>
            <button className="btn-ghost" onClick={addPeriod}>
              <Plus size={14} /> Add Period
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {periods.map((period) => {
              const curriculum = GRADES_CURRICULUM[period.grade] || [];
              return (
                <div key={period.id} className="period-card">
                  {periods.length > 1 && (
                    <button className="btn-danger" onClick={() => removePeriod(period.id)}
                      style={{ position: "absolute", top: 12, right: 12, padding: "4px 8px" }}>
                      <Trash2 size={12} />
                    </button>
                  )}

                  {/* Row 1: Period, Grade, Section, Duration, Attendance, Session No */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 70px 80px 90px 80px",
                    gap: 10,
                    marginBottom: 12,
                  }}>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Period</label>
                      <select className="input" value={period.periodNo}
                        onChange={e => updatePeriod(period.id, "periodNo", Number(e.target.value))}>
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Grade</label>
                      <select className="input" value={period.grade}
                        onChange={e => updatePeriod(period.id, "grade", e.target.value)}>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Section</label>
                      <select className="input" value={period.section}
                        onChange={e => updatePeriod(period.id, "section", e.target.value)}>
                        {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Time (min)</label>
                      <input className="input" placeholder="40" value={period.duration}
                        onChange={e => updatePeriod(period.id, "duration", e.target.value)} />
                    </div>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Attendance</label>
                      <input className="input" placeholder="20/22" value={period.attendance}
                        onChange={e => updatePeriod(period.id, "attendance", e.target.value)} />
                    </div>
                    <div>
                      <label className="section-label" style={{ display: "block", marginBottom: 6 }}>Session #</label>
                      <input className="input" placeholder="1" value={period.sessionNo}
                        onChange={e => updatePeriod(period.id, "sessionNo", e.target.value)} />
                    </div>
                  </div>

                  {/* Row 2: Topic dropdown */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
                      📚 Class Session Brief *
                    </label>
                    {curriculum.length > 0 ? (
                      <select className="input" value={period.coreTopic}
                        onChange={e => updatePeriod(period.id, "coreTopic", e.target.value)}>
                        <option value="">Select a topic from {period.grade} curriculum...</option>
                        {curriculum.map(c => (
                          <option key={c.code} value={formatTopic(c)}>
                            {formatTopic(c)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input className="input"
                        placeholder={`No curriculum for ${period.grade} yet — type manually`}
                        value={period.coreTopic}
                        onChange={e => updatePeriod(period.id, "coreTopic", e.target.value)} />
                    )}
                  </div>

                  {/* Row 3: Star students */}
                  <div>
                    <label className="section-label" style={{ display: "block", marginBottom: 6 }}>
                      ⭐ Highlighters · Talented & Gifted
                    </label>
                    <input className="input" placeholder="Acknowledge high performers..."
                      value={period.starStudents}
                      onChange={e => updatePeriod(period.id, "starStudents", e.target.value)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Media */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Film size={14} color="var(--gold)" />
              <span className="section-label">Classroom Recap (Video)</span>
            </div>
            <span style={{ color: "var(--text-dim)", fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Target: 30–60 seconds · Optional
            </span>
          </div>

          {videoFile ? (
            <div style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Film size={16} color="var(--gold)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{videoFile.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              </div>
              <button onClick={() => setVideoFile(null)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--text-muted)", padding: 4,
              }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              <Upload size={24} color="var(--text-dim)" />
              <div style={{ fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Barlow Condensed'", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 13 }}>
                Select from Device
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>MP4, MOV, WEBM · Max 500MB</div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
            onChange={e => setVideoFile(e.target.files?.[0] || null)} />

          <div style={{ marginTop: 16 }}>
            <label className="section-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <LinkIcon size={11} /> External Reference or Video Link (Optional)
            </label>
            <input className="input" placeholder="e.g. https://youtube.com/... or Drive link"
              value={externalLink} onChange={e => setExternalLink(e.target.value)} />
          </div>
        </div>

        {/* Submit */}
        <button className="btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 17, borderRadius: 8 }}
          onClick={handleSubmit} disabled={submitting}>
          {submitting ? (<><div className="spinner" />Uploading...</>)
            : (<><Send size={16} />Submit FTU Record</>)}
        </button>
        <p className="section-label" style={{ textAlign: "center", marginTop: 10 }}>
          Logging as {session?.user?.name} · Synced to your dedicated Drive folder
        </p>
      </div>

      <BottomNav />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
