"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import AppShell from "@/components/AppShell";
import { getBackendUrl } from "@/lib/config";

import { useOnboarding } from "@/components/OnboardingProvider";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;

  const { onboardingCompletedAt, onboardingStep, isLoading: onboardingLoading, updateStep } = useOnboarding();
  const [redirected, setRedirected] = useState(false);

  const [summary, setSummary] = useState({ bots: 0, activeBots: 0, conversations: 0, leads: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (onboardingLoading || loadingSummary || redirected || status !== "authenticated") return;

    if (onboardingCompletedAt === null) {
      setRedirected(true);
      const token = (session as any)?.id_token;
      if (!token) return;

      fetch(`${getBackendUrl()}/bots`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : [])
      .then(async (botsList) => {
        if (botsList.length === 0) {
          router.push("/my-bots");
        } else {
          const latestBot = botsList[0];
          if (onboardingStep < 2) {
            await updateStep(2);
          }
          router.push(`/bot/${latestBot.id}?tour=1`);
        }
      })
      .catch(console.error);
    }
  }, [onboardingCompletedAt, onboardingStep, onboardingLoading, loadingSummary, session, status, router, redirected, updateStep]);

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

        {/* Empty state tutorial */}
        {!loadingSummary && summary.bots === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
                Welcome to Chatbot Builder! 🎉
              </h2>
              <p className="text-secondary text-[15px] mb-8">
                It looks like you haven&apos;t created any bots yet. Follow these 4 simple steps to build and deploy your first custom AI assistant.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-signal-teal text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-ink text-[15px]">Create your bot</h4>
                    <p className="text-sm text-secondary">Click the button below to give your AI assistant a name.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-paper border border-border text-ink flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-ink text-[15px]">Train it on your data</h4>
                    <p className="text-sm text-secondary">Upload PDFs or text files so the bot learns about your business.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-paper border border-border text-ink flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-ink text-[15px]">Customize appearance</h4>
                    <p className="text-sm text-secondary">Change the colors, avatar, and welcome message to match your brand.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-paper border border-border text-ink flex items-center justify-center font-bold shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-ink text-[15px]">Deploy to your website</h4>
                    <p className="text-sm text-secondary">Copy a simple script tag and paste it into your site to go live!</p>
                  </div>
                </div>
              </div>

              <Link
                href="/my-bots?new=1"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-signal-teal hover:bg-teal-dark text-white text-[15px] font-semibold rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Bot Now
              </Link>
            </div>
          </div>
        )}

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
