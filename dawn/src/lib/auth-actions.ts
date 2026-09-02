"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/session";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  notice?: string;
};

function fieldErrorsFrom(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${parsed.data.email})`)
    .limit(1);

  // Mesma mensagem para e-mail inexistente e senha errada: não entregamos
  // quais e-mails existem na base.
  const invalid: AuthState = { error: "E-mail ou senha incorretos." };
  if (!user?.passwordHash) {
    await bcrypt.compare(parsed.data.password, "$2a$12$invalidsaltinvalidsaltinv");
    return invalid;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  await createSession(user.id);
  redirect("/feed");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const inserted = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
    })
    .onConflictDoNothing()
    .returning({ id: users.id });

  if (inserted.length === 0) {
    return { fieldErrors: { email: "Esse e-mail já tem uma conta." } };
  }

  await createSession(inserted[0].id);
  redirect("/feed");
}

const RESET_TTL_MINUTES = 30;

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${parsed.data.email})`)
    .limit(1);

  if (user) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
    });

    // TODO: enviar por e-mail (Resend / SES). Enquanto não há provedor
    // configurado, o link fica no log do servidor para dar para testar.
    console.info(
      `[dawn] link de recuperação: /nova-senha?token=${token} (expira em ${RESET_TTL_MINUTES} min)`,
    );
  }

  // Resposta idêntica exista ou não a conta.
  return {
    notice:
      "Se existir uma conta com esse e-mail, o link de recuperação chega em instantes.",
  };
}

export async function signOut() {
  await destroySession();
  redirect("/entrar");
}

export async function deleteAccount() {
  const { getCurrentUser } = await import("@/lib/session");
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  await db.delete(users).where(eq(users.id, user.id));
  await destroySession();
  redirect("/entrar");
}
