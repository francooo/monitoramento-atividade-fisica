"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  FormError,
  OrDivider,
  OutlineButton,
  SubmitButton,
} from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signIn, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function SignInForm({ oauthError }: { oauthError?: string }) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <>
      <FormError message={oauthError} />

      <form action={formAction} className="flex w-full flex-col gap-[10px]">
        <Field
          name="email"
          type="email"
          icon="mail"
          placeholder="E-mail"
          autoComplete="email"
          inputMode="email"
          error={state.fieldErrors?.email}
          required
        />
        <Field
          name="password"
          type="password"
          icon="lock"
          placeholder="Senha"
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          required
        />

        <div className="flex w-full justify-end pt-[10px] pb-[16px]">
          <Link
            href="/recuperar-senha"
            className="text-[13px] font-semibold text-brand"
          >
            Esqueci minha senha
          </Link>
        </div>

        <FormError message={state.error} />

        <SubmitButton pendingLabel="Entrando…">Entrar</SubmitButton>
      </form>

      <div className="h-[16px]" />

      <OrDivider />

      <div className="flex w-full flex-col gap-[10px]">
        <OutlineButton icon="google" href="/api/auth/google">
          Continuar com Google
        </OutlineButton>
        <OutlineButton icon="apple">Continuar com Apple</OutlineButton>
      </div>
    </>
  );
}
