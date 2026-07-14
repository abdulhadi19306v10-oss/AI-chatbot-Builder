"use client";
import { getBackendUrl } from "../lib/config";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AnalyticsDashboard({ botId }: { botId: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = (session as any)?.id_token || "test";
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots/${botId}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    if (session) loadData();
  }, [botId, session]);

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-500">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">Failed to load analytics</div>;

  const resolutionRate = data.total_conversations > 0 
    ? Math.round((data.resolved_conversations / data.total_conversations) * 100) 
    : 0;

  // Render pure CSS bar chart for last 7 days
  const maxConvos = Math.max(...data.last_7_days.map((d: any) => parseInt(d.conversations)), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">Total Conversations</p>
          <p className="text-3xl font-bold text-slate-800">{data.total_conversations}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">Resolution Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-emerald-600">{resolutionRate}%</p>
            <p className="text-sm text-slate-400 mb-1">({data.resolved_conversations} resolved)</p>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">Bot Messages</p>
          <p className="text-3xl font-bold text-slate-800">{data.total_bot_messages}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">Leads Captured</p>
          <p className="text-3xl font-bold text-blue-600">{data.total_leads}</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-8">Conversations (Last 7 Days)</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {data.last_7_days.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400">No data for the last 7 days.</div>
          ) : (
            data.last_7_days.map((day: any, i: number) => {
              const heightPct = Math.max((parseInt(day.conversations) / maxConvos) * 100, 4);
              const dateObj = new Date(day.day);
              // Adding UTC forces it to not shift the date backwards by timezone
              const label = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
                  <div className="w-full relative flex justify-center h-full items-end">
                    <div 
                      className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all group-hover:from-blue-700 group-hover:to-blue-500 relative shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                        {day.conversations}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
