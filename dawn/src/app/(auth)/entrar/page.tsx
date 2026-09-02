import Image from "next/image";
import Link from "next/link";

import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Entrar · Dawn" };

/** Figma: 02 · Entrar (9:2) */
export default function EntrarPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-white">
      <div className="relative h-[286px] w-full shrink-0 overflow-hidden">
        <Image
          src="/img/hero-auth.svg"
          alt=""
          width={390}
          height={286}
          priority
          className="h-[286px] w-full object-cover"
        />
      </div>

      <div className="flex w-full flex-1 flex-col items-start px-[24px] pt-[30px]">
        <p className="text-[34px] font-extrabold tracking-[-0.68px] text-brand">
          Dawn
        </p>
        <p className="w-full text-[15px] font-medium text-muted">
          Registre cada treino. Veja sua evolução.
        </p>

        <div className="h-[22px]" />

        <SignInForm />
      </div>

      <div className="flex w-full items-center justify-center gap-[5px] pt-[10px] pb-[34px] text-[14px]">
        <span className="font-medium text-muted">Ainda não tem conta?</span>
        <Link href="/criar-conta" className="font-bold text-brand">
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}
