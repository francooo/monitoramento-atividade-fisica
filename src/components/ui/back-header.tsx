import Link from "next/link";

import { Icon } from "@/components/icon";

/** Cabeçalho com seta de voltar. Figma: 9:53 / 9:96. */
export function BackHeader({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex w-full items-center px-[18px] pt-[56px] pb-[8px]">
      <Link href={href} aria-label={label} className="shrink-0">
        <Icon name="back" />
      </Link>
    </div>
  );
}
