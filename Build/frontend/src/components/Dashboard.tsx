"use client";
import { getBackendUrl } from "../lib/config";

import { useState, useEffect } from "react";
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
            className="text-3xl font-bold text-[#14171F]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            My Bots
          </h1>
          <p className="text-[#6d7a76] mt-1 text-[15px]">
            Create, manage and deploy your AI assistants.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1FA391] hover:bg-[#167A6D] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create bot
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Total Bots</p>
          <p className="text-3xl font-bold text-[#14171F]">{bots.length}</p>
        </div>
        <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Active Bots</p>
          <p className="text-3xl font-bold text-[#1FA391]">{activeBots.length}</p>
        </div>
        <div className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7a76] mb-2">Deployments</p>
          <p className="text-3xl font-bold text-[#14171F]">{bots.length}</p>
        </div>
      </div>

      {/* Bot grid */}
      {bots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white border border-[#E5E4DE] rounded-xl p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#14171F] text-[15px] leading-tight">{bot.name}</h3>
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4F5F0] text-[#1FA391]">
                    Active
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#E4F5F0] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#1FA391]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <Link
                  href={`/bot/${bot.id}`}
                  className="flex-1 text-center text-sm font-semibold text-[#1FA391] border border-[#1FA391] rounded-lg py-2 hover:bg-[#E4F5F0] transition-colors"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleDeleteBot(bot.id, bot.name)}
                  className="text-sm font-medium text-[#D64545] px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="border-2 border-dashed border-[#E5E4DE] rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E4F5F0] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#1FA391]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3
            className="text-lg font-bold text-[#14171F] mb-2"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Create your first bot
          </h3>
          <p className="text-[#6d7a76] text-sm mb-6">
            No bots yet. Get started by creating your first AI assistant.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1FA391] hover:bg-[#167A6D] text-white text-sm font-semibold rounded-lg transition-colors"
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
          <div className="relative bg-white border border-[#E5E4DE] rounded-2xl shadow-xl p-8 w-full max-w-sm z-10">
            <h2
              className="text-xl font-bold text-[#14171F] mb-1"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Create a new bot
            </h2>
            <p className="text-[#6d7a76] text-sm mb-6">Give your bot a name to get started.</p>

            <form onSubmit={handleCreateBot} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d7a76] mb-1.5">
                  Bot Name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Sales Bot"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#E5E4DE] bg-white text-[#14171F] placeholder:text-[#6d7a76] focus:outline-none focus:ring-2 focus:ring-[#1FA391] focus:border-[#1FA391] transition text-sm"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !botName.trim()}
                  className="flex-1 py-3 bg-[#1FA391] hover:bg-[#167A6D] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Creating…" : "Create Bot"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setBotName(""); }}
                  className="px-5 py-3 border border-[#E5E4DE] text-[#14171F] font-medium rounded-lg hover:bg-[#FAFAF8] transition-colors text-sm"
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
