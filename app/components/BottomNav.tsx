"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, FileText, Clock, LayoutGrid } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const items = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/tracker", label: "FTU Tracker", icon: FileText },
    { href: "/history", label: "History", icon: Clock },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: LayoutGrid }] : []),
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav-item ${pathname === href ? "active" : ""}`}
        >
          <Icon size={20} strokeWidth={1.8} />
          {label}
        </Link>
      ))}
    </nav>
  );
}