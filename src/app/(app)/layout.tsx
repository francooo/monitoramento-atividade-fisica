import { redirect } from "next/navigation";

import { CoachChat } from "@/components/coach-chat";
import { TabBar } from "@/components/tab-bar";
import { getCurrentUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-white">
      <div className="flex-1">{children}</div>
      <CoachChat />
      <TabBar />
    </div>
  );
}
