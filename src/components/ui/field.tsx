"use client";

import { useId, useState } from "react";

import { Icon, type IconName } from "@/components/icon";

type FieldProps = {
  name: string;
  placeholder: string;
  icon?: IconName;
  type?: "text" | "email" | "password" | "number" | "datetime-local";
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "numeric" | "decimal";
  error?: string;
  required?: boolean;
  step?: string;
};

/**
 * Campo do design: fundo #F5F5F6, borda #E7E8EA, raio 12, ícone à esquerda,
 * placeholder #9AA0A6 em 15px. No Figma o rótulo vive dentro do campo como
 * placeholder — aqui ele também existe como <label> oculto, para leitores de
 * tela não ficarem sem nome acessível.
 */
export function Field({
  name,
  placeholder,
  icon,
  type = "text",
  defaultValue,
  autoComplete,
  inputMode,
  error,
  required,
  step,
}: FieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="w-full">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div
        className={`flex w-full items-center gap-[10px] rounded-field border bg-field px-[14px] py-[15px] ${
          error ? "border-danger" : "border-line"
        }`}
      >
        {icon && <Icon name={icon} />}
        <input
          id={id}
          name={name}
          type={inputType}
          step={step}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none placeholder:text-faint"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="shrink-0"
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
          >
            <Icon name="eye" />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-[6px] text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
