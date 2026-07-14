"use client";
import { getBackendUrl } from "../lib/config";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session } = useSession();
  const getToken = async () => (session as any)?.id_token || "test";
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState("");
  
  const containerRef = useRef<HTMLDivElement>(null);

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
          return newBots;
        });
        setBotName("");
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
      setBots(prev => prev.filter(b => b.id !== botId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={containerRef} className="grid gap-8">
      <section className="dashboard-section p-8 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">Your Bots</h2>
        
        {bots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {bots.map((bot, i) => (
              <div key={i} className={`bot-card-${i} p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between`}>
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{bot.name}</h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full font-medium mt-2 inline-block">Active</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/bot/${bot.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">Manage</Link>
                  <button onClick={() => handleDeleteBot(bot.id, bot.name)} className="text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 mb-6 italic">No bots created yet. Start by creating one below.</p>
        )}

        <form onSubmit={handleCreateBot} className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="e.g. Sales Bot" 
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="flex-1 max-w-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
          />
          <button 
            type="submit" 
            disabled={loading || !botName.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Bot"}
          </button>
        </form>
      </section>
      
      <section className="dashboard-section p-8 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Analytics & Leads</h2>
        <p className="text-slate-500 dark:text-slate-400">Analytics dashboard will appear here once your bot receives messages.</p>
      </section>
    </div>
  );
}
