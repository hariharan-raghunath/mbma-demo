import { google } from "googleapis";
import { sheets_v4, drive_v3 } from "googleapis";

// ── OAuth2 Client (uses company account refresh token) ────────────────────────
function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

// ── Sheet column structure (matches MBMA's existing template) ─────────────────
export const SHEET_COLUMNS = [
  "Month", "Date", "Day", "Period", "Class & Div", "Time (min)",
  "Attendance", "Session no.", "Class Session Brief",
  "Class Video / Pics Links", "\"Highlighters\" Talented & Gifted",
  "Faculty / Teachers", "School", "HOA",
  // Hidden internal columns at the end (used for filtering/searching)
  "Submission ID", "Timestamp", "Teacher Email",
];

// Header rows occupy rows 1-5; data starts at row 7 (row 6 is the column header)
const DATA_START_ROW = 7;

// ── Drive helpers ─────────────────────────────────────────────────────────────

async function findFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: "files(id)",
  });
  return res.data.files && res.data.files.length > 0
    ? res.data.files[0].id!
    : null;
}

async function getOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string> {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return folder.data.id!;
}

async function findFile(
  drive: drive_v3.Drive,
  name: string,
  parentId: string,
  mimeType?: string
): Promise<string | null> {
  const escapedName = name.replace(/'/g, "\\'");
  let q = `name='${escapedName}' and '${parentId}' in parents and trashed=false`;
  if (mimeType) q += ` and mimeType='${mimeType}'`;

  const res = await drive.files.list({
    q,
    fields: "files(id)",
  });
  return res.data.files && res.data.files.length > 0
    ? res.data.files[0].id!
    : null;
}

// ── Folder / sheet structure for a teacher ────────────────────────────────────
// Root / SchoolName / TeacherName / { Recordings/, Tracking Sheet/ <Sheet> }

export interface TeacherWorkspace {
  schoolFolderId: string;
  teacherFolderId: string;
  recordingsFolderId: string;
  sheetFolderId: string;
  sheetId: string;
}

async function getOrCreateTeacherWorkspace(
  schoolName: string,
  teacherName: string
): Promise<TeacherWorkspace> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const schoolFolderId = await getOrCreateFolder(drive, schoolName, rootId);
  const teacherFolderId = await getOrCreateFolder(drive, teacherName, schoolFolderId);
  const recordingsFolderId = await getOrCreateFolder(drive, "Recordings", teacherFolderId);
  const sheetFolderId = await getOrCreateFolder(drive, "Tracking Sheet", teacherFolderId);

  const sheetName = `${teacherName} - FTU Tracker`;
  let sheetId = await findFile(
    drive,
    sheetName,
    sheetFolderId,
    "application/vnd.google-apps.spreadsheet"
  );

  if (!sheetId) {
    // Create the sheet inside the Tracking Sheet folder with MBMA layout
    sheetId = await createMbmaSheet(sheetName, sheetFolderId, teacherName, schoolName);
  }

  return {
    schoolFolderId,
    teacherFolderId,
    recordingsFolderId,
    sheetFolderId,
    sheetId,
  };
}

// ── Create a new sheet with MBMA-style header layout ──────────────────────────

async function createMbmaSheet(
  name: string,
  parentFolderId: string,
  teacherName: string,
  schoolName: string
): Promise<string> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  // 1. Create the spreadsheet via Drive API (lets us put it directly in a folder)
  const file = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentFolderId],
    },
    fields: "id",
  });
  const spreadsheetId = file.data.id!;

  // 2. Apply the MBMA template (header rows, formatting, frozen rows)
  await applyMbmaTemplate(sheets, spreadsheetId, teacherName, schoolName);

  return spreadsheetId;
}

