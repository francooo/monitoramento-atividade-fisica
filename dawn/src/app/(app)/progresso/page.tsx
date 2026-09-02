import { WeekSummaryCard } from "@/components/week-summary-card";
import { getProfileTotals, getWeekSummary } from "@/db/queries";
import {
  formatDistanceShort,
  formatDurationCompact,
} from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Progresso · Dawn" };

export default async function ProgressoPage() {
  const user = await requireUser();
  const [week, totals] = await Promise.all([
    getWeekSummary(user.id),
    getProfileTotals(user.id),
  ]);

  return (
    <div className="flex w-full flex-col gap-[12px] px-[14px] pt-[56px] pb-[12px]">
      <h1 className="px-[4px] pb-[6px] text-[30px] font-extrabold tracking-[-0.6px] text-ink">
        Progresso
      </h1>

      <WeekSummaryCard summary={week} />

      <section className="flex w-full flex-col gap-[16px] rounded-card border border-line bg-white p-[16px]">
        <h2 className="text-[15px] font-bold text-ink">Desde o começo</h2>
        <div className="flex w-full items-start">
          {[
            { value: String(totals.workouts), label: "Treinos" },
            { value: formatDistanceShort(totals.distance), label: "Distância" },
            { value: formatDurationCompact(totals.duration), label: "Tempo" },
          ].map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <p className="text-[20px] font-extrabold tracking-[-0.2px] text-ink">
                {stat.value}
              </p>
              <p className="text-[12px] font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
