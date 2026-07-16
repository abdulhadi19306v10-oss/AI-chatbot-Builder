"use client";

import { useSession } from "next-auth/react";
import Dashboard from "@/components/Dashboard"; // This component renders the My Bots UI
import NotificationBell from "@/components/NotificationBell";
import AppShell from "@/components/AppShell";

export default function MyBotsPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.email;

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
    return (
      <AppShell
        session={session}
        pageTitle="My Bots"
        notificationBell={<NotificationBell />}
      >
        <Dashboard />
      </AppShell>
    );
  }

  return null;
}
