import "server-only";

import {
  getActivitiesForCoach,
  getProfileTotals,
  getWeekSummary,
} from "@/db/queries";
import {
  formatDistanceShort,
  formatDurationCompact,
  formatPace,
} from "@/lib/format";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * O maior modelo aberto que a Groq serve. Vale o tamanho porque a resposta
 * ainda chega em poucos segundos — é o que essa infraestrutura faz de melhor —
 * e um modelo menor erra mais ao interpretar ritmo e volume.
 */
const MODEL = "openai/gpt-oss-120b";

/** Teto por mensagem e quantas voltas de conversa seguem no contexto. */
export const MAX_QUESTION_LENGTH = 1000;
export const MAX_HISTORY_MESSAGES = 12;

export type ChatMessage = { role: "user" | "assistant"; content: string };

const WEEKDAYS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function groqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

/**
 * Retrato dos treinos em texto corrido.
 *
 * Os números vão prontos, nas mesmas unidades que o app mostra na tela — ritmo
 * em min/km, distância em km — em vez de metros e segundos crus. Assim o
 * modelo não precisa fazer aritmética para responder, que é justamente onde
 * um LLM erra e inventa.
 */
export async function buildTrainingContext(userId: string): Promise<string> {
  const [totals, week, recent] = await Promise.all([
    getProfileTotals(userId),
    getWeekSummary(userId),
    getActivitiesForCoach(userId),
  ]);

  if (recent.length === 0) {
    return "A pessoa ainda não registrou nenhum treino no aplicativo.";
  }

  const perDay = week.perDayMeters
    .map((meters, index) =>
      meters > 0 ? `${WEEKDAYS[index]} ${formatDistanceShort(meters)}` : null,
    )
    .filter(Boolean)
    .join(", ");

  const lines = recent.map((activity) => {
    const when = DATE_FORMAT.format(activity.startedAt);
    const distance = formatDistanceShort(activity.distanceMeters);
    const duration = formatDurationCompact(activity.durationSeconds);
    const pace = formatPace(activity.distanceMeters, activity.durationSeconds);
    const place = activity.city ? `, ${activity.city}` : "";
    return `- ${when} · ${activity.kind} · ${distance} em ${duration} (ritmo ${pace})${place} — "${activity.title}"`;
  });

  return [
    "TOTAIS DESDE O INÍCIO",
    `${totals.workouts} treinos, ${formatDistanceShort(totals.distance)}, ${formatDurationCompact(totals.duration)} em movimento.`,
    "",
    "SEMANA ATUAL (de segunda até hoje)",
    `${week.workouts} treinos, ${formatDistanceShort(week.distanceMeters)}, ${formatDurationCompact(week.durationSeconds)}.`,
    perDay ? `Por dia: ${perDay}.` : "Nenhum treino registrado nesta semana ainda.",
    "",
    `ÚLTIMOS ${recent.length} TREINOS (do mais recente para o mais antigo)`,
    ...lines,
  ].join("\n");
}

const SYSTEM_PROMPT = `Você é o treinador do Dawn, um aplicativo de registro de treinos.

Converse em português do Brasil, de forma direta e calorosa, como um treinador que conhece a pessoa. Trate quem fala por "você".

Regras que não se quebram:
- Baseie toda análise nos dados de treino fornecidos abaixo. Nunca invente treinos, datas ou números que não estejam ali.
- Se os dados não permitirem responder, diga isso com franqueza em vez de estimar.
- Cite números concretos dos dados quando eles sustentarem o que você diz.
- Fale como quem já conhece o histórico. Nunca mencione "os dados fornecidos", nem cite os títulos das seções abaixo — quem lê vê só a sua resposta, não a tabela por trás.
- Seja breve: no máximo três parágrafos curtos.
- Escreva em texto corrido, sem markdown: nada de asteriscos, sublinhados ou cerquilhas. A tela mostra o texto exatamente como você escrever.
- Você não é médico. Diante de dor, lesão ou sintoma, recomende procurar um profissional de saúde e não tente diagnosticar.`;

export type CoachReply = { answer: string } | { error: string };

/**
 * Tira a marcação que escapa mesmo com a instrução no prompt. A bolha do chat
 * mostra texto puro, então um `**` que passe vira asterisco visível na tela —
 * e pedir ao modelo não é garantia suficiente para uma questão de aparência.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/(^|\s)\*(\S(?:.*?\S)?)\*(?=\s|$)/gs, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export async function askCoach(input: {
  apiKey: string;
  trainingContext: string;
  history: ChatMessage[];
}): Promise<CoachReply> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      // Baixa, mas não zero: a análise precisa ser estável entre perguntas
      // parecidas, sem virar um texto decorado.
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `DADOS DE TREINO DESTA PESSOA\n\n${input.trainingContext}`,
        },
        ...input.history,
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[dawn] Groq respondeu ${response.status}: ${detail.slice(0, 300)}`);
    return { error: "O treinador não respondeu agora. Tente de novo em instantes." };
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    console.error("[dawn] Groq devolveu resposta vazia");
    return { error: "O treinador não respondeu agora. Tente de novo em instantes." };
  }

  return { answer: stripMarkdown(answer) };
}
