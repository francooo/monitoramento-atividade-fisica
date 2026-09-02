"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como estou indo nos treinos?",
  "Meu ritmo está evoluindo?",
  "O que treinar esta semana?",
];

const GREETING =
  "Oi! Eu leio os seus treinos registrados aqui no Dawn. Pergunte como você está indo, se o ritmo evoluiu, o que fazer nesta semana.";

export function CoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cada resposta nasce fora da vista numa conversa longa; rolar para o fim
  // evita que a pessoa precise fazer isso a cada troca.
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Fechar com Esc é o que se espera de qualquer painel sobreposto.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setDraft("");
    setError(undefined);
    setPending(true);

    try {
      const response = await fetch("/api/treinador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await response.json()) as { answer?: string; error?: string };

      if (!response.ok || !data.answer) {
        setError(data.error ?? "Não consegui falar com o treinador agora.");
        return;
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer! },
      ]);
    } catch {
      setError("Sem conexão com o treinador. Verifique a internet e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[390px] justify-end px-[16px] pb-[96px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir o treinador"
          className="pointer-events-auto flex size-[52px] items-center justify-center rounded-[26px] bg-ink text-white shadow-lg transition-transform hover:scale-105"
        >
          <ChatIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[390px] flex-col px-[10px] pb-[92px]">
      <section
        aria-label="Conversa com o treinador"
        className="flex h-[74dvh] max-h-[560px] w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-[10px] border-b border-line px-[14px] py-[12px]">
          <span className="flex size-[34px] items-center justify-center rounded-[17px] bg-brand-soft text-brand">
            <ChatIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">Treinador</p>
            <p className="truncate text-[12px] font-medium text-muted">
              Lê os seus treinos registrados
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar o treinador"
            className="shrink-0 rounded-pill px-[10px] py-[6px] text-[13px] font-semibold text-muted hover:bg-field"
          >
            Fechar
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-[14px] py-[14px]">
          <Bubble role="assistant">{GREETING}</Bubble>

          {messages.map((message, index) => (
            <Bubble key={index} role={message.role}>
              {message.content}
            </Bubble>
          ))}

          {pending && (
            <Bubble role="assistant">
              <span className="text-muted">Analisando seus treinos…</span>
            </Bubble>
          )}

          {error && (
            <p role="alert" className="py-[6px] text-[13px] font-medium text-danger">
              {error}
            </p>
          )}

          {messages.length === 0 && !pending && (
            <div className="flex flex-wrap gap-[6px] pt-[6px]">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-pill border border-line-strong px-[12px] py-[7px] text-[13px] font-semibold text-ink transition-colors hover:bg-field"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex shrink-0 items-center gap-[8px] border-t border-line px-[12px] py-[10px]"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Pergunte sobre seus treinos"
            aria-label="Sua pergunta"
            maxLength={1000}
            className="min-w-0 flex-1 rounded-field border border-line bg-field px-[12px] py-[11px] text-[15px] font-medium text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="shrink-0 rounded-pill bg-brand px-[16px] py-[11px] text-[14px] font-bold text-white transition-colors hover:bg-brand-press disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const mine = role === "user";
  return (
    <div className={`flex w-full pb-[10px] ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-card px-[12px] py-[9px] text-[14px] font-medium whitespace-pre-wrap ${
          mine ? "bg-brand text-white" : "bg-field text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ChatIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.8L3 21l1.9-4.2A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
    </svg>
  );
}
