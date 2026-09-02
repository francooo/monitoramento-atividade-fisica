"use client";

import { useFormStatus } from "react-dom";

import { Icon, type IconName } from "@/components/icon";

/** Botão sólido laranja, raio 26, 16px de padding vertical. */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  /** Trava o envio por motivo externo — a foto ainda sendo comprimida, p.ex. */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex w-full items-center justify-center rounded-pill bg-brand py-[16px] text-[16px] font-bold text-white transition-colors hover:bg-brand-press disabled:opacity-60"
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Botão de contorno usado no login social. */
export function OutlineButton({
  icon,
  children,
  onClick,
}: {
  icon: IconName;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-[9px] rounded-pill border border-line-strong bg-white py-[14px] text-[15px] font-semibold text-ink transition-colors hover:bg-field"
    >
      <Icon name={icon} />
      {children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex w-full items-center gap-[12px] pb-[16px]">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[13px] font-medium text-faint">ou</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="w-full pb-[10px] text-[13px] font-medium text-danger">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="w-full rounded-field bg-brand-soft px-[14px] py-[12px] text-[13px] font-medium text-brand"
    >
      {message}
    </p>
  );
}
