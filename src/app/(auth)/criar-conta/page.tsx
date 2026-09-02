import Link from "next/link";

import { BackHeader } from "@/components/ui/back-header";

import { SignUpForm } from "./sign-up-form";

export const metadata = { title: "Criar conta · Dawn" };

/** Figma: 03 · Criar conta (9:52) */
export default function CriarContaPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white">
      <BackHeader href="/entrar" label="Voltar para entrar" />

      <div className="flex w-full flex-1 flex-col items-start px-[24px] pt-[18px]">
        <h1 className="text-[30px] font-extrabold tracking-[-0.6px] text-ink">
          Criar conta
        </h1>
        <p className="w-full text-[15px] font-medium text-muted">
          Leva menos de um minuto.
        </p>

        <div className="h-[24px]" />

        <SignUpForm />

        <div className="h-[14px]" />

        <p className="w-full text-center text-[12px] font-medium text-faint">
          Ao criar a conta você concorda com os Termos de Uso e a Política de
          Privacidade.
        </p>
      </div>

      <div className="flex w-full items-center justify-center gap-[5px] pb-[34px] text-[14px]">
        <span className="font-medium text-muted">Já tem conta?</span>
        <Link href="/entrar" className="font-bold text-brand">
          Entrar
        </Link>
      </div>
    </div>
  );
}
