import Image from "next/image";

import { getActivitiesWithRoute } from "@/db/queries";
import { formatDistance, formatWhenAndPlace } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Mapa · Dawn" };

export default async function MapaPage() {
  const user = await requireUser();
  const activities = await getActivitiesWithRoute(user.id);

  return (
    <div className="flex w-full flex-col gap-[12px] px-[14px] pt-[56px] pb-[12px]">
      <h1 className="px-[4px] pb-[6px] text-[30px] font-extrabold tracking-[-0.6px] text-ink">
        Mapa
      </h1>

      {activities.length === 0 ? (
        <p className="px-[4px] text-[15px] font-medium text-muted">
          Nenhum traçado ainda. Os treinos com rota gravada aparecem aqui.
        </p>
      ) : (
        activities.map((activity) => (
          <article
            key={activity.id}
            className="w-full overflow-hidden rounded-card border border-line bg-white"
          >
            <Image
              src="/img/route-map.svg"
              alt={`Traçado do treino ${activity.title}`}
              width={362}
              height={176}
              className="h-[176px] w-full object-cover"
            />
            <div className="flex flex-col gap-[2px] px-[16px] py-[14px]">
              <p className="text-[15px] font-semibold text-ink">{activity.title}</p>
              <p className="text-[13px] font-medium text-muted">
                {formatWhenAndPlace(activity.startedAt, activity.city)} ·{" "}
                {formatDistance(activity.distanceMeters)}
              </p>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
