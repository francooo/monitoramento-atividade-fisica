import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo."),
    email: z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não são iguais.",
  });

export const resetRequestSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail.").email("E-mail inválido."),
});

export const activitySchema = z.object({
  title: z.string().trim().min(2, "Dê um nome ao treino."),
  kind: z.enum(["corrida", "caminhada", "pedal", "trilha"]),
  /** Quilômetros, como a pessoa digita: "8,24" ou "8.24". */
  distanceKm: z.coerce
    .number({ invalid_type_error: "Distância inválida." })
    .positive("A distância precisa ser maior que zero.")
    .max(1000, "Distância acima do limite."),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Duração inválida." })
    .positive("A duração precisa ser maior que zero.")
    .max(60 * 24, "Duração acima do limite."),
  startedAt: z.coerce.date(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

/**
 * Teto do base64 aceito pelo servidor. O corpo de uma Server Action é limitado
 * a 1MB (`serverActions.bodySizeLimit`), e o resto do formulário também viaja
 * ali — 700KB de base64 (~525KB de imagem) deixa folga de sobra. O navegador
 * já comprime bem abaixo disso; este limite é a rede de segurança para quem
 * postar direto na action, sem passar pela tela.
 */
export const MAX_PHOTO_BASE64_LENGTH = 700_000;

const PHOTO_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export type ParsedPhoto = {
  mimeType: string;
  data: string;
  byteSize: number;
};

/**
 * Lê o data URL que a tela monta depois de comprimir a foto no navegador.
 * Devolve `photo: null` sem erro quando o campo veio vazio — a foto é
 * opcional, e treino digitado à mão continua válido.
 */
export function parsePhotoDataUrl(value: FormDataEntryValue | null): {
  photo: ParsedPhoto | null;
  error?: string;
} {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { photo: null };

  if (raw.length > MAX_PHOTO_BASE64_LENGTH) {
    return { photo: null, error: "A foto ficou grande demais. Tente outra." };
  }

  const match = PHOTO_DATA_URL.exec(raw);
  if (!match) {
    return { photo: null, error: "Formato de imagem não suportado." };
  }

  const [, mimeType, data] = match;
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  const byteSize = (data.length / 4) * 3 - padding;

  return { photo: { mimeType, data, byteSize } };
}

/** Dimensão declarada pela tela; só serve para o card reservar espaço. */
export function parsePhotoDimension(value: FormDataEntryValue | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 8000 ? n : 0;
}

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;

/** Aceita vírgula decimal do teclado pt-BR antes de validar. */
export function parseDecimal(value: FormDataEntryValue | null): string {
  return String(value ?? "").replace(",", ".");
}
