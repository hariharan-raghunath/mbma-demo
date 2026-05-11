import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { getTeacherSubmissions, getAllSubmissions } from "../../lib/google";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isAdmin = (session.user as any).role === "admin";
    const teacherName = session.user.name || "Unknown";
    const email = session.user.email;

    const rows = isAdmin
      ? await getAllSubmissions()
      : await getTeacherSubmissions(teacherName, email);

    // Filter last 30 days for teachers
    if (!isAdmin) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const filtered = rows.filter((row) => {
        if (!row["Timestamp"]) return false;
        try {
          return new Date(row["Timestamp"]) >= cutoff;
        } catch {
          return false;
        }
      });
      return NextResponse.json({ rows: filtered });
    }

    return NextResponse.json({ rows });
  } catch (err: any) {
    console.error("History error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
