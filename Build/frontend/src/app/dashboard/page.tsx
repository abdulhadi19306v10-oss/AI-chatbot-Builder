"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import AppShell from "@/components/AppShell";
import { getBackendUrl } from "@/lib/config";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;

  const [summary, setSummary] = useState({ bots: 0, activeBots: 0, conversations: 0, leads: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  if (!isLoaded || (!userId && status !== "unauthenticated")) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
          <p className="text-sm text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (!userId) return null; // Will redirect

  return (
    <AppShell
      session={session}
      pageTitle="Dashboard"
      notificationBell={<NotificationBell />}
    >
      <div className="space-y-6">
        <div>
          <h1
            className="text-3xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Dashboard
          </h1>
          <p className="text-secondary mt-1 text-[15px]">
            Welcome back to your AI Assistant control center.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loadingSummary ? (
            <div className="col-span-1 md:col-span-4 flex items-center justify-center py-10 bg-card border border-border rounded-xl shadow-sm">
              <div className="w-6 h-6 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Total Bots</p>
                <p className="text-3xl font-bold text-ink">{summary.bots}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Active Bots</p>
                <p className="text-3xl font-bold text-ink">{summary.activeBots}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Total Conversations</p>
                <p className="text-3xl font-bold text-ink">{summary.conversations}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Total Leads</p>
                <p className="text-3xl font-bold text-ink">{summary.leads}</p>
              </div>
            </>
          )}
        </div>

        <h2 className="text-xl font-bold text-ink mt-8 mb-4" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/my-bots" className="group bg-card border border-border hover:border-signal-teal rounded-xl p-6 shadow-sm transition-colors text-left block">
            <div className="w-10 h-10 rounded-lg bg-soft-mint flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-signal-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-bold text-ink mb-1">Manage Your Bots</h3>
            <p className="text-sm text-secondary">Create, configure, and train your AI assistants.</p>
          </Link>

          <Link href="/analytics" className="group bg-card border border-border hover:border-signal-teal rounded-xl p-6 shadow-sm transition-colors text-left block">
            <div className="w-10 h-10 rounded-lg bg-soft-mint flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-signal-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-ink mb-1">Global Analytics</h3>
            <p className="text-sm text-secondary">View performance and insights across all your bots.</p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
