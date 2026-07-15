"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  notificationBell?: ReactNode;
  /** Optional: pass in a bot ID so sidebar can show bot-scoped nav links */
  botId?: string;
  /** Page title shown in the top bar of the main content area */
  pageTitle?: string;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "My Bots",
    href: "/my-bots",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function AppShell({
  children,
  session,
  notificationBell,
  pageTitle,
}: AppShellProps) {
  const pathname = usePathname();
  const userName = session?.user?.name || session?.user?.email || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = (session?.user?.name?.[0] || session?.user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 w-[220px] bg-white border-r border-[#E5E4DE] flex flex-col z-30">
        {/* Logo + branding */}
        <div className="px-5 pt-6 pb-4 border-b border-[#E5E4DE]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#1FA391] flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-bold text-[15px] text-[#14171F] leading-tight" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
              Chatbot Builder
            </span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-[#E5E4DE] shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#E4F5F0] flex items-center justify-center text-[#1FA391] text-xs font-bold shrink-0">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#14171F] truncate leading-tight">{userName}</p>
              <p className="text-[11px] text-[#6d7a76] truncate leading-tight">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#E4F5F0] text-[#1FA391]"
                    : "text-[#6d7a76] hover:bg-[#F5F5F3] hover:text-[#14171F]"
                }`}
              >
                <span className={isActive ? "text-[#1FA391]" : "text-[#6d7a76]"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1 border-t border-[#E5E4DE] pt-3">
          {/* Create New Bot button */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#1FA391] hover:bg-[#167A6D] text-white text-sm font-semibold rounded-lg transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Bot
          </Link>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[#D64545] hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen ml-[220px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E5E4DE] px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#14171F]" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
            {pageTitle || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            {notificationBell}
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