async function applyMbmaTemplate(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  teacherName: string,
  schoolName: string
) {
  // Get default sheet ID (it's always 0 for first sheet)
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetGid = meta.data.sheets![0].properties!.sheetId!;

  // Write static header content (rows 1-6) and column headers
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        // Row 2: Subject / Faculty Code / School Code
        { range: "Sheet1!B2:E2", values: [["MUSIC", "MBMA", schoolName, ""]] },
        // Row 3: Faculty Name
        { range: "Sheet1!B3:E3", values: [[teacherName, "", "", ""]] },
        // Row 3: Section title in middle
        { range: "Sheet1!I3", values: [["FACULTY CLASS SESSION"]] },
        // Row 6: Column headers
        { range: "Sheet1!A6:Q6", values: [SHEET_COLUMNS] },
      ],
    },
  });

  // Apply formatting via batchUpdate (formatting requires this API, not values API)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Freeze top 6 rows
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetGid,
              gridProperties: { frozenRowCount: 6 },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        // Header bar (row 6) — bold, centered, peach background
        {
          repeatCell: {
            range: { sheetId: sheetGid, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: SHEET_COLUMNS.length },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.99, green: 0.85, blue: 0.7 },
                textFormat: { bold: true, fontSize: 10 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                wrapStrategy: "WRAP",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)",
          },
        },
        // Date columns (Month, Date, Day, Period, Class & Div) — light blue
        {
          repeatCell: {
            range: { sheetId: sheetGid, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.82, green: 0.88, blue: 0.97 },
                textFormat: { bold: true, fontSize: 10 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
          },
        },
        // HOA column — dark blue with white text
        {
          repeatCell: {
            range: { sheetId: sheetGid, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 13, endColumnIndex: 14 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.15, green: 0.25, blue: 0.85 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 10 },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
          },
        },
        // Faculty info block (rows 2-3) — light blue
        {
          repeatCell: {
            range: { sheetId: sheetGid, startRowIndex: 1, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 5 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.82, green: 0.88, blue: 0.97 },
                textFormat: { bold: true },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
          },
        },
        // Title in row 3 (FACULTY CLASS SESSION)
        {
          repeatCell: {
            range: { sheetId: sheetGid, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 8, endColumnIndex: 9 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 16 },
                horizontalAlignment: "CENTER",
              },
            },
            fields: "userEnteredFormat(textFormat,horizontalAlignment)",
          },
        },
        // Hide internal columns (Submission ID, Timestamp, Teacher Email — cols 14-16)
        {
          updateDimensionProperties: {
            range: { sheetId: sheetGid, dimension: "COLUMNS", startIndex: 14, endIndex: 17 },
            properties: { hiddenByUser: true },
            fields: "hiddenByUser",
          },
        },
        // Auto-resize columns A-N
        {
          autoResizeDimensions: {
            dimensions: { sheetId: sheetGid, dimension: "COLUMNS", startIndex: 0, endIndex: 14 },
          },
        },
        // Set row height for header row
        {
          updateDimensionProperties: {
            range: { sheetId: sheetGid, dimension: "ROWS", startIndex: 5, endIndex: 6 },
            properties: { pixelSize: 50 },
            fields: "pixelSize",
          },
        },
      ],
    },
  });
}

// ── Append a row to teacher's sheet ───────────────────────────────────────────

interface PeriodRow {
  monthName: string;
  dateStr: string;
  dayName: string;
  periodNo: string;
  classDiv: string;
  duration: string;
  attendance: string;
  sessionNo: string;
  sessionBrief: string;
  videoLink: string;
  highlighters: string;
  facultyName: string;
  schoolName: string;
  hoa: string;
  // Internal
  submissionId: string;
  timestamp: string;
  teacherEmail: string;
}

