import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import {
  submitToTeacherSheet,
  uploadVideoForTeacher,
  clearAdminCache,
} from "../../lib/google";

function generateId() {
  return `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthAndDay(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: MONTH_NAMES[d.getMonth()],
    day: DAY_NAMES[d.getDay()],
    formatted: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const school = formData.get("school") as string;
    const date = formData.get("date") as string;
    const periodsJson = formData.get("periods") as string;
    const externalLink = formData.get("externalLink") as string;
    const videoFile = formData.get("video") as File | null;

    const periods = JSON.parse(periodsJson);
    const teacherName = session.user.name || "Unknown";
    const teacherEmail = session.user.email;
    const submissionId = generateId();
    const timestamp = new Date().toISOString();

    const { month, day, formatted: dateFormatted } = getMonthAndDay(date);

    // Upload video first (if present) — files go to teacher's Recordings folder
    let videoLink = "";
    if (videoFile && videoFile.size > 0) {
      const arrayBuffer = await videoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = videoFile.name.split(".").pop() || "mp4";
      const fileName = `${date}_${submissionId}.${ext}`;
      videoLink = await uploadVideoForTeacher(
        buffer,
        fileName,
        videoFile.type || "video/mp4",
        school,
        teacherName
      );
    }

    // Combined media link (uploaded video + external link, if both present)
    const mediaLink = [videoLink, externalLink].filter(Boolean).join(" | ");

    // Build one row per period
    const rows = periods.map((p: any, idx: number) => ({
      monthName: month,
      dateStr: dateFormatted,
      dayName: day,
      periodNo: String(p.periodNo || idx + 1),
      classDiv: `${p.grade?.replace("Class ", "")}-${p.section}`,
      duration: p.duration || "40",
      attendance: p.attendance || "",
      sessionNo: p.sessionNo || "",
      sessionBrief: p.coreTopic,
      videoLink: mediaLink,
      highlighters: p.starStudents || "",
      facultyName: teacherName,
      schoolName: school,
      hoa: p.hoa || "",
      // Internal
      submissionId,
      timestamp,
      teacherEmail,
    }));

    const result = await submitToTeacherSheet(teacherName, teacherEmail, school, rows);

    // Invalidate admin cache so the new data shows up immediately
    clearAdminCache();

    return NextResponse.json({
      success: true,
      submissionId,
      sheetUrl: result.sheetUrl,
    });
  } catch (err: any) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
