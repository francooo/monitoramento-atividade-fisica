import Link from "next/link";

import { ActivityCard } from "@/components/activity-card";
import { TopBar } from "@/components/top-bar";
import { WeekSummaryCard } from "@/components/week-summary-card";
import { getFeed, getWeekSummary } from "@/db/queries";
import { initialOf } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Início · Dawn" };

/** Figma: Início — cabeçalho 8:4, feed 8:12. */
export default async function FeedPage() {
  const user = await requireUser();
  const [feed, week] = await Promise.all([
    getFeed(user.id),
    getWeekSummary(user.id),
  ]);

  return (
    <>
      <TopBar initial={initialOf(user.name)} />

      <div className="flex w-full flex-col gap-[12px] px-[14px] pb-[12px]">
        {feed.length === 0 ? (
          <EmptyFeed />
        ) : (
          feed.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        )}

        <WeekSummaryCard summary={week} />
      </div>
    </>
  );
}

function EmptyFeed() {
  return (
    <div className="flex w-full flex-col items-start gap-[8px] rounded-card border border-line bg-white p-[20px]">
      <h2 className="text-[18px] font-bold tracking-[-0.18px] text-ink">
        Comece pelo primeiro treino
      </h2>
      <p className="text-[15px] font-medium text-muted">
        Registre uma corrida e ela aparece aqui, com distância, ritmo e tempo.
      </p>
      <Link
        href="/nova-atividade"
        className="mt-[8px] rounded-pill bg-brand px-[20px] py-[12px] text-[15px] font-bold text-white"
      >
        Registrar treino
      </Link>
    </div>
  );
}