export async function submitToTeacherSheet(
  teacherName: string,
  teacherEmail: string,
  schoolName: string,
  rows: PeriodRow[]
): Promise<{ sheetId: string; sheetUrl: string }> {
  const workspace = await getOrCreateTeacherWorkspace(schoolName, teacherName);

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const values = rows.map((r) => [
    r.monthName, r.dateStr, r.dayName, r.periodNo, r.classDiv,
    r.duration, r.attendance, r.sessionNo, r.sessionBrief,
    r.videoLink, r.highlighters, r.facultyName, r.schoolName, r.hoa,
    r.submissionId, r.timestamp, r.teacherEmail,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: workspace.sheetId,
    range: "Sheet1!A:Q",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return {
    sheetId: workspace.sheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${workspace.sheetId}/edit`,
  };
}

// ── Upload video to teacher's Recordings folder ───────────────────────────────

export async function uploadVideoForTeacher(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  schoolName: string,
  teacherName: string
): Promise<string> {
  const workspace = await getOrCreateTeacherWorkspace(schoolName, teacherName);

  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const { Readable } = await import("stream");
  const stream = Readable.from(fileBuffer);

  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [workspace.recordingsFolderId],
    },
    media: { mimeType, body: stream },
    fields: "id, webViewLink",
  });

  return uploaded.data.webViewLink || "";
}

// ── Read submissions ──────────────────────────────────────────────────────────

interface SheetRow {
  [key: string]: string;
}

async function readSheetRows(sheetId: string): Promise<SheetRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `Sheet1!A${DATA_START_ROW}:Q`,
    });

    const rows = res.data.values || [];
    return rows.map((row) => {
      const obj: SheetRow = {};
      SHEET_COLUMNS.forEach((col, i) => {
        obj[col] = (row[i] as string) || "";
      });
      return obj;
    });
  } catch (e) {
    return [];
  }
}

// Get all submissions for a specific teacher
export async function getTeacherSubmissions(
  teacherName: string,
  teacherEmail: string
): Promise<SheetRow[]> {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  // Find all teacher folders matching the teacher name across all schools
  // Walk: Root → School folders → Teacher folder → Tracking Sheet → Sheet
  const allSheets: string[] = [];

  // Get all school folders under root
  const schoolFolders = await drive.files.list({
    q: `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
  });

  for (const school of schoolFolders.data.files || []) {
    const teacherFolderId = await findFolder(drive, teacherName, school.id!);
    if (!teacherFolderId) continue;

    const sheetFolderId = await findFolder(drive, "Tracking Sheet", teacherFolderId);
    if (!sheetFolderId) continue;

    const sheetName = `${teacherName} - FTU Tracker`;
    const sheetId = await findFile(
      drive,
      sheetName,
      sheetFolderId,
      "application/vnd.google-apps.spreadsheet"
    );
    if (sheetId) allSheets.push(sheetId);
  }

  const allRows: SheetRow[] = [];
  for (const sheetId of allSheets) {
    const rows = await readSheetRows(sheetId);
    allRows.push(...rows.filter((r) => r["Teacher Email"] === teacherEmail));
  }

  return allRows;
}

// Get all submissions across all teachers (for admin)
// Simple in-memory cache with 30s TTL to keep this fast
let adminCache: { data: SheetRow[]; expires: number } | null = null;
const ADMIN_CACHE_TTL = 30 * 1000;

export async function getAllSubmissions(): Promise<SheetRow[]> {
  if (adminCache && adminCache.expires > Date.now()) {
    return adminCache.data;
  }

  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  // Find all sheets named "* - FTU Tracker" recursively under root
  const sheets = await drive.files.list({
    q: `name contains 'FTU Tracker' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id, name, parents)",
    pageSize: 1000,
  });

  const allRows: SheetRow[] = [];

  // Process all teacher sheets in parallel for speed
  await Promise.all(
    (sheets.data.files || []).map(async (file) => {
      const rows = await readSheetRows(file.id!);
      allRows.push(...rows);
    })
  );

  adminCache = { data: allRows, expires: Date.now() + ADMIN_CACHE_TTL };
  return allRows;
}

export function clearAdminCache() {
  adminCache = null;
}
