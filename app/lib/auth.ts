import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function parseAllowedEmails(): { email: string; role: string }[] {
  const raw = process.env.ALLOWED_EMAILS || "";
  return raw.split(",").map((entry) => {
    entry = entry.trim();
    if (entry.startsWith("admin:")) {
      return { email: entry.replace("admin:", ""), role: "admin" };
    }
    return { email: entry, role: "teacher" };
  });
}

function getUserRole(email: string): string | null {

  if (email.endsWith("@mbmusicacademy.org")) {
    const allowed = parseAllowedEmails();
    const match = allowed.find((e) => e.email === email);
    return match ? match.role : "teacher";
  }


  const allowed = parseAllowedEmails();
  const match = allowed.find((e) => e.email === email);
  return match ? match.role : null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const role = getUserRole(user.email || "");
      return !!role;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = getUserRole(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};


// @mbmusicacademy.org