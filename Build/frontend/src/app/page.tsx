"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import AppShell from "@/components/AppShell";
import { useState, useEffect } from "react";
import { getBackendUrl } from "@/lib/config";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;

  const [summary, setSummary] = useState({ bots: 0, activeBots: 0, conversations: 0, leads: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      const token = (session as any)?.id_token;
      if (!token) return;
      try {
        const botsRes = await fetch(`${getBackendUrl()}/bots`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!botsRes.ok) throw new Error("Failed to fetch bots");
        const bots = await botsRes.json();
        
        const activeBots = bots.filter((b: any) => b.status !== "failed").length;

        const promises = bots.map((b: any) =>
          fetch(`${getBackendUrl()}/bots/${b.id}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.ok ? r.json() : null)
        );
        const results = await Promise.all(promises);

        let conversations = 0;
        let leads = 0;
        for (const res of results) {
          if (!res) continue;
          conversations += res.total_conversations || 0;
          leads += res.total_leads || 0;
        }

        setSummary({ bots: bots.length, activeBots, conversations, leads });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSummary(false);
      }
    }
    if (session) loadSummary();
  }, [session]);

  /* ── Loading spinner ──────────────────────────────────── */
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#E5E4DE] border-t-[#1FA391] animate-spin" />
          <p className="text-sm text-[#6d7a76]">Loading…</p>
        </div>
      </div>
    );
  }

  /* ── Authenticated — wrap in AppShell ────────────────── */
  if (userId) {
    return (
      <AppShell
        session={session}
        pageTitle="Dashboard"
        notificationBell={<NotificationBell />}
      >
        <div className="space-y-6">
          <div>
            <h1
              className="text-3xl font-bold text-[#14171F]"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Dashboard
            </h1>
            <p className="text-[#6d7a76] mt-1 text-[15px]">
              Welcome back to your AI Assistant control center.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {loadingSummary ? (
              <div className="col-span-1 md:col-span-4 flex items-center justify-center py-10 bg-white border border-[#E5E4DE] rounded-xl shadow-sm">
                <div className="w-6 h-6 rounded-full border-2 border-[#E5E4DE] border-t-[#1FA391] animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Total Bots</p>
                  <p className="text-3xl font-bold text-[#14171F]">{summary.bots}</p>
                </div>
                <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Active Bots</p>
                  <p className="text-3xl font-bold text-[#1FA391]">{summary.activeBots}</p>
                </div>
                <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Total Conversations</p>
                  <p className="text-3xl font-bold text-[#14171F]">{summary.conversations}</p>
                </div>
                <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Total Leads</p>
                  <p className="text-3xl font-bold text-[#1FA391]">{summary.leads}</p>
                </div>
              </>
            )}
          </div>

          <h2 className="text-xl font-bold text-[#14171F] mt-8 mb-4" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/my-bots" className="group bg-white border border-[#E5E4DE] hover:border-[#1FA391] rounded-xl p-6 shadow-sm transition-colors text-left block">
              <div className="w-10 h-10 rounded-lg bg-[#E4F5F0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#1FA391]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#14171F] mb-1">Manage Your Bots</h3>
              <p className="text-sm text-[#6d7a76]">Create, configure, and train your AI assistants.</p>
            </Link>

            <Link href="/analytics" className="group bg-white border border-[#E5E4DE] hover:border-[#1FA391] rounded-xl p-6 shadow-sm transition-colors text-left block">
              <div className="w-10 h-10 rounded-lg bg-[#E4F5F0] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#1FA391]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#14171F] mb-1">Global Analytics</h3>
              <p className="text-sm text-[#6d7a76]">View performance and insights across all your bots.</p>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Unauthenticated landing ─────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative teal blob */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #1FA391 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
      />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Logo above card */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1FA391] flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span
            className="text-2xl font-bold text-[#14171F]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Chatbot Builder
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E4DE] rounded-2xl shadow-sm p-10">
          <h1
            className="text-3xl font-bold text-[#14171F] mb-3"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Welcome
          </h1>
          <p className="text-[#6d7a76] mb-8 text-[15px]">
            Build, train, and deploy an intelligent AI assistant for your website in minutes.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="w-full py-3 px-4 bg-[#1FA391] hover:bg-[#167A6D] text-white font-semibold rounded-lg transition-colors text-sm text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-white border border-[#E5E4DE] text-[#14171F] font-medium rounded-lg hover:bg-[#FAFAF8] transition-colors text-sm text-center"
            >
              Log In
            </Link>
          </div>

          <p className="mt-6 text-xs text-[#6d7a76]">
            Sign up with your email or use Google OAuth for quick access.
          </p>
        </div>
      </div>
    </div>
  );
}
