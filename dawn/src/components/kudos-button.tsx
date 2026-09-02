"use client";

import { useOptimistic, useTransition } from "react";

import { likeActivity } from "@/lib/activity-actions";

/**
 * O contador muda na hora e só depois espera o servidor — curtir é a
 * interação mais repetida do feed e não deve esperar um round-trip.
 */
export function KudosButton({
  activityId,
  initialCount,
  initialLiked,
}: {
  activityId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { count: initialCount, liked: initialLiked },
    (current) => ({
      count: current.liked ? current.count - 1 : current.count + 1,
      liked: !current.liked,
    }),
  );

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Remover curtida" : "Curtir treino"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(null);
          await likeActivity(activityId);
        })
      }
      className={`flex items-center gap-[6px] ${
        state.liked ? "text-brand" : "text-muted"
      }`}
    >
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          display: "block",
          backgroundColor: "currentColor",
          maskImage: "url(/icons/heart.svg)",
          WebkitMaskImage: "url(/icons/heart.svg)",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
      <span className="text-[14px] font-semibold">{state.count}</span>
    </button>
  );
}
