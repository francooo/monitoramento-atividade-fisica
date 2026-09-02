const TZ = "America/Sao_Paulo";

/** 8240 -> "8,24 km" */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`;
}

/** 31200 -> "31,2 km" (uma casa, para os totais da semana) */
export function formatDistanceShort(meters: number): string {
  const km = meters / 1000;
  return `${km.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/** 2712s -> "45:12"; 11520s -> "3:12:00" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 11520s -> "3h 12" (formato compacto do resumo semanal) */
export function formatDurationCompact(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, "0")}`;
}

/** Ritmo médio: "5:29 /km". Retorna "—" quando não dá para dividir. */
export function formatPace(meters: number, seconds: number): string {
  if (meters <= 0 || seconds <= 0) return "—";
  const secondsPerKm = seconds / (meters / 1000);
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  const carry = s === 60;
  return `${carry ? m + 1 : m}:${String(carry ? 0 : s).padStart(2, "0")} /km`;
}

/** "Hoje, 6:12" / "Ontem, 19:40" / "12 de mar, 6:12" */
export function formatWhen(date: Date, now = new Date()): string {
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);

  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dayKey(date) === dayKey(now)) return `Hoje, ${time}`;
  if (dayKey(date) === dayKey(yesterday)) return `Ontem, ${time}`;

  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  })
    .format(date)
    .replace(".", "");
  return `${day}, ${time}`;
}

/** Linha de subtítulo do card: "Hoje, 6:12 · Porto Alegre" */
export function formatWhenAndPlace(date: Date, city: string | null): string {
  const when = formatWhen(date);
  return city ? `${when} · ${city}` : when;
}

/** Inicial usada no avatar. */
export function initialOf(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}
