import Link from "next/link";

import { Icon } from "@/components/icon";

/** Figma: 8:4 — cabeçalho do feed. */
export function TopBar({ initial }: { initial: string }) {
  return (
    <header className="flex w-full items-center justify-between bg-white px-[18px] pt-[56px] pb-[14px]">
      <span className="text-[24px] font-extrabold tracking-[-0.48px] text-brand">
        Dawn
      </span>

      <div className="flex items-center gap-[14px]">
        <button type="button" aria-label="Notificações" className="shrink-0">
          <Icon name="bell" />
        </button>
        <Link
          href="/voce"
          aria-label="Seu perfil"
          className="flex size-[32px] items-center justify-center rounded-[16px] bg-ink text-[14px] font-bold text-white"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
