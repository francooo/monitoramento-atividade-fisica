import { NextResponse } from "next/server";

import {
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_LENGTH,
  type ChatMessage,
  askCoach,
  buildTrainingContext,
  groqApiKey,
} from "@/lib/coach";
import { getCurrentUser } from "@/lib/session";

/**
 * Chat do treinador.
 *
 * O contexto de treino é montado aqui no servidor a partir do usuário da
 * sessão — o cliente manda apenas a conversa, nunca os dados. Assim não existe
 * requisição capaz de pedir análise sobre os treinos de outra pessoa, e a
 * chave da Groq não sai do servidor.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const apiKey = groqApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "O treinador não está configurado neste ambiente." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Só o que o modelo precisa: papel conhecido e texto dentro do limite. As
  // mais antigas caem fora para o prompt não crescer sem teto ao longo da
  // conversa.
  const history: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY_MESSAGES)) {
    const role = (item as ChatMessage)?.role;
    const content = (item as ChatMessage)?.content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string" || !content.trim()) continue;
    history.push({ role, content: content.slice(0, MAX_QUESTION_LENGTH) });
  }

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const trainingContext = await buildTrainingContext(user.id);
  const reply = await askCoach({ apiKey, trainingContext, history });

  if ("error" in reply) {
    return NextResponse.json({ error: reply.error }, { status: 502 });
  }

  return NextResponse.json({ answer: reply.answer });
}
