import { QUOTES } from "../data/quotes";

/** Небольшой генератор случайных чисел: одинаковое зерно даёт одинаковый порядок */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const permCache = new Map<number, number[]>();

function permutation(cycle: number): number[] {
  const cached = permCache.get(cycle);
  if (cached) return cached;
  const order = QUOTES.map((_, i) => i);
  const rnd = mulberry32(cycle * 2654435761 + 12345);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  permCache.set(cycle, order);
  return order;
}

/**
 * Цитата дня: порядок случайный, но один и тот же для одной даты, и цитаты не повторяются,
 * пока не пройдёт круг из всех цитат списка.
 */
export function quoteForDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const n = QUOTES.length;
  const cycle = Math.floor(dayNumber / n);
  const position = ((dayNumber % n) + n) % n;
  return QUOTES[permutation(cycle)[position]];
}
