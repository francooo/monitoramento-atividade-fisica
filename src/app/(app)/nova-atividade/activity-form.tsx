"use client";

import { useActionState, useState } from "react";

import { FormError, SubmitButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PhotoField } from "@/components/ui/photo-field";
import { saveActivity, type ActivityState } from "@/lib/activity-actions";

const initialState: ActivityState = {};

const KINDS = [
  { value: "corrida", label: "Corrida" },
  { value: "caminhada", label: "Caminhada" },
  { value: "pedal", label: "Pedal" },
  { value: "trilha", label: "Trilha" },
];

function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ActivityForm({ defaultCity }: { defaultCity: string }) {
  const [state, formAction] = useActionState(saveActivity, initialState);
  // Segurar o envio enquanto a foto comprime evita salvar o treino sem ela.
  const [photoBusy, setPhotoBusy] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-[10px]">
      <Field
        name="title"
        placeholder="Nome do treino"
        defaultValue="Corrida matinal"
        error={state.fieldErrors?.title}
        required
      />

      <fieldset className="flex w-full flex-wrap gap-[8px] pt-[4px] pb-[4px]">
        <legend className="sr-only">Modalidade</legend>
        {KINDS.map((kind, index) => (
          <label
            key={kind.value}
            className="cursor-pointer rounded-pill border border-line bg-field px-[16px] py-[9px] text-[14px] font-semibold text-muted has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand"
          >
            <input
              type="radio"
              name="kind"
              value={kind.value}
              defaultChecked={index === 0}
              className="sr-only"
            />
            {kind.label}
          </label>
        ))}
      </fieldset>

      <Field
        name="distanceKm"
        placeholder="Distância em km (ex.: 8,24)"
        inputMode="decimal"
        error={state.fieldErrors?.distanceKm}
        required
      />
      <Field
        name="durationMinutes"
        placeholder="Duração em minutos (ex.: 45)"
        inputMode="decimal"
        error={state.fieldErrors?.durationMinutes}
        required
      />
      <Field
        name="startedAt"
        type="datetime-local"
        placeholder="Início do treino"
        defaultValue={localNow()}
        error={state.fieldErrors?.startedAt}
        required
      />
      <Field
        name="city"
        placeholder="Cidade"
        defaultValue={defaultCity}
        error={state.fieldErrors?.city}
      />

      <PhotoField error={state.fieldErrors?.photo} onBusyChange={setPhotoBusy} />

      <div className="h-[10px]" />

      <FormError message={state.error} />

      <SubmitButton pendingLabel="Salvando…" disabled={photoBusy}>
        Salvar treino
      </SubmitButton>
    </form>
  );
}
