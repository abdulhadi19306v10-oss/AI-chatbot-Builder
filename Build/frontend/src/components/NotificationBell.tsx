"use client";
import { getBackendUrl } from "../lib/config";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

type Lead = {
  name: string;
  email: string;
  message?: string;
  created_at: string;
  bot_name: string;
};

export default function NotificationBell() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string>(() =>
    // ponytail: persist last-seen timestamp in localStorage so unread count survives refresh
    typeof window !== "undefined" ? (localStorage.getItem("notif_last_seen") ?? new Date(0).toISOString()) : new Date(0).toISOString()
  );
  const [now, setNow] = useState(() => Date.now());
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    const token = (session as any)?.id_token;
    if (!token) return [];

    // First fetch bots if we don't have them passed in
    let fetchedBots: { id: string; name: string }[] = [];
    try {
      const botsRes = await fetch(`${getBackendUrl()}/bots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (botsRes.ok) {
        fetchedBots = await botsRes.json();
      }
    } catch (e) {}

    if (fetchedBots.length === 0) return [];

    const results = await Promise.allSettled(
      fetchedBots.map(async (bot) => {
        const res = await fetch(`${getBackendUrl()}/bots/${bot.id}/leads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        const rows: Omit<Lead, "bot_name">[] = await res.json();
        return rows.map((r) => ({ ...r, bot_name: bot.name }));
      })
    );

    return results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [session]);

  // Initial fetch + poll every 30s
  useEffect(() => {
    let active = true;
    const run = async () => {
      const all = await fetchLeads();
      if (active) setLeads(all);
    };

    run();
    const id = setInterval(run, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [fetchLeads]);

  // Keep 'now' state updated every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = leads.filter((l) => new Date(l.created_at) > new Date(lastSeenAt)).length;

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      const nowStr = new Date().toISOString();
      setLastSeenAt(nowStr);
      localStorage.setItem("notif_last_seen", nowStr);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-2.5 rounded-lg bg-card border border-border text-secondary hover:bg-paper hover:text-ink transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-signal-teal text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-error text-sm">Notifications</h3>
            {leads.length > 0 && (
              <span className="text-xs text-secondary">
                {leads.length} lead{leads.length !== 1 ? "s" : ""} total
              </span>
            )}
          </div>

          {/* Lead list */}
          <div className="max-h-80 overflow-y-auto">
            {leads.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 text-secondary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-secondary">No leads yet</p>
              </div>
            ) : (
              leads.map((lead, i) => {
                const isUnread = new Date(lead.created_at) > new Date(lastSeenAt);
                return (
                  <div
                    key={i}
                    className={`px-4 py-3 border-b border-/60 last:border-0 flex items-start gap-3 transition-colors ${
                      isUnread ? "bg-/40" : "hover:bg-card"
                    }`}
                  >
                    {/* Avatar initial */}
                    <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {lead.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{lead.name || "Anonymous"}</p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-signal-teal shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-secondary truncate">{lead.email}</p>
                      {lead.message && (
                        <p className="text-xs text-ink bg-paper/40 rounded px-2 py-1.5 mt-1 border border-border/40 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                          {lead.message}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-card text-ink px-1.5 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                          {lead.bot_name}
                        </span>
                        <span className="text-[10px] text-secondary">{timeAgo(lead.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
