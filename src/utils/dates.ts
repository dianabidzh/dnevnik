import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";

/** Дата в формате ГГГГ-ММ-ДД по местному времени (не UTC) */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function shiftDay(iso: string, delta: number): string {
  return toISODate(addDays(parseISO(iso), delta));
}

export function formatDayLong(iso: string): string {
  return format(parseISO(iso), "EEEE, d MMMM", { locale: ru });
}

export function formatDayShort(iso: string): string {
  return format(parseISO(iso), "d MMMM", { locale: ru });
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

/* ---------- Месяцы: ключ вида "2026-11" ---------- */
export function currentMonthKey(): string {
  return format(new Date(), "yyyy-MM");
}

export function shiftMonth(key: string, delta: number): string {
  return format(addMonths(parseISO(key + "-01"), delta), "yyyy-MM");
}

export function monthTitle(key: string): string {
  return format(parseISO(key + "-01"), "LLLL yyyy", { locale: ru });
}

export function monthDays(key: string): string[] {
  const start = parseISO(key + "-01");
  return eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(start) }).map(toISODate);
}

/** Сколько пустых клеток перед 1-м числом, если неделя начинается с понедельника */
export function mondayOffset(key: string): number {
  return (getDay(parseISO(key + "-01")) + 6) % 7;
}

/** Склонение: plural(1, ["день","дня","дней"]) → "день" */
export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

export function formatDateFull(iso: string): string {
  return format(parseISO(iso), "d MMMM yyyy", { locale: ru });
}
