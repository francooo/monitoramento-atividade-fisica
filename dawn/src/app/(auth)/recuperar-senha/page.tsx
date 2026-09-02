import Link from "next/link";

import { Icon } from "@/components/icon";
import { BackHeader } from "@/components/ui/back-header";

import { ResetForm } from "./reset-form";

export const metadata = { title: "Recuperar senha · Dawn" };

/** Figma: 04 · Recuperar senha (9:95) */
export default function RecuperarSenhaPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white">
      <BackHeader href="/entrar" label="Voltar para entrar" />

      <div className="flex w-full flex-1 flex-col items-start px-[24px] pt-[18px]">
        <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[30px] bg-brand-soft">
          <Icon name="lock-lg" />
        </div>

        <div className="h-[20px]" />

        <h1 className="text-[30px] font-extrabold tracking-[-0.6px] text-ink">
          Recuperar senha
        </h1>

        <div className="h-[8px]" />

        <p className="w-full text-[15px] font-medium text-muted">
          Informe o e-mail da sua conta. Enviaremos um link para você criar uma
          nova senha.
        </p>

        <div className="h-[26px]" />

        <ResetForm />
      </div>

      <div className="flex w-full items-center justify-center gap-[5px] pb-[34px] text-[14px]">
        <span className="font-medium text-muted">Lembrou a senha?</span>
        <Link href="/entrar" className="font-bold text-brand">
          Entrar
        </Link>
      </div>
    </div>
  );
}
