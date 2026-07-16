"use client";

import { useSession } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";
import AppShell from "@/components/AppShell";
import { getBackendUrl } from "@/lib/config";
import { useState, useEffect } from "react";

export default function GlobalAnalyticsPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;

  const [data, setData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadGlobalAnalytics() {
      const token = (session as any)?.id_token;
      if (!token) return;
      try {
        const botsRes = await fetch(`${getBackendUrl()}/bots`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!botsRes.ok) throw new Error("Failed to fetch bots");
        const bots = await botsRes.json();

        const promises = bots.map((b: any) =>
          fetch(`${getBackendUrl()}/bots/${b.id}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.ok ? r.json() : null)
        );
        const results = await Promise.all(promises);

        const agg = {
          total_conversations: 0,
          resolved_conversations: 0,
          total_bot_messages: 0,
          total_leads: 0,
          last_7_days_map: {} as Record<string, number>
        };

        for (const res of results) {
          if (!res) continue;
          agg.total_conversations += res.total_conversations || 0;
          agg.resolved_conversations += res.resolved_conversations || 0;
          agg.total_bot_messages += res.total_bot_messages || 0;
          agg.total_leads += res.total_leads || 0;

          for (const day of (res.last_7_days || [])) {
            agg.last_7_days_map[day.day] = (agg.last_7_days_map[day.day] || 0) + parseInt(day.conversations || "0");
          }
        }

        // Convert map to sorted array
        const last_7_days = Object.keys(agg.last_7_days_map)
          .sort()
          .map(day => ({ day, conversations: agg.last_7_days_map[day] }));

        setData({ ...agg, last_7_days });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    }
    if (session) loadGlobalAnalytics();
  }, [session]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
          <p className="text-sm text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (userId) {
    const resolutionRate = data?.total_conversations > 0
      ? Math.round((data.resolved_conversations / data.total_conversations) * 100)
      : 0;
    
    const maxConvos = data ? Math.max(...data.last_7_days.map((d: any) => d.conversations), 1) : 1;

    return (
      <AppShell
        session={session}
        pageTitle="Analytics Overview"
        notificationBell={<NotificationBell />}
      >
        <div className="space-y-6">
          <div>
            <h1
              className="text-3xl font-bold text-ink"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Global Analytics
            </h1>
            <p className="text-secondary mt-1 text-[15px]">
              Overview of all your AI assistants.
            </p>
          </div>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-signal-teal animate-spin" />
                <p className="text-sm text-secondary">Aggregating analytics…</p>
              </div>
            </div>
          ) : !data ? (
            <div className="p-6 bg-red-50 border border-red-100 text-error text-sm rounded-xl">
              Failed to load analytics.
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Total Conversations</p>
                  <p className="text-3xl font-bold text-ink">{data.total_conversations}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Resolution Rate</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-ink">{resolutionRate}%</p>
                    <p className="text-xs text-secondary mb-1">({data.resolved_conversations} resolved)</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Bot Messages</p>
                  <p className="text-3xl font-bold text-ink">{data.total_bot_messages}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Leads Captured</p>
                  <p className="text-3xl font-bold text-ink">{data.total_leads}</p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3
                  className="text-base font-bold text-ink mb-6"
                  style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
                >
                  Global Conversations (Last 7 Days)
                </h3>
                <div className="h-56 flex items-end justify-between gap-2">
                  {data.last_7_days.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-error text-sm">
                      No data for the last 7 days.
                    </div>
                  ) : (
                    data.last_7_days.map((day: any, i: number) => {
                      const heightPct = Math.max((day.conversations / maxConvos) * 100, 4);
                      const dateObj = new Date(day.day);
                      const label = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000)
                        .toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                          <div className="w-full relative flex justify-center h-full items-end">
                            <div
                              className="w-full max-w-[48px] rounded-t-lg transition-all relative overflow-hidden"
                              style={{
                                height: `${heightPct}%`,
                                background: "linear-gradient(to top, var(--color-signal-teal), #65d9c6)"
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-signal-teal text-white text-xs px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md whitespace-nowrap">
                                {day.conversations}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-secondary font-medium">{label}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return null;
}
