/** Converte uma data para o valor local aceito por `<input type="datetime-local">`. */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

/** Data padrão para novas partidas: amanhã às 18:00 (sempre no futuro). */
export function defaultFutureDatetimeLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return toDatetimeLocalValue(date);
}

/** `true` quando o valor datetime-local é uma data futura. */
export function isFutureDatetimeLocal(value: string): boolean {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() > Date.now();
}
