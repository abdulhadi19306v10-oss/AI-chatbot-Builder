"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-paper flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink">
      <div className="p-8 max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center shadow-lg shadow-teal/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-ink dark:text-paper">Chatbot Builder</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm border border-black/10 dark:border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-ink dark:text-paper uppercase">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
                </div>
              )}
              <button onClick={() => signOut()} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium">Log out</button>
            </div>
          </div>
        </header>

        <Dashboard />
      </div>
    </div>
  );
}
