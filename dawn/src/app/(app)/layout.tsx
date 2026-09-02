import { redirect } from "next/navigation";

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
      <TabBar />
    </div>
  );
}
