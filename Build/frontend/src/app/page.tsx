"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Dashboard from "@/components/Dashboard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
      <div className="p-8 font-sans max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300">Chatbot Builder</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isLoaded && userId && (
              <div className="flex items-center gap-3">
                <img src={session?.user?.image || ""} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm border border-slate-200 dark:border-slate-700" />
                <button onClick={() => signOut()} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium">Log out</button>
              </div>
            )}
            {isLoaded && !userId && (
              <button onClick={() => signIn('google')} className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">Sign In with Google</button>
            )}
          </div>
        </header>

        {!isLoaded ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : userId ? (
          <Dashboard />
        ) : (
          <div className="text-center py-32 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-4xl font-extrabold mb-4 text-slate-800 dark:text-slate-100 tracking-tight">Welcome to Chatbot Builder</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto">Build, train, and deploy an intelligent AI assistant for your website in minutes. No coding required.</p>
            <button onClick={() => signIn('google')} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-blue-500/30 text-lg">Continue with Google</button>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You will need to provide Google OAuth credentials in your .env file to use this auth method.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
