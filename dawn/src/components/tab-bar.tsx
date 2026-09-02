"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { IconName } from "@/components/icon";

const TABS = [
  { href: "/feed", label: "Início", icon: "tab-home" },
  { href: "/mapa", label: "Mapa", icon: "tab-map" },
  { href: "/progresso", label: "Progresso", icon: "tab-progress" },
  { href: "/voce", label: "Você", icon: "tab-user" },
] as const satisfies readonly { href: string; label: string; icon: IconName }[];

/**
 * Os SVGs exportados vêm com a cor cravada (laranja no ativo, cinza nos
 * demais). Aqui eles entram como máscara: a geometria é exatamente a do
 * arquivo, e a cor passa a seguir `currentColor`, o que permite alternar o
 * estado ativo sem exportar duas versões de cada ícone.
 */
function MaskIcon({ src, size }: { src: string; size: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        display: "block",
        backgroundColor: "currentColor",
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-10 flex w-full items-center justify-between border-t border-line bg-white px-[26px] pt-[13px] pb-[18px]"
    >
      {TABS.slice(0, 2).map((tab) => (
        <TabLink key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
      ))}

      <Link
        href="/nova-atividade"
        aria-label="Registrar treino"
        className="flex size-[56px] shrink-0 items-center justify-center rounded-[28px] bg-brand text-white transition-colors hover:bg-brand-press"
      >
        <MaskIcon src="/icons/tab-plus.svg" size={26} />
      </Link>

      {TABS.slice(2).map((tab) => (
        <TabLink key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
      ))}
    </nav>
  );
}

function TabLink({
  tab,
  active,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
}) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 flex-col items-center gap-[4px] ${
        active ? "text-brand" : "text-faint"
      }`}
    >
      <MaskIcon src={`/icons/${tab.icon}.svg`} size={23} />
      <span className="text-[11px] font-semibold">{tab.label}</span>
    </Link>
  );
}
