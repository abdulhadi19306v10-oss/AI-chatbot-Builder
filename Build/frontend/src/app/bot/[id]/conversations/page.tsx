import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ChatHistoryList from "@/components/ChatHistoryList";
import AppShell from "@/components/AppShell";

export default async function BotConversationsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const { id } = await params;

  return (
    <AppShell session={session} pageTitle="Chat History" botId={id}>
      <ChatHistoryList botId={id} />
    </AppShell>
  );
}
