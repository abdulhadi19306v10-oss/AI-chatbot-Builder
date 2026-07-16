"use client";
import { getBackendUrl } from "../lib/config";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Dashboard({ onBotsChange }: { onBotsChange?: (bots: { id: string; name: string }[]) => void }) {
  const { data: session } = useSession();
  const getToken = async () => (session as any)?.id_token || "test";
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadBots() {
      const token = await getToken();
      if (!token || token === "test") return;
      try {
        const res = await fetch(`${getBackendUrl()}/bots`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBots(data);
          onBotsChange?.(data);
        }
      } catch (e) {}
    }
    loadBots();
  }, [session]);

  // GSAP Animation when bots load
  useEffect(() => {
    if (bots.length > 0) {
      gsap.fromTo(
        ".bot-card",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [bots]);

  // Stats Animation on mount
  useEffect(() => {
    gsap.fromTo(
      ".stat-card",
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.1, ease: "power2.out" }
    );
  }, []);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName.trim()) return;

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${getBackendUrl()}/bots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: botName }),
      });

      if (res.ok) {
        const bot = await res.json();
        setBots(prev => {
          const newBots = [...prev, bot];
          onBotsChange?.(newBots);
          return newBots;
        });
        setBotName("");
        setShowModal(false);
      } else {
        const errData = await res.json().catch(() => null);
        alert(`Failed to create bot: ${errData?.detail || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string, botName: string) => {
    if (!confirm(`Are you sure you want to delete "${botName}"?`)) return;

    try {
      const token = await getToken();
      await fetch(`${getBackendUrl()}/bots/${botId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setBots(prev => {
        const next = prev.filter(b => b.id !== botId);
        onBotsChange?.(next);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const activeBots = bots.filter(b => b.status !== "failed");

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-ink"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            My Bots
          </h1>
          <p className="text-secondary mt-1 text-[15px]">
            Create, manage and deploy your AI assistants.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-signal-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create bot
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Total Bots</p>
          <p className="text-3xl font-bold text-ink">{bots.length}</p>
        </div>
        <div className="stat-card bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Active Bots</p>
          <p className="text-3xl font-bold text-ink">{activeBots.length}</p>
        </div>
        <div className="stat-card bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">Deployments</p>
          <p className="text-3xl font-bold text-ink">{bots.length}</p>
        </div>
      </div>

      {/* Bot grid */}
      {bots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bot-card bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink text-[15px] leading-tight">{bot.name}</h3>
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-card text-ink">
                    Active
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-soft-mint flex items-center justify-center shrink-0 overflow-hidden text-lg border border-border">
                  {bot.avatar?.startsWith('data:image') || bot.avatar?.startsWith('http') ? (
                    <img src={bot.avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    bot.avatar || "🤖"
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <Link
                  href={`/bot/${bot.id}`}
                  className="flex-1 text-center text-sm font-semibold text-signal-teal border border-border rounded-lg py-2 hover:bg-paper transition-colors"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleDeleteBot(bot.id, bot.name)}
                  className="text-sm font-medium text-error px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-soft-mint flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-signal-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3
            className="text-lg font-bold text-ink mb-2"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Create your first bot
          </h3>
          <p className="text-error text-sm mb-6">
            No bots yet. Get started by creating your first AI assistant.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-signal-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create bot
          </button>
        </div>
      )}

      {/* ── Create Bot Modal ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />

          {/* Modal card */}
          <div className="relative bg-card border border-border rounded-2xl shadow-xl p-8 w-full max-w-sm z-10">
            <h2
              className="text-xl font-bold text-ink mb-1"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Create a new bot
            </h2>
            <p className="text-error text-sm mb-6">Give your bot a name to get started.</p>

            <form onSubmit={handleCreateBot} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Bot Name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Sales Bot"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-inkink placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-signal-teal focus:border-signal-teal transition text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !botName.trim()}
                  className="flex-1 py-3 bg-signal-teal hover:bg-teal-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Creating…" : "Create Bot"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setBotName(""); }}
                  className="px-5 py-3 border border-border text-secondary font-medium rounded-lg hover:bg-paper transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
