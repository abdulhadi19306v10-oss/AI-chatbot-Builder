import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import BotManager from "@/components/BotManager";
import AppShell from "@/components/AppShell";

export default async function BotPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const { id } = await params;

  return (
    <AppShell session={session} pageTitle="Bot Management" botId={id}>
      <BotManager botId={id} />
    </AppShell>
  );
}
