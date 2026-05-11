/**
 * MBMA — Google Refresh Token Generator
 * ─────────────────────────────────────
 * Run this ONCE to get the refresh token for the company Google account.
 * The token is saved to .env.local automatically.
 *
 * Usage:
 *   node scripts/get-refresh-token.mjs
 *
 * Prerequisites:
 *   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must already be in .env.local
 */

import { google } from "googleapis";
import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { URL } from "url";
import { resolve } from "path";
import { execSync } from "child_process";

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");

if (!existsSync(envPath)) {
  console.error("\n❌  .env.local not found.");
  console.error("    Copy .env.example to .env.local and fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.\n");
  process.exit(1);
}

const envContent = readFileSync(envPath, "utf-8");

function getEnvVar(content, key) {
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

const CLIENT_ID = getEnvVar(envContent, "GOOGLE_CLIENT_ID");
const CLIENT_SECRET = getEnvVar(envContent, "GOOGLE_CLIENT_SECRET");

if (!CLIENT_ID || CLIENT_ID.includes("your_google")) {
  console.error("\n❌  GOOGLE_CLIENT_ID is not set in .env.local\n");
  process.exit(1);
}
if (!CLIENT_SECRET || CLIENT_SECRET.includes("your_google")) {
  console.error("\n❌  GOOGLE_CLIENT_SECRET is not set in .env.local\n");
  process.exit(1);
}

// ── Setup OAuth client ────────────────────────────────────────────────────────
const REDIRECT_URI = "http://localhost:4242/oauth/callback";

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // force consent so we always get a refresh token
});

// ── Start local server to catch the OAuth callback ────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:4242");

  if (url.pathname !== "/oauth/callback") {
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2 style="font-family:sans-serif;color:red">❌ Access denied: ${error}</h2><p>You can close this tab.</p>`);
    server.close();
    console.error(`\n❌  OAuth error: ${error}\n`);
    process.exit(1);
  }

  if (!code) {
    res.end("No code received");
    server.close();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <h2 style="font-family:sans-serif;color:orange">⚠️ No refresh token received</h2>
        <p>This usually means this Google account already approved this app before.<br/><br/>
        Fix: Go to
        <a href="https://myaccount.google.com/permissions">Google Account Permissions</a>,
        find and remove this app, then run this script again.</p>
      `);
      server.close();
      console.error("\n⚠️  No refresh token received.");
      console.error("    The account has already approved this app before.");
      console.error("    Revoke access here, then re-run:");
      console.error("    https://myaccount.google.com/permissions\n");
      process.exit(1);
    }

    // ── Save token to .env.local ──────────────────────────────────────────────
    let updated = envContent;

    if (updated.includes("GOOGLE_REFRESH_TOKEN=")) {
      updated = updated.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${refreshToken}`);
    } else {
      updated += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
    }

    writeFileSync(envPath, updated, "utf-8");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
      <body style="font-family:sans-serif;max-width:500px;margin:60px auto;padding:0 20px;background:#0a0a0a;color:#fff">
        <div style="background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:32px">
          <h2 style="color:#F5C518;margin:0 0 16px">✅ Token saved!</h2>
          <p style="color:#aaa;margin:0 0 12px">Refresh token has been written to <code style="color:#F5C518">.env.local</code></p>
          <p style="color:#aaa;margin:0 0 24px">You can close this tab and go back to your terminal.</p>
          <hr style="border-color:#2a2a2a;margin-bottom:20px"/>
          <p style="color:#555;font-size:12px;margin:0">
            Token: <code style="color:#666">${refreshToken.slice(0, 12)}...${refreshToken.slice(-6)}</code>
          </p>
        </div>
      </body>
      </html>
    `);

    server.close();

    console.log("\n✅  Refresh token saved to .env.local");
    console.log(`    Token: ${refreshToken.slice(0, 12)}...${refreshToken.slice(-6)}`);
    console.log("\n    Next steps:");
    console.log("    1. Run: npm run dev");
    console.log("    2. Open: http://localhost:3000\n");

    setTimeout(() => process.exit(0), 500);

  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h2 style="font-family:sans-serif;color:red">❌ Error: ${err.message}</h2><p>Check your terminal.</p>`);
    server.close();
    console.error("\n❌  Token exchange failed:", err.message, "\n");
    process.exit(1);
  }
});

server.listen(4242, () => {
  console.log("\n──────────────────────────────────────────────────────");
  console.log("  MBMA · Google Account Authorization");
  console.log("──────────────────────────────────────────────────────");
  console.log("\n  Opening your browser...");
  console.log("  Sign in as the COMPANY Google account —");
  console.log("  the account whose Drive will store all recordings.\n");
  console.log("  If the browser does not open, paste this URL manually:");
  console.log("\n  " + authUrl + "\n");
  console.log("──────────────────────────────────────────────────────\n");

  // Auto-open browser
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  try {
    execSync(`${cmd} "${authUrl}"`);
  } catch {
    // Browser open failed — user will use the printed URL
  }
});
