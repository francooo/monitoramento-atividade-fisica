import Image from "next/image";

import { Icon } from "@/components/icon";
import { KudosButton } from "@/components/kudos-button";
import type { FeedActivity } from "@/db/queries";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatWhenAndPlace,
  initialOf,
} from "@/lib/format";

/** Figma: card de atividade (8:13). */
export function ActivityCard({ activity }: { activity: FeedActivity }) {
  const stats = [
    { label: "Distância", value: formatDistance(activity.distanceMeters) },
    {
      label: "Ritmo",
      value: formatPace(activity.distanceMeters, activity.durationSeconds),
    },
    { label: "Tempo", value: formatDuration(activity.durationSeconds) },
  ];

  return (
    <article className="w-full overflow-hidden rounded-card border border-line bg-white">
      <div className="flex w-full items-center gap-[10px] px-[14px] pt-[14px] pb-[10px]">
        <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[21px] bg-brand-soft text-[16px] font-bold text-brand">
          {initialOf(activity.authorName)}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <p className="truncate text-[15px] font-semibold text-ink">
            {activity.authorName}
          </p>
          <div className="flex items-center gap-[5px]">
            <Icon name="pin" />
            <p className="truncate text-[13px] font-medium text-muted">
              {formatWhenAndPlace(activity.startedAt, activity.city)}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Mais opções"
          className="shrink-0 opacity-70"
        >
          <Icon name="more" />
        </button>
      </div>

      <div className="flex w-full items-center px-[14px] pb-[12px]">
        <h2 className="text-[18px] font-bold tracking-[-0.18px] text-ink">
          {activity.title}
        </h2>
      </div>

      <div className="relative h-[176px] w-full overflow-hidden">
        <Image
          src={
            activity.hasPhoto
              ? `/api/atividades/${activity.id}/foto`
              : "/img/route-map.svg"
          }
          alt={
            activity.hasPhoto
              ? `Foto do treino ${activity.title}`
              : `Traçado do treino ${activity.title}`
          }
          width={362}
          height={176}
          // A foto já chega comprimida e redimensionada pelo navegador de quem
          // publicou; passar de novo pelo otimizador só gastaria tempo.
          unoptimized={activity.hasPhoto}
          className="h-[176px] w-full object-cover"
        />
      </div>

      <div className="flex w-full items-start px-[16px] py-[14px]">
        {stats.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <p className="text-[12px] font-medium text-muted">{stat.label}</p>
            <p className="text-[21px] font-extrabold tracking-[-0.21px] text-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="h-px w-[300px] bg-line" />

      <div className="flex w-full items-center gap-[18px] px-[14px] py-[10px]">
        <KudosButton
          activityId={activity.id}
          initialCount={activity.kudosCount}
          initialLiked={activity.likedByMe}
        />
        <div className="flex items-center gap-[6px]">
          <Icon name="comment" />
          <span className="text-[14px] font-semibold text-muted">
            {activity.commentsCount}
          </span>
        </div>
      </div>
    </article>
  );
}
