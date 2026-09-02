"use client";

import { useActionState } from "react";

import { FormError, SubmitButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signUp, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col">
      <div className="flex w-full flex-col gap-[10px]">
        <Field
          name="name"
          icon="user"
          placeholder="Nome completo"
          autoComplete="name"
          error={state.fieldErrors?.name}
          required
        />
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
          placeholder="Senha (mín. 6 caracteres)"
          autoComplete="new-password"
          error={state.fieldErrors?.password}
          required
        />
        <Field
          name="confirmPassword"
          type="password"
          icon="lock"
          placeholder="Confirmar senha"
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
          required
        />
      </div>

      <div className="h-[20px]" />

      <FormError message={state.error} />

      <SubmitButton pendingLabel="Criando conta…">Criar conta</SubmitButton>
    </form>
  );
}
