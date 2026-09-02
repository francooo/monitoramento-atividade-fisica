import Link from "next/link";

import type { WeekSummary } from "@/db/queries";
import { formatDistanceShort, formatDurationCompact } from "@/lib/format";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const BAR_MAX = 40;
const BAR_MIN = 6; // altura do dia sem treino, igual ao Figma

/** Figma: bloco "Esta semana" (8:57). */
export function WeekSummaryCard({ summary }: { summary: WeekSummary }) {
  const peak = Math.max(...summary.perDayMeters, 1);

  const stats = [
    { value: String(summary.workouts), label: "Treinos" },
    { value: formatDistanceShort(summary.distanceMeters), label: "Distância" },
    { value: formatDurationCompact(summary.durationSeconds), label: "Tempo" },
  ];

  return (
    <section className="flex w-full flex-col gap-[16px] rounded-card border border-line bg-white p-[16px]">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-[15px] font-bold text-ink">Esta semana</h2>
        <Link href="/progresso" className="text-[13px] font-semibold text-brand">
          Ver tudo
        </Link>
      </div>

      <div className="flex w-full items-start">
        {stats.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <p className="text-[20px] font-extrabold tracking-[-0.2px] text-ink">
              {stat.value}
            </p>
            <p className="text-[12px] font-medium text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex h-[40px] w-full max-w-[300px] items-end justify-between">
        {summary.perDayMeters.map((meters, index) => {
          const active = meters > 0;
          const height = active
            ? Math.max(BAR_MIN + 4, Math.round((meters / peak) * BAR_MAX))
            : BAR_MIN;

          return (
            <div
              key={DAYS[index]}
              title={`${DAYS[index]}: ${
                active ? formatDistanceShort(meters) : "sem treino"
              }`}
              style={{ height }}
              className={`w-[26px] shrink-0 rounded-[6px] ${
                active ? "bg-brand" : "bg-track"
              }`}
            />
          );
        })}
      </div>
      <p className="sr-only">
        Distância por dia, de segunda a domingo:{" "}
        {summary.perDayMeters
          .map((m, i) => `${DAYS[i]} ${formatDistanceShort(m)}`)
          .join(", ")}
        .
      </p>
    </section>
  );
}
