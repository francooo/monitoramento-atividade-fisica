"use client";

import { useActionState } from "react";

import { FormError, FormNotice, SubmitButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { requestPasswordReset, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = {};

export function ResetForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  if (state.notice) {
    return <FormNotice message={state.notice} />;
  }

  return (
    <form action={formAction} className="flex w-full flex-col">
      <Field
        name="email"
        type="email"
        icon="mail"
        placeholder="E-mail cadastrado"
        autoComplete="email"
        inputMode="email"
        error={state.fieldErrors?.email}
        required
      />

      <div className="h-[20px]" />

      <FormError message={state.error} />

      <SubmitButton pendingLabel="Enviando…">
        Enviar link de recuperação
      </SubmitButton>
    </form>
  );
}
