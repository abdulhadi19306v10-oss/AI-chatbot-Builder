import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import BotManager from "@/components/BotManager";

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100">
      <div className="p-8 font-sans max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 p-6 bg-white/50 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-800 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Bot Management</h1>
          </div>
          {session.user.image && (
            <img src={session.user.image} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm border border-slate-200 dark:border-slate-700" />
          )}
        </header>

        <BotManager botId={id} />
      </div>
    </div>
  );
}
