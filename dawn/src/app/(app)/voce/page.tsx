import { getProfileTotals } from "@/db/queries";
import {
  formatDistanceShort,
  formatDurationCompact,
  initialOf,
} from "@/lib/format";
import { signOut } from "@/lib/auth-actions";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Você · Dawn" };

export default async function VocePage() {
  const user = await requireUser();
  const totals = await getProfileTotals(user.id);

  return (
    <div className="flex w-full flex-col gap-[12px] px-[14px] pt-[56px] pb-[12px]">
      <div className="flex items-center gap-[14px] px-[4px] pb-[6px]">
        <div className="flex size-[60px] items-center justify-center rounded-[30px] bg-brand-soft text-[24px] font-bold text-brand">
          {initialOf(user.name)}
        </div>
        <div className="flex min-w-0 flex-col gap-[2px]">
          <p className="truncate text-[20px] font-extrabold tracking-[-0.2px] text-ink">
            {user.name}
          </p>
          <p className="truncate text-[13px] font-medium text-muted">{user.email}</p>
        </div>
      </div>

      <section className="flex w-full items-start rounded-card border border-line bg-white p-[16px]">
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
      </section>

      <form action={signOut} className="pt-[4px]">
        <button
          type="submit"
          className="w-full rounded-pill border border-line-strong bg-white py-[14px] text-[15px] font-semibold text-ink"
        >
          Sair da conta
        </button>
      </form>
    </div>
  );
}
